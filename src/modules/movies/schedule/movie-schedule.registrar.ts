import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MOVIE_SCHEDULE_QUEUE, MOVIE_SCHEDULE_TICK_MS } from '../movies.constants';

const TICK_JOB_ID = 'movie-schedule-tick';
const FAILED_JOBS_KEPT = 100;

@Injectable()
export class MovieScheduleRegistrar implements OnModuleInit {
  constructor(@InjectQueue(MOVIE_SCHEDULE_QUEUE) private readonly queue: Queue) {}

  // A fixed jobId makes registration idempotent across restarts and multiple app instances.
  async onModuleInit(): Promise<void> {
    await this.queue.add(
      'tick',
      {},
      {
        repeat: { every: MOVIE_SCHEDULE_TICK_MS },
        jobId: TICK_JOB_ID,
        removeOnComplete: true,
        removeOnFail: FAILED_JOBS_KEPT,
      },
    );
  }
}
