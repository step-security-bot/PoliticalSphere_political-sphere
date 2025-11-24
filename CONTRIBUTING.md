# Contributing to Political Sphere

Thank you for your interest in contributing to Political Sphere! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

- Node.js 22 or higher
- npm 10 or higher
- Git
- Docker (for local development)

### Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/political-sphere.git
   cd political-sphere
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```
5. **Run tests** to verify setup:
   ```bash
   npm test
   ```

For detailed onboarding instructions, see [docs/onboarding.md](../docs/onboarding.md).

## Development Process

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Workflow

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Write/update tests
4. Run quality checks:
   ```bash
   npm run lint:fix
   npm run type-check
   npm test
   ```
5. Commit with descriptive messages
6. Push to your fork
7. Open a Pull Request

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass locally (`npm test`)
- [ ] New tests added for new functionality (maintain 100% pass rate)
- [ ] Security audit passed (`npm run audit:full` - no new critical/high issues)
- [ ] Documentation updated if needed
- [ ] CHANGELOG.md updated with your changes
- [ ] Commit messages are clear and descriptive

### CI/CD Requirements

All PRs must pass automated quality gates before merging:

#### **Test Suite** (`.github/workflows/test.yml`)

- ✅ Unit tests: 130/130 passing required
- ✅ Coverage maintained or improved
- ⏱️ Tests complete in <15 minutes

#### **Security & Quality Audit** (`.github/workflows/audit.yml`)

- ✅ No new critical or high severity issues
- ✅ OpenAPI specification valid
- ✅ No hardcoded secrets detected
- ✅ App-specific audits pass for affected apps

#### **Governance Controls** (`.github/workflows/controls.yml`)

- ✅ ESLint zero-warning policy
- ✅ TypeScript strict typecheck
- ✅ Module boundary compliance
- ✅ PR header validation

#### **Security Scanning** (`.github/workflows/security-scan.yml`)

- ✅ Gitleaks: No secrets committed
- ✅ Semgrep: No prohibited patterns
- ✅ npm audit: No high/critical vulnerabilities

### PR Guidelines

1. **Use the PR template** - Select appropriate template when creating PR
2. **Keep PRs focused** - One feature/fix per PR
3. **Respect change budgets**:
   - Safe mode: ≤300 lines changed, ≤12 files
   - Fast-secure: ≤200 lines changed, ≤8 files
4. **Link related issues** - Reference issues in PR description
5. **Request review** - Tag appropriate reviewers
6. **Address audit findings** - Fix any issues found by automated audits

### PR Review Process

- PRs require at least one approval from the core team
- All CI checks must pass
- Address reviewer feedback promptly
- Keep the PR up to date with `main`

## Coding Standards

### File Organization

Follow the structure in [docs/ai/ai-usage-playbook.md](docs/ai/ai-usage-playbook.md) and the directory layout below:

```
/apps     - Applications
/libs     - Shared libraries
/tools    - Build tools
/docs     - Documentation
/scripts  - Automation scripts
```

### Naming Conventions

- **Files/directories**: `kebab-case`
- **Classes/Components**: `PascalCase`
- **Functions/variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`

### Code Style

- Use ESLint and Prettier (configured in project)
- Run `npm run lint:fix` before committing
- Follow existing patterns in the codebase
- Write self-documenting code with clear names

### TypeScript

- Enable strict mode
- Avoid `any` types
- Provide proper type annotations
- Document complex types

## Testing Requirements

### Test Coverage

- Minimum 80% coverage for new code
- All new features must have tests
- Bug fixes should include regression tests

### Test Types

- **Unit tests**: Test individual functions/components
- **Integration tests**: Test component interactions
- **E2E tests**: Test critical user flows

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
npm run test:e2e           # E2E tests only
```

## Documentation

### Code Documentation

- Document all public APIs
- Use JSDoc/TSDoc comments
- Explain _why_, not just _what_
- Include examples for complex features

### Project Documentation

When adding features, update relevant docs in `/docs`:

- Architecture documentation
- API documentation
- User guides
- ADRs (Architecture Decision Records) for significant changes

### Changelog

Add entry to `CHANGELOG.md` under `[Unreleased]` section:

```markdown
### Added

- Your feature description (YYYY-MM-DD)

### Changed

- Your change description (YYYY-MM-DD)

### Fixed

- Your fix description (YYYY-MM-DD)
```

## Governance and Rules

This project follows strict governance rules defined in:

- `.github/copilot-instructions/` - AI assistant governance
- `.blackboxrules` - Development rules and standards
- `docs/02-governance/` - Project governance documentation

Key principles:

- **Constitutional Tier 0**: Ethics, safety, privacy (never bypass)
- **Operational Tier 1**: Security, compliance (mandatory)
- **Best-Practice Tier 2**: Quality, testing (defaults)
- **Advisory Tier 3**: Optimizations (recommended)

## Getting Help

- **Documentation**: Check `/docs` folder
- **Discussions**: Use GitHub Discussions for questions
- **Support**: See [SUPPORT.md](SUPPORT.md)
- **Issues**: Report bugs via issue templates

## Recognition

Contributors will be acknowledged in:

- CHANGELOG.md
- Project README.md
- Release notes

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](../LICENSE)).

---

Thank you for contributing to Political Sphere! 🎉
