import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { DEFAULT_BOOKING_CUTOFF_MINUTES, DEFAULT_BUFFER_MINUTES, SCHEDULABLE_MOVIE_STATUSES } from '../../common/constants/cinema.constants';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { isExclusionViolation } from '../../common/utils/db-errors.util';
import { Movie } from '../movies/entities/movie.entity';
import { Screen } from '../screens/entities/screen.entity';
import { ScreensService } from '../screens/screens.service';
import { Seat } from '../seat-layouts/entities/seat.entity';
import { SeatLayoutsService } from '../seat-layouts/seat-layouts.service';
import { BulkCreateShowtimesDto, CreateShowtimeDto, ShowtimeBaseDto } from './dto/create-showtime.dto';
import { BulkCreateResultDto, ShowtimeResponseDto } from './dto/showtime-response.dto';
import { ShowtimePricing } from './entities/showtime-pricing.entity';
import { Showtime } from './entities/showtime.entity';
import { ShowtimeQueryService } from './showtime-query.service';
import { ShowtimeSchedulingService } from './showtime-scheduling.service';
import { ShowtimeSeatsService } from './showtime-seats.service';
import { expandBulkSlots } from './showtime-slots.util';

interface PlanContext {
  dto: ShowtimeBaseDto;
  screen: Screen;
  movie: Movie;
  layoutId: string;
  seats: Seat[];
  overrides: Map<string, number>;
  userId: string;
}

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    private readonly dataSource: DataSource,
    private readonly screensService: ScreensService,
    private readonly layoutsService: SeatLayoutsService,
    private readonly scheduling: ShowtimeSchedulingService,
    private readonly seatsService: ShowtimeSeatsService,
    private readonly queries: ShowtimeQueryService,
  ) {}

  async create(user: JwtUser, dto: CreateShowtimeDto): Promise<ShowtimeResponseDto> {
    const context = await this.prepare(user, dto);
    const [id] = await this.persist(context, [dto.startAt]);
    return this.queries.findOneAdmin(user, id);
  }

  async createBulk(user: JwtUser, dto: BulkCreateShowtimesDto): Promise<BulkCreateResultDto> {
    const context = await this.prepare(user, dto);
    const slots = expandBulkSlots({
      fromDate: dto.fromDate, toDate: dto.toDate, times: dto.times, daysOfWeek: dto.daysOfWeek, timezone: context.screen.cinema.timezone,
    });
    const showtimeIds = await this.persist(context, slots);
    return { count: showtimeIds.length, showtimeIds };
  }

  private async prepare(user: JwtUser, dto: ShowtimeBaseDto): Promise<PlanContext> {
    const screen = await this.screensService.findOneForUser(user, dto.screenId);
    this.scheduling.assertScreenSchedulable(screen, dto.format);
    const movie = await this.loadSchedulableMovie(dto.movieId);
    const layout = await this.layoutsService.getActiveLayoutOrFail(screen.id);
    const seats = await this.layoutsService.getBookableSeats(this.dataSource.manager, layout.id);
    if (seats.length === 0) throw new ConflictException('Active layout has no bookable seats');
    const overrides = await this.resolveOverrides(dto);
    return { dto, screen, movie, layoutId: layout.id, seats, overrides, userId: user.id };
  }

  private async resolveOverrides(dto: ShowtimeBaseDto): Promise<Map<string, number>> {
    const prices = dto.seatTypePrices ?? [];
    const idByCode = await this.layoutsService.resolveSeatTypeIds(prices.map((p) => p.seatTypeCode));
    return new Map(prices.map((p) => [idByCode.get(p.seatTypeCode) as string, p.price] as const));
  }

  private async loadSchedulableMovie(movieId: string): Promise<Movie> {
    const movie = await this.movies.findOne({ where: { id: movieId, status: In([...SCHEDULABLE_MOVIE_STATUSES]) } });
    if (!movie) throw new NotFoundException('Movie not found or not published');
    return movie;
  }

  // All-or-nothing; the DB exclusion constraint is the backstop for races the in-tx check cannot see.
  private async persist(context: PlanContext, startTimes: readonly Date[]): Promise<string[]> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const ids: string[] = [];
        for (const startAt of startTimes) ids.push(await this.insertOne(manager, context, startAt));
        return ids;
      });
    } catch (error) {
      if (isExclusionViolation(error)) throw new ConflictException('Showtime overlaps another session on this screen');
      throw error;
    }
  }

  private async insertOne(manager: EntityManager, context: PlanContext, startAt: Date): Promise<string> {
    const { dto, movie, screen } = context;
    this.scheduling.assertStartInFuture(startAt);
    this.scheduling.assertBookingWindow(startAt, dto.bookingOpensAt);
    const endAt = this.scheduling.computeEndAt(startAt, movie.runtimeMin, dto.bufferMinutes ?? DEFAULT_BUFFER_MINUTES);
    await this.scheduling.assertSlotFree(manager, { screenId: screen.id, startAt, endAt });
    const showtime = await manager.save(Showtime, manager.create(Showtime, {
      movieId: movie.id, screenId: screen.id, seatLayoutId: context.layoutId, format: dto.format,
      languageCode: dto.languageCode, subtitleLanguageCode: dto.subtitleLanguageCode ?? null,
      startAt, endAt, basePrice: dto.basePrice, bookingOpensAt: dto.bookingOpensAt ?? null,
      bookingCutoffMinutes: dto.bookingCutoffMinutes ?? DEFAULT_BOOKING_CUTOFF_MINUTES, createdBy: context.userId,
    }));
    await this.savePricing(manager, showtime.id, context.overrides);
    await this.seatsService.generate(manager, showtime, context.seats, context.overrides);
    return showtime.id;
  }

  private async savePricing(manager: EntityManager, showtimeId: string, overrides: ReadonlyMap<string, number>): Promise<void> {
    if (overrides.size === 0) return;
    const rows = [...overrides].map(([seatTypeId, price]) => ({ showtimeId, seatTypeId, price }));
    await manager.insert(ShowtimePricing, rows);
  }
}
