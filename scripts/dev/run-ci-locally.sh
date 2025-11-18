#!/usr/bin/env bash
# Local CI Emulation with 'act'
# Run GitHub Actions workflows locally for faster iteration

set -euo pipefail

echo "🚀 Running CI workflows locally with 'act'..."
echo ""

# Check if 'act' is installed
if ! command -v act >/dev/null 2>&1; then
  echo "❌ 'act' not installed"
  echo ""
  echo "Install with:"
  echo "  macOS:  brew install act"
  echo "  Linux:  curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
  echo ""
  exit 1
fi

# Default workflow to run
WORKFLOW="${1:-.github/workflows/ci.yml}"
EVENT_TYPE="${2:-push}"
BRANCH="${3:-main}"

echo "📋 Running workflow: ${WORKFLOW}"
echo "🎯 Event type: ${EVENT_TYPE}"
echo "🌿 Branch: ${BRANCH}"
echo ""

# Create temporary env file with local overrides
TEMP_ENV=$(mktemp)
cat > "${TEMP_ENV}" << EOF
CI=true
NODE_VERSION=22
NX_CLOUD_ACCESS_TOKEN=${NX_CLOUD_ACCESS_TOKEN:-}
GITHUB_REF=refs/heads/${BRANCH}
GITHUB_SHA=$(git rev-parse HEAD)
GITHUB_EVENT_NAME=${EVENT_TYPE}
EOF

# Merge with existing .env.local if it exists
if [ -f .env.local ]; then
  cat .env.local >> "${TEMP_ENV}"
fi

# Run with act (uses Docker to simulate GitHub Actions runner)
echo "🏃 Starting local CI simulation..."
START_TIME=$(date +%s)

act "${EVENT_TYPE}" \
  --workflows "${WORKFLOW}" \
  --platform ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-latest \
  --env-file "${TEMP_ENV}" \
  --secret-file <(echo "") \
  --verbose \
  --container-options "--memory=4g --cpus=2"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Cleanup
rm -f "${TEMP_ENV}"

echo ""
echo "✅ Local CI simulation complete in ${DURATION} seconds"
echo ""
echo "💡 Tips:"
echo "  • Use './scripts/dev/fast-feedback.sh' for quicker checks"
echo "  • Set NX_CLOUD_ACCESS_TOKEN for faster builds"
echo "  • Use '--platform' to test different runner types"
echo ""
echo "📊 Estimated cost savings: ~$0.08 vs full CI run"
