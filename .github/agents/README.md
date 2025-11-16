# GitHub Copilot Custom Agents

This directory contains custom agent profiles that provide specialized assistance for specific tasks.

## Directory Structure

```
.github/agents/
├── docs-improver.md   - Documentation quality enhancement
├── readme-expert.md   - README creation and maintenance
└── test-generator.md  - Comprehensive test generation
```

## What Are Custom Agents?

Custom agents are specialized AI assistants with focused expertise in specific domains. Each agent has:

- A clear area of focus
- Specialized knowledge and best practices
- Task-specific templates and patterns
- Quality standards and checklists

## Available Agents

### 📚 docs-improver.md

**Specialization**: Documentation Quality Enhancement

**Use When**:

- Improving existing documentation
- Writing technical documentation
- Creating API documentation
- Writing ADRs (Architecture Decision Records)
- Enhancing code comments

**Capabilities**:

- Clarifies ambiguous explanations
- Improves organization and structure
- Adds missing information
- Ensures consistency
- Provides code examples
- Follows documentation best practices

**Example Usage**:

```
@copilot using @docs-improver, please improve the documentation in this file
```

### 📖 readme-expert.md

**Specialization**: README Creation and Maintenance

**Use When**:

- Creating new README files
- Updating existing READMEs
- Documenting new features
- Adding installation instructions
- Creating usage examples

**Capabilities**:

- Creates well-structured README files
- Includes all essential sections
- Provides clear installation steps
- Adds working code examples
- Maintains consistency across READMEs
- Adds appropriate badges and links

**Example Usage**:

```
@copilot using @readme-expert, create a comprehensive README for this library
```

### 🧪 test-generator.md

**Specialization**: Comprehensive Test Generation

**Use When**:

- Creating test suites for new code
- Improving test coverage
- Adding missing test cases
- Testing edge cases
- Creating accessibility tests
- Creating security tests

**Capabilities**:

- Generates comprehensive test suites
- Follows AAA (Arrange-Act-Assert) pattern
- Includes success and failure scenarios
- Tests edge cases and boundaries
- Creates accessibility tests (axe-core)
- Creates security tests
- Targets 80%+ coverage

**Example Usage**:

```
@copilot using @test-generator, create a comprehensive test suite for this component
```

## How to Use Custom Agents

### In GitHub Issues/PRs

Mention the agent in comments:

```
@copilot using @readme-expert, please update the README to include the new configuration options
```

### In IDE (VS Code, etc.)

Use the agent in chat:

```
Using the test-generator agent, create tests for the validateEmail function
```

## Agent Selection Guide

| Task                  | Recommended Agent | Alternative     |
| --------------------- | ----------------- | --------------- |
| Create/update README  | `readme-expert`   | `docs-improver` |
| Write API docs        | `docs-improver`   | -               |
| Generate tests        | `test-generator`  | -               |
| Improve comments      | `docs-improver`   | -               |
| Create ADR            | `docs-improver`   | -               |
| Add test coverage     | `test-generator`  | -               |
| Document architecture | `docs-improver`   | -               |

## Quality Standards

All agents follow these standards:

- Clear, actionable output
- Concrete code examples
- Best practices alignment
- Project conventions
- Comprehensive coverage
- Quality checklists

## Creating New Agents

When adding new agents:

1. **Choose a clear focus**: One specific domain or task type
2. **Define capabilities**: What the agent can do
3. **Provide examples**: Real code examples and templates
4. **Include checklists**: Quality and completeness checks
5. **Reference standards**: Link to official docs and guides
6. **Use frontmatter**:
   ```yaml
   ---
   name: agent-name
   description: Brief description of the agent's purpose
   ---
   ```

## Benefits

1. **Specialized Expertise**: Domain-specific knowledge and patterns
2. **Consistency**: Standardized output across similar tasks
3. **Quality**: Built-in best practices and standards
4. **Efficiency**: Faster task completion with expert guidance
5. **Learning**: Educational for developers

## Maintenance

When updating agents:

- Keep focus narrow and specific
- Update examples when standards change
- Test that examples work
- Maintain consistency with project standards
- Add new capabilities as needed

## Related Files

- **Main instructions**: `.github/copilot-instructions.md`
- **Scoped instructions**: `.github/instructions/*.instructions.md`
- **Project standards**: `docs/00-foundation/standards/`

## References

- [GitHub Copilot Custom Agents](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat)
- [Building Custom Agents](https://montemagno.com/building-better-apps-with-github-copilot-custom-agents/)
- [Best Practices for Copilot Agents](https://docs.github.com/en/copilot/tutorials/coding-agent/get-the-best-results)
