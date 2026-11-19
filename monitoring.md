# Monitoring Setup and Log Viewing

Stack: Prometheus (metrics), Alertmanager (Slack alerts), Grafana (dashboards), Loki + Promtail (logs), node-exporter, cAdvisor, blackbox, postgres-exporter, redis-exporter.

Manage it with `./monitor.sh`. App services (`ticket-backend`, `postgres`, `redis`) are managed with `./docker.sh`. `./monitor.sh down` never stops the app.

## 1. Files

```
docker-compose.yml                  app + postgres + redis
docker-compose.monitoring.yml       monitoring stack
docker.sh                           app commands
monitor.sh                          monitoring commands
monitoring/
  prometheus.yml  alerts.yml  rules.yml
  alertmanager.yml  promtail.yml
  grafana-ds.yml  grafana-dashboards.yml
  dashboards/cinemahub-app.json
  secrets/slack_webhook_url         (gitignored)
src/monitoring/
  metrics.ts  monitoring.module.ts  monitoring.service.ts  health.controller.ts
```

## 2. One-time setup

```bash
# 1. Dependencies and build (must pass before building the image)
npm i prom-client @nestjs/terminus
npm run build

# 2. Slack webhook (no trailing newline)
mkdir -p monitoring/secrets
printf '%s' 'https://hooks.slack.com/services/XXX/YYY/ZZZ' > monitoring/secrets/slack_webhook_url
chmod 600 monitoring/secrets/slack_webhook_url
grep -q 'monitoring/secrets' .gitignore || echo '/monitoring/secrets/' >> .gitignore

# 3. Passwords in .env
cat >> .env <<'EOF'
GRAFANA_PASSWORD=choose-a-password
MONITOR_PG_PASSWORD=choose-another
EOF

# 4. Rebuild the app so the monitoring module is in the image
./docker.sh build ticket-backend
./docker.sh up

# 5. Read-only Postgres user for the exporter (same password as MONITOR_PG_PASSWORD)
docker compose exec postgres psql -U postgres -c "CREATE USER monitor WITH PASSWORD 'choose-another'; GRANT pg_monitor TO monitor;"
# if the role exists: ALTER USER monitor WITH PASSWORD 'choose-another';

# 6. Start monitoring
./monitor.sh validate
./monitor.sh up
```

## 3. Daily commands

| Command | Purpose |
|---|---|
| `./monitor.sh up` | Start the stack and print a health report |
| `./monitor.sh down` | Stop monitoring only (volumes kept) |
| `./monitor.sh status` | List monitoring containers |
| `./monitor.sh health` | Check Grafana, Prometheus, Alertmanager, targets, firing alerts |
| `./monitor.sh logs [service]` | Tail logs (default: grafana, prometheus, alertmanager) |
| `./monitor.sh doctor [service]` | Diagnose an unreachable service (default: grafana) |
| `./monitor.sh validate` | Check Prometheus config and rules with promtool |
| `./monitor.sh reload` | Apply `alerts.yml` or `rules.yml` changes without restart |
| `./monitor.sh alert-test` | Send a test alert to Slack |
| `./monitor.sh grafana-password` | Reset the admin password to `GRAFANA_PASSWORD` |
| `./monitor.sh urls` | Print local URLs |
| `./monitor.sh tunnel user@host` | SSH tunnel to a remote VM |

## 4. URLs

| Service | URL | Login |
|---|---|---|
| Grafana | http://localhost:3001 | `admin` / `GRAFANA_PASSWORD` |
| Prometheus | http://localhost:9090 (`/targets`, `/alerts`) | none |
| Alertmanager | http://localhost:9093 | none |
| App health | http://localhost:3000/health/live and `/health/ready` | none |

All monitoring ports are bound to `127.0.0.1`. Metrics are on port 9464 inside the Docker network only and are not published.

Remote VM: `./monitor.sh tunnel user@VM_IP`, then open the same localhost URLs.

## 5. Viewing logs

### A. Terminal (quickest)

```bash
./docker.sh logs ticket-backend                              # follow app logs
docker compose logs --since 15m ticket-backend               # last 15 minutes
docker compose logs --since 1h ticket-backend 2>&1 | grep -iE 'error|exception|ECONNREFUSED|timeout'
docker compose logs --since 1h postgres | grep -E 'ERROR|FATAL'
./monitor.sh logs promtail                                   # is log shipping working
```

### B. Grafana dashboard

1. Open http://localhost:3001, then **Dashboards → CinemaHub → CinemaHub App**.
2. The **App logs** panel at the bottom shows the app's container logs.
3. Set the time range top right (**Last 15 minutes** for live, **Last 6 hours** for history).

### C. Grafana Explore (search and filter)

Open **Explore**, choose the **Loki** data source, and run:

```logql
# all app logs
{container=~".*ticket-backend.*"}

# errors only
{container=~".*ticket-backend.*"} |~ "(?i)error|exception"

# HTTP request lines (needs request logging, see section 7)
{container=~".*ticket-backend.*"} |= "HTTP" |= " 500 "

# Postgres errors
{container=~".*postgres-1"} |~ "ERROR|FATAL"

# error rate per minute (switch to Graph view)
sum(rate({container=~".*ticket-backend.*"} |~ "(?i)error" [1m]))
```

