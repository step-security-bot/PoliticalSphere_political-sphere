# Web Configurations

This directory hosts JSON configuration that is bundled with the `apps/web` frontend.

- `feature-flags.json` – default client-side toggles for experiments and beta programs. These values are overridden by the deployment pipeline; do not edit them in production without updating release notes.
- `game-config.json` – gameplay tuning knobs that the web UI uses for countdown timers, score weighting, and leaderboard limits.

Keep secrets and environment-specific overrides in `config/env/` or the infrastructure layer. This folder should only contain artefacts that are safe to publish to the browser bundle.
