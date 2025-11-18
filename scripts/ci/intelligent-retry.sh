#!/usr/bin/env bash
# Intelligent Retry Logic for CI/CD
# Automatically retries transient failures with exponential backoff

set -euo pipefail

MAX_RETRIES=3
BASE_DELAY=5  # seconds
MAX_DELAY=60  # seconds

# Function to determine if error is retryable
is_retryable_error() {
  local error_message="$1"

  # Retryable error patterns (network/infrastructure issues)
  local retryable_patterns=(
    "ECONNREFUSED"
    "ETIMEDOUT"
    "ENOTFOUND"
    "network.*timeout"
    "rate limit"
    "503 Service Unavailable"
    "502 Bad Gateway"
    "socket hang up"
    "Cannot lock ref"
    "chrome.*crashed"
    "webdriver.*timeout"
    "playwright.*timeout"
    "browser.*disconnected"
  )

  for pattern in "${retryable_patterns[@]}"; do
    if echo "${error_message}" | grep -qi "${pattern}"; then
      return 0  # Retryable
    fi
  done

  return 1  # Not retryable
}

# Function to analyze failure patterns and suggest quarantine
analyze_failure_pattern() {
  local error_message="$1"
  local test_name="$2"
  local failure_log="${3:-}"

  # Patterns that indicate consistently failing tests
  local quarantine_patterns=(
    "element.*not.*found"
    "stale.*element"
    "assertion.*failed"
    "expected.*but.*got"
    "timeout.*waiting"
    "flaky.*test"
  )

  # Check if this looks like a consistently failing test
  for pattern in "${quarantine_patterns[@]}"; do
    if echo "${error_message}" | grep -qi "${pattern}"; then
      echo "⚠️  Detected potential consistently failing test pattern in '${test_name}': ${pattern}"
      # Log for quarantine analysis
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ),${test_name},${pattern},${error_message}" >> test-failure-patterns.log
      return 0
    fi
  done

  return 1
}

# Main retry function with failure pattern analysis
retry_command() {
  local command="$@"
  local test_name="${TEST_NAME:-unknown}"
  local attempt=1
  local delay="${BASE_DELAY}"

  while [ "${attempt}" -le "${MAX_RETRIES}" ]; do
    echo "🔄 Attempt ${attempt}/${MAX_RETRIES}: ${command}"

    if output=$(eval "${command}" 2>&1); then
      echo "✅ Command succeeded on attempt ${attempt}"
      echo "${output}"
      return 0
    else
      local exit_code=$?
      echo "❌ Command failed with exit code ${exit_code}"
      echo "Output: ${output}"

      # Analyze failure pattern for quarantine detection
      analyze_failure_pattern "${output}" "${test_name}"

      # Check if error is retryable
      if is_retryable_error "${output}"; then
        if [ "${attempt}" -lt "${MAX_RETRIES}" ]; then
          echo "⏳ Retryable error detected, waiting ${delay}s before retry..."
          sleep "${delay}"

          # Exponential backoff
          delay=$((delay * 2))
          if [ "${delay}" -gt "${MAX_DELAY}" ]; then
            delay="${MAX_DELAY}"
          fi

          attempt=$((attempt + 1))
        else
          echo "❌ Max retries reached"
          return "${exit_code}"
        fi
      else
        echo "❌ Non-retryable error, failing immediately"
        return "${exit_code}"
      fi
    fi
  done
}

# Usage examples:
# retry_command "npm install"
# retry_command "npm test"

# If called directly
if [ "$#" -gt 0 ]; then
  retry_command "$@"
fi
