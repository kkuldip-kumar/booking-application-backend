import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { isPubliclyVisible, MovieStatus } from '../../common/enums/movie-status.enum';
import { applyStatus } from './domain/apply-status';
import { canTransition } from './domain/movie-status-transitions';
import { assertNotArchived, lockMovieOrFail, recordStatusChange } from './domain/movie-persistence';
import { findPublishBlockers } from './domain/publish-readiness';
import { ScheduleMovieDto, SetFeaturedDto } from './dto/movie-lifecycle.dto';
import { AdminMovieDetailDto } from './dto/movie-response.dto';
import { Movie } from './entities/movie.entity';
import { MovieAuditService } from './movie-audit.service';
import { MoviesService } from './movies.service';

export interface TransitionInput {
  readonly movieId: string;
  readonly target: MovieStatus;
  readonly actorId: string | null;
  readonly reason?: string;
}

@Injectable()
export class MovieLifecycleService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly audit: MovieAuditService,
    private readonly movies: MoviesService,
  ) {}

  async changeStatus(input: TransitionInput): Promise<AdminMovieDetailDto> {
    await this.transition(input);
    return this.movies.getAdmin(input.movieId);
  }

  async transition(input: TransitionInput): Promise<void> {
    const from = await this.dataSource.transaction(async (manager) => {
      const movie = await lockMovieOrFail(manager, input.movieId);
      const previous = movie.status;
      if (!canTransition(previous, input.target)) {
        throw new ConflictException(`Cannot change status from ${previous} to ${input.target}`);
      }
      if (previous === MovieStatus.DRAFT && isPubliclyVisible(input.target)) {
        await this.assertPublishable(manager, movie.id);
      }
      applyStatus(movie, input.target, new Date());
      await manager.save(movie);
      await recordStatusChange(manager, {
        movieId: movie.id, oldStatus: previous, newStatus: input.target,
        changedBy: input.actorId, reason: input.reason,
      });
      return previous;
    });
    await this.audit.record({
      actorId: input.actorId,
      action: 'movie.status_changed',
      movieId: input.movieId,
      metadata: { from, to: input.target, reason: input.reason },
    });
  }

  async setFeatured(actorId: string, movieId: string, dto: SetFeaturedDto): Promise<AdminMovieDetailDto> {
    await this.dataSource.transaction(async (manager) => {
      const movie = await lockMovieOrFail(manager, movieId);
      if (dto.isFeatured && !isPubliclyVisible(movie.status)) {
        throw new ConflictException('Only published movies can be featured');
      }
      movie.isFeatured = dto.isFeatured;
      movie.featuredOrder = dto.isFeatured ? (dto.featuredOrder ?? 0) : null;
      await manager.save(movie);
    });
    await this.audit.record({
      actorId, action: 'movie.featured_changed', movieId,
      metadata: { isFeatured: dto.isFeatured, featuredOrder: dto.featuredOrder },
    });
    return this.movies.getAdmin(movieId);
  }

  async setSchedule(actorId: string, movieId: string, dto: ScheduleMovieDto): Promise<AdminMovieDetailDto> {
    await this.dataSource.transaction(async (manager) => {
      const movie = await lockMovieOrFail(manager, movieId);
      assertNotArchived(movie);
      await this.applySchedule(manager, movie, dto);
      await manager.save(movie);
    });
    await this.audit.record({
      actorId, action: 'movie.schedule_changed', movieId,
      metadata: { publishAt: dto.publishAt, unpublishAt: dto.unpublishAt },
    });
    return this.movies.getAdmin(movieId);
  }

  private async applySchedule(manager: EntityManager, movie: Movie, dto: ScheduleMovieDto): Promise<void> {
    const now = new Date();
    if (dto.publishAt !== undefined) {
      if (dto.publishAt !== null && movie.status !== MovieStatus.DRAFT) {
        throw new ConflictException('Only draft movies can be scheduled for publication');
      }
      movie.publishAt = dto.publishAt === null ? null : this.futureDate(dto.publishAt, now, 'publishAt');
      if (movie.publishAt) await this.assertPublishable(manager, movie.id);
    }
    if (dto.unpublishAt !== undefined) {
      movie.unpublishAt = dto.unpublishAt === null ? null : this.futureDate(dto.unpublishAt, now, 'unpublishAt');
    }
    if (movie.publishAt && movie.unpublishAt && movie.unpublishAt <= movie.publishAt) {
      throw new BadRequestException('unpublishAt must be after publishAt');
    }
  }

  private futureDate(value: string, now: Date, field: string): Date {
    const date = new Date(value);
    if (date <= now) throw new BadRequestException(`${field} must be in the future`);
    return date;
  }

  private async assertPublishable(manager: EntityManager, movieId: string): Promise<void> {
    const missing = await findPublishBlockers(manager, movieId);
    if (missing.length > 0) {
      throw new BadRequestException({ message: 'Movie is not ready to be published', missing });
    }
  }
}
