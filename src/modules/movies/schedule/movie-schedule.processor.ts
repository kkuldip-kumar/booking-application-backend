import { Processor, WorkerHost } from '@nestjs/bullmq';
import { MOVIE_SCHEDULE_QUEUE } from '../movies.constants';
import { MovieScheduleService } from './movie-schedule.service';

@Processor(MOVIE_SCHEDULE_QUEUE)
export class MovieScheduleProcessor extends WorkerHost {
  constructor(private readonly schedule: MovieScheduleService) {
    super();
  }

  async process(): Promise<void> {
    await this.schedule.runDue();
  }
}
