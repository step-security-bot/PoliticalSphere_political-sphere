#!/usr/bin/env bash

# =============================================================================
# Pre-commit Dependencies Setup
# Installs all required tools for Lefthook v4.0.0 pre-commit hooks
# =============================================================================

set -euo pipefail

echo "🔧 Installing pre-commit dependencies..."
echo ""

# Detect package manager
if command -v brew >/dev/null 2>&1; then
  PKG_MGR="brew"
elif command -v apt-get >/dev/null 2>&1; then
  PKG_MGR="apt"
elif command -v yum >/dev/null 2>&1; then
  PKG_MGR="yum"
else
  echo "❌ No supported package manager found (brew, apt, yum)"
  exit 1
fi

# Install system tools
echo "📦 Installing system tools with $PKG_MGR..."

if [ "$PKG_MGR" = "brew" ]; then
  brew install gitleaks actionlint hadolint yamllint jq || true
elif [ "$PKG_MGR" = "apt" ]; then
  sudo apt-get update
  sudo apt-get install -y jq yamllint
  echo "⚠️  gitleaks, actionlint, hadolint require manual installation on Linux"
elif [ "$PKG_MGR" = "yum" ]; then
  sudo yum install -y jq
  echo "⚠️  gitleaks, actionlint, hadolint require manual installation on RHEL/CentOS"
fi

# Install Node.js tools
echo ""
echo "📦 Installing Node.js tools globally..."
npm install -g markdownlint-cli license-checker biome || true

# Verify installations
echo ""
echo "✅ Verifying installations..."
echo ""

check_tool() {
  if command -v "$1" >/dev/null 2>&1; then
    VERSION=$($1 --version 2>&1 | head -n 1 || echo "unknown")
    echo "  ✅ $1 ($VERSION)"
    return 0
  else
    echo "  ❌ $1 (not found)"
    return 1
  fi
}

MISSING=0

check_tool gitleaks || MISSING=$((MISSING + 1))
check_tool actionlint || MISSING=$((MISSING + 1))
check_tool hadolint || MISSING=$((MISSING + 1))
check_tool yamllint || MISSING=$((MISSING + 1))
check_tool jq || MISSING=$((MISSING + 1))
check_tool markdownlint || MISSING=$((MISSING + 1))
check_tool license-checker || MISSING=$((MISSING + 1))
check_tool biome || MISSING=$((MISSING + 1))

echo ""

if [ $MISSING -eq 0 ]; then
  echo "✅ All pre-commit dependencies installed successfully"
  echo ""
  echo "Next steps:"
  echo "  1. Run: lefthook install"
  echo "  2. Test: git add . && git commit -m 'test: validate hooks'"
else
  echo "⚠️  $MISSING tool(s) missing - some hooks may be skipped"
  echo ""
  echo "Manual installation required for:"
  echo "  - gitleaks: https://github.com/gitleaks/gitleaks#installation"
  echo "  - actionlint: https://github.com/rhysd/actionlint#installation"
  echo "  - hadolint: https://github.com/hadolint/hadolint#install"
fi
