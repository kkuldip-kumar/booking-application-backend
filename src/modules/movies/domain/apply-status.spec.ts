import { MovieStatus } from '../../../common/enums/movie-status.enum';
import { applyStatus, LifecycleFields } from './apply-status';

const NOW = new Date('2026-10-04T10:00:00Z');
const make = (overrides: Partial<LifecycleFields> = {}): LifecycleFields => ({
  status: MovieStatus.DRAFT,
  publishedAt: null,
  publishAt: new Date('2026-10-04T09:00:00Z'),
  unpublishAt: null,
  isFeatured: false,
  featuredOrder: null,
  archivedAt: null,
  ...overrides,
});

describe('applyStatus', () => {
  it('publishing stamps publishedAt once and consumes the schedule', () => {
    const movie = make();
    applyStatus(movie, MovieStatus.PUBLISHED, NOW);
    expect(movie.status).toBe(MovieStatus.PUBLISHED);
    expect(movie.publishedAt).toEqual(NOW);
    expect(movie.publishAt).toBeNull();
  });

  it('keeps the original publishedAt when re-published', () => {
    const first = new Date('2026-01-01T00:00:00Z');
    const movie = make({ publishedAt: first });
    applyStatus(movie, MovieStatus.PUBLISHED, NOW);
    expect(movie.publishedAt).toEqual(first);
  });

  it('keeps a pending unpublishAt when going live', () => {
    const later = new Date('2026-12-01T00:00:00Z');
    const movie = make({ unpublishAt: later });
    applyStatus(movie, MovieStatus.PUBLISHED, NOW);
    expect(movie.unpublishAt).toEqual(later);
  });

  it('unpublishing clears featuring and the unpublish schedule', () => {
    const movie = make({
      status: MovieStatus.NOW_SHOWING, isFeatured: true, featuredOrder: 2, unpublishAt: NOW, publishAt: null,
    });
    applyStatus(movie, MovieStatus.DRAFT, NOW);
    expect(movie).toMatchObject({ isFeatured: false, featuredOrder: null, unpublishAt: null });
  });

  it('archiving sets archivedAt and restoring clears it', () => {
    const movie = make();
    applyStatus(movie, MovieStatus.ARCHIVED, NOW);
    expect(movie.archivedAt).toEqual(NOW);
    expect(movie.publishAt).toBeNull();
    applyStatus(movie, MovieStatus.DRAFT, NOW);
    expect(movie.archivedAt).toBeNull();
  });
});
