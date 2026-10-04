import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DEFAULT_COUNTRY, DEFAULT_TIMEZONE } from '../../common/constants/cinema.constants';
import { CinemaStatus } from '../../common/enums/cinema.enums';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { assertCinemaAccess, hasGlobalCinemaAccess } from '../../common/utils/cinema-access.util';
import { isUniqueViolation } from '../../common/utils/db-errors.util';
import { Paginated, paginate } from '../../common/utils/pagination.util';
import { escapeLike, pickDefined } from '../../common/utils/query.util';
import { AddCinemaImageDto, CinemaImageResponseDto } from './dto/cinema-image.dto';
import { CinemaResponseDto } from './dto/cinema-response.dto';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { QueryCinemasDto } from './dto/query-cinemas.dto';
import { UpdateCinemaDto } from './dto/update-cinema.dto';
import { CinemaImage } from './entities/cinema-image.entity';
import { Cinema } from './entities/cinema.entity';

const CINEMA_UPDATABLE_FIELDS = [
  'name', 'addressLine', 'city', 'state', 'country', 'postalCode', 'latitude', 'longitude',
  'timezone', 'phone', 'email', 'openingTime', 'closingTime', 'facilities',
] as const satisfies readonly (keyof UpdateCinemaDto)[];

@Injectable()
export class CinemasService {
  constructor(
    @InjectRepository(Cinema) private readonly cinemas: Repository<Cinema>,
    @InjectRepository(CinemaImage) private readonly images: Repository<CinemaImage>,
  ) {}

  async create(dto: CreateCinemaDto): Promise<CinemaResponseDto> {
    try {
      const saved = await this.cinemas.save(
        this.cinemas.create({
          code: dto.code, name: dto.name, addressLine: dto.addressLine, city: dto.city, state: dto.state,
          country: dto.country ?? DEFAULT_COUNTRY, postalCode: dto.postalCode,
          latitude: dto.latitude ?? null, longitude: dto.longitude ?? null,
          timezone: dto.timezone ?? DEFAULT_TIMEZONE, phone: dto.phone ?? null, email: dto.email ?? null,
          openingTime: dto.openingTime, closingTime: dto.closingTime, facilities: dto.facilities ?? [],
        }),
      );
      return CinemaResponseDto.from(saved);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Cinema code already exists');
      throw error;
    }
  }

  async update(user: JwtUser, id: string, dto: UpdateCinemaDto): Promise<CinemaResponseDto> {
    const cinema = await this.findOwnedOrFail(user, id);
    Object.assign(cinema, pickDefined(dto, CINEMA_UPDATABLE_FIELDS));
    return CinemaResponseDto.from(await this.cinemas.save(cinema));
  }

  async setStatus(id: string, status: CinemaStatus): Promise<CinemaResponseDto> {
    const cinema = await this.cinemas.findOneBy({ id });
    if (!cinema) throw new NotFoundException('Cinema not found');
    cinema.status = status;
    return CinemaResponseDto.from(await this.cinemas.save(cinema));
  }

  async findAllAdmin(user: JwtUser, query: QueryCinemasDto): Promise<Paginated<CinemaResponseDto>> {
    const qb = this.cinemas.createQueryBuilder('c');
    if (!hasGlobalCinemaAccess(user)) {
      qb.andWhere(user.cinemaIds.length > 0 ? 'c.id IN (:...cinemaIds)' : '1 = 0', { cinemaIds: user.cinemaIds });
    }
    if (query.status) qb.andWhere('c.status = :status', { status: query.status });
    return this.runList(qb, query);
  }

  async findAllPublic(query: QueryCinemasDto): Promise<Paginated<CinemaResponseDto>> {
    const qb = this.cinemas.createQueryBuilder('c').where('c.status = :active', { active: CinemaStatus.ACTIVE });
    return this.runList(qb, query);
  }

  async findOneAdmin(user: JwtUser, id: string): Promise<CinemaResponseDto> {
    assertCinemaAccess(user, id);
    return CinemaResponseDto.from(await this.loadWithImages({ id }));
  }

  async findOnePublic(id: string): Promise<CinemaResponseDto> {
    return CinemaResponseDto.from(await this.loadWithImages({ id, status: CinemaStatus.ACTIVE }));
  }

  async addImage(user: JwtUser, cinemaId: string, dto: AddCinemaImageDto): Promise<CinemaImageResponseDto> {
    await this.findOwnedOrFail(user, cinemaId);
    const image = this.images.create({ cinemaId, url: dto.url, type: dto.type, sortOrder: dto.sortOrder ?? 0 });
    return CinemaImageResponseDto.from(await this.images.save(image));
  }

  async removeImage(user: JwtUser, cinemaId: string, imageId: string): Promise<void> {
    assertCinemaAccess(user, cinemaId);
    const result = await this.images.delete({ id: imageId, cinemaId });
    if (!result.affected) throw new NotFoundException('Image not found');
  }

  async assertExists(id: string): Promise<void> {
    if (!(await this.cinemas.existsBy({ id }))) throw new NotFoundException('Cinema not found');
  }

  private async findOwnedOrFail(user: JwtUser, id: string): Promise<Cinema> {
    assertCinemaAccess(user, id);
    const cinema = await this.cinemas.findOneBy({ id });
    if (!cinema) throw new NotFoundException('Cinema not found');
    return cinema;
  }

  private async loadWithImages(where: { id: string; status?: CinemaStatus }): Promise<Cinema> {
    const cinema = await this.cinemas.findOne({ where, relations: { images: true }, order: { images: { sortOrder: 'ASC' } } });
    if (!cinema) throw new NotFoundException('Cinema not found');
    return cinema;
  }

  private async runList(qb: SelectQueryBuilder<Cinema>, query: QueryCinemasDto): Promise<Paginated<CinemaResponseDto>> {
    if (query.city) qb.andWhere('LOWER(c.city) = LOWER(:city)', { city: query.city });
    if (query.q) qb.andWhere('LOWER(c.name) LIKE :q', { q: `%${escapeLike(query.q.toLowerCase())}%` });
    const [rows, total] = await qb.orderBy('c.name', 'ASC').skip(query.skip).take(query.limit).getManyAndCount();
    return paginate(rows.map((row) => CinemaResponseDto.from(row)), total, query.page, query.limit);
  }
}
