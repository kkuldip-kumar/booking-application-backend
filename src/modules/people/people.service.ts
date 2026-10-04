import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PUBLIC_MOVIE_STATUSES } from '../../common/constants/cinema.constants';
import { isForeignKeyViolation, isUniqueViolation } from '../../common/utils/db-errors.util';
import { Paginated, paginate } from '../../common/utils/pagination.util';
import { escapeLike, pickDefined } from '../../common/utils/query.util';
import { slugify, withRandomSuffix } from '../../common/utils/slug.util';
import { CreatePersonDto, FilmographyItemDto, PersonResponseDto, QueryPeopleDto, UpdatePersonDto } from './dto/person.dto';
import { MovieCredit } from './entities/movie-credit.entity';
import { Person } from './entities/person.entity';

const PERSON_UPDATABLE_FIELDS = ['name', 'biography', 'profileImageUrl', 'birthDate'] as const satisfies readonly (keyof UpdatePersonDto)[];

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(Person) private readonly people: Repository<Person>,
    @InjectRepository(MovieCredit) private readonly credits: Repository<MovieCredit>,
  ) {}

  async create(dto: CreatePersonDto): Promise<PersonResponseDto> {
    const person = this.people.create({
      name: dto.name, slug: await this.uniqueSlug(dto.name), biography: dto.biography ?? null,
      profileImageUrl: dto.profileImageUrl ?? null, birthDate: dto.birthDate ?? null,
    });
    try {
      return PersonResponseDto.from(await this.people.save(person));
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('A person with this slug already exists, retry');
      throw error;
    }
  }

  async update(id: string, dto: UpdatePersonDto): Promise<PersonResponseDto> {
    const person = await this.findOrFail(id);
    Object.assign(person, pickDefined(dto, PERSON_UPDATABLE_FIELDS));
    return PersonResponseDto.from(await this.people.save(person));
  }

  async setActive(id: string, isActive: boolean): Promise<PersonResponseDto> {
    const person = await this.findOrFail(id);
    person.isActive = isActive;
    return PersonResponseDto.from(await this.people.save(person));
  }

  async remove(id: string): Promise<void> {
    await this.findOrFail(id);
    try {
      await this.people.delete({ id });
    } catch (error) {
      if (isForeignKeyViolation(error)) throw new ConflictException('Person has movie credits; deactivate instead');
      throw error;
    }
  }

  async findAll(query: QueryPeopleDto, activeOnly: boolean): Promise<Paginated<PersonResponseDto>> {
    const qb = this.people.createQueryBuilder('p');
    if (activeOnly) qb.where('p.isActive = true');
    if (query.q) qb.andWhere('LOWER(p.name) LIKE :q', { q: `%${escapeLike(query.q.toLowerCase())}%` });
    const [rows, total] = await qb.orderBy('p.name', 'ASC').skip(query.skip).take(query.limit).getManyAndCount();
    return paginate(rows.map((row) => PersonResponseDto.from(row)), total, query.page, query.limit);
  }

  async findOnePublic(id: string): Promise<PersonResponseDto> {
    const person = await this.people.findOneBy({ id, isActive: true });
    if (!person) throw new NotFoundException('Person not found');
    return PersonResponseDto.from(person, await this.loadFilmography(id));
  }

  async findOneAdmin(id: string): Promise<PersonResponseDto> {
    return PersonResponseDto.from(await this.findOrFail(id), await this.loadFilmography(id));
  }

  async assertAllExist(ids: readonly string[]): Promise<void> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return;
    const found = await this.people.count({ where: { id: In(unique) } });
    if (found !== unique.length) throw new NotFoundException('One or more people not found');
  }

  // Public filmography only lists movies that are publicly visible.
  private async loadFilmography(personId: string): Promise<FilmographyItemDto[]> {
    const rows = await this.credits.createQueryBuilder('c')
      .innerJoin('c.movie', 'm').select(['c.id', 'c.creditType', 'c.characterName', 'c.movieId', 'm.id', 'm.title'])
      .where('c.personId = :personId AND m.status IN (:...statuses)', { personId, statuses: PUBLIC_MOVIE_STATUSES })
      .orderBy('m.title', 'ASC').take(200).getMany();
    return rows.map((row) => ({ movieId: row.movieId, title: row.movie.title, creditType: row.creditType, characterName: row.characterName }));
  }

  private async findOrFail(id: string): Promise<Person> {
    const person = await this.people.findOneBy({ id });
    if (!person) throw new NotFoundException('Person not found');
    return person;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    return (await this.people.existsBy({ slug: base })) ? withRandomSuffix(base) : base;
  }
}
