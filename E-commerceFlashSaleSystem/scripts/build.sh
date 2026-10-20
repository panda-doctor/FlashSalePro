#!/usr/bin/env bash
# =====================================================
# WSL 原生构建入口（规避 Windows UNC 路径下的父 POM 解析失败）
#
# 用法：
#   ./scripts/build.sh                 # clean package（跳过测试）
#   ./scripts/build.sh clean package -DskipTests
#   ./scripts/build.sh -pl flash-sale-gateway -am package
#
# 说明：
#   /mnt/d/Maven/apache-maven-3.9.4/conf/settings.xml 里 localRepository 写的是
#   Windows 路径（D:\...），在 WSL 中会被当成相对目录。这里用 maven.repo.local
#   指向同一份 2GB 缓存，避免重复下载。
# =====================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
MAVEN_REPO_LOCAL="${MAVEN_REPO_LOCAL:-/mnt/d/Maven/apache-maven-3.9.4/mvn_repo}"
export JAVA_HOME

cd "$PROJECT_DIR"

if (( $# == 0 )); then
  set -- clean package
fi

exec mvn -B -Dmaven.repo.local="$MAVEN_REPO_LOCAL" -Dmaven.test.skip=true "$@"
