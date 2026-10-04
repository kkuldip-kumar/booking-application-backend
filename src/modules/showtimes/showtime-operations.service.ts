import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ShowtimeSeatStatus, ShowtimeStatus } from '../../common/enums/cinema.enums';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { isExclusionViolation } from '../../common/utils/db-errors.util';
import { ScreensService } from '../screens/screens.service';
import { SeatLayoutsService } from '../seat-layouts/seat-layouts.service';
import { RescheduleShowtimeDto, UpdateShowtimePricingDto } from './dto/showtime-operations.dto';
import { ShowtimeResponseDto } from './dto/showtime-response.dto';
import { ShowtimePricing } from './entities/showtime-pricing.entity';
import { Showtime } from './entities/showtime.entity';
import { ShowtimeQueryService } from './showtime-query.service';
import { ShowtimeSchedulingService } from './showtime-scheduling.service';
import { ShowtimeSeatsService } from './showtime-seats.service';

type Mutation = (manager: EntityManager, showtime: Showtime) => Promise<void>;

@Injectable()
export class ShowtimeOperationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly screensService: ScreensService,
    private readonly layoutsService: SeatLayoutsService,
    private readonly scheduling: ShowtimeSchedulingService,
    private readonly seatsService: ShowtimeSeatsService,
    private readonly queries: ShowtimeQueryService,
  ) {}

  reschedule(user: JwtUser, id: string, dto: RescheduleShowtimeDto): Promise<ShowtimeResponseDto> {
    return this.mutate(user, id, async (manager, showtime) => {
      this.assertScheduled(showtime);
      if ((await this.seatsService.countNotAvailable(manager, id)) > 0) {
        throw new ConflictException('Showtime has held or booked seats; cancel those bookings first');
      }
      this.scheduling.assertStartInFuture(dto.startAt);
      const endAt = new Date(dto.startAt.getTime() + (showtime.endAt.getTime() - showtime.startAt.getTime()));
      await this.scheduling.assertSlotFree(manager, { screenId: showtime.screenId, startAt: dto.startAt, endAt, excludeShowtimeId: id });
      await manager.update(Showtime, { id }, { startAt: dto.startAt, endAt });
    });
  }

  cancel(user: JwtUser, id: string, reason: string): Promise<ShowtimeResponseDto> {
    return this.mutate(user, id, async (manager, showtime) => {
      if (showtime.status === ShowtimeStatus.CANCELLED || showtime.status === ShowtimeStatus.COMPLETED) {
        throw new ConflictException(`Showtime is already ${showtime.status}`);
      }
      // Until the bookings module can refund, a session with sold seats cannot be cancelled here.
      if ((await this.seatsService.countByStatus(manager, id, ShowtimeSeatStatus.BOOKED)) > 0) {
        throw new ConflictException('Showtime has booked seats; cancel and refund those bookings first');
      }
      await this.seatsService.setStatus(manager, id, [ShowtimeSeatStatus.AVAILABLE, ShowtimeSeatStatus.HELD], ShowtimeSeatStatus.BLOCKED);
      await manager.update(Showtime, { id }, { status: ShowtimeStatus.CANCELLED, statusReason: reason });
    });
  }

  block(user: JwtUser, id: string, reason: string): Promise<ShowtimeResponseDto> {
    return this.mutate(user, id, async (manager, showtime) => {
      this.assertScheduled(showtime);
      if ((await this.seatsService.countByStatus(manager, id, ShowtimeSeatStatus.BOOKED)) > 0) {
        throw new ConflictException('Showtime has booked seats and cannot be blocked');
      }
      await this.seatsService.setStatus(manager, id, [ShowtimeSeatStatus.AVAILABLE, ShowtimeSeatStatus.HELD], ShowtimeSeatStatus.BLOCKED);
      await manager.update(Showtime, { id }, { status: ShowtimeStatus.BLOCKED, statusReason: reason });
    });
  }

  unblock(user: JwtUser, id: string): Promise<ShowtimeResponseDto> {
    return this.mutate(user, id, async (manager, showtime) => {
      if (showtime.status !== ShowtimeStatus.BLOCKED) throw new ConflictException('Showtime is not blocked');
      await this.seatsService.setStatus(manager, id, [ShowtimeSeatStatus.BLOCKED], ShowtimeSeatStatus.AVAILABLE);
      await manager.update(Showtime, { id }, { status: ShowtimeStatus.SCHEDULED, statusReason: null });
    });
  }

  updatePricing(user: JwtUser, id: string, dto: UpdateShowtimePricingDto): Promise<ShowtimeResponseDto> {
    return this.mutate(user, id, async (manager, showtime) => {
      this.assertScheduled(showtime);
      if (dto.seatTypePrices) await this.replaceOverrides(manager, id, dto);
      const basePrice = dto.basePrice ?? showtime.basePrice;
      await manager.update(Showtime, { id }, { basePrice });
      await this.seatsService.repriceAvailable(manager, id, basePrice);
    });
  }

  private async replaceOverrides(manager: EntityManager, showtimeId: string, dto: UpdateShowtimePricingDto): Promise<void> {
    const prices = dto.seatTypePrices ?? [];
    const idByCode = await this.layoutsService.resolveSeatTypeIds(prices.map((p) => p.seatTypeCode));
    await manager.delete(ShowtimePricing, { showtimeId });
    if (prices.length === 0) return;
    await manager.insert(ShowtimePricing, prices.map((p) => ({ showtimeId, seatTypeId: idByCode.get(p.seatTypeCode) as string, price: p.price })));
  }

  private assertScheduled(showtime: Showtime): void {
    if (showtime.status !== ShowtimeStatus.SCHEDULED) throw new ConflictException(`Showtime is ${showtime.status}`);
  }

  // Row lock serialises concurrent admin edits (and the future hold flow's status checks) on one session.
  private async mutate(user: JwtUser, id: string, mutation: Mutation): Promise<ShowtimeResponseDto> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const showtime = await manager.findOne(Showtime, { where: { id }, lock: { mode: 'pessimistic_write' } });
        if (!showtime) throw new NotFoundException('Showtime not found');
        await this.screensService.findOneForUser(user, showtime.screenId);
        await mutation(manager, showtime);
      });
    } catch (error) {
      if (isExclusionViolation(error)) throw new ConflictException('Showtime overlaps another session on this screen');
      throw error;
    }
    return this.queries.findOneAdmin(user, id);
  }
}
