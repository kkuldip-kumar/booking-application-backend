import { MovieStatus } from '../enums/movie-status.enum';

export const MAX_PAGE_LIMIT = 100;
export const DEFAULT_PAGE_LIMIT = 20;
export const DEFAULT_COUNTRY = 'IN';
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;

export const MAX_LAYOUT_ROWS = 50;
export const MAX_SEATS_PER_ROW = 60;
export const MAX_SEATS_PER_LAYOUT = 2000;
export const SEAT_INSERT_CHUNK = 500;
export const SHOWTIME_SEAT_INSERT_CHUNK = 1000;

export const DEFAULT_BUFFER_MINUTES = 15;
export const MAX_BUFFER_MINUTES = 120;
export const DEFAULT_BOOKING_CUTOFF_MINUTES = 15;
export const MAX_BULK_DAYS = 31;
export const MAX_BULK_SHOWTIMES = 200;
export const MAX_PRICE_PAISE = 10_000_000;
export const SEAT_PRICE_DIVISOR_BPS = 10_000;

export const SCHEDULABLE_MOVIE_STATUSES: readonly MovieStatus[] = [MovieStatus.PUBLISHED, MovieStatus.NOW_SHOWING, MovieStatus.COMING_SOON];
export const PUBLIC_MOVIE_STATUSES: readonly MovieStatus[] = SCHEDULABLE_MOVIE_STATUSES;
