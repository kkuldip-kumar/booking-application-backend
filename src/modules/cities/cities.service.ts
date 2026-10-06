// src/modules/cities/cities.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated, toPaginated } from '../../common/utils/paginate';
import { isForeignKeyViolation, isUniqueViolation } from '../../common/utils/db-errors';
import { slugify } from '../../common/utils/slugify';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AdminQueryCitiesDto } from './dto/query-cities.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { City } from './entities/city.entity';

const CITY_EXISTS_MESSAGE = 'City already exists';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City) private readonly cities: Repository<City>,
    private readonly audit: AuditLogsService,
  ) {}

  async findAll(query: AdminQueryCitiesDto, includeInactive: boolean): Promise<Paginated<City>> {
    const qb = this.cities
      .createQueryBuilder('c')
      .loadRelationCountAndMap('c.cinemaCount', 'c.cinemas');

    if (!includeInactive) {
      qb.andWhere('c.isActive = true');
    } else if (query.isActive !== undefined) {
      qb.andWhere('c.isActive = :isActive', { isActive: query.isActive });
    }
    if (query.q) qb.andWhere('c.name ILIKE :q', { q: `%${query.q}%` });
    if (query.state) qb.andWhere('c.state ILIKE :state', { state: query.state });

    const [items, total] = await qb
      .orderBy('c.name', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    return toPaginated(items, total, query);
  }

  async findOne(id: string, includeInactive: boolean): Promise<City> {
    const city = await this.cities
      .createQueryBuilder('c')
      .loadRelationCountAndMap('c.cinemaCount', 'c.cinemas')
      .where('c.id = :id', { id })
      .getOne();
    if (!city || (!city.isActive && !includeInactive)) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  /** Used by CinemasService before attaching a cinema to a city. */
  async assertActive(id: string): Promise<void> {
    const exists = await this.cities.exist({ where: { id, isActive: true } });
    if (!exists) throw new NotFoundException('City not found');
  }

  async create(actorId: string, dto: CreateCityDto): Promise<City> {
    try {
      const city = await this.cities.save(
        this.cities.create({
          name: dto.name,
          slug: slugify(dto.name),
          state: dto.state,
          isActive: dto.isActive ?? true,
        }),
      );
      await this.audit.record({
        actorId, action: 'CITY_CREATED', entityType: 'city', entityId: city.id,
      });
      return city;
    } catch (error: unknown) {
      throw this.translate(error);
    }
  }

  async update(actorId: string, id: string, dto: UpdateCityDto): Promise<City> {
    const city = await this.findOne(id, true);
    if (dto.name !== undefined) {
      city.name = dto.name;
      city.slug = slugify(dto.name);
    }
    if (dto.state !== undefined) city.state = dto.state;
    if (dto.isActive !== undefined) city.isActive = dto.isActive;
    try {
      const saved = await this.cities.save(city);
      await this.audit.record({
        actorId, action: 'CITY_UPDATED', entityType: 'city', entityId: id,
      });
      return saved;
    } catch (error: unknown) {
      throw this.translate(error);
    }
  }

  async remove(actorId: string, id: string): Promise<void> {
    const city = await this.findOne(id, true);
    if ((city.cinemaCount ?? 0) > 0) {
      throw new ConflictException('City has cinemas; deactivate it instead');
    }
    try {
      await this.cities.delete(city.id);
    } catch (error: unknown) {
      throw this.translate(error);
    }
    await this.audit.record({
      actorId, action: 'CITY_DELETED', entityType: 'city', entityId: id,
    });
  }

  private translate(error: unknown): unknown {
    if (isUniqueViolation(error)) return new ConflictException(CITY_EXISTS_MESSAGE);
    if (isForeignKeyViolation(error)) {
      return new ConflictException('City is referenced by other records');
    }
    return error;
  }
}