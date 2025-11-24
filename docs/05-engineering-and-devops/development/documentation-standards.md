# Documentation Standards

## Overview

This document defines the documentation standards and quality requirements for Political Sphere. All documentation must meet these standards to ensure consistency, accuracy, and maintainability.

## Documentation Structure

### Required Directories

The project follows a structured documentation hierarchy:

- `docs/00-foundation/` - Core principles, organization, standards
- `docs/01-strategy/` - Product roadmap, vision, strategy
- `docs/02-governance/` - Governance framework, policies
- `docs/03-legal-and-compliance/` - Legal requirements, GDPR, CCPA
- `docs/04-architecture/` - System architecture, ADRs
- `docs/05-engineering-and-devops/` - Development guides, testing
- `docs/06-security-and-risk/` - Security policies, risk management
- `docs/07-ai-and-simulation/` - AI governance, model documentation
- `docs/08-game-design-and-mechanics/` - Game design documentation
- `docs/09-observability-and-ops/` - Operations, monitoring, runbooks

### File Organization

- Each major directory must contain a `README.md` with overview and navigation
- Use kebab-case for file names: `documentation-standards.md`
- Group related documents in subdirectories
- Maintain consistent naming conventions across similar document types

## Markdown Standards

### Formatting Rules

**Headings:**

