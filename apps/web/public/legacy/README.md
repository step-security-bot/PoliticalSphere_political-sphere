# Legacy Public Bundle

Compiled static assets that used to live in the repository root under `assets/public/` now sit here so they are versioned alongside the `apps/web` project.

- These files represent historical Vite bundles that certain smoke tests still load directly (e.g. `environment.js`, `main.js`, `runtime.js`, `styles*.js/css`).
- Keep this directory **out of** the normal Vite build pipeline; anything placed here is served verbatim from `/`.
- When the legacy bundle is no longer required, delete these files instead of copying new builds here.
