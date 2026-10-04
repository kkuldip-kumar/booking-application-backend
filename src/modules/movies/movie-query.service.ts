import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MovieAssetType } from '../../common/enums/movie-asset-type.enum';
import { LanguageType } from '../../common/enums/language-type.enum';
import { PUBLIC_MOVIE_STATUSES } from '../../common/enums/movie-status.enum';
import { escapeLike } from '../../common/utils/transformers';
import { AdminListMoviesQueryDto, ListMoviesQueryDto, MovieSortOrder } from './dto/list-movies-query.dto';
import { MovieListItemDto, PaginatedMoviesDto } from './dto/movie-response.dto';
import { Movie } from './entities/movie.entity';
import { toMovieListItem } from './movie.mapper';
import { FEATURED_MOVIES_LIMIT } from './movies.constants';

type Direction = 'ASC' | 'DESC';

const SORT_COLUMNS: Readonly<Record<MovieSortOrder, readonly [string, Direction]>> = {
  [MovieSortOrder.RELEASE_DATE_DESC]: ['movie.releaseDate', 'DESC'],
  [MovieSortOrder.RELEASE_DATE_ASC]: ['movie.releaseDate', 'ASC'],
  [MovieSortOrder.TITLE_ASC]: ['movie.title', 'ASC'],
};

@Injectable()
export class MovieQueryService {
  constructor(@InjectRepository(Movie) private readonly movies: Repository<Movie>) {}

  listPublic(query: ListMoviesQueryDto): Promise<PaginatedMoviesDto> {
    const qb = this.listQuery();
    this.restrictToVisible(qb);
    if (query.status) qb.andWhere('movie.status = :status', { status: query.status });
    return this.paginate(qb, query);
  }

  listAdmin(query: AdminListMoviesQueryDto): Promise<PaginatedMoviesDto> {
    const qb = this.listQuery();
    if (query.status) qb.andWhere('movie.status = :status', { status: query.status });
    if (query.isFeatured !== undefined) {
      qb.andWhere('movie.isFeatured = :isFeatured', { isFeatured: query.isFeatured });
    }
    return this.paginate(qb, query);
  }

  async listFeatured(): Promise<MovieListItemDto[]> {
    const qb = this.listQuery();
    this.restrictToVisible(qb);
    const rows = await qb
      .andWhere('movie.isFeatured = true')
      .orderBy('movie.featuredOrder', 'ASC', 'NULLS LAST')
      .addOrderBy('movie.releaseDate', 'DESC')
      .addOrderBy('movie.id', 'ASC')
      .take(FEATURED_MOVIES_LIMIT)
      .getMany();
    return rows.map(toMovieListItem);
  }

  // Only the columns the list view needs; poster is joined by type to avoid loading every asset.
  private listQuery(): SelectQueryBuilder<Movie> {
    return this.movies
      .createQueryBuilder('movie')
      .leftJoin('movie.assets', 'asset', 'asset.assetType = :posterType', { posterType: MovieAssetType.POSTER })
      .leftJoin('movie.genres', 'genre')
      .select([
        'movie.id', 'movie.title', 'movie.slug', 'movie.runtimeMin', 'movie.releaseDate',
        'movie.status', 'movie.isFeatured', 'movie.featuredOrder',
        'asset.id', 'asset.assetType', 'asset.url',
        'genre.id', 'genre.name', 'genre.slug',
      ]);
  }

  private restrictToVisible(qb: SelectQueryBuilder<Movie>): void {
    qb.andWhere('movie.status IN (:...visible)', { visible: PUBLIC_MOVIE_STATUSES })
      .andWhere('(movie.unpublishAt IS NULL OR movie.unpublishAt > now())');
  }

  private applyFilters(qb: SelectQueryBuilder<Movie>, query: ListMoviesQueryDto): void {
    if (query.q) {
      qb.andWhere("movie.title ILIKE :q ESCAPE '\\'", { q: `%${escapeLike(query.q)}%` });
    }
    if (query.genreId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM movie_genres mg WHERE mg.movie_id = movie.id AND mg.genre_id = :genreId)',
        { genreId: query.genreId },
      );
    }
    if (query.language) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM movie_languages ml INNER JOIN languages l ON l.id = ml.language_id
                 WHERE ml.movie_id = movie.id AND ml.language_type = :audio AND l.code = :language)`,
        { audio: LanguageType.AUDIO, language: query.language },
      );
    }
    if (query.format) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM movie_formats mf INNER JOIN formats f ON f.id = mf.format_id
                 WHERE mf.movie_id = movie.id AND f.code = :format)`,
        { format: query.format },
      );
    }
  }

  private async paginate(qb: SelectQueryBuilder<Movie>, query: ListMoviesQueryDto): Promise<PaginatedMoviesDto> {
    this.applyFilters(qb, query);
    const [column, direction] = SORT_COLUMNS[query.sort];
    const [rows, total] = await qb
      .orderBy(column, direction)
      .addOrderBy('movie.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return { items: rows.map(toMovieListItem), meta: { page: query.page, limit: query.limit, total } };
  }
}
