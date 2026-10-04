import { MovieStatus } from '../../../common/enums/movie-status.enum';
import { canTransition } from './movie-status-transitions';

describe('canTransition', () => {
  it.each([
    [MovieStatus.DRAFT, MovieStatus.PUBLISHED],
    [MovieStatus.PUBLISHED, MovieStatus.NOW_SHOWING],
    [MovieStatus.COMING_SOON, MovieStatus.NOW_SHOWING],
    [MovieStatus.NOW_SHOWING, MovieStatus.DRAFT],
    [MovieStatus.PUBLISHED, MovieStatus.ARCHIVED],
    [MovieStatus.ARCHIVED, MovieStatus.DRAFT],
  ])('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    [MovieStatus.ARCHIVED, MovieStatus.PUBLISHED],
    [MovieStatus.ARCHIVED, MovieStatus.NOW_SHOWING],
    [MovieStatus.DRAFT, MovieStatus.DRAFT],
    [MovieStatus.NOW_SHOWING, MovieStatus.COMING_SOON],
  ])('rejects %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });
});
