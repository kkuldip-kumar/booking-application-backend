import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { EntityManager } from 'typeorm';
import { MovieStatus } from '../../../common/enums/movie-status.enum';
import { slugify } from '../../../common/utils/slugify';
import { Movie } from '../entities/movie.entity';
import { MovieStatusHistory } from '../entities/movie-status-history.entity';

const SLUG_SUFFIX_BYTES = 3;

// Must run inside a transaction: the row lock serialises lifecycle, upload and edit operations per movie.
export async function lockMovieOrFail(manager: EntityManager, id: string): Promise<Movie> {
  const movie = await manager.findOne(Movie, { where: { id }, lock: { mode: 'pessimistic_write' } });
  if (!movie) throw new NotFoundException('Movie not found');
  return movie;
}

export function assertNotArchived(movie: Movie): void {
  if (movie.status === MovieStatus.ARCHIVED) {
    throw new ConflictException('Archived movies cannot be modified; restore the movie first');
  }
}

export async function generateUniqueSlug(manager: EntityManager, title: string): Promise<string> {
  const base = slugify(title);
  const taken = (await manager.countBy(Movie, { slug: base })) > 0;
  return taken ? `${base}-${randomBytes(SLUG_SUFFIX_BYTES).toString('hex')}` : base;
}

export interface StatusChange {
  readonly movieId: string;
  readonly oldStatus: MovieStatus | null;
  readonly newStatus: MovieStatus;
  readonly changedBy: string | null;
  readonly reason?: string;
}

export async function recordStatusChange(manager: EntityManager, change: StatusChange): Promise<void> {
  await manager.insert(MovieStatusHistory, {
    movieId: change.movieId,
    oldStatus: change.oldStatus,
    newStatus: change.newStatus,
    changedBy: change.changedBy,
    reason: change.reason ?? null,
  });
}
