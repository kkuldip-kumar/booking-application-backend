import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { SHOWTIME_SEAT_INSERT_CHUNK } from '../../common/constants/cinema.constants';
import { ShowtimeSeatStatus } from '../../common/enums/cinema.enums';
import { chunked } from '../../common/utils/query.util';
import { Seat } from '../seat-layouts/entities/seat.entity';
import { SeatSummary } from './dto/showtime-response.dto';
import { ShowtimeSeat } from './entities/showtime-seat.entity';
import { Showtime } from './entities/showtime.entity';
import { computeSeatPrice } from './showtime-pricing.util';

@Injectable()
export class ShowtimeSeatsService {
  async generate(manager: EntityManager, showtime: Showtime, seats: readonly Seat[], overrides: ReadonlyMap<string, number>): Promise<void> {
    const rows = seats.map((seat) => ({
      showtimeId: showtime.id,
      seatId: seat.id,
      price: computeSeatPrice(showtime.basePrice, seat.seatType.priceMultiplierBps, overrides.get(seat.seatTypeId)),
      status: ShowtimeSeatStatus.AVAILABLE,
    }));
    for (const chunk of chunked(rows, SHOWTIME_SEAT_INSERT_CHUNK)) await manager.insert(ShowtimeSeat, chunk);
  }

  async summarize(manager: EntityManager, showtimeId: string): Promise<SeatSummary> {
    const rows = await manager.createQueryBuilder(ShowtimeSeat, 'ss')
      .select('ss.status', 'status').addSelect('COUNT(*)', 'count')
      .where('ss.showtimeId = :showtimeId', { showtimeId }).groupBy('ss.status')
      .getRawMany<{ status: ShowtimeSeatStatus; count: string }>();
    const count = (status: ShowtimeSeatStatus): number => Number(rows.find((r) => r.status === status)?.count ?? 0);
    const summary = {
      available: count(ShowtimeSeatStatus.AVAILABLE), held: count(ShowtimeSeatStatus.HELD),
      booked: count(ShowtimeSeatStatus.BOOKED), blocked: count(ShowtimeSeatStatus.BLOCKED),
    };
    return { total: summary.available + summary.held + summary.booked + summary.blocked, ...summary };
  }

  async countByStatus(manager: EntityManager, showtimeId: string, status: ShowtimeSeatStatus): Promise<number> {
    return manager.count(ShowtimeSeat, { where: { showtimeId, status } });
  }

  async countNotAvailable(manager: EntityManager, showtimeId: string): Promise<number> {
    const summary = await this.summarize(manager, showtimeId);
    return summary.held + summary.booked;
  }

  async setStatus(manager: EntityManager, showtimeId: string, from: ShowtimeSeatStatus[], to: ShowtimeSeatStatus): Promise<void> {
    await manager.createQueryBuilder().update(ShowtimeSeat)
      .set({ status: to, heldBy: null, heldUntil: null })
      .where('showtimeId = :showtimeId AND status IN (:...from)', { showtimeId, from }).execute();
  }

  /** Re-prices AVAILABLE seats only; HELD/BOOKED seats keep the price the customer saw. */
  async repriceAvailable(manager: EntityManager, showtimeId: string, basePrice: number): Promise<void> {
    await manager.query(
      `UPDATE showtime_seats ss
          SET price = COALESCE(sp.price, ROUND(($2::bigint * st.price_multiplier_bps) / 10000.0))::int, updated_at = now()
         FROM seats s
         JOIN seat_types st ON st.id = s.seat_type_id
         LEFT JOIN showtime_pricing sp ON sp.showtime_id = $1 AND sp.seat_type_id = st.id
        WHERE ss.showtime_id = $1 AND ss.seat_id = s.id AND ss.status = 'AVAILABLE'`,
      [showtimeId, basePrice],
    );
  }
}
