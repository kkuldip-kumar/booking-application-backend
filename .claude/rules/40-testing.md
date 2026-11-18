---
paths:
  - "**/*.spec.ts"
  - "test/**"
---
# Testing
- Unit tests beside source (`*.service.spec.ts`); mock repositories and external services.
- E2E in `test/**/*.e2e-spec.ts` on a real Postgres test DB; run migrations before, truncate between tests.
- Arrange/Act/Assert; one behavior per test; descriptive names.
- Cover happy path, validation errors, auth/ownership failures, booking concurrency.
- Concurrency: N parallel requests for one seat; exactly one succeeds.
- No real network calls; mock payment gateway and email.
- Never weaken or delete a test to make it pass.
- Coverage: services ≥ 80%, booking/payment ≥ 90%.
- Report actual `npm run test` output when claiming completion.
