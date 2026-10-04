export enum MovieStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  NOW_SHOWING = 'NOW_SHOWING',
  COMING_SOON = 'COMING_SOON',
  ARCHIVED = 'ARCHIVED',
}

export const PUBLIC_MOVIE_STATUSES: readonly MovieStatus[] = [
  MovieStatus.PUBLISHED,
  MovieStatus.NOW_SHOWING,
  MovieStatus.COMING_SOON,
];

export const isPubliclyVisible = (status: MovieStatus): boolean =>
  PUBLIC_MOVIE_STATUSES.includes(status);
