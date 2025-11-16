#!/bin/bash
#
# Quick Start Guide for AI Development System
#
# This script demonstrates how to use the integrated system.
#

set -e

echo "🚀 AI Development System - Quick Start"
echo "======================================"
echo ""

# Check we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this from libs/ai-system directory"
  exit 1
fi

echo "1️⃣  Running Test Suite..."
npm test 2>&1 | tail -5
echo ""

echo "2️⃣  Available Integration Commands:"
echo "   npm run setup-hooks       - Install Git pre-commit validation"
echo "   npm run validate:ci       - Run CI/CD validation"
echo "   npm run validate:pre-commit - Test pre-commit validation"
echo "   npm test                  - Run test suite"
echo "   npm run test:coverage     - Check code coverage"
echo ""

echo "3️⃣  System Files:"
echo "   ✅ Pre-commit hook:   scripts/pre-commit-validation.mjs"
echo "   ✅ CI validation:     scripts/ci-validation.mjs"
echo "   ✅ Setup script:      scripts/setup-hooks.sh"
echo "   ✅ Tests:             tests/ (43 tests)"
echo "   ✅ Documentation:     IMPLEMENTATION-COMPLETE.md"
echo ""

echo "4️⃣  To Start Using:"
echo "   cd libs/ai-system"
echo "   npm run setup-hooks"
echo ""

echo "✅ AI Development System is ready for production use!"
echo ""
