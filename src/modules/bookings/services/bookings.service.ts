import {
  BadGatewayException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { PAYMENT_CURRENCY } from '../../../common/constants/booking.constants';
import {
  BookingSeatStatus,
  BookingStatus,
  RefundStatus,
  ShowtimeSeatStatus,
} from '../../../common/enums/booking.enums';
import {
  BookingPaymentBridge,
  PAYMENT_PORT,
  PayableBooking,
  PaymentOrder,
  PaymentPort,
} from '../../../common/contracts/payment.contract';
import { toBookingResponse } from '../booking.mapper';
import {
  assertShowtimeBookable,
  earliestHoldEnd,
  generateBookingReference,
  isSeatHeldBy,
  sumPrices,
} from '../booking.rules';
import { LockedSeat, PaginatedResult } from '../booking.types';
import { BookingResponseDto, CreateBookingResponseDto } from '../dto/booking-response.dto';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingSeat } from '../entities/booking-seat.entity';
import { Booking } from '../entities/booking.entity';
import { SeatInventoryRepository } from '../repositories/seat-inventory.repository';
import { TicketsService } from '../../tickets/tickets.service';

@Injectable()
export class BookingsService implements BookingPaymentBridge {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly inventory: SeatInventoryRepository,
    private readonly ticketsService:TicketsService,
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @Inject(PAYMENT_PORT) private readonly payments: PaymentPort,
  ) {}

  async create(userId: string, dto: CreateBookingDto): Promise<CreateBookingResponseDto> {
    const booking = await this.dataSource.transaction((manager) =>
      this.createPending(manager, userId, dto),
    );
    const payment = await this.openPaymentOrder(booking);
    return { booking: toBookingResponse(booking), payment };
  }

  async findOne(userId: string, bookingId: string): Promise<BookingResponseDto> {
    const booking = await this.bookings.findOne({
      where: { id: bookingId, userId },
      relations: { seats: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return toBookingResponse(booking);
  }

  async list(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<BookingResponseDto>> {
    const [rows, total] = await this.bookings.findAndCount({
      where: { userId },
      relations: { seats: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: rows.map(toBookingResponse), meta: { page, limit, total } };
  }

  private async createPending(
    manager: EntityManager,
    userId: string,
    dto: CreateBookingDto,
  ): Promise<Booking> {
    assertShowtimeBookable(await this.inventory.lockShowtime(manager, dto.showtimeId, 'SHARE'));
    const seats = await this.inventory.lockSeats(manager, dto.showtimeId, dto.showtimeSeatIds);
    this.assertHeldByUser(seats, dto.showtimeSeatIds.length, userId);
    await this.assertNoActiveBooking(manager, dto.showtimeSeatIds);
    return this.insertBooking(manager, userId, dto.showtimeId, seats);
  }

  private assertHeldByUser(seats: LockedSeat[], expected: number, userId: string): void {
    if (seats.length !== expected || !seats.every((seat) => isSeatHeldBy(seat, userId))) {
      throw new ConflictException('Seats must be held by you before booking');
    }
  }

  private async assertNoActiveBooking(manager: EntityManager, seatIds: string[]): Promise<void> {
    const active = await manager.count(BookingSeat, {
      where: { showtimeSeatId: In(seatIds), status: BookingSeatStatus.ACTIVE },
    });
    if (active > 0) throw new ConflictException('Seats already belong to an active booking');
  }

  private async insertBooking(
    manager: EntityManager,
    userId: string,
    showtimeId: string,
    seats: LockedSeat[],
  ): Promise<Booking> {
    const booking = await manager.save(
      manager.create(Booking, {
        reference: generateBookingReference(),
        userId,
        showtimeId,
        status: BookingStatus.PENDING,
        totalAmount: sumPrices(seats),
        paidAmount: null,
        providerPaymentId: null,
        refundStatus: RefundStatus.NONE,
        expiresAt: earliestHoldEnd(seats),
        cancelledAt: null,
      }),
    );
    booking.seats = await manager.save(
      seats.map((seat) =>
        manager.create(BookingSeat, {
          bookingId: booking.id,
          showtimeSeatId: seat.id,
          seatLabel: seat.label,
          unitPrice: seat.price,
          status: BookingSeatStatus.ACTIVE,
        }),
      ),
    );
    return booking;
  }

  private async openPaymentOrder(booking: Booking): Promise<PaymentOrder> {
    try {
      return await this.payments.createOrder({
        bookingId: booking.id,
        userId: booking.userId,
        amount: booking.totalAmount,
        currency: PAYMENT_CURRENCY,
        idempotencyKey: `order:${booking.id}`,
      });
    } catch (error) {
      this.logger.error(
        `Payment order failed for booking ${booking.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.abort(booking.id);
      throw new BadGatewayException('Unable to start payment');
    }
  }

  private async abort(bookingId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(Booking, { id: bookingId, status: BookingStatus.PENDING }, {
        status: BookingStatus.FAILED,
      });
      await this.inventory.releaseBookingSeats(manager, [bookingId], ShowtimeSeatStatus.AVAILABLE);
    });
  }

  async getPayableBooking(userId: string, bookingId: string): Promise<PayableBooking> {
    const booking = await this.bookings.findOne({ where: { id: bookingId, userId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING || booking.expiresAt <= new Date()) {
      throw new ConflictException('Booking is not payable');
    }
    return { id: booking.id, reference: booking.reference, totalAmount: booking.totalAmount };
  }

    /**
   * Called by the payment webhook inside its transaction. Throws ConflictException
   * when the booking can no longer be confirmed (expired/cancelled, seats lost).
   */
    async confirmFromPayment(manager: EntityManager, bookingId: string): Promise<void> {
      const booking = await manager.findOne(Booking, {
        where: { id: bookingId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.status === BookingStatus.CONFIRMED) return;
      if (booking.status !== BookingStatus.PENDING) {
        throw new ConflictException('Booking is no longer payable');
      }
    
      const links = await manager.find(BookingSeat, {
        where: { bookingId, status: BookingSeatStatus.ACTIVE },
        select: { showtimeSeatId: true },
      });
      const seatIds = links.map((link) => link.showtimeSeatId);
      if (seatIds.length === 0) throw new ConflictException('Booking has no active seats');
    
      // Blocking lock, so contention can't be mistaken for "seats lost".
      const seats = await this.inventory.lockSeatsBlocking(manager, booking.showtimeId, seatIds);
      const stillHeld =
        seats.length === seatIds.length &&
        seats.every((seat) => seat.status === ShowtimeSeatStatus.HELD && seat.heldBy === booking.userId);
      if (!stillHeld) throw new ConflictException('Held seats are no longer available');
    
      await this.inventory.markBooked(manager, seatIds);
      await manager.update(Booking, booking.id, { status: BookingStatus.CONFIRMED });
      await this.ticketsService.issueForBooking(manager, {
        bookingId: booking.id,
        bookingReference: booking.reference,
        userId: booking.userId,
        showtimeId: booking.showtimeId,
        seats: seats.map((seat) => ({
          showtimeSeatId: seat.id,
          seatLabel: seat.label,
          bookingSeatId: links.find((link) => link.showtimeSeatId === seat.id)?.id!,
        })),
        cinemaId: await this.inventory.getCinemaId(manager, booking.showtimeId),
      });
      
      // Ticket issuance: call TicketsService here with the same `manager`.
    }
}
