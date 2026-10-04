import { isPubliclyVisible, MovieStatus } from '../../../common/enums/movie-status.enum';
import { Movie } from '../entities/movie.entity';

export type LifecycleFields = Pick<
  Movie,
  'status' | 'publishedAt' | 'publishAt' | 'unpublishAt' | 'isFeatured' | 'featuredOrder' | 'archivedAt'
>;

// Keeps lifecycle side effects in one place so manual and scheduled changes behave identically.
export function applyStatus(movie: LifecycleFields, target: MovieStatus, now: Date): void {
  const wasVisible = isPubliclyVisible(movie.status);
  const willBeVisible = isPubliclyVisible(target);

  if (!wasVisible && willBeVisible) {
    movie.publishedAt ??= now;
    movie.publishAt = null;
  }
  if (!willBeVisible) {
    movie.isFeatured = false;
    movie.featuredOrder = null;
    movie.unpublishAt = null;
  }
  if (target === MovieStatus.ARCHIVED) movie.publishAt = null;
  movie.archivedAt = target === MovieStatus.ARCHIVED ? now : null;
  movie.status = target;
}