- Use ATX-style headings (`#`, `##`, `###`)
- Maintain proper heading hierarchy (don't skip levels)
- Use sentence case for headings
- Include blank lines before and after headings

**Lists:**

- Use dashes (`-`) for unordered lists
- Indent nested lists by 2 spaces
- Include blank lines before and after lists
- Use consistent punctuation (periods for complete sentences)

**Code Blocks:**

- Always specify language for syntax highlighting
- Use fenced code blocks (```) instead of indented
- Include comments for complex code examples
- Keep code examples focused and minimal

**Links:**

- Use descriptive link text (not "click here")
- Validate all external links regularly
- Use relative paths for internal documentation links
- Include link titles for additional context

### Example

```markdown
# Document Title

Brief introduction paragraph explaining the document's purpose.

## Main Section

Descriptive content with proper formatting.

### Subsection

- List item one
- List item two with **emphasis**
- List item three with `inline code`

**Code example:**

\`\`\`typescript
// TypeScript example with proper syntax highlighting
function example(): string {
return 'Hello, world!';
}
\`\`\`

**Related documents:**

- [Architecture Overview](../04-architecture/overview.md)
- [Testing Standards](testing.md)
```

## Content Quality Standards

### Clarity and Completeness

- Write for your audience (developers, architects, operations)
- Define technical terms and acronyms on first use
- Include examples to illustrate complex concepts
- Provide context and rationale for decisions
- Keep paragraphs focused on single topics

### Accuracy and Maintenance

- Review and update documentation with code changes
- Include version information and last updated dates
- Mark deprecated content clearly
- Remove outdated information promptly
- Verify code examples compile and run correctly

### Accessibility

- Use clear, simple language
- Avoid jargon where possible
- Structure content with proper headings
- Include alt text for images and diagrams
- Ensure adequate color contrast in diagrams

## API Documentation

### Requirements

- Generate API documentation using Compodoc
- Document all public APIs and interfaces
- Include parameter descriptions and types
- Provide usage examples for complex APIs
- Document error conditions and exceptions

### Coverage Standards

- Minimum 80% API documentation coverage
- All exported functions/classes documented
- Complex algorithms explained with comments
- Breaking changes highlighted in changelogs

### Example

````typescript
/**
 * Validates user authentication credentials
 *
 * @param credentials - User login credentials
 * @param credentials.username - Username (3-50 characters)
 * @param credentials.password - Password (minimum 12 characters)
 * @returns Authentication token on success
 * @throws {ValidationError} If credentials are invalid
 * @throws {AuthenticationError} If authentication fails
 *
 * @example
 * ```typescript
 * const token = await validateCredentials({
 *   username: 'user@example.com',
 *   password: 'securePassword123!'
 * });
 * ```
 */
export async function validateCredentials(credentials: UserCredentials): Promise<AuthToken> {
  // Implementation
}
````

## Spelling and Grammar

### Dictionary

- Use American English spelling
- Maintain project-specific dictionary in `cspell.json`
- Add technical terms, project names, and acronyms
- Review and update dictionary regularly

### Grammar

- Use active voice where possible
- Write in present tense for descriptions
- Use consistent terminology throughout
- Proofread before committing

## Link Management

### Internal Links

- Use relative paths for documentation links
- Verify links when moving or renaming files
- Update related documents when structure changes
- Avoid deep nesting in link paths

### External Links

- Verify external links are accessible
- Use stable, versioned documentation URLs
- Include link titles for context
- Consider archiving important external resources

### Link Validation

- Run automated link checks in CI/CD
- Fix broken links promptly
- Document intentional exclusions
- Review link health reports regularly

## Automation and CI/CD

### Automated Checks

**Pre-commit:**

- Markdown linting
- Spell checking
- Basic structure validation

**CI/CD Pipeline:**

- Comprehensive markdown linting
- Full spell check with project dictionary
- Link validation with retry logic
- API documentation coverage
- Structure validation

### Quality Gates

- All markdown lint rules must pass
- Zero spelling errors (or approved exceptions)
- All internal links must be valid
- API documentation coverage ≥80%
- Required directories must exist

### Reporting

- Automated PR comments with quality summary
- Detailed error messages for failures
- Links to relevant documentation standards
- Actionable guidance for fixes

## Review Process

### Documentation Changes

1. Create descriptive commit messages
2. Run local validation before committing
3. Include documentation updates with code PRs
4. Request review from relevant domain experts
5. Address feedback and update as needed

### Major Updates

- Announce significant documentation changes
- Update related documents for consistency
- Review impact on dependent documentation
- Update navigation and indexes

## Tools and Scripts

### NPM Scripts

```bash
# Lint markdown files
npm run docs:lint

# Check spelling
npm run docs:spell

# Validate links
npm run docs:links

# Run all documentation validations
npm run docs:validate

# Generate API docs and validate
npm run docs:build
```

### CI/CD Integration

Documentation quality checks run automatically:

- On pull request creation and updates
- On push to main branch
- On documentation file changes
- Via manual workflow dispatch

## Best Practices

### Writing Tips

- Start with an outline
- Use concrete examples
- Include diagrams for complex concepts
- Test code examples thoroughly
- Get peer review for technical accuracy

### Maintenance

- Review documentation quarterly
- Update with architectural changes
- Archive obsolete documentation
- Maintain changelog for documentation
- Track documentation coverage metrics

### Collaboration

- Use consistent terminology across teams
- Share documentation templates
- Contribute to project dictionary
- Participate in documentation reviews
- Suggest improvements to standards

## Resources

### Tools

- **Markdownlint**: [GitHub](https://github.com/DavidAnson/markdownlint)
- **cspell**: [GitHub](https://github.com/streetsidesoftware/cspell)
- **Compodoc**: [Documentation](https://compodoc.app/)
- **markdown-link-check**: [GitHub](https://github.com/tcort/markdown-link-check)

### Style Guides

- [Microsoft Writing Style Guide](https://docs.microsoft.com/en-us/style-guide/welcome/)
- [Google Developer Documentation Style Guide](https://developers.google.com/style)
- [Write the Docs](https://www.writethedocs.org/guide/)

### Project References

- [GitHub Copilot Instructions](.github/copilot-instructions.md)
- [Quick Reference](quick-ref.md)
- [Architecture Overview](04-architecture/README.md)
- [Testing Standards](05-engineering-and-devops/development/testing.md)

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-20  
**Maintainer**: Technical Documentation Team
