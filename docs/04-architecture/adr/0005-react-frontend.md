# ADR-0005: React 18+ for Frontend

> NOTE: For project-level context and strategy, see `docs/00-foundation/project-context.md`.

**Status:** Accepted  
**Date:** 2025-11-10  
**Deciders:** Technical Lead, Frontend Team  
**Technical Story:** Frontend Framework Selection

## Context and Problem Statement

We need a modern, accessible, and performant frontend framework for Political Sphere's web applications that supports complex interactive UIs and real-time updates.

## Decision Drivers

- Component-based architecture for reusability
- Strong accessibility support (WCAG 2.2 AA+ mandatory)
- Large ecosystem and community
- Performance and scalability
- Server-side rendering capabilities

## Considered Options

- **Option 1**: React 18+ with concurrent features
- **Option 2**: Vue.js 3
- **Option 3**: Svelte
- **Option 4**: Angular

## Decision Outcome

**Chosen option:** "React 18+ with concurrent features"

**Justification:** React provides the most mature accessibility tooling, largest ecosystem, and concurrent rendering features for optimal UX. Strong TypeScript support and widespread industry adoption reduce hiring risk.

### Positive Consequences

- Concurrent rendering improves UX under load
- Extensive accessibility tooling (React Testing Library, axe-core)
- Large talent pool familiar with React
- Rich ecosystem of libraries and components
- Suspense and transitions for better loading states

### Negative Consequences

- Larger bundle size than lighter frameworks
- More boilerplate than Svelte
- Learning curve for hooks and concurrent features

## Links

- [React Documentation](https://react.dev)
- `/docs/05-engineering-and-devops/languages/react.md`
- `/docs/05-engineering-and-devops/ui/ux-accessibility.md`

## Compliance Checklist

- [x] **Accessibility (UX-01 to UX-05)**: WCAG 2.2 AA compliance achievable
- [x] **Quality (QUAL-01 to QUAL-09)**: Strong testing support
- [x] **Security (SEC-01 to SEC-10)**: XSS protection built-in

## Notes

**Required patterns:**

- Functional components with hooks (no class components)
- Proper accessibility attributes (ARIA, semantic HTML)
- React Testing Library for component tests
- Error boundaries for resilience
