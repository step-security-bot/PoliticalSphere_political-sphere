# GitHub Copilot Instructions Directory

This directory contains specialized instruction files that provide context-specific guidance to GitHub Copilot coding agents.

## Directory Structure

```
.github/instructions/
├── accessibility.instructions.md - WCAG 2.2 AA compliance guidance
├── security.instructions.md      - Security best practices and patterns
└── testing.instructions.md       - Testing patterns and requirements
```

## How Scoped Instructions Work

These `.instructions.md` files use YAML frontmatter to specify which files they apply to. When Copilot works on matching files, it automatically includes the relevant instructions for context-aware assistance.

### Example Frontmatter

```yaml
---
applies_to:
  - '**/*.test.{ts,tsx,js,jsx}'
  - '**/*.spec.{ts,tsx,js,jsx}'
  - '**/tests/**'
---
```

## Instruction Files

### accessibility.instructions.md

**Applies to**: React/JSX files, UI components, pages
**Purpose**: Ensures WCAG 2.2 AA compliance in all UI code
**Key Topics**:

- Semantic HTML usage
- Keyboard navigation
- ARIA attributes (when needed)
- Color contrast requirements
- Focus management
- Screen reader support
- Accessibility testing with axe-core

### security.instructions.md

**Applies to**: Authentication, security, validation, crypto, API files
**Purpose**: Enforces security best practices and prevents vulnerabilities
**Key Topics**:

- Zero-trust principles
- Authentication & authorization
- Input validation & sanitization
- SQL injection prevention
- Secrets management
- Cryptography best practices
- Rate limiting
- Security testing
- OWASP Top 10 prevention

### testing.instructions.md

**Applies to**: Test files (`*.test.*`, `*.spec.*`, test directories)
**Purpose**: Ensures comprehensive, high-quality test coverage
**Key Topics**:

- Arrange-Act-Assert (AAA) pattern
- Vitest configuration and usage
- Unit, integration, and E2E testing
- Accessibility testing
- Security testing
- Coverage requirements (80%+)
- Test data management
- Mocking and cleanup

## Benefits

1. **Context-Aware**: Instructions automatically apply based on file type
2. **Specialized Guidance**: Detailed, domain-specific best practices
3. **Consistency**: Standardized approaches across the codebase
4. **Quality**: Built-in quality gates and requirements
5. **Learning**: Educational for developers and AI assistants

## Usage

These files work automatically when using GitHub Copilot:

1. Open a test file → Testing instructions are active
2. Open a React component → Accessibility instructions are active
3. Open an authentication file → Security instructions are active

No manual activation needed - Copilot automatically includes relevant guidance.

## Maintenance

When updating these files:

- Keep instructions clear and actionable
- Include concrete code examples
- Reference official standards (WCAG, OWASP, etc.)
- Update when project standards change
- Test that examples actually work

## Related Files

- **Main instructions**: `.github/copilot-instructions.md`
- **Custom agents**: `.github/agents/*.md`
- **Project docs**: `docs/05-engineering-and-devops/`

## References

- [GitHub Copilot Custom Instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)
- [Scoped Instructions Documentation](https://github.blog/changelog/2025-07-23-github-copilot-coding-agent-now-supports-instructions-md-custom-instructions/) (Feature announcement date)
- [Best Practices for Copilot Coding Agents](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results)
