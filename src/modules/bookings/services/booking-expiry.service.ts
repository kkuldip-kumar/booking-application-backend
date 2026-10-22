import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BookingStatus, ShowtimeSeatStatus } from '../../../common/enums/booking.enums';
import { ExpiryResult } from '../booking.types';
import { Booking } from '../entities/booking.entity';
import { SeatInventoryRepository } from '../repositories/seat-inventory.repository';

@Injectable()
export class BookingExpiryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventory: SeatInventoryRepository,
  ) {}

  expireStale(): Promise<ExpiryResult> {
    return this.dataSource.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .update(Booking)
        .set({ status: BookingStatus.EXPIRED })
        .where('status = :pending AND expires_at < now()', { pending: BookingStatus.PENDING })
        .returning('id')
        .execute();
      const ids = (result.raw as { id: string }[]).map((row) => row.id);
      if (ids.length > 0) {
        await this.inventory.releaseBookingSeats(manager, ids, ShowtimeSeatStatus.AVAILABLE);
      }
      const releasedHolds = await this.inventory.releaseExpiredHolds(manager);
      return { expiredBookings: ids.length, releasedHolds };
    });
  }
}
