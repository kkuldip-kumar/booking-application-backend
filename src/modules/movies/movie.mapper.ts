import { LanguageType } from '../../common/enums/language-type.enum';
import { MovieAssetType } from '../../common/enums/movie-asset-type.enum';
import {
  AdminMovieDetailDto, CreditDto, LanguageDto, MovieAssetsDto, MovieDetailDto, MovieListItemDto,
} from './dto/movie-response.dto';
import { Movie } from './entities/movie.entity';
import { MovieAsset } from './entities/movie-asset.entity';
import { MovieLanguage } from './entities/movie-language.entity';

const assetUrl = (assets: readonly MovieAsset[], type: MovieAssetType): string | null =>
  assets.find((asset) => asset.assetType === type)?.url ?? null;

const toAssets = (assets: readonly MovieAsset[]): MovieAssetsDto => ({
  poster: assetUrl(assets, MovieAssetType.POSTER),
  banner: assetUrl(assets, MovieAssetType.BANNER),
  header: assetUrl(assets, MovieAssetType.HEADER),
});

const toLanguages = (rows: readonly MovieLanguage[], type: LanguageType): LanguageDto[] =>
  rows
    .filter((row) => row.languageType === type)
    .map(({ language }) => ({ id: language.id, code: language.code, name: language.name }));

const toCredits = (movie: Movie): CreditDto[] =>
  [...movie.credits]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((credit) => ({
      personId: credit.personId,
      name: credit.person.name,
      profileImageUrl: credit.person.profileImageUrl,
      creditType: credit.creditType,
      characterName: credit.characterName,
      displayOrder: credit.displayOrder,
    }));

export function toMovieDetail(movie: Movie): MovieDetailDto {
  const { ageRating } = movie;
  return {
    id: movie.id,
    title: movie.title,
    slug: movie.slug,
    synopsis: movie.synopsis,
    runtimeMin: movie.runtimeMin,
    releaseDate: movie.releaseDate,
    ageRating: { id: ageRating.id, code: ageRating.code, label: ageRating.label, minAge: ageRating.minAge },
    trailerUrl: movie.trailerUrl,
    status: movie.status,
    isFeatured: movie.isFeatured,
    genres: movie.genres.map(({ id, name, slug }) => ({ id, name, slug })),
    formats: movie.formats.map(({ id, code, name }) => ({ id, code, name })),
    audioLanguages: toLanguages(movie.languages, LanguageType.AUDIO),
    subtitleLanguages: toLanguages(movie.languages, LanguageType.SUBTITLE),
    credits: toCredits(movie),
    assets: toAssets(movie.assets),
  };
}

const iso = (date: Date | null): string | null => (date ? date.toISOString() : null);

export function toAdminMovieDetail(movie: Movie): AdminMovieDetailDto {
  return {
    ...toMovieDetail(movie),
    featuredOrder: movie.featuredOrder,
    publishAt: iso(movie.publishAt),
    unpublishAt: iso(movie.unpublishAt),
    publishedAt: iso(movie.publishedAt),
    archivedAt: iso(movie.archivedAt),
    createdAt: movie.createdAt.toISOString(),
    updatedAt: movie.updatedAt.toISOString(),
  };
}

export function toMovieListItem(movie: Movie): MovieListItemDto {
  return {
    id: movie.id,
    title: movie.title,
    slug: movie.slug,
    runtimeMin: movie.runtimeMin,
    releaseDate: movie.releaseDate,
    status: movie.status,
    isFeatured: movie.isFeatured,
    posterUrl: assetUrl(movie.assets ?? [], MovieAssetType.POSTER),
    genres: (movie.genres ?? []).map(({ id, name, slug }) => ({ id, name, slug })),
  };
}
