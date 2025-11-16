#!/usr/bin/env bash
set -euo pipefail

################################################################################
# Developer Onboarding & Environment Setup Script
# 
# This script automates the initial setup for new developers joining the
# Political Sphere project. It verifies dependencies, configures tooling,
# and prepares the development environment.
#
# Usage:
#   bash scripts/onboarding/setup-developer.sh
#
# Requirements:
#   - macOS or Linux
#   - Bash 4.0+
#   - Internet connection for package downloads
#
# Reference: docs/05-engineering-and-devops/development/README.md
################################################################################

# Color output helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Detect project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

log_info "Political Sphere Developer Onboarding Script"
log_info "Project root: ${PROJECT_ROOT}"
echo ""

cd "${PROJECT_ROOT}"

################################################################################
# Step 1: Check System Requirements
################################################################################
log_info "Step 1: Checking system requirements..."

# Check Node.js version
if ! command -v node &> /dev/null; then
  log_error "Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "${NODE_VERSION}" -lt 20 ]; then
  log_error "Node.js version ${NODE_VERSION} detected. Version 20+ required."
  exit 1
fi
log_success "Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
  log_error "npm is not installed"
  exit 1
fi
log_success "npm $(npm -v) detected"

# Check Git
if ! command -v git &> /dev/null; then
  log_error "Git is not installed. Please install Git from https://git-scm.com/"
  exit 1
fi
log_success "Git $(git --version | awk '{print $3}') detected"

# Check Docker (optional but recommended)
if command -v docker &> /dev/null; then
  log_success "Docker $(docker --version | awk '{print $3}' | tr -d ',') detected"
else
  log_warning "Docker not found. Docker is recommended for local development."
fi

echo ""

################################################################################
# Step 2: Install Dependencies
################################################################################
log_info "Step 2: Installing project dependencies..."

if [ ! -d "node_modules" ]; then
  log_info "Running npm install..."
  npm install
  log_success "Dependencies installed"
else
  log_info "node_modules exists. Running npm ci to ensure clean install..."
  npm ci
  log_success "Dependencies verified"
fi

echo ""

################################################################################
# Step 3: Setup Git Hooks (Lefthook)
################################################################################
log_info "Step 3: Setting up Git hooks with Lefthook..."

if [ -f ".lefthook.yml" ]; then
  npx lefthook install
  log_success "Git hooks installed"
else
  log_warning ".lefthook.yml not found. Skipping Git hooks setup."
fi

echo ""

################################################################################
# Step 4: Configure Environment Variables
################################################################################
log_info "Step 4: Configuring environment variables..."

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    log_info "Copying .env.example to .env..."
    cp .env.example .env
    log_success ".env created from .env.example"
    log_warning "Please review .env and update with your local configuration"
  else
    log_warning ".env.example not found. You may need to create .env manually."
  fi
else
  log_info ".env already exists"
fi

echo ""

################################################################################
# Step 5: Verify TypeScript Configuration
################################################################################
log_info "Step 5: Verifying TypeScript configuration..."

if npm run type-check &> /dev/null; then
  log_success "TypeScript configuration valid"
else
  log_warning "TypeScript type-checking found issues. Run 'npm run type-check' to see details."
fi

echo ""

################################################################################
# Step 6: Run Initial Linting
################################################################################
log_info "Step 6: Running linters..."

if npm run lint &> /dev/null; then
  log_success "Linting passed"
else
  log_warning "Linting found issues. Run 'npm run lint' to see details, or 'npm run lint:fix' to auto-fix."
fi

echo ""

################################################################################
# Step 7: Run Tests
################################################################################
log_info "Step 7: Running test suite..."

if npm test &> /dev/null; then
  log_success "All tests passed"
else
  log_warning "Some tests failed. Run 'npm test' to see details."
fi

echo ""

################################################################################
# Step 8: Verify Essential Tools
################################################################################
log_info "Step 8: Verifying development tools..."

# Check for Playwright browsers (for E2E testing)
if [ -d "node_modules/@playwright/test" ]; then
  log_info "Installing Playwright browsers..."
  npx playwright install --with-deps chromium firefox webkit
  log_success "Playwright browsers installed"
fi

# Check for Biome
if command -v npx &> /dev/null && npx biome --version &> /dev/null; then
  log_success "Biome linter available"
else
  log_warning "Biome not available. Install with 'npm install --save-dev @biomejs/biome'"
fi

echo ""

################################################################################
# Step 9: Generate Initial Documentation
################################################################################
log_info "Step 9: Generating documentation..."

if [ -f "scripts/adr-tool.mjs" ]; then
  npm run adr:index &> /dev/null || log_warning "ADR index generation skipped"
  log_success "Documentation indexed"
fi

echo ""

################################################################################
# Step 10: Final Health Check
################################################################################
log_info "Step 10: Running final health checks..."

ISSUES=0

# Check for required files
REQUIRED_FILES=(
  "package.json"
  "tsconfig.json"
  "vitest.config.js"
  ".github/copilot-instructions.md"
  "README.md"
)

for FILE in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "${FILE}" ]; then
    log_error "Required file missing: ${FILE}"
    ISSUES=$((ISSUES + 1))
  fi
done

# Check for critical directories
REQUIRED_DIRS=(
  "apps"
  "libs"
  "docs"
  "tools"
  "scripts"
)

for DIR in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "${DIR}" ]; then
    log_error "Required directory missing: ${DIR}"
    ISSUES=$((ISSUES + 1))
  fi
done

if [ ${ISSUES} -eq 0 ]; then
  log_success "All health checks passed"
else
  log_error "${ISSUES} health check(s) failed"
fi

echo ""

################################################################################
# Summary & Next Steps
################################################################################
echo "========================================================================"
log_success "Developer environment setup complete!"
echo "========================================================================"
echo ""
echo "Next steps:"
echo "  1. Review and update .env with your configuration"
echo "  2. Read docs/CONTRIBUTING.md for contribution guidelines"
echo "  3. Review docs/TODO.md for current priorities"
echo "  4. Run 'npm run dev' to start the development server"
echo "  5. Run 'npm test' to verify everything works"
echo ""
echo "Useful commands:"
echo "  npm run dev:api          - Start API server"
echo "  npm run dev:web          - Start web frontend"
echo "  npm test                 - Run test suite"
echo "  npm run lint             - Run linters"
echo "  npm run type-check       - Check TypeScript types"
echo "  npm run ai:context       - Build AI context for assistance"
echo ""
echo "Documentation:"
echo "  README.md                - Project overview"
echo "  CONTRIBUTING.md          - Contribution guidelines"
echo "  docs/TODO.md             - Current work items"
echo "  docs/quick-ref.md        - Quick reference guide"
echo ""
log_info "For questions, see SUPPORT.md or open an issue on GitHub"
echo "========================================================================"
