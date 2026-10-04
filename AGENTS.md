# BookMyShow Backend — Agent Entry Point

Ticket booking backend: browse movies/shows, pick seats, hold, pay, receive ticket.

## Stack
- NestJS 10 (TypeScript strict), Node 20
- PostgreSQL 16 + TypeORM (migrations only, `synchronize: false`)
- Redis + BullMQ (emails, expiry jobs, cache) — NOT the source of truth for seats
- JWT auth (access + refresh), class-validator, Swagger
- Jest + Supertest, Docker Compose for local

## Commands
```bash
docker compose up -d                 # postgres + redis
npm run start:dev
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
npm run seed
npm run lint && npm run test && npm run test:e2e
```

## Docs (read only what the task needs)
- Requirements: @docs/PRD.md
- Design: @docs/ARCHITECTURE.md, @docs/DATABASE.md, @docs/API.md
- Quality: @docs/SECURITY.md, @docs/TESTING.md, @docs/PRODUCTION.md
- Progress: @docs/TASKS.md
- Decisions/gotchas: @docs/MEMORY.md, @docs/adr/

## Working agreement
1. Pick ONE unchecked item from `docs/TASKS.md`. Do only that.
2. Follow `.cursor/rules/*`. Never edit applied migrations; add new ones.
3. Every change: code + tests + migration (if schema) + docs/API.md update (if endpoint).
4. Verify before marking done: `npm run lint && npm run build && npm run test` must pass, and show the output.
5. Log non-obvious decisions or mistakes in `docs/MEMORY.md`.
6. Ask before adding dependencies, changing the schema of existing tables, or deviating from the docs.
