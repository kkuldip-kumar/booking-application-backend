import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsISO8601, IsOptional, IsString, IsUrl, IsUUID,
  Length, Matches, Max, MaxLength, Min,
} from 'class-validator';
import { trimString } from '../../../common/utils/transformers';
import {
  MAX_FORMATS_PER_MOVIE, MAX_GENRES_PER_MOVIE, MAX_RUNTIME_MIN,
} from '../movies.constants';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class CreateMovieDto {
  @Transform(trimString)
  @IsString()
  @Length(1, 200)
  title!: string;

  @Transform(trimString)
  @IsString()
  @Length(1, 5000)
  synopsis!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RUNTIME_MIN)
  runtimeMin!: number;

  @Matches(DATE_ONLY, { message: 'releaseDate must be YYYY-MM-DD' })
  @IsISO8601({ strict: true })
  releaseDate!: string;

  @IsUUID('4')
  ageRatingId!: string;

  /** Stored only; the server never fetches this URL. */
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  trailerUrl?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_GENRES_PER_MOVIE)
  @IsUUID('4', { each: true })
  genreIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_FORMATS_PER_MOVIE)
  @IsUUID('4', { each: true })
  formatIds?: string[];
}
