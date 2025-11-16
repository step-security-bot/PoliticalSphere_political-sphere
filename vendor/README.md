# Vendored Dependencies

This directory stores patched third-party packages that must be tracked in-repo for security fixes which are not yet available on the public npm registry.

## js-yaml-patched

- Mirrors `js-yaml@4.1.1` with a local fix for [GHSA-mh29-5h37-fv8m](https://osv.dev/vulnerability/GHSA-mh29-5h37-fv8m).
- All consumers are forced to resolve through this directory via `package.json` overrides so no `js-yaml@3.x/4.1.0` copies remain in the dependency graph.
- When an official upstream release is available, delete this directory and update the dependency tree accordingly.
