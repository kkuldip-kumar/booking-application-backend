---
paths:
  - "src/**/*.{controller,module,service}.ts"
---
# NestJS
- Module layout: `dto/`, `entities/`, `<name>.{controller,service,module}.ts`.
- Controllers: routing, DTO binding, guards, Swagger only; no business logic or repositories.
- Services hold business logic; inject repositories via `@InjectRepository`.
- One DTO per request (class-validator/transformer); respond with response DTOs, never raw entities.
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- Throw Nest built-in or `common/exceptions` exceptions, never generic `Error`.
- Use `JwtAuthGuard`, `RolesGuard`, `@Public()`, `@Roles()`, `@CurrentUser()`.
- Cross-module access via exported services only; no `forwardRef` without approval.
- Pagination `?page=1&limit=20`, max 100, return `{ items, meta }`.
- Every endpoint has `@ApiTags`, `@ApiOperation`, response decorators.
- Async work (email, expiry) goes to BullMQ processors, not inline.
