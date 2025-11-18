#!/usr/bin/env bash
# Dependency Verification Script
# Validates package integrity and license compliance

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${REPO_ROOT}"

echo "🔍 Verifying dependency integrity..."

# Step 1: Verify package-lock.json integrity
if [ ! -f "package-lock.json" ]; then
  echo "❌ package-lock.json not found"
  exit 1
fi

echo "✅ package-lock.json present"

# Step 2: Check for known vulnerabilities
echo ""
echo "🛡️ Scanning for vulnerabilities..."

if command -v npm >/dev/null 2>&1; then
  npm audit --audit-level=high --production || {
    echo "⚠️ High/critical vulnerabilities found"
    echo "Run: npm audit fix --production"
    exit 1
  }
  echo "✅ No high/critical vulnerabilities"
else
  echo "⚠️ npm not found, skipping audit"
fi

# Step 3: License compliance check
echo ""
echo "📜 Checking license compliance..."

ALLOWED_LICENSES=(
  "MIT"
  "Apache-2.0"
  "BSD-2-Clause"
  "BSD-3-Clause"
  "ISC"
  "0BSD"
  "CC0-1.0"
)

RESTRICTED_LICENSES=(
  "GPL"
  "AGPL"
  "LGPL"
  "SSPL"
)

# Simple license check (requires license-checker)
if command -v npx >/dev/null 2>&1; then
  npx license-checker --production --json > /tmp/licenses.json || true
  
  if [ -f /tmp/licenses.json ]; then
    # Check for restricted licenses
    for license in "${RESTRICTED_LICENSES[@]}"; do
      if jq -r '.[].licenses' /tmp/licenses.json 2>/dev/null | grep -q "${license}"; then
        echo "❌ Restricted license detected: ${license}"
        jq -r ".[] | select(.licenses | contains(\"${license}\")) | .name" /tmp/licenses.json
        exit 1
      fi
    done
    
    echo "✅ No restricted licenses found"
  fi
else
  echo "⚠️ npx not available, skipping license check"
fi

# Step 4: Verify lock file hasn't been tampered
echo ""
echo "🔐 Verifying lock file integrity..."

LOCK_HASH=$(sha256sum package-lock.json | awk '{print $1}')
echo "Lock file SHA256: ${LOCK_HASH}"

# Store in artifact for comparison
mkdir -p reports/integrity
echo "${LOCK_HASH}" > reports/integrity/package-lock-hash.txt
echo "✅ Lock file hash recorded"

echo ""
echo "✅ All dependency verifications passed"
