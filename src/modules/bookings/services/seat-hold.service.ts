import { ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { BOOKING_LIMITS } from '../../../common/constants/booking.constants';
import { assertShowtimeBookable, isSeatHoldableBy } from '../booking.rules';
import { HoldResult } from '../booking.types';
import { SeatInventoryRepository } from '../repositories/seat-inventory.repository';

@Injectable()
export class SeatHoldService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventory: SeatInventoryRepository,
    private readonly config: ConfigService,
  ) {}

  holdSeats(userId: string, showtimeId: string, seatIds: string[]): Promise<HoldResult> {
    return this.dataSource.transaction((manager) =>
      this.holdInTransaction(manager, userId, showtimeId, seatIds),
    );
  }

  async releaseHold(userId: string, showtimeId: string): Promise<void> {
    await this.dataSource.transaction((manager) =>
      this.inventory.releaseUserHolds(manager, showtimeId, userId),
    );
  }

  private async holdInTransaction(
    manager: EntityManager,
    userId: string,
    showtimeId: string,
    seatIds: string[],
  ): Promise<HoldResult> {
    assertShowtimeBookable(await this.inventory.lockShowtime(manager, showtimeId, 'SHARE'));
    await this.assertHoldQuota(manager, userId, showtimeId);

    const seats = await this.inventory.lockSeats(manager, showtimeId, seatIds);
    const allHoldable =
      seats.length === seatIds.length && seats.every((seat) => isSeatHoldableBy(seat, userId));
    if (!allHoldable) throw new ConflictException('One or more seats are unavailable');

    const holdMinutes = this.config.get<number>(
      'SEAT_HOLD_MINUTES',
      BOOKING_LIMITS.DEFAULT_HOLD_MINUTES,
    );
    const heldUntil = await this.inventory.markHeld(manager, { seatIds, userId, holdMinutes });
    return { heldUntil, showtimeSeatIds: seatIds };
  }

  private async assertHoldQuota(
    manager: EntityManager,
    userId: string,
    showtimeId: string,
  ): Promise<void> {
    const others = await this.inventory.countOtherHeldShowtimes(manager, userId, showtimeId);
    if (others >= BOOKING_LIMITS.MAX_HELD_SHOWTIMES_PER_USER) {
      throw new HttpException('Too many active seat holds', HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}
