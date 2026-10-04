import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { PUBLIC_MOVIE_STATUSES } from '../../common/constants/cinema.constants';
import { CinemaStatus, ShowtimeStatus } from '../../common/enums/cinema.enums';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { assertCinemaAccess, hasGlobalCinemaAccess } from '../../common/utils/cinema-access.util';
import { Paginated, paginate } from '../../common/utils/pagination.util';
import { QueryPublicShowtimesDto, QueryShowtimesDto } from './dto/query-showtimes.dto';
import { ShowtimeResponseDto } from './dto/showtime-response.dto';
import { Showtime } from './entities/showtime.entity';
import { ShowtimeSeatsService } from './showtime-seats.service';

@Injectable()
export class ShowtimeQueryService {
  constructor(
    @InjectRepository(Showtime) private readonly showtimes: Repository<Showtime>,
    private readonly dataSource: DataSource,
    private readonly seatsService: ShowtimeSeatsService,
  ) {}

  async findAllPublic(query: QueryPublicShowtimesDto): Promise<Paginated<ShowtimeResponseDto>> {
    const qb = this.baseQuery()
      .where('s.status = :scheduled', { scheduled: ShowtimeStatus.SCHEDULED })
      .andWhere('s.startAt > now()')
      .andWhere('(s.bookingOpensAt IS NULL OR s.bookingOpensAt <= now())')
      .andWhere('c.status = :activeCinema', { activeCinema: CinemaStatus.ACTIVE })
      .andWhere('m.status IN (:...movieStatuses)', { movieStatuses: PUBLIC_MOVIE_STATUSES });
    return this.run(qb, query);
  }

  async findAllAdmin(user: JwtUser, query: QueryShowtimesDto): Promise<Paginated<ShowtimeResponseDto>> {
    const qb = this.baseQuery().where('1 = 1');
    if (!hasGlobalCinemaAccess(user)) {
      qb.andWhere(user.cinemaIds.length > 0 ? 'sc.cinemaId IN (:...scope)' : '1 = 0', { scope: user.cinemaIds });
    }
    if (query.screenId) qb.andWhere('s.screenId = :screenId', { screenId: query.screenId });
    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    return this.run(qb, query);
  }

  async findOnePublic(id: string): Promise<ShowtimeResponseDto> {
    const showtime = await this.baseQuery()
      .where('s.id = :id AND s.status = :scheduled', { id, scheduled: ShowtimeStatus.SCHEDULED })
      .andWhere('c.status = :activeCinema', { activeCinema: CinemaStatus.ACTIVE })
      .andWhere('m.status IN (:...movieStatuses)', { movieStatuses: PUBLIC_MOVIE_STATUSES })
      .getOne();
    if (!showtime) throw new NotFoundException('Showtime not found');
    return ShowtimeResponseDto.from(showtime, await this.seatsService.summarize(this.dataSource.manager, id));
  }

  async findOneAdmin(user: JwtUser, id: string): Promise<ShowtimeResponseDto> {
    const showtime = await this.baseQuery().where('s.id = :id', { id }).getOne();
    if (!showtime) throw new NotFoundException('Showtime not found');
    assertCinemaAccess(user, showtime.screen.cinemaId);
    return ShowtimeResponseDto.from(showtime, await this.seatsService.summarize(this.dataSource.manager, id));
  }

  // Partial selects keep list payloads small (no movie synopsis etc.).
  private baseQuery(): SelectQueryBuilder<Showtime> {
    return this.showtimes.createQueryBuilder('s')
      .innerJoin('s.movie', 'm').innerJoin('s.screen', 'sc').innerJoin('sc.cinema', 'c')
      .select(['s', 'm.id', 'm.title', 'sc.id', 'sc.name', 'sc.cinemaId', 'c.id', 'c.name']);
  }

  private async run(qb: SelectQueryBuilder<Showtime>, query: QueryPublicShowtimesDto): Promise<Paginated<ShowtimeResponseDto>> {
    if (query.movieId) qb.andWhere('s.movieId = :movieId', { movieId: query.movieId });
    if (query.cinemaId) qb.andWhere('sc.cinemaId = :cinemaId', { cinemaId: query.cinemaId });
    if (query.from) qb.andWhere('s.startAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('s.startAt < :to', { to: query.to });
    const [rows, total] = await qb.orderBy('s.startAt', 'ASC').skip(query.skip).take(query.limit).getManyAndCount();
    return paginate(rows.map((row) => ShowtimeResponseDto.from(row)), total, query.page, query.limit);
  }
}
