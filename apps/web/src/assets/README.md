# Web Application Assets

## 1. Directory Identity & Purpose

**Directory Name:** `apps/web/src/assets`

**Short Description:** Source-of-truth for images, fonts, icons, and audio assets that ship with the Political Sphere web client.

**Role within the System:** Provides the design system primitives that React components reference at build-time (via import) or at runtime when served from Vite/Vercel.

**Unique Value:** Keeps every UX-facing asset colocated with the `apps/web` application so designers and frontend engineers can iterate without touching unrelated parts of the monorepo.

**Intended Audience:** Frontend engineers, designers, brand/comms reviewers.

## 2. Scope, Boundaries, & Responsibilities

**Responsibilities:**
- `images/`: Product, marketing, and UI illustration folders (`game/`, `marketing/`, `ui/`)
- `icons/`: SVG/icon sprites
- `fonts/`: Web font bundles
- `audio/`: Placeholder `music/` and `sfx/` trees for future sound design

**Not Responsible For:** Backend assets, documentation, or runtime/public bundles (`apps/web/public/**` now hosts the manifest and `legacy/` drop folder for compiled artifacts).

**Functional Scope:** Anything imported by React/Vite from `src/assets`. Built output is handled automatically by the bundler.

## 3. Operational Standards, Practices, & Tooling

- Keep binary assets optimized (SVGO for icons, ImageOptim/tiny-png for raster imagery, ffmpeg for audio).
- Use lowercase, dash-delimited filenames that match component names when possible.
- Store configuration JSON used by the web app under `apps/web/config/`, **not** in this folder.
- Larger static drops (prebuilt JS/CSS) should live under `apps/web/public/legacy/` so they bypass the bundler.

## 4. Maintenance & Review

- **Ownership:** Web experience team
- **Review cadence:** Any PR touching this directory requires at least one frontend reviewer
- **Escalation:** Brand/design lead when adding new visual identity assets

## 5. Future Work

- Backfill actual assets (current directories are scaffolded with `.gitkeep` until the next visual refresh)
- Automate image optimization in CI
- Wire up linting to warn when unused assets linger
