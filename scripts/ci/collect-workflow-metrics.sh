#!/usr/bin/env bash
# CI/CD Workflow Metrics Collector
# Automatically called at end of workflow runs

set -euo pipefail

WORKFLOW_NAME="${1:-unknown}"
JOB_NAME="${2:-unknown}"
STATUS="${3:-unknown}"
START_TIME="${4:-$(date +%s)}"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

METRICS_FILE="reports/ci-metrics/workflow-runs.jsonl"
mkdir -p "$(dirname "${METRICS_FILE}")"

# Append metrics in JSONL format
cat << EOF >> "${METRICS_FILE}"
{"timestamp":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","workflow":"${WORKFLOW_NAME}","job":"${JOB_NAME}","status":"${STATUS}","duration_seconds":${DURATION},"run_id":"${GITHUB_RUN_ID:-local}","run_number":"${GITHUB_RUN_NUMBER:-0}"}
EOF

echo "📊 Metrics recorded: ${WORKFLOW_NAME} / ${JOB_NAME} - ${STATUS} (${DURATION}s)"
