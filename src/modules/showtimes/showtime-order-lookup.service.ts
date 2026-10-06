import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ShowtimeStatus } from '../../common/enums/cinema.enums';
import { ShowtimeSeat } from './entities/showtime-seat.entity';
import { Showtime } from './entities/showtime.entity';

export interface ShowtimeOrderFacts {
  showtimeId: string;
  movieId: string;
  cinemaId: string;
  timezone: string;
  startAt: Date;
  seatPrices: number[];
}

/** Server-side source of truth for what an order costs; callers never supply prices. */
@Injectable()
export class ShowtimeOrderLookupService {
  constructor(
    @InjectRepository(Showtime) private readonly showtimes: Repository<Showtime>,
    @InjectRepository(ShowtimeSeat) private readonly seats: Repository<ShowtimeSeat>,
  ) {}

  async lookup(showtimeId: string, seatIds: readonly string[]): Promise<ShowtimeOrderFacts> {
    const showtime = await this.showtimes.createQueryBuilder('s')
      .innerJoin('s.screen', 'sc').innerJoin('sc.cinema', 'c')
      .select(['s.id', 's.movieId', 's.startAt', 's.status', 'sc.id', 'sc.cinemaId', 'c.id', 'c.timezone'])
      .where('s.id = :showtimeId', { showtimeId }).getOne();
    if (!showtime || showtime.status !== ShowtimeStatus.SCHEDULED) throw new NotFoundException('Showtime not found');
    const rows = await this.seats.find({ select: { id: true, price: true }, where: { showtimeId, id: In([...seatIds]) } });
    if (rows.length !== seatIds.length) throw new BadRequestException('One or more seats do not belong to this showtime');
    return {
      showtimeId, movieId: showtime.movieId, cinemaId: showtime.screen.cinemaId, timezone: showtime.screen.cinema.timezone,
      startAt: showtime.startAt, seatPrices: rows.map((row) => row.price),
    };
  }
}
