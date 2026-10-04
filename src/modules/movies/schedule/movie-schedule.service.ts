import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { MovieStatus, PUBLIC_MOVIE_STATUSES } from '../../../common/enums/movie-status.enum';
import { Movie } from '../entities/movie.entity';
import { MovieAuditService } from '../movie-audit.service';
import { MovieLifecycleService } from '../movie-lifecycle.service';
import { MOVIE_SCHEDULE_BATCH } from '../movies.constants';

@Injectable()
export class MovieScheduleService {
  private readonly logger = new Logger(MovieScheduleService.name);

  constructor(
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    private readonly lifecycle: MovieLifecycleService,
    private readonly audit: MovieAuditService,
  ) {}

  async runDue(now: Date = new Date()): Promise<void> {
    await this.publishDue(now);
    await this.unpublishDue(now);
  }

  private async publishDue(now: Date): Promise<void> {
    const due = await this.movies.find({
      select: { id: true },
      where: { status: MovieStatus.DRAFT, publishAt: LessThanOrEqual(now) },
      order: { publishAt: 'ASC' },
      take: MOVIE_SCHEDULE_BATCH,
    });
    for (const { id } of due) await this.apply(id, MovieStatus.PUBLISHED, 'Scheduled publication');
  }

  private async unpublishDue(now: Date): Promise<void> {
    const due = await this.movies.find({
      select: { id: true },
      where: { status: In(PUBLIC_MOVIE_STATUSES), unpublishAt: LessThanOrEqual(now) },
      order: { unpublishAt: 'ASC' },
      take: MOVIE_SCHEDULE_BATCH,
    });
    for (const { id } of due) await this.apply(id, MovieStatus.DRAFT, 'Scheduled unpublication');
  }

  private async apply(movieId: string, target: MovieStatus, reason: string): Promise<void> {
    try {
      await this.lifecycle.transition({ movieId, target, actorId: null, reason });
    } catch (error: unknown) {
      await this.handleFailure(movieId, target, error);
    }
  }

  private async handleFailure(movieId: string, target: MovieStatus, error: unknown): Promise<void> {
    // Another worker or an admin already moved the movie; nothing left to do.
    if (error instanceof ConflictException) return;
    if (error instanceof BadRequestException) {
      // Clear the schedule so a movie that is no longer publishable is not retried every minute.
      await this.movies.update({ id: movieId, status: MovieStatus.DRAFT }, { publishAt: null });
      this.logger.warn(`Scheduled ${target} skipped for movie ${movieId}: ${error.message}`);
      await this.audit.record({
        actorId: null, action: 'movie.schedule_failed', movieId, metadata: { target, reason: error.message },
      });
      return;
    }
    this.logger.error(`Scheduled ${target} failed for movie ${movieId}: ${String(error)}`);
  }
}
