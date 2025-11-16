#!/usr/bin/env bash
set -euo pipefail

# Apply branch protection rules to main branch via GitHub API
# Usage: ./apply-branch-protection.sh
# Requires: GITHUB_TOKEN environment variable with repo admin scope

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/branch-protection.json"
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-PoliticalSphere}"
REPO_NAME="${GITHUB_REPOSITORY_NAME:-political-sphere}"
BRANCH="main"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Applying branch protection to ${REPO_OWNER}/${REPO_NAME}:${BRANCH}${NC}"

# Check for GitHub token
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo -e "${RED}ERROR: GITHUB_TOKEN environment variable not set${NC}"
  echo "Please set GITHUB_TOKEN with repo admin permissions:"
  echo "  export GITHUB_TOKEN=ghp_..."
  exit 1
fi

# Validate config file exists
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo -e "${RED}ERROR: Configuration file not found: $CONFIG_FILE${NC}"
  exit 1
fi

# Apply branch protection
echo "Applying protection rules from: $CONFIG_FILE"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection" \
  -d @"${CONFIG_FILE}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ "$HTTP_CODE" -eq 200 ]]; then
  echo -e "${GREEN}✅ Branch protection applied successfully${NC}"
  echo ""
  echo "Protected branch: ${BRANCH}"
  echo "Required status checks:"
  echo "$BODY" | jq -r '.required_status_checks.contexts[]' | sed 's/^/  - /'
  echo ""
  echo "Required reviews: $(echo "$BODY" | jq -r '.required_pull_request_reviews.required_approving_review_count')"
  echo "Enforce admins: $(echo "$BODY" | jq -r '.enforce_admins.enabled')"
  exit 0
else
  echo -e "${RED}❌ Failed to apply branch protection (HTTP $HTTP_CODE)${NC}"
  echo "Response:"
  echo "$BODY" | jq '.'
  exit 1
fi
