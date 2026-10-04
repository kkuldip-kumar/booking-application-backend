# VAPT Standard

## Standards followed
- OWASP API Security Top 10:2023
- OWASP ASVS 4.0 Level 2
- OWASP Top 10:2021, CWE Top 25
- PCI-DSS scope avoided: no card data ever touches our servers (gateway-hosted checkout)

## Control Mapping (API Top 10:2023)
| ID | Risk | Control in this system | Test |
|---|---|---|---|
| API1 | BOLA/IDOR | Every query scoped by `userId`; ownership in service layer | authz.e2e: user B reads user A booking → 404 |
| API2 | Broken auth | Argon2, JWT 15m, refresh rotation + reuse detection, throttled login | brute-force + reuse tests |
| API3 | Broken object property auth | Response DTOs; whitelist input; no mass assignment | send `role:"ADMIN"`, `price` → ignored/400 |
| API4 | Unrestricted resource consumption | Throttler, body 100kb, limit ≤100, max 6 seats, ≤3 active holds/user | load + limit tests |
| API5 | Broken function-level auth | `@Roles(ADMIN)` on `/admin/*`, default-deny guard | USER token on admin route → 403 |
| API6 | Unrestricted sensitive business flows | Hold caps + TTL, per-user booking rate limit, hold-hoarding detection | hold-abuse test |
| API7 | SSRF | No user-supplied URLs fetched; poster_url stored only, never fetched server-side | code review |
| API8 | Security misconfiguration | Helmet, CORS allowlist, no Swagger in prod, `synchronize:false`, non-root container | config test/ZAP |
| API9 | Improper inventory mgmt | Only `/api/v1`; no debug routes; OpenAPI = source of truth | route diff in CI |
| API10 | Unsafe consumption of APIs | Verify gateway webhook signature; validate gateway payload schema and amount | webhook tests |

## Mandatory Bootstrap (main.ts)
```ts
const app = await NestFactory.create(AppModule, { rawBody: true });
app.use(helmet());
app.enableCors({ origin: config.get<string>('CORS_ORIGINS').split(','), credentials: true });
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.set('trust proxy', 1);
app.disable('x-powered-by');
if (config.get('NODE_ENV') !== 'production') setupSwagger(app);
```

## Webhook Verification Pattern
```ts
const sig = Buffer.from(req.headers['x-signature'] as string, 'hex');
const mac = crypto.createHmac('sha256', secret).update(req.rawBody).digest();
if (sig.length !== mac.length || !crypto.timingSafeEqual(sig, mac)) throw new UnauthorizedException();
```

## Data Protection
- TLS 1.2+ at proxy; HSTS via Helmet.
- Encrypt DB at rest (managed Postgres); backups encrypted.
- Store only: hashed passwords, hashed refresh tokens. PII minimal (name, email, phone).
- Secrets in env/secret manager; rotate on leak; separate per environment.

## Automated Gates (CI: .github/workflows/security.yml)
SAST (Semgrep), secrets (Gitleaks), dependencies (`npm audit`, Trivy), container scan (Trivy). Any High/Critical fails the build.

## DAST (before each release)
```bash
# App running in staging with OpenAPI at /docs-json (staging only)
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py \
  -t https://staging.example.com/docs-json -f openapi -r zap-report.html
```

## Release Gate Checklist (evidence required)
- [ ] All routes listed; each has guard/role/ownership (route table in PR)
- [ ] `test/security/*` green
- [ ] CI scanners green; 0 High/Critical open
- [ ] ZAP report: 0 High/Critical
- [ ] Concurrency test: 0 double bookings
- [ ] Webhook replay/forged-signature tests green
- [ ] No secrets in repo history (gitleaks full scan)
- [ ] Prod env: Swagger off, CORS allowlist, NODE_ENV=production, non-root container
- [ ] Rate limits verified under load
- [ ] Backup restore tested
- [ ] Independent VAPT report received; all High/Critical fixed and retested

## Finding Handling
Severity SLA: Critical 24h, High 7d, Medium 30d, Low backlog. Log each in `docs/MEMORY.md` under "Don't Do Again" with root cause.

## Independent VAPT Scope (give to tester)
Auth flows, all `/api/v1` endpoints, admin RBAC, booking/seat-hold concurrency and abuse, payment + webhook, rate limiting, infra config (TLS, headers, exposed ports), dependency/container scan. Provide: OpenAPI spec, test accounts (USER, ADMIN), staging URL.