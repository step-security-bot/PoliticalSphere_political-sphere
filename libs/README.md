# Libs

This directory contains shared libraries and utilities used across the Political Sphere platform. These are reusable modules that provide common functionality, types, and configurations.

## Libraries

- **`shared/`** - Shared utilities, types, and common business logic
- **`ui/`** - Shared UI components and design system
- **`infrastructure/`** - Infrastructure modules and configurations
- **`platform/`** - Platform configurations and cross-cutting concerns
- **`ci/`** - Reusable CI/CD tooling and automation scripts

## Architecture

Libraries are built as Nx libraries to enable code sharing and maintainability across applications. They follow the single responsibility principle and are designed to be independently testable and versionable.

## Development

Libraries can be built and tested independently:

```bash
npx nx build shared
npx nx test ui
```

To build all libraries:

```bash
npx nx run-many --target=build --all
```

Refer to each library's README.md for specific usage and development instructions.
**Maturity Level:** Stable
**Current Limitations:** Some libraries may be evolving.

**Known Issues:** Dependency management.
