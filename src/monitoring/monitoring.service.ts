// src/monitoring/monitoring.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';
import type { Queue } from 'bullmq';
import { instrumentPgPool, pollQueue } from './metrics';

const POLL_MS = Number(process.env.MONITOR_POLL_MS ?? 15_000);
const QUEUE_NAMES = (process.env.MONITORED_QUEUES ?? 'mail,booking-expiry,movie-schedule')
  .split(',').map((s) => s.trim()).filter(Boolean);

@Injectable()
export class MonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(MonitoringService.name);
  private timer?: NodeJS.Timeout;
  private queues: Queue[] = [];
  private polling = false;
  private lastWarn = 0;

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    // Postgres pool gauge (registered once)
    const pool = (this.ds.driver as any)?.master;
    if (pool?.totalCount !== undefined) instrumentPgPool(pool);
    else this.log.warn('pg pool not found on TypeORM driver; pg_pool_connections disabled');

    // Resolve queues by name; skip any that aren't registered
    for (const name of QUEUE_NAMES) {
      try {
        this.queues.push(this.moduleRef.get<Queue>(getQueueToken(name), { strict: false }));
      } catch {
        this.log.warn(`queue "${name}" not registered; skipping`);
      }
    }
    this.log.log(`monitoring queues: [${this.queues.map((q) => q.name).join(', ')}]`);

    this.timer = setInterval(() => void this.poll(), POLL_MS);
    this.timer.unref();
  }

  private async poll() {
    if (this.polling) return; // previous run still in progress
    this.polling = true;
    try {
      await Promise.all(
        this.queues.map(async (q) => {
          try {
            await pollQueue(q);
          } catch (e: any) {
            // Redis down: RedisDown/AppDown alerts cover it. Log at most once a minute.
            if (Date.now() - this.lastWarn > 60_000) {
              this.lastWarn = Date.now();
              this.log.warn(`queue poll failed for "${q.name}": ${e?.message}`);
            }
          }
        }),
      );
    } finally {
      this.polling = false;
    }
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }
}