import { MovieStatus } from '../../../common/enums/movie-status.enum';

const ALLOWED: Readonly<Record<MovieStatus, readonly MovieStatus[]>> = {
  [MovieStatus.DRAFT]: [
    MovieStatus.PUBLISHED,
    MovieStatus.NOW_SHOWING,
    MovieStatus.COMING_SOON,
    MovieStatus.ARCHIVED,
  ],
  [MovieStatus.PUBLISHED]: [
    MovieStatus.NOW_SHOWING,
    MovieStatus.COMING_SOON,
    MovieStatus.DRAFT,
    MovieStatus.ARCHIVED,
  ],
  [MovieStatus.COMING_SOON]: [
    MovieStatus.PUBLISHED,
    MovieStatus.NOW_SHOWING,
    MovieStatus.DRAFT,
    MovieStatus.ARCHIVED,
  ],
  [MovieStatus.NOW_SHOWING]: [MovieStatus.PUBLISHED, MovieStatus.DRAFT, MovieStatus.ARCHIVED],
  [MovieStatus.ARCHIVED]: [MovieStatus.DRAFT],
};

export const canTransition = (from: MovieStatus, to: MovieStatus): boolean =>
  ALLOWED[from].includes(to);
