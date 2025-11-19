#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="artifacts/security"
mkdir -p "$OUTPUT_DIR"

echo "[security-scan] Starting vulnerability scan (npm audit)" >&2
# Run npm audit (ignore exit code handling for JSON parse, enforce manually)
AUDIT_JSON="$OUTPUT_DIR/npm-audit.json"
if npm audit --json > "$AUDIT_JSON" 2> "$OUTPUT_DIR/npm-audit.log"; then
  echo "[security-scan] npm audit completed" >&2
else
  echo "[security-scan] npm audit returned non-zero (captured)" >&2
fi

CRITICAL_COUNT=$(jq '.vulnerabilities.critical // 0' < "$AUDIT_JSON" 2>/dev/null || echo 0)
HIGH_COUNT=$(jq '.vulnerabilities.high // 0' < "$AUDIT_JSON" 2>/dev/null || echo 0)
MODERATE_COUNT=$(jq '.vulnerabilities.moderate // 0' < "$AUDIT_JSON" 2>/dev/null || echo 0)
LOW_COUNT=$(jq '.vulnerabilities.low // 0' < "$AUDIT_JSON" 2>/dev/null || echo 0)

echo "[security-scan] Vulnerabilities: critical=${CRITICAL_COUNT} high=${HIGH_COUNT} moderate=${MODERATE_COUNT} low=${LOW_COUNT}" >&2

# Optional OSV scanner if available
if command -v osv-scanner >/dev/null 2>&1; then
  echo "[security-scan] Running OSV scanner" >&2
  osv-scanner --config="osv-scanner.toml" --json > "$OUTPUT_DIR/osv-scan.json" || echo "[security-scan] OSV scanner failed" >&2
fi

# Basic policy thresholds (can be tightened later)
if [ "$CRITICAL_COUNT" -gt 0 ] || [ "$HIGH_COUNT" -gt 5 ]; then
  echo "[security-scan] Failing due to vulnerability thresholds (critical>0 or high>5)." >&2
  exit 1
fi

echo "[security-scan] Completed successfully within thresholds." >&2
exit 0
