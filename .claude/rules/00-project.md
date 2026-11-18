# Project
- Modular monolith: one folder per domain in `src/modules/<name>/`.
- Files kebab-case, classes PascalCase, DB columns snake_case.
- API prefix `/api/v1`; responses `{ success, data, message }` via global interceptor.
- Config via `@nestjs/config` + validated env; never read `process.env` in modules.
- Money: integer minor units (paise), never floats.
- Timestamps `timestamptz` UTC; public entity IDs UUID v4.
- Business logic in services only.
- Don't add dependencies without asking.
- Run lint, build, tests before claiming done; report the output.
