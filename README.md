# BookMyShow Backend

NestJS + PostgreSQL (TypeORM) backend for movie ticket booking.

## Quick start
```bash
cp .env.example .env
docker compose up -d
npm install
npm run migration:run
npm run seed
npm run start:dev
```
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/docs

## Scripts
| Script | Purpose |
|---|---|
| `start:dev` | Run with watch |
| `build` | Compile |
| `migration:generate` / `migration:run` / `migration:revert` | DB migrations |
| `seed` | Seed cities, movies, theatres, shows |
| `test` / `test:e2e` / `test:cov` | Tests |
| `lint` | ESLint |

## Structure
See `docs/ARCHITECTURE.md`. Modules live in `src/modules/*`.

## Docs
`docs/` holds PRD, architecture, database, API, security, testing, production notes.
AI agents: start at `AGENTS.md`.
