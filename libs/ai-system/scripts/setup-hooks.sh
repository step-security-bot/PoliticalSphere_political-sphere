#!/bin/bash
#
# Setup Git Hooks for AI Development System
#
# This integrates the AI system into active development practice.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$GIT_ROOT/.git/hooks"

echo "🔧 Setting up AI Development System Git Hooks"
echo ""

# Make scripts executable
chmod +x "$SCRIPT_DIR/pre-commit-validation.mjs"
chmod +x "$SCRIPT_DIR/ci-validation.mjs"

# Create pre-commit hook
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
#
# AI Development System Pre-Commit Hook
#

cd "$(git rev-parse --show-toplevel)/libs/ai-system"

# Run validation
node scripts/pre-commit-validation.mjs

exit $?
EOF

chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Git hooks installed successfully!"
echo ""
echo "The following hooks are now active:"
echo "  - pre-commit: Political neutrality validation"
echo ""
echo "To bypass hooks (emergency only), use: git commit --no-verify"
echo ""
