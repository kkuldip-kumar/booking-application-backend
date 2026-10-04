import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { isUniqueViolation } from '../../common/utils/db-errors';
import { slugify } from '../../common/utils/slugify';
import { escapeLike } from '../../common/utils/transformers';
import { CreateGenreDto, CreatePersonDto, SearchPeopleQueryDto } from './dto/lookup.dto';
import { AgeRatingDto, FormatDto, GenreDto, LanguageDto, PersonDto } from './dto/movie-response.dto';
import { AgeRating } from './entities/age-rating.entity';
import { Format } from './entities/format.entity';
import { Genre } from './entities/genre.entity';
import { Language } from './entities/language.entity';
import { Person } from './entities/person.entity';

const PEOPLE_SEARCH_LIMIT = 25;

@Injectable()
export class LookupsService {
  constructor(
    @InjectRepository(Genre) private readonly genres: Repository<Genre>,
    @InjectRepository(Language) private readonly languages: Repository<Language>,
    @InjectRepository(Format) private readonly formats: Repository<Format>,
    @InjectRepository(AgeRating) private readonly ageRatings: Repository<AgeRating>,
    @InjectRepository(Person) private readonly people: Repository<Person>,
  ) {}

  listGenres(): Promise<GenreDto[]> {
    return this.genres.find({ select: { id: true, name: true, slug: true }, order: { name: 'ASC' } });
  }

  listLanguages(): Promise<LanguageDto[]> {
    return this.languages.find({ select: { id: true, code: true, name: true }, order: { name: 'ASC' } });
  }

  listFormats(): Promise<FormatDto[]> {
    return this.formats.find({ select: { id: true, code: true, name: true }, order: { code: 'ASC' } });
  }

  listAgeRatings(): Promise<AgeRatingDto[]> {
    return this.ageRatings.find({
      select: { id: true, code: true, label: true, minAge: true },
      order: { minAge: 'ASC' },
    });
  }

  async createGenre(dto: CreateGenreDto): Promise<GenreDto> {
    try {
      const saved = await this.genres.save(this.genres.create({ name: dto.name, slug: slugify(dto.name) }));
      return { id: saved.id, name: saved.name, slug: saved.slug };
    } catch (error: unknown) {
      if (isUniqueViolation(error)) throw new ConflictException('Genre already exists');
      throw error;
    }
  }

  async createPerson(dto: CreatePersonDto): Promise<PersonDto> {
    const saved = await this.people.save(
      this.people.create({
        name: dto.name,
        biography: dto.biography ?? null,
        profileImageUrl: dto.profileImageUrl ?? null,
      }),
    );
    return this.toPerson(saved);
  }

  async searchPeople(query: SearchPeopleQueryDto): Promise<PersonDto[]> {
    const rows = await this.people.find({
      where: query.q ? { name: ILike(`%${escapeLike(query.q)}%`) } : {},
      order: { name: 'ASC' },
      take: PEOPLE_SEARCH_LIMIT,
    });
    return rows.map((row) => this.toPerson(row));
  }

  private toPerson(person: Person): PersonDto {
    return {
      id: person.id,
      name: person.name,
      biography: person.biography,
      profileImageUrl: person.profileImageUrl,
    };
  }
}
