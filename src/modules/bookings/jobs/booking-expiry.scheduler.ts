import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  BOOKING_LIMITS,
  EXPIRY_QUEUE,
  EXPIRY_SCHEDULER_ID,
} from '../../../common/constants/booking.constants';

@Injectable()
export class BookingExpiryScheduler implements OnModuleInit {
  constructor(@InjectQueue(EXPIRY_QUEUE) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.queue.upsertJobScheduler(EXPIRY_SCHEDULER_ID, {
      every: BOOKING_LIMITS.EXPIRY_TICK_MS,
    });
  }
}
