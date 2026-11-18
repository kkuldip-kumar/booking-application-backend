import client from 'prom-client';
import * as http from 'http';
import type { Request, Response, NextFunction } from 'express';
import type { Queue } from 'bullmq';

client.collectDefaultMetrics(); // heap, GC, event loop lag, handles, process_start_time

const SLA_MS = Number(process.env.SLA_MS ?? 500);

// ---------- API ----------
export const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'API latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
});
export const apiErrors = new client.Counter({
  name: 'api_errors_total',
  help: 'API errors; class=technical (5xx) | business (4xx)',
  labelNames: ['route', 'class', 'status'],
});
export const slaBreaches = new client.Counter({
  name: 'api_sla_breach_total',
  help: 'Requests slower than SLA_MS',
  labelNames: ['route'],
});

export function recordApi(route: string, method: string, status: number, seconds: number) {
  httpDuration.observe({ method, route, status }, seconds);
  if (status >= 500) apiErrors.inc({ route, class: 'technical', status });
  else if (status >= 400) apiErrors.inc({ route, class: 'business', status });
  if (seconds * 1000 > SLA_MS) slaBreaches.inc({ route });
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const route = req.route ? `${req.baseUrl}${req.route.path}` : 'unmatched'; // template, never raw URL
    if (route.includes('/health')) return; // keep probes out of latency stats
    recordApi(route, req.method, res.statusCode, Number(process.hrtime.bigint() - start) / 1e9);
  });
  next();
}

// ---------- Business events ----------
export const bizEvents = new client.Counter({
  name: 'business_events_total',
  help: 'Core flow events',
  labelNames: ['event', 'result'],
});
// e.g. bizEvents.inc({ event: 'booking_created', result: 'success' });

// ---------- Downstream calls (payment gateway, SMS, email provider...) ----------
export const downstreamDuration = new client.Histogram({
  name: 'downstream_request_duration_seconds',
  help: 'Outbound call latency',
  labelNames: ['service', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
});
export const downstreamFailures = new client.Counter({
  name: 'downstream_failures_total',
  help: 'Outbound call failures',
  labelNames: ['service', 'reason'],
});
export async function trackDownstream<T>(service: string, fn: () => Promise<T>): Promise<T> {
  const end = downstreamDuration.startTimer({ service });
  try {
    const r = await fn();
    end({ status: 'ok' });
    return r;
  } catch (e: any) {
    end({ status: 'error' });
    downstreamFailures.inc({ service, reason: e?.code ?? e?.name ?? 'error' });
    throw e;
  }
}
// usage: const r = await trackDownstream('razorpay', () => axios.post(url, body, { timeout: 5000 }));

// ---------- Postgres pool (TypeORM) ----------
export function instrumentPgPool(pool: any) {
  new client.Gauge({
    name: 'pg_pool_connections',
    help: 'pg pool state',
    labelNames: ['state'],
    collect() {
      this.set({ state: 'total' }, pool.totalCount);
      this.set({ state: 'idle' }, pool.idleCount);
      this.set({ state: 'waiting' }, pool.waitingCount);
    },
  });
}

// ---------- Queues (BullMQ) ----------
export const queueJobs = new client.Gauge({
  name: 'bullmq_jobs', help: 'Job counts by state', labelNames: ['queue', 'state'],
});
export const qProduced = new client.Counter({
  name: 'queue_produced_total', help: 'Jobs added', labelNames: ['queue'],
});
export const qConsumed = new client.Counter({
  name: 'queue_consumed_total', help: 'Jobs finished', labelNames: ['queue', 'result'],
});
export const qDuration = new client.Histogram({
  name: 'queue_job_duration_seconds', help: 'Job processing time', labelNames: ['queue'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300],
});
export const qMsgSize = new client.Histogram({
  name: 'queue_message_size_bytes', help: 'Payload size', labelNames: ['queue'],
  buckets: [256, 1024, 4096, 16384, 65536, 262144, 1048576],
});
export const qOldestAge = new client.Gauge({
  name: 'queue_oldest_waiting_age_seconds', help: 'Age of oldest waiting job', labelNames: ['queue'],
});

export function produce(q: Queue, name: string, data: any, opts?: any) {
  qProduced.inc({ queue: q.name });
  qMsgSize.observe({ queue: q.name }, Buffer.byteLength(JSON.stringify(data ?? {})));
  return q.add(name, data, opts);
}
// call from @OnWorkerEvent('completed' | 'failed') in your processor
export function recordJob(queue: string, ok: boolean, job?: { processedOn?: number; finishedOn?: number }) {
  qConsumed.inc({ queue, result: ok ? 'success' : 'fail' });
  if (job?.processedOn && job?.finishedOn) qDuration.observe({ queue }, (job.finishedOn - job.processedOn) / 1000);
}
export async function pollQueue(q: Queue) {
  const c = await q.getJobCounts('waiting', 'active', 'failed', 'delayed');
  for (const [s, n] of Object.entries(c)) queueJobs.set({ queue: q.name, state: s }, n as number);
  const waiting = await q.getJobs(['waiting'], 0, 99, true);
  const oldest = waiting.length ? Math.min(...waiting.map((j) => j.timestamp)) : 0;
  qOldestAge.set({ queue: q.name }, oldest ? (Date.now() - oldest) / 1000 : 0);
}

// ---------- Scheduled jobs ----------
export const jobDuration = new client.Histogram({
  name: 'job_duration_seconds', help: 'Job time', labelNames: ['job'],
  buckets: [0.5, 1, 5, 30, 60, 300, 900, 3600],
});
export const jobRuns = new client.Counter({
  name: 'job_runs_total', help: 'Job runs', labelNames: ['job', 'result'],
});
export const jobLastSuccess = new client.Gauge({
  name: 'job_last_success_timestamp_seconds', help: 'Last success', labelNames: ['job'],
});
export async function trackJob<T>(job: string, fn: () => Promise<T>): Promise<T> {
  const end = jobDuration.startTimer({ job });
  try {
    const r = await fn();
    jobRuns.inc({ job, result: 'success' });
    jobLastSuccess.set({ job }, Date.now() / 1000);
    return r;
  } catch (e) {
    jobRuns.inc({ job, result: 'fail' });
    throw e;
  } finally {
    end();
  }
}

// ---------- /metrics on a separate, unpublished port ----------
export function startMetricsServer(port = 9464) {
  http
    .createServer(async (req, res) => {
      if (req.url === '/metrics') {
        res.setHeader('Content-Type', client.register.contentType);
        return res.end(await client.register.metrics());
      }
      res.statusCode = 404;
      res.end();
    })
    .listen(port, '0.0.0.0'); // not in compose `ports:`, so only reachable inside the Docker network
}