#!/bin/bash
# Manage the monitoring stack (Prometheus, Grafana, Loki, Alertmanager, exporters).
# App services (ticket-backend, postgres, redis) are never stopped or removed by this script.
set -u
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.monitoring.yml"
MON="prometheus alertmanager grafana loki promtail node-exporter cadvisor blackbox postgres-exporter redis-exporter"

say()  { echo -e "${GREEN}==> $*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }
fail() { echo -e "${RED}$*${NC}"; }

usage() {
  cat <<U
Usage: $0 <command> [args]

  up                 Start the monitoring stack
  down               Stop and remove monitoring containers (data volumes kept)
  restart [svc]      Restart all monitoring services, or one
  status             Show monitoring containers
  logs [svc]         Tail logs (default: grafana prometheus alertmanager)
  validate           Check prometheus.yml / alerts.yml / rules.yml with promtool
  reload             Reload Prometheus config without restart
  health             Check Grafana, Prometheus, Alertmanager, scrape targets
  doctor             Diagnose why a service (default: grafana) is not reachable
  alert-test         Send a test alert to Slack via Alertmanager
  grafana-password   Reset the Grafana admin password to GRAFANA_PASSWORD from .env
  urls               Print local URLs
  tunnel user@host   SSH tunnel to a remote VM (Grafana 3001, Prometheus 9090)
  purge-data         DELETE monitoring volumes (metrics, logs, dashboards)
U
  exit 1
}

[ -z "${1:-}" ] && usage
CMD=$1; shift

[ -f docker-compose.monitoring.yml ] || { fail "docker-compose.monitoring.yml not found in $(pwd)"; exit 1; }
for f in prometheus.yml alerts.yml rules.yml alertmanager.yml promtail.yml grafana-ds.yml; do
  [ -f "monitoring/$f" ] || { fail "missing monitoring/$f"; exit 1; }
done
[ -s monitoring/secrets/slack_webhook_url ] || warn "monitoring/secrets/slack_webhook_url is missing or empty (Slack alerts will fail)"

case "$CMD" in
  up)
    say "Starting monitoring stack..."
    $COMPOSE up -d $MON
    sleep 5
    "$0" health
    ;;
  down)
    say "Stopping monitoring stack (app untouched)..."
    $COMPOSE stop $MON && $COMPOSE rm -f $MON
    ;;
  restart)
    say "Restarting ${*:-all monitoring services}..."
    $COMPOSE restart ${*:-$MON}
    ;;
  status)
    $COMPOSE ps $MON
    ;;
  logs)
    say "Tailing logs (Ctrl+C to exit)..."
    $COMPOSE logs -f --tail=100 ${*:-grafana prometheus alertmanager}
    ;;
  validate)
    say "Validating Prometheus config and rules..."
    docker run --rm -v "$PWD/monitoring:/w" --entrypoint promtool prom/prometheus check config /w/prometheus.yml
    ;;
  reload)
    say "Reloading Prometheus..."
    curl -fsS -X POST localhost:9090/-/reload && echo "reloaded" || fail "reload failed (is prometheus up?)"
    ;;
  health)
    ok=0
    chk() { # name url
      code=$(curl -s -o /dev/null -m 4 -w '%{http_code}' "$2")
      if [ "$code" = "200" ]; then echo -e "${GREEN}OK  ${NC} $1"; else echo -e "${RED}FAIL${NC} $1 (HTTP $code)"; ok=1; fi
    }
    chk "grafana      http://localhost:3001" http://localhost:3001/api/health
    chk "prometheus   http://localhost:9090" http://localhost:9090/-/ready
    chk "alertmanager http://localhost:9093" http://localhost:9093/-/ready
    chk "app health   http://localhost:3000/health/ready" http://localhost:3000/health/ready
    echo "--- scrape targets ---"
    curl -s -m 4 localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | "\(.labels.job)\t\(.health)\t\(.lastError)"' 2>/dev/null || { fail "cannot read targets"; ok=1; }
    echo "--- firing alerts ---"
    curl -s -m 4 localhost:9090/api/v1/alerts | jq -r '.data.alerts[] | select(.state=="firing") | "\(.labels.alertname) \(.labels.severity)"' 2>/dev/null | grep -v Watchdog || echo "none"
    exit $ok
    ;;
  doctor)
    svc=${1:-grafana}
    say "Diagnosing '$svc'..."
    echo "--- container ---";      $COMPOSE ps -a $svc
    echo "--- state ---";          docker inspect "$($COMPOSE ps -aq $svc)" --format 'status={{.State.Status}} exit={{.State.ExitCode}} restarts={{.RestartCount}} oom={{.State.OOMKilled}} err={{.State.Error}}' 2>&1
    echo "--- host port listeners ---"; ss -ltn 2>/dev/null | grep -E ':(3001|9090|9093)\b' || echo "nothing listening on 3001/9090/9093"
    echo "--- grafana http ---";   curl -s -m 4 -o /dev/null -w 'HTTP %{http_code}\n' http://localhost:3001/api/health || echo "no response"
    echo "--- last 40 log lines ---"; $COMPOSE logs --tail 40 $svc
    ;;
  alert-test)
    say "Sending test alert..."
    curl -fsS -XPOST localhost:9093/api/v2/alerts -H 'Content-Type: application/json' \
      -d '[{"labels":{"alertname":"TestAlert","severity":"critical"},"annotations":{"summary":"Slack test from monitor.sh"}}]' \
      && echo "sent; Slack message expected within ~30s (group_wait)"
    ;;
  grafana-password)
    pw=$(grep -E '^GRAFANA_PASSWORD=' .env | cut -d= -f2-)
    [ -z "$pw" ] && { fail "GRAFANA_PASSWORD not set in .env"; exit 1; }
    $COMPOSE exec grafana grafana cli admin reset-admin-password "$pw"
    ;;
  urls)
    echo "Grafana       http://localhost:3001  (user: admin)"
    echo "Prometheus    http://localhost:9090"
    echo "Alertmanager  http://localhost:9093"
    ;;
  tunnel)
    [ -z "${1:-}" ] && { fail "usage: $0 tunnel user@host"; exit 1; }
    say "Tunnel open: http://localhost:3001 and http://localhost:9090 (Ctrl+C to close)"
    ssh -N -L 3001:127.0.0.1:3001 -L 9090:127.0.0.1:9090 "$1"
    ;;
  purge-data)
    warn "This deletes Prometheus, Loki and Grafana data volumes."
    read -p "Type 'yes' to continue: " c
    if [ "$c" = "yes" ]; then
      $COMPOSE stop $MON && $COMPOSE rm -f -v $MON
      docker volume ls -q | grep -E '_(prom|graf|loki|pt)$' | xargs -r docker volume rm
    else warn "Cancelled."; fi
    ;;
  *) usage ;;
esac
