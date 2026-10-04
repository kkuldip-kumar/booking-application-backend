import { IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, Max, Min, ValidateIf } from 'class-validator';
import { MovieStatus, PUBLIC_MOVIE_STATUSES } from '../../../common/enums/movie-status.enum';
import { MAX_FEATURED_ORDER } from '../movies.constants';

export class UpdateStatusDto {
  @IsIn(PUBLIC_MOVIE_STATUSES)
  status!: MovieStatus;
}

export class ScheduleMovieDto {
  /** ISO-8601 instant, `null` clears the schedule, omitted leaves it unchanged. */
  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsISO8601({ strict: true })
  publishAt?: string | null;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsISO8601({ strict: true })
  unpublishAt?: string | null;
}

export class SetFeaturedDto {
  @IsBoolean()
  isFeatured!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_FEATURED_ORDER)
  featuredOrder?: number;
}
