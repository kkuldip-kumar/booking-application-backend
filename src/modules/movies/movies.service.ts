import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, FindOptionsWhere, In, IsNull, MoreThan } from 'typeorm';
import { isPubliclyVisible, MovieStatus, PUBLIC_MOVIE_STATUSES } from '../../common/enums/movie-status.enum';
import { isUniqueViolation } from '../../common/utils/db-errors';
import { generateUniqueSlug, assertNotArchived, lockMovieOrFail, recordStatusChange } from './domain/movie-persistence';
import { loadAllOrFail } from './domain/reference-loader';
import { CreateMovieDto } from './dto/create-movie.dto';
import { AdminMovieDetailDto, MovieDetailDto } from './dto/movie-response.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { AgeRating } from './entities/age-rating.entity';
import { Format } from './entities/format.entity';
import { Genre } from './entities/genre.entity';
import { Movie } from './entities/movie.entity';
import { toAdminMovieDetail, toMovieDetail } from './movie.mapper';
import { MovieAuditService } from './movie-audit.service';

const DETAIL_RELATIONS = {
  ageRating: true,
  genres: true,
  formats: true,
  languages: { language: true },
  credits: { person: true },
  assets: true,
} as const;

@Injectable()
export class MoviesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly audit: MovieAuditService,
  ) {}

  async create(actorId: string, dto: CreateMovieDto): Promise<AdminMovieDetailDto> {
    const movieId = await this.dataSource
      .transaction((manager) => this.insertDraft(manager, actorId, dto))
      .catch((error: unknown) => {
        if (isUniqueViolation(error)) throw new ConflictException('A movie with this slug already exists');
        throw error;
      });
    await this.audit.record({ actorId, action: 'movie.created', movieId });
    return this.getAdmin(movieId);
  }

  async update(actorId: string, id: string, dto: UpdateMovieDto): Promise<AdminMovieDetailDto> {
    await this.dataSource.transaction(async (manager) => {
      assertNotArchived(await lockMovieOrFail(manager, id));
      const movie = await manager.findOneOrFail(Movie, {
        where: { id },
        relations: { genres: true, formats: true },
      });
      this.applyScalars(movie, dto);
      await this.applyReferences(manager, movie, dto);
      await manager.save(movie);
    });
    await this.audit.record({ actorId, action: 'movie.updated', movieId: id, metadata: { fields: Object.keys(dto) } });
    return this.getAdmin(id);
  }

  async getAdmin(id: string): Promise<AdminMovieDetailDto> {
    const movie = await this.dataSource.manager.findOne(Movie, {
      where: { id },
      relations: DETAIL_RELATIONS,
      relationLoadStrategy: 'query',
    });
    if (!movie) throw new NotFoundException('Movie not found');
    return toAdminMovieDetail(movie);
  }

  getPublicById(id: string): Promise<MovieDetailDto> {
    return this.getPublic({ id });
  }

  getPublicBySlug(slug: string): Promise<MovieDetailDto> {
    return this.getPublic({ slug });
  }

  private async getPublic(key: FindOptionsWhere<Movie>): Promise<MovieDetailDto> {
    const visible = { ...key, status: In(PUBLIC_MOVIE_STATUSES) };
    const movie = await this.dataSource.manager.findOne(Movie, {
      // OR of two clauses: not scheduled for removal, or removal still in the future.
      where: [
        { ...visible, unpublishAt: IsNull() },
        { ...visible, unpublishAt: MoreThan(new Date()) },
      ],
      relations: DETAIL_RELATIONS,
      relationLoadStrategy: 'query',
    });
    if (!movie) throw new NotFoundException('Movie not found');
    return toMovieDetail(movie);
  }

  private async insertDraft(manager: EntityManager, actorId: string, dto: CreateMovieDto): Promise<string> {
    await this.assertAgeRatingExists(manager, dto.ageRatingId);
    const movie = manager.create(Movie, {
      title: dto.title,
      slug: await generateUniqueSlug(manager, dto.title),
      synopsis: dto.synopsis,
      runtimeMin: dto.runtimeMin,
      releaseDate: dto.releaseDate,
      ageRatingId: dto.ageRatingId,
      trailerUrl: dto.trailerUrl ?? null,
      status: MovieStatus.DRAFT,
      createdBy: actorId,
      genres: await loadAllOrFail(manager, Genre, dto.genreIds ?? [], 'genres'),
      formats: await loadAllOrFail(manager, Format, dto.formatIds ?? [], 'formats'),
    });
    const saved = await manager.save(movie);
    await recordStatusChange(manager, {
      movieId: saved.id, oldStatus: null, newStatus: MovieStatus.DRAFT, changedBy: actorId,
    });
    return saved.id;
  }

  // Explicit field mapping (no spread) so clients can never set status, slug, featured flags or ownership.
  private applyScalars(movie: Movie, dto: UpdateMovieDto): void {
    if (dto.title !== undefined) movie.title = dto.title;
    if (dto.synopsis !== undefined) movie.synopsis = dto.synopsis;
    if (dto.runtimeMin !== undefined) movie.runtimeMin = dto.runtimeMin;
    if (dto.releaseDate !== undefined) movie.releaseDate = dto.releaseDate;
    if (dto.trailerUrl !== undefined) movie.trailerUrl = dto.trailerUrl;
  }

  private async applyReferences(manager: EntityManager, movie: Movie, dto: UpdateMovieDto): Promise<void> {
    if (dto.ageRatingId !== undefined) {
      await this.assertAgeRatingExists(manager, dto.ageRatingId);
      movie.ageRatingId = dto.ageRatingId;
    }
    if (dto.genreIds !== undefined) {
      movie.genres = await loadAllOrFail(manager, Genre, dto.genreIds, 'genres');
    }
    if (dto.formatIds !== undefined) {
      movie.formats = await loadAllOrFail(manager, Format, dto.formatIds, 'formats');
    }
    if (isPubliclyVisible(movie.status) && movie.genres.length === 0) {
      throw new BadRequestException('A published movie must keep at least one genre');
    }
  }

  private async assertAgeRatingExists(manager: EntityManager, id: string): Promise<void> {
    if ((await manager.countBy(AgeRating, { id })) === 0) {
      throw new BadRequestException('Unknown ageRatingId');
    }
  }
}
