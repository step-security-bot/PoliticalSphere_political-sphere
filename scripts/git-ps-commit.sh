#!/usr/bin/env bash
# =============================================================================
# Political Sphere - Branded Git Commit Wrapper
# =============================================================================
#
# Usage: git ps-commit [git commit options]
# Example: git ps-commit -m "feat: add new feature"
#
# This wrapper shows the Political Sphere banner before running git commit
# with all lefthook pre-commit hooks.
#
# Install: Run `npm run setup:git-alias` or manually:
#   git config alias.ps-commit '!bash scripts/git-ps-commit.sh'
# =============================================================================

# Display Political Sphere banner
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║                          ____  ____                              ║"
echo "║                         |  _ \\/ ___|                             ║"
echo "║                         | |_) \\___ \\                             ║"
echo "║                         |  __/ ___) |                            ║"
echo "║                         |_|   |____/                             ║"
echo "║                                                                  ║"
echo "║                 P O L I T I C A L   S P H E R E                  ║"
echo "║                                                                  ║"
echo "║                  ── Pre-Commit Validation ──                     ║"
echo "║                        ── V 3.0.0 ──                             ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Run git commit with all passed arguments
# Lefthook will trigger automatically
git commit "$@"
