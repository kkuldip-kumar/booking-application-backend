import { OmitType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';
import { MovieStatus, PUBLIC_MOVIE_STATUSES } from '../../../common/enums/movie-status.enum';
import { toBoolean, trimString } from '../../../common/utils/transformers';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from '../movies.constants';

export enum MovieSortOrder {
  RELEASE_DATE_DESC = 'RELEASE_DATE_DESC',
  RELEASE_DATE_ASC = 'RELEASE_DATE_ASC',
  TITLE_ASC = 'TITLE_ASC',
}

export class ListMoviesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  limit: number = DEFAULT_PAGE_LIMIT;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @Length(1, 100)
  q?: string;

  @IsOptional()
  @IsUUID('4')
  genreId?: string;

  /** Audio language code, e.g. `hi`. */
  @IsOptional()
  @Matches(/^[a-z]{2,10}$/)
  language?: string;

  /** Format code, e.g. `IMAX`. */
  @IsOptional()
  @Matches(/^[A-Z0-9_]{1,20}$/)
  format?: string;

  @IsOptional()
  @IsIn(PUBLIC_MOVIE_STATUSES)
  status?: MovieStatus;

  @IsOptional()
  @IsEnum(MovieSortOrder)
  sort: MovieSortOrder = MovieSortOrder.RELEASE_DATE_DESC;
}

export class AdminListMoviesQueryDto extends OmitType(ListMoviesQueryDto, ['status'] as const) {
  @IsOptional()
  @IsEnum(MovieStatus)
  status?: MovieStatus;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isFeatured?: boolean;
}
