# API Service

The API service exposes read/write endpoints for policy updates and provides analytics consumed by the worker and frontend. It is intentionally lightweight (vanilla Node.js) so it can run anywhere while the broader domain model evolves.

## Endpoints

- `GET /healthz` – readiness probe used by Docker Compose and monitoring.
- `GET /` – discovery document describing the available routes.
- `GET /api/news` – list policy stories with optional filtering (`category`, `tag`, `search`, `limit`).
- `POST /api/news` – create a new policy story (validates `title`, `excerpt`, `content`).
- `GET /api/news/{id}` – retrieve a single record.
- `PUT /api/news/{id}` – update an existing record.
- `GET /metrics/news` – analytics summary consumed by the worker and dashboard.

Because the server is built with native Node.js (`http` module), no additional dependencies or frameworks are required.

## Running locally

```bash
npm run start:api
# or, via Nx:
npx nx serve api
```

The service listens on `API_PORT` (default: `4000`) and binds to `0.0.0.0` so it is reachable from other containers.

Data is persisted to `apps/api/data/news.json`. The `JsonNewsStore` helper keeps the storage format simple while still supporting concurrent updates in tests.

## Database (Prisma + PostgreSQL)

The game simulation domain (parliament, elections, media) uses Prisma with PostgreSQL. For local development you can run PostgreSQL via Docker (recommended for reproducibility) or Homebrew.

### Quick Start (Docker)

```bash
# Ensure any local Postgres on 5432 is stopped if occupied; we default to 5433 mapping
docker run --name political-sphere-db \
	-e POSTGRES_PASSWORD=postgres \
	-e POSTGRES_USER=postgres \
	-e POSTGRES_DB=political_sphere_dev \
	-p 5433:5432 -d postgres:16

# Set DATABASE_URL in apps/api/.env (already added):
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/political_sphere_dev"

# Apply schema and seed demo data
cd apps/api
npx prisma db push
npx tsx prisma/seed.ts
```

### Homebrew Alternative (macOS)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb political_sphere_dev
psql -U "$(whoami)" -d political_sphere_dev -c "ALTER DATABASE political_sphere_dev OWNER TO postgres;" || true

# If you prefer port 5432 and have a postgres role with password:
export PGPASSWORD=postgres
psql -h localhost -U postgres -c 'SELECT 1;' || createuser -s postgres

# Update DATABASE_URL to use 5432 if free
```

### Seeding
`prisma/seed.ts` creates:
- 2 chambers
- 1 demo election
- 3 constituencies
- 1 motion
- 1 press release
- 1 poll

Re‑run safely; it uses idempotent upserts where appropriate.

### Troubleshooting
- Prisma env var conflict: remove duplicate `DATABASE_URL` from root `.env` (done).
- Auth failure: ensure container started with `POSTGRES_PASSWORD` and env matches.
- Port collision: fall back to mapping `5433:5432` if `5432` occupied.

### Security (Dev Only)
Never reuse the `postgres:postgres` credentials in staging or production. Rotate and manage secrets via the approved secret store.

## Testing

- Test suites are standardized on ES modules using `.mjs` files (Jest runner via Nx)
- Legacy `.js` test files remain only as skipped CommonJS placeholders to avoid ESM parse errors in mixed tooling; see `apps/api/tests/*.test.js`
- Run the suite:

```bash
npx nx test api --runInBand
```

Notes:

- Avoid top‑level await in `.js` tests; use async `beforeAll` or convert to `.mjs`
- Keep a single authoritative test per suite to prevent duplicate execution

## Next steps

- Replace the JSON storage layer with a real database module or service client.
- Implement authentication and authorization once the auth service lands.
- Extend the analytics endpoint with additional signals (tone, reach, velocity) as data sources come online.
