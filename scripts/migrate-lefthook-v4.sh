#!/usr/bin/env bash

# =============================================================================
# Lefthook v3 → v4 Migration Script
# Safely migrates from v3.0.0 to v4.0.0 configuration
# =============================================================================

set -euo pipefail

echo "🔄 Migrating Lefthook configuration v3.0.0 → v4.0.0"
echo ""

# Safety checks
if [ ! -f ".lefthook.yml" ]; then
  echo "❌ No .lefthook.yml found in current directory"
  exit 1
fi

if [ ! -f ".lefthook-v4.yml" ]; then
  echo "❌ No .lefthook-v4.yml found - ensure it exists before migration"
  exit 1
fi

# Create backup
BACKUP_FILE=".lefthook-v3-backup-$(date +%Y%m%d-%H%M%S).yml"
echo "📦 Creating backup: $BACKUP_FILE"
cp .lefthook.yml "$BACKUP_FILE"

# Show diff
echo ""
echo "📊 Configuration changes preview:"
echo "════════════════════════════════"
diff -u .lefthook.yml .lefthook-v4.yml | head -n 50 || true
echo ""
echo "(showing first 50 lines of diff)"
echo ""

# Confirm migration
read -p "Proceed with migration? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Migration cancelled"
  exit 1
fi

# Apply migration
echo ""
echo "✨ Applying v4.0.0 configuration..."
mv .lefthook-v4.yml .lefthook.yml

# Reinstall hooks
echo "🔧 Reinstalling Lefthook hooks..."
lefthook install

# Create telemetry directory
echo "📂 Creating telemetry directory..."
mkdir -p logs

# Update .gitignore
if ! grep -q "logs/pre-commit-telemetry.jsonl" .gitignore 2>/dev/null; then
  echo "📝 Updating .gitignore..."
  echo "" >> .gitignore
  echo "# Pre-commit telemetry" >> .gitignore
  echo "logs/pre-commit-telemetry.jsonl" >> .gitignore
fi

# Test new configuration
echo ""
echo "🧪 Testing new configuration..."
if lefthook run --no-tty pre-commit 2>&1 | head -n 5; then
  echo "✅ Configuration test passed"
else
  echo "⚠️  Configuration test showed errors (may be due to pending changes)"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "Summary:"
echo "  ✅ v3.0.0 backed up to: $BACKUP_FILE"
echo "  ✅ v4.0.0 installed"
echo "  ✅ Hooks reinstalled"
echo "  ✅ Telemetry directory created"
echo "  ✅ .gitignore updated"
echo ""
echo "Breaking changes in v4.0.0:"
echo "  • markdownlint now enforced (run: markdownlint --fix '**/*.md')"
echo "  • 17 jsx-a11y rules (was 5) - stricter accessibility"
echo "  • Change budget validation in AUDIT_MODE"
echo "  • Conventional commits strictly enforced"
echo ""
echo "Testing:"
echo "  git add <files> && git commit -m 'test: validate v4 hooks'"
echo ""
echo "Execution modes:"
echo "  Standard:  git commit              (all gates)"
echo "  Fast:      FAST_AI=1 git commit   (reduced gates)"
echo "  Audit:     AUDIT_MODE=1 git commit (full + evidence)"
echo ""
echo "Rollback (if needed):"
echo "  mv $BACKUP_FILE .lefthook.yml"
echo "  lefthook install"
