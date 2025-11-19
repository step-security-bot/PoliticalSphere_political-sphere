# GitHub Usage Policy

<div align="center">

| Classification | Version | Last Updated |       Owner        | Review Cycle |    Status    |
| :------------: | :-----: | :----------: | :----------------: | :----------: | :----------: |
|  🔒 Internal   | `0.1.0` |  2025-10-30  | Documentation Team |  Quarterly   | **Approved** |

</div>

---

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

This document outlines best practices for safely using GitHub in this repository, ensuring security, collaboration, and compliance with our security policies.

## General Guidelines

- **Commit Messages**: Use clear, descriptive commit messages. Follow conventional commits if applicable (e.g., `feat: add new feature`).
- **Branching**: Use descriptive branch names (e.g., `feature/add-login`, `bugfix/fix-auth`). Avoid working directly on `main` or `master`.
- **Pull Requests (PRs)**: Always create PRs for changes. Include a description, link to issues if applicable, and request reviews from relevant team members. Use the provided PR template.
- **Code Reviews**: Require at least one approval before merging. Review for security, code quality, and adherence to standards. Use CODEOWNERS for automatic reviewer assignment.
- **Issues**: Use GitHub Issues for tracking bugs, features, and discussions. Use issue templates for consistency.

## Security Practices

### Secrets and Credentials

- **Never Commit Secrets**: Do not commit API keys, passwords, tokens, or any sensitive data. Use GitHub Secrets for CI/CD pipelines instead.
- **Secrets Scanning**: Our CI runs automated Gitleaks checks. If a secret is detected, the PR will fail, and you must remove it from history.
- **Handling Leaked Secrets**: If a secret is accidentally committed:
  1. Revoke the credential immediately.
  2. Remove from git history using `git filter-repo` or BFG.
  3. Force-push the cleaned branch.
  4. Store the new credential securely (e.g., GitHub Secrets).
- **False Positives**: If Gitleaks flags a false positive, update `.gitleaks.toml` with justification.

### Reporting Vulnerabilities

- Report security issues privately via GitHub issues or contact maintainers in CODEOWNERS.
- Do not discuss vulnerabilities publicly until resolved.

## CI/CD and Automation

- **GitHub Actions**: Use GitHub Secrets for environment variables. Avoid hardcoding secrets in workflows. Workflows are configured in `.github/workflows/`.
- **Pre-commit Hooks**: Lefthook runs local checks (e.g., linting, secrets scan) before commits.
- **CI Checks**: Ensure all CI checks pass before merging. This includes linting, testing, security scans, and dependency reviews.
- **Automation**: Renovate is configured for dependency updates. Stale issues/PRs are managed automatically. PRs are labeled and sized automatically.

## Collaboration and Communication

- **Issues**: Use GitHub Issues for tracking bugs, features, and discussions. Label appropriately.
- **Discussions**: For broader topics, use GitHub Discussions if enabled.
- **Code of Conduct**: Follow the project's Code of Conduct for all interactions.

## Compliance

- Align with [SECURITY.md](../../../SECURITY.md) for secrets management and incident response.
- For urgent security incidents, follow the contact procedures in [SECURITY.md](../../../SECURITY.md) or the Code of Conduct.

## References

- [SECURITY.md](../../../SECURITY.md) - Detailed security policies.
- [CONTRIBUTING.md](../../../CONTRIBUTING.md) - Contribution guidelines.
- [.github/CODEOWNERS](../../../.github/CODEOWNERS) - Code ownership rules.
- [.github/workflows/](../../../.github/workflows/) - CI/CD pipeline configurations.
- [GitHub Docs](https://docs.github.com/) - Official GitHub documentation.
