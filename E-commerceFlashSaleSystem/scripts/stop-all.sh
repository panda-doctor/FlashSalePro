#!/usr/bin/env bash
# =====================================================
# 停止后端服务（依据 run/*.pid 逆序优雅停止）
#
# 用法：
#   ./scripts/stop-all.sh              # 停止全部
#   ./scripts/stop-all.sh gateway auth # 只停止指定服务
# =====================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$PROJECT_DIR/run"
GRACE_SECONDS="${GRACE_SECONDS:-30}"

# 与 start-all.sh 相同顺序，停止时逆序
SERVICES=(
  "bootstrap:8081"
  "auth:8082"
  "ai:8083"
  "product:8084"
  "activity:8085"
  "seckill:8086"
  "order:8087"
  "gateway:8090"
)

log() { printf '%s %s\n' "$(date '+%H:%M:%S')" "$*"; }

stop_one() {
  local name="$1" pid_file="$PID_DIR/$name.pid" pid
  if [[ ! -f "$pid_file" ]]; then
    log "[SKIP] $name 无 PID 记录"
    return 0
  fi
  pid="$(cat "$pid_file")"
  if ! kill -0 "$pid" 2>/dev/null; then
    log "[SKIP] $name 进程不存在 (PID $pid)，清理 PID 文件"
    rm -f "$pid_file"
    return 0
  fi

  log "[STOP] $name (PID $pid)"
  kill -TERM "$pid" 2>/dev/null || true
  local waited=0
  while kill -0 "$pid" 2>/dev/null && (( waited < GRACE_SECONDS )); do
    sleep 1
    ((waited++)) || true
  done
  if kill -0 "$pid" 2>/dev/null; then
    log "[KILL] $name 未在 ${GRACE_SECONDS}s 内退出，强制终止"
    kill -KILL "$pid" 2>/dev/null || true
    sleep 1
  fi
  rm -f "$pid_file"
  log "[OK]   $name 已停止"
}

main() {
  local selected=("$@")
  local i
  for (( i=${#SERVICES[@]}-1; i>=0; i-- )); do
    local entry="${SERVICES[$i]}" name
    name="${entry%%:*}"
    if (( ${#selected[@]} > 0 )) && [[ ! " ${selected[*]} " =~ " $name " ]]; then
      continue
    fi
    stop_one "$name"
  done
  log "停止流程结束"
}

main "$@"
