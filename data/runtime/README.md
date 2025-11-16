# Runtime SQLite Data

- Holds developer-local SQLite files such as `political_sphere.db`, WAL files, and SHM files.
- Contents are `.gitignore`d; never check these files in or reference them from code directly. Always resolve paths via `data/runtime/` or the `SQLITE_DB_PATH` environment variable.
- Safe to delete when you need a clean slate (`npm run db:init` or `npm run db:seed` will recreate them).
