#!/usr/bin/env bash
# =====================================================
# 一键启动后端 8 个服务（WSL 原生路径运行）
#
# 用法：
#   ./scripts/start-all.sh              # 启动全部服务
#   ./scripts/start-all.sh auth order   # 只启动指定服务
#   HEALTH_TIMEOUT=180 ./scripts/start-all.sh
#
# 说明：
#   - 所有 jar 以「聚合根」为工作目录启动，spring-dotenv 才能读到根级 .env
#     （ADMIN_TOKEN / USER_TOKENS / MYSQL_PASSWORD 等）。
#   - 日志：logs/{service}.log    PID：run/{service}.pid
#   - 已运行（PID 存活）的服务会跳过；端口被其他进程占用则直接失败。
# =====================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
PID_DIR="$PROJECT_DIR/run"

JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
JAVA_BIN="$JAVA_HOME/bin/java"
JAVA_OPTS="${JAVA_OPTS:--Xms256m -Xmx512m -XX:+UseG1GC -Dfile.encoding=UTF-8}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"

# 启动顺序：单体 → 领域服务 → 网关（网关最后，避免路由到未注册实例）
# 格式：name:module:port
SERVICES=(
  "bootstrap:flash-sale-bootstrap:8081"
  "auth:flash-sale-auth:8082"
  "ai:flash-sale-ai:8083"
  "product:flash-sale-product:8084"
  "activity:flash-sale-activity:8085"
  "seckill:flash-sale-seckill:8086"
  "order:flash-sale-order:8087"
  "gateway:flash-sale-gateway:8090"
)

log()  { printf '%s %s\n' "$(date '+%H:%M:%S')" "$*"; }
fail() { printf '%s [ERROR] %s\n' "$(date '+%H:%M:%S')" "$*" >&2; exit 1; }

port_in_use() {
  ss -ltn 2>/dev/null | awk 'NR>1{print $4}' | sed 's/.*://' | grep -qx "$1"
}

pid_alive() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

start_one() {
  local name="$1" module="$2" port="$3"
  local pid_file="$PID_DIR/$name.pid"
  local log_file="$LOG_DIR/$name.log"

  if pid_alive "$pid_file"; then
    log "[SKIP] $name 已在运行 (PID $(cat "$pid_file"))"
    return 0
  fi
  rm -f "$pid_file"

  if port_in_use "$port"; then
    fail "$name 端口 $port 已被其他进程占用，停止启动"
  fi

  local jar
  jar="$(ls "$PROJECT_DIR/$module"/target/"$module"-*.jar 2>/dev/null | grep -v '\.original$' | head -1 || true)"
  [[ -n "$jar" && -f "$jar" ]] || fail "$name 未找到可执行 jar，请先执行 mvn package"

  log "[START] $name :$port ← $(basename "$jar")"
  (
    cd "$PROJECT_DIR"
    # shellcheck disable=SC2086
    nohup "$JAVA_BIN" $JAVA_OPTS -jar "$jar" >>"$log_file" 2>&1 &
    echo $! >"$pid_file"
  )

  local started=$SECONDS pid
  pid="$(cat "$pid_file")"
  while (( SECONDS - started < HEALTH_TIMEOUT )); do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "----- $name 日志尾部 -----" >&2
      tail -n 60 "$log_file" >&2 || true
      fail "$name 启动失败（进程退出），完整日志：$log_file"
    fi
    if curl -fsS -m 2 "http://127.0.0.1:$port/actuator/health" 2>/dev/null | grep -q '"status":"UP"'; then
      log "[OK]    $name :$port UP ($((SECONDS - started))s)"
      return 0
    fi
    sleep 2
  done

  echo "----- $name 日志尾部 -----" >&2
  tail -n 60 "$log_file" >&2 || true
  fail "$name 健康检查超时（${HEALTH_TIMEOUT}s），完整日志：$log_file"
}

main() {
  [[ -x "$JAVA_BIN" ]] || fail "未找到 java：$JAVA_BIN（可设置 JAVA_HOME 覆盖）"
  command -v curl >/dev/null || fail "缺少 curl"
  command -v ss   >/dev/null || fail "缺少 ss"

  mkdir -p "$LOG_DIR" "$PID_DIR"

  local selected=("$@")
  local started_any=0
  for entry in "${SERVICES[@]}"; do
    IFS=':' read -r name module port <<<"$entry"
    if (( ${#selected[@]} > 0 )) && [[ ! " ${selected[*]} " =~ " $name " ]]; then
      continue
    fi
    start_one "$name" "$module" "$port"
    started_any=1
  done

  (( started_any )) || fail "未匹配到任何服务：${selected[*]}"
  log "全部完成。停止：$SCRIPT_DIR/stop-all.sh"
}

main "$@"
