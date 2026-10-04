import { CreditType } from '../../../common/enums/credit-type.enum';
import { MovieStatus } from '../../../common/enums/movie-status.enum';

export class GenreDto { id!: string; name!: string; slug!: string }
export class FormatDto { id!: string; code!: string; name!: string }
export class LanguageDto { id!: string; code!: string; name!: string }
export class AgeRatingDto { id!: string; code!: string; label!: string; minAge!: number }
export class PersonDto { id!: string; name!: string; biography!: string | null; profileImageUrl!: string | null }

export class CreditDto {
  personId!: string;
  name!: string;
  profileImageUrl!: string | null;
  creditType!: CreditType;
  characterName!: string | null;
  displayOrder!: number;
}

export class MovieAssetsDto {
  poster!: string | null;
  banner!: string | null;
  header!: string | null;
}

export class PageMetaDto { page!: number; limit!: number; total!: number }

export class MovieListItemDto {
  id!: string;
  title!: string;
  slug!: string;
  runtimeMin!: number;
  releaseDate!: string;
  status!: MovieStatus;
  isFeatured!: boolean;
  posterUrl!: string | null;
  genres!: GenreDto[];
}

export class PaginatedMoviesDto {
  items!: MovieListItemDto[];
  meta!: PageMetaDto;
}

export class MovieDetailDto {
  id!: string;
  title!: string;
  slug!: string;
  synopsis!: string;
  runtimeMin!: number;
  releaseDate!: string;
  ageRating!: AgeRatingDto;
  trailerUrl!: string | null;
  status!: MovieStatus;
  isFeatured!: boolean;
  genres!: GenreDto[];
  formats!: FormatDto[];
  audioLanguages!: LanguageDto[];
  subtitleLanguages!: LanguageDto[];
  credits!: CreditDto[];
  assets!: MovieAssetsDto;
}

export class AdminMovieDetailDto extends MovieDetailDto {
  featuredOrder!: number | null;
  publishAt!: string | null;
  unpublishAt!: string | null;
  publishedAt!: string | null;
  archivedAt!: string | null;
  createdAt!: string;
  updatedAt!: string;
}
