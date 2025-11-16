#!/usr/bin/env bash
set -euo pipefail

# PURPOSE: Local semantic-release dry run to verify workflow permission changes did not break tagging logic.
# SECURITY: Does not publish; uses --dry-run. Requires no elevated token scopes.
# USAGE: GITHUB_TOKEN=ghp_dummy ./scripts/release/semantic-release-dry-run.sh

export CI=false
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "WARNING: GITHUB_TOKEN not set. Set a dummy token for dry-run (no network writes)." >&2
fi

echo "Running semantic-release dry run..."
npx --no-install semantic-release --dry-run || {
  echo "Semantic-release dry run failed" >&2
  exit 1
}
echo "Semantic-release dry run completed successfully"
