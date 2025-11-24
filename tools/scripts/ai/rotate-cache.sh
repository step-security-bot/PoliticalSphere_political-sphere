#!/usr/bin/env bash
set -euo pipefail

# Remove stale AI cache/index artifacts to keep repo lean.
# Default retention: 30 days. Override via DAYS env.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../../.. && pwd)"
DAYS="${DAYS:-30}"

echo "🔄 Rotating AI caches older than ${DAYS} days under ${ROOT_DIR}/ai and ${ROOT_DIR}/reports/ai/index"

TARGETS=(
  "${ROOT_DIR}/ai/index"
  "${ROOT_DIR}/ai/cache"
  "${ROOT_DIR}/ai/context-bundles"
  "${ROOT_DIR}/ai/metrics"
  "${ROOT_DIR}/ai-logs"
  "${ROOT_DIR}/reports/ai/index"
)

for dir in "${TARGETS[@]}"; do
  if [[ -d "${dir}" ]]; then
    echo "Pruning ${dir}"
    find "${dir}" -type f -mtime +"${DAYS}" -print -delete
  fi
done

echo "✅ AI cache rotation complete"