### D. Loki API from the terminal

```bash
PW=$(grep ^GRAFANA_PASSWORD= .env | cut -d= -f2-)
curl -s -G -u admin:$PW "localhost:3001/api/datasources/proxy/uid/loki/loki/api/v1/query_range" \
  --data-urlencode 'query={container=~".*ticket-backend.*"}' \
  --data-urlencode "start=$(date -d '-1 hour' +%s)000000000" \
  --data-urlencode 'limit=20' | jq -r '.data.result[].values[][1]'
```

## 6. Imported dashboards

In Grafana: **Dashboards → New → Import**, enter the ID, choose **Prometheus**.

| ID | Dashboard |
|---|---|
| 1860 | Node Exporter Full (VM CPU, RAM, disk) |
| 9628 | PostgreSQL |
| 763 | Redis |
| 14282 | cAdvisor (per-container usage) |

## 7. Optional: log every HTTP request

Nest logs only at startup by default, so the logs panel is quiet when there is no traffic. Add this to `src/main.ts` next to `app.use(metricsMiddleware)`:

```ts
app.use((req, res, next) => {
  const t = Date.now();
  res.on('finish', () => {
    if (!req.originalUrl.startsWith('/health')) {
      new Logger('HTTP').log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - t}ms`);
    }
  });
  next();
});
```

Never log request bodies, headers or cookies. They contain tokens and personal data.

## 8. Alerts

Alerts are defined in `monitoring/alerts.yml` and delivered to Slack by Alertmanager. After editing:

```bash
./monitor.sh validate && ./monitor.sh reload
./monitor.sh alert-test
```

Key alerts: `AppDown`, `AppRestarting`, `PostgresDown`, `RedisDown`, `High5xxRate`, `SLOBurnFast`, `HighP95Latency`, `HighP99Latency`, `EventLoopLag`, `HeapNearLimit`, `PgPoolWaiting`, `QueueOldestJobStale`, `QueueFailing`, `HighCPU`, `LowMemory`, `DiskAlmostFull`, `ContainerOOMKilled`.

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `localhost:3001` not responding | Grafana failed provisioning | `./monitor.sh doctor grafana`. For `data source not found`, make sure `grafana-ds.yml` has `deleteDatasources` for Prometheus and Loki, then `./monitor.sh restart grafana` |
| Grafana login fails | Old password stored in the `graf` volume | `./monitor.sh grafana-password` |
| `/health/live` returns 404 | Image built before `MonitoringModule` was imported | `npm run build && docker compose build ticket-backend && docker compose up -d --force-recreate ticket-backend` |
| Dashboard panels empty | No traffic, or time range too wide | Send some requests, set **Last 15 minutes**, wait 45s |
| TPS and latency panels empty | `/health/*` is excluded from API metrics | Hit a real route such as `/api/v1/movies` |
| App logs panel empty | App is quiet, or window too short | Restart the app, widen range to 6h, or enable section 7 |
| Prometheus target `postgres` down | Wrong `monitor` password | Match `MONITOR_PG_PASSWORD` in `.env` with the SQL user, then `./monitor.sh restart postgres-exporter` |
| No Slack message | Placeholder URL or trailing newline | Re-create `slack_webhook_url` with `printf '%s'`, then `./monitor.sh restart alertmanager` |
| `relation "movies" does not exist` | Database schema not created | Run your migrations. `/api/v1/movies` returns 500 until then |
| `could not inspect container info` in promtail | Old recreated containers | Harmless |
| pgAdmin connection refused | Wrong port | The host port for cinemahub Postgres is `5434`, not `5432` |

## 10. Verification checklist

Run each command and confirm the expected result.

```bash
./monitor.sh health                                              # 4 OK lines, targets all "up", exit code 0
curl -s localhost:3000/health/live                               # {"success":true,...}
curl -s -o /dev/null -w '%{http_code}\n' localhost:3001/api/health   # 200
curl -s localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | "\(.labels.job) \(.health)"'   # app, node, cadvisor, postgres, redis, uptime: all up
./monitor.sh alert-test                                          # Slack message within ~30s
docker compose stop ticket-backend                               # Slack "AppDown" within ~1.5 min
docker compose start ticket-backend                              # Slack "RESOLVED"
```

Logs verification: in Grafana Explore, `{container=~".*ticket-backend.*"}` returns lines for the last hour.

## 11. Security notes

- Postgres and Redis should bind to `127.0.0.1` in `docker-compose.yml` (`"127.0.0.1:5434:5432"`, `"127.0.0.1:6379:6379"`). Redis has no password.
- Never publish ports 9090, 9093, 9464 or 3001 on a public interface. Use `./monitor.sh tunnel` or an authenticated reverse proxy.
- Change the default `postgres/postgres` credentials before any shared or production use.
- Keep `monitoring/secrets/` and `.env` out of git.
- The monitoring stack shares the VM with the app. If the VM goes down, no alerts are sent. Add an external uptime check (UptimeRobot or Better Stack) on the public health URL.
