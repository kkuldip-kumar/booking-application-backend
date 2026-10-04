import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PUBLIC_MOVIE_STATUSES } from '../../common/constants/cinema.constants';
import { isUniqueViolation } from '../../common/utils/db-errors.util';
import { Movie } from '../movies/entities/movie.entity';
import { AddCreditDto, CreditResponseDto, UpdateCreditDto } from './dto/credit.dto';
import { MovieCredit } from './entities/movie-credit.entity';
import { PeopleService } from './people.service';

const DUPLICATE_CREDIT_MESSAGE = 'Duplicate credit for this person, type and character';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(MovieCredit) private readonly credits: Repository<MovieCredit>,
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    private readonly peopleService: PeopleService,
    private readonly dataSource: DataSource,
  ) {}

  async listForMovie(movieId: string, publicOnly: boolean): Promise<CreditResponseDto[]> {
    await this.assertMovieExists(movieId, publicOnly);
    const rows = await this.credits.find({
      where: { movieId, ...(publicOnly ? { person: { isActive: true } } : {}) },
      relations: { person: true },
      order: { creditType: 'ASC', displayOrder: 'ASC' },
    });
    return rows.map((row) => CreditResponseDto.from(row));
  }

  async add(movieId: string, dto: AddCreditDto): Promise<CreditResponseDto> {
    await this.assertMovieExists(movieId, false);
    await this.peopleService.assertAllExist([dto.personId]);
    try {
      const saved = await this.credits.save(this.credits.create({
        movieId, personId: dto.personId, creditType: dto.creditType,
        characterName: dto.characterName ?? null, displayOrder: dto.displayOrder ?? 0,
      }));
      return this.loadOne(saved.id);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(DUPLICATE_CREDIT_MESSAGE);
      throw error;
    }
  }

  async update(movieId: string, creditId: string, dto: UpdateCreditDto): Promise<CreditResponseDto> {
    const credit = await this.credits.findOneBy({ id: creditId, movieId });
    if (!credit) throw new NotFoundException('Credit not found');
    credit.characterName = dto.characterName ?? credit.characterName;
    credit.displayOrder = dto.displayOrder ?? credit.displayOrder;
    try {
      await this.credits.save(credit);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(DUPLICATE_CREDIT_MESSAGE);
      throw error;
    }
    return this.loadOne(creditId);
  }

  async remove(movieId: string, creditId: string): Promise<void> {
    const result = await this.credits.delete({ id: creditId, movieId });
    if (!result.affected) throw new NotFoundException('Credit not found');
  }

  /** Atomically replaces the full cast & crew of a movie (used by the Movies module when assigning credits). */
  async replaceForMovie(movieId: string, items: readonly AddCreditDto[]): Promise<CreditResponseDto[]> {
    await this.assertMovieExists(movieId, false);
    await this.peopleService.assertAllExist(items.map((item) => item.personId));
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.delete(MovieCredit, { movieId });
        if (items.length === 0) return;
        await manager.insert(MovieCredit, items.map((item, index) => ({
          movieId, personId: item.personId, creditType: item.creditType,
          characterName: item.characterName ?? null, displayOrder: item.displayOrder ?? index,
        })));
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(DUPLICATE_CREDIT_MESSAGE);
      throw error;
    }
    return this.listForMovie(movieId, false);
  }

  private async loadOne(id: string): Promise<CreditResponseDto> {
    return CreditResponseDto.from(await this.credits.findOneOrFail({ where: { id }, relations: { person: true } }));
  }

  private async assertMovieExists(movieId: string, publicOnly: boolean): Promise<void> {
    const movie = await this.movies.findOneBy({ id: movieId });
    const visible = movie !== null && (!publicOnly || PUBLIC_MOVIE_STATUSES.includes(movie.status));
    if (!visible) throw new NotFoundException('Movie not found');
  }
}
