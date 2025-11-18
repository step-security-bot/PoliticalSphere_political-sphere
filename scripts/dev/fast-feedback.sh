#!/usr/bin/env bash
# Fast Feedback Loop
# Run only critical checks before pushing (30-second target)

set -euo pipefail

echo "⚡ Fast feedback loop (target: <30 seconds)"
echo ""

START_TIME=$(date +%s)

# 1. Type checking (TypeScript)
echo "🔍 Type checking..."
npm run type-check --if-present || {
  echo "❌ Type check failed"
  exit 1
}

# 2. Linting (changed files only)
echo "🔍 Linting changed files..."
git diff --name-only --cached | grep -E '\.(ts|tsx|js|jsx)$' | xargs npx eslint --quiet || {
  echo "❌ Linting failed"
  exit 1
}

# 3. Unit tests (changed files only)
echo "🧪 Running unit tests for changed files..."
npm run test:changed --if-present || npx vitest --run --changed || {
  echo "❌ Tests failed"
  exit 1
}

# 4. Security scan (quick)
echo "🛡️ Quick security scan..."
npx lockfile-lint --path package-lock.json --type npm --validate-https --allowed-hosts npm || {
  echo "⚠️ Lockfile security check failed (non-blocking)"
}

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "✅ All checks passed in ${DURATION} seconds"

if [ "${DURATION}" -gt 30 ]; then
  echo "⚠️ Warning: Exceeded 30-second target"
fi
