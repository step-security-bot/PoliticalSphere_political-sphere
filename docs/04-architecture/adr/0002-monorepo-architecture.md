# ADR-0002: Monorepo Architecture with Nx

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Status:** Accepted  
**Date:** 2025-11-10  
**Deciders:** Technical Lead, DevOps Team  
**Technical Story:** Repository Organization and Scalability

## Context and Problem Statement

The Political Sphere project requires managing multiple applications (frontend, backend, game server, workers) and shared libraries. We need to decide on a repository structure that supports code sharing, consistent tooling, and efficient CI/CD.

## Decision Drivers

- Code reusability across multiple applications
- Consistent dependency management
- Simplified CI/CD pipelines
- Atomic commits across related changes
- Developer experience and tooling support

## Considered Options

- **Option 1**: Monorepo with Nx workspace
- **Option 2**: Multi-repo (separate repositories per application)
- **Option 3**: Monorepo with Turborepo
- **Option 4**: Monorepo with Lerna

## Decision Outcome

**Chosen option:** "Monorepo with Nx workspace"

**Justification:** Nx provides superior tooling for TypeScript monorepos, including advanced dependency graph analysis, affected command detection, and built-in caching. It integrates well with our tech stack (React, Node.js, TypeScript) and provides module boundary enforcement.

### Positive Consequences

- Shared libraries reduce code duplication
- Affected commands optimize CI/CD (only test changed projects)
- Module boundaries enforce architectural constraints
- Single version of dependencies across projects
- Atomic commits for cross-cutting changes

### Negative Consequences

- Initial setup complexity
- Larger repository size
- Learning curve for Nx-specific concepts
- Build cache management required

## Pros and Cons of the Options

### Monorepo with Nx workspace

**Pros:**

- Advanced dependency graph visualization
- Built-in caching and distributed task execution
- Module boundary enforcement
- Excellent TypeScript support
- Active community and ecosystem

**Cons:**

- Steeper learning curve than simpler tools
- Requires careful configuration
- Can be complex for new contributors

### Multi-repo

**Pros:**

- Simple, independent repositories
- Clear ownership boundaries
- Smaller repository sizes

**Cons:**

- Code duplication across repos
- Complex dependency management
- Difficult to coordinate breaking changes
- Multiple CI/CD pipelines to maintain

### Turborepo

**Pros:**

- Simpler than Nx
- Good caching capabilities
- Growing ecosystem

**Cons:**

- Less mature tooling for module boundaries
- Fewer built-in generators and schematics

## Links

- [Nx Documentation](https://nx.dev)
- [Monorepo Best Practices](https://monorepo.tools)
- `/docs/04-architecture/nx-configuration.md`

## Compliance Checklist

- [x] **Security (SEC-01 to SEC-10)**: Module boundaries prevent unauthorized access
- [x] **Quality (QUAL-01 to QUAL-09)**: Affected commands optimize test execution
- [x] **Operations (OPS-01 to OPS-05)**: Caching improves CI/CD performance

## Notes

- Nx configuration is in `nx.json`
- Module boundaries defined in project-specific `project.json` files
- Use `nx affected:test` in CI to optimize test runs
