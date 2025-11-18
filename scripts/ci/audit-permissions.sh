#!/usr/bin/env bash
# =============================================================================
# GitHub Actions Permission Audit Script
# =============================================================================
# Purpose: Analyze all workflows for GITHUB_TOKEN permission usage
# Compliance: OWASP CICD-SEC-2, GitHub Security Best Practices
# Output: JSON report with findings and recommendations
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
WORKFLOWS_DIR="${REPO_ROOT}/.github/workflows"
OUTPUT_FILE="${REPO_ROOT}/reports/permissions-audit-$(date +%Y%m%d-%H%M%S).json"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure reports directory exists
mkdir -p "$(dirname "${OUTPUT_FILE}")"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   GitHub Actions Permission Audit Tool             ║${NC}"
echo -e "${BLUE}║   Political Sphere - Security Hardening            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Initialize report
cat > "${OUTPUT_FILE}" << 'EOF'
{
  "audit_timestamp": "",
  "repository": "political-sphere",
  "total_workflows": 0,
  "compliant_workflows": 0,
  "non_compliant_workflows": 0,
  "findings": [],
  "recommendations": []
}
EOF

# Update timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i.bak "s/\"audit_timestamp\": \"\"/\"audit_timestamp\": \"${TIMESTAMP}\"/" "${OUTPUT_FILE}"
rm -f "${OUTPUT_FILE}.bak"

# Count workflows
TOTAL_WORKFLOWS=$(find "${WORKFLOWS_DIR}" -name "*.yml" -o -name "*.yaml" | wc -l | tr -d ' ')
echo -e "${BLUE}📊 Analyzing ${TOTAL_WORKFLOWS} workflows...${NC}"
echo ""

COMPLIANT=0
NON_COMPLIANT=0
declare -a FINDINGS=()

# Analyze each workflow
while IFS= read -r workflow_file; do
  WORKFLOW_NAME=$(basename "${workflow_file}")
  echo -e "${BLUE}🔍 Analyzing: ${WORKFLOW_NAME}${NC}"
  
  HAS_TOP_LEVEL_PERMISSIONS=false
  HAS_WRITE_ALL=false
  HAS_GRANULAR_PERMISSIONS=false
  ISSUES=()
  
  # Check for top-level permissions
  if grep -q "^permissions:" "${workflow_file}"; then
    HAS_TOP_LEVEL_PERMISSIONS=true
    
    # Check if it's read-all or contents: read
    if grep -A 1 "^permissions:" "${workflow_file}" | grep -qE "(read-all|contents: read)"; then
      echo -e "  ${GREEN}✓${NC} Top-level permissions: read-only"
    else
      echo -e "  ${YELLOW}⚠${NC} Top-level permissions: not read-only"
      ISSUES+=("top_level_not_read_only")
    fi
  else
    echo -e "  ${RED}✗${NC} Missing top-level permissions declaration"
    ISSUES+=("missing_top_level_permissions")
    HAS_TOP_LEVEL_PERMISSIONS=false
  fi
  
  # Check for write-all at job level
  if grep -qE "permissions:.*write-all" "${workflow_file}"; then
    echo -e "  ${RED}✗${NC} Found 'write-all' permission (CRITICAL)"
    ISSUES+=("write_all_permission")
    HAS_WRITE_ALL=true
  fi
  
  # Check for granular job-level permissions
  if grep -A 5 "jobs:" "${workflow_file}" | grep -A 2 "permissions:" | grep -qE "(pull-requests: write|contents: write|packages: write)"; then
    HAS_GRANULAR_PERMISSIONS=true
    echo -e "  ${GREEN}✓${NC} Granular job-level permissions found"
  fi
  
  # Determine compliance
  if [ "${#ISSUES[@]}" -eq 0 ] && [ "${HAS_TOP_LEVEL_PERMISSIONS}" = true ]; then
    echo -e "  ${GREEN}✅ COMPLIANT${NC}"
    ((COMPLIANT++)) || true
  else
    echo -e "  ${RED}❌ NON-COMPLIANT${NC}"
    ((NON_COMPLIANT++)) || true
    
    # Build finding object
    FINDING=$(cat << EOFINDING
{
  "workflow": "${WORKFLOW_NAME}",
  "issues": [$(printf '"%s",' "${ISSUES[@]}" | sed 's/,$//')]
  "severity": "$( [ "${HAS_WRITE_ALL}" = true ] && echo "CRITICAL" || echo "HIGH" )"
}
EOFINDING
)
    FINDINGS+=("${FINDING}")
  fi
  
  echo ""
done < <(find "${WORKFLOWS_DIR}" -name "*.yml" -o -name "*.yaml")

# Generate recommendations
echo -e "${BLUE}📋 Generating recommendations...${NC}"
echo ""

RECOMMENDATIONS='[
  {
    "priority": 1,
    "action": "Set top-level permissions to read-all or contents: read",
    "rationale": "Follows principle of least privilege (OWASP CICD-SEC-2)",
    "example": "permissions:\\n  contents: read"
  },
  {
    "priority": 2,
    "action": "Grant write permissions only at job level where needed",
    "rationale": "Minimizes attack surface for compromised workflows",
    "example": "jobs:\\n  deploy:\\n    permissions:\\n      contents: read\\n      packages: write"
  },
  {
    "priority": 3,
    "action": "Remove all write-all permissions",
    "rationale": "write-all violates least-privilege principle",
    "example": "Replace with specific grants: pull-requests: write, etc."
  },
  {
    "priority": 4,
    "action": "Use StepSecurity Harden-Runner for network egress monitoring",
    "rationale": "Detects supply chain attacks and credential exfiltration",
    "example": "- uses: step-security/harden-runner@v2\\n  with:\\n    egress-policy: audit"
  }
]'

# Update report with findings
jq --argjson total "${TOTAL_WORKFLOWS}" \
   --argjson compliant "${COMPLIANT}" \
   --argjson non_compliant "${NON_COMPLIANT}" \
   --argjson recommendations "${RECOMMENDATIONS}" \
   '.total_workflows = $total | .compliant_workflows = $compliant | .non_compliant_workflows = $non_compliant | .recommendations = $recommendations' \
   "${OUTPUT_FILE}" > "${OUTPUT_FILE}.tmp" && mv "${OUTPUT_FILE}.tmp" "${OUTPUT_FILE}"

# Print summary
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Audit Summary                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Total Workflows:${NC}         ${TOTAL_WORKFLOWS}"
echo -e "${GREEN}Compliant:${NC}               ${COMPLIANT}"
echo -e "${RED}Non-Compliant:${NC}           ${NON_COMPLIANT}"
echo ""

if [ "${NON_COMPLIANT}" -gt 0 ]; then
  echo -e "${YELLOW}⚠ Action Required:${NC} ${NON_COMPLIANT} workflows need remediation"
  echo -e "${BLUE}📄 Detailed report:${NC} ${OUTPUT_FILE}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo -e "  1. Review findings in ${OUTPUT_FILE}"
  echo -e "  2. Use StepSecurity online tool: https://app.stepsecurity.io/securerepo"
  echo -e "  3. Apply recommendations from priority 1-4"
  echo -e "  4. Re-run audit to verify compliance"
  exit 1
else
  echo -e "${GREEN}✅ All workflows are compliant!${NC}"
  echo -e "${BLUE}📄 Report saved:${NC} ${OUTPUT_FILE}"
  exit 0
fi
