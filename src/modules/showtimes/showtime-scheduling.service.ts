import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { MS_PER_MINUTE } from '../../common/constants/cinema.constants';
import { ScreenStatus, ShowFormat, ShowtimeStatus } from '../../common/enums/cinema.enums';
import { Screen } from '../screens/entities/screen.entity';
import { ScreensService } from '../screens/screens.service';
import { Showtime } from './entities/showtime.entity';

export interface SlotCheck {
  screenId: string;
  startAt: Date;
  endAt: Date;
  excludeShowtimeId?: string;
}

const SLOT_BLOCKING_STATUSES = [ShowtimeStatus.SCHEDULED, ShowtimeStatus.BLOCKED];

@Injectable()
export class ShowtimeSchedulingService {
  constructor(private readonly screensService: ScreensService) {}

  computeEndAt(startAt: Date, runtimeMin: number, bufferMin: number): Date {
    return new Date(startAt.getTime() + (runtimeMin + bufferMin) * MS_PER_MINUTE);
  }

  assertStartInFuture(startAt: Date): void {
    if (startAt.getTime() <= Date.now()) throw new BadRequestException('Showtime must start in the future');
  }

  assertBookingWindow(startAt: Date, bookingOpensAt?: Date): void {
    if (bookingOpensAt && bookingOpensAt >= startAt) throw new BadRequestException('bookingOpensAt must be before startAt');
  }

  assertScreenSchedulable(screen: Screen, format: ShowFormat): void {
    if (screen.status !== ScreenStatus.ACTIVE) throw new ConflictException('Screen is not active');
    if (screen.supportedFormats.length > 0 && !screen.supportedFormats.includes(format)) {
      throw new BadRequestException(`Screen does not support ${format}`);
    }
  }

  async assertSlotFree(manager: EntityManager, slot: SlotCheck): Promise<void> {
    const qb = manager.createQueryBuilder(Showtime, 's')
      .where('s.screenId = :screenId', { screenId: slot.screenId })
      .andWhere('s.status IN (:...statuses)', { statuses: SLOT_BLOCKING_STATUSES })
      .andWhere('s.startAt < :endAt AND s.endAt > :startAt', { startAt: slot.startAt, endAt: slot.endAt });
    if (slot.excludeShowtimeId) qb.andWhere('s.id <> :excludeId', { excludeId: slot.excludeShowtimeId });
    if (await qb.getExists()) throw new ConflictException('Showtime overlaps another session on this screen');
    if (await this.screensService.hasMaintenanceOverlap(manager, slot.screenId, slot.startAt, slot.endAt)) {
      throw new ConflictException('Showtime overlaps a screen maintenance window');
    }
  }
}
