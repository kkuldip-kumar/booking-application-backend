import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  CreatePaymentOrderInput,
  PaymentOrder,
  PaymentPort,
  RefundInput,
} from '../../../src/common/contracts/payment.contract';
import { CreateBookings1791158400000 } from '../../../src/database/migrations/1791158400000-CreateBookings';
import { BookingSeat } from '../../../src/modules/bookings/entities/booking-seat.entity';
import { Booking } from '../../../src/modules/bookings/entities/booking.entity';
import { BookingLocker } from '../../../src/modules/bookings/repositories/booking-locker';
import { SeatInventoryRepository } from '../../../src/modules/bookings/repositories/seat-inventory.repository';
import { BookingCancellationService } from '../../../src/modules/bookings/services/booking-cancellation.service';
import { BookingExpiryService } from '../../../src/modules/bookings/services/booking-expiry.service';
import { BookingPaymentService } from '../../../src/modules/bookings/services/booking-payment.service';
import { BookingRefundService } from '../../../src/modules/bookings/services/booking-refund.service';
import { BookingsService } from '../../../src/modules/bookings/services/bookings.service';
import { SeatHoldService } from '../../../src/modules/bookings/services/seat-hold.service';

export class FakePayments implements PaymentPort {
  readonly orders: CreatePaymentOrderInput[] = [];
  readonly refunds: RefundInput[] = [];
  failRefunds = false;

  async createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder> {
    this.orders.push(input);
    return {
      orderId: `ord_${input.bookingId}`,
      providerOrderId: `prov_${input.bookingId}`,
      amount: input.amount,
      currency: input.currency,
    };
  }

  async refund(input: RefundInput): Promise<void> {
    if (this.failRefunds) throw new Error('gateway down');
    this.refunds.push(input);
  }
}

export interface Harness {
  ds: DataSource;
  fake: FakePayments;
  holds: SeatHoldService;
  bookings: BookingsService;
  payment: BookingPaymentService;
  cancellation: BookingCancellationService;
  refunds: BookingRefundService;
  expiry: BookingExpiryService;
}

// Minimal stand-ins for tables owned by other modules; IF NOT EXISTS keeps real schemas intact.
const STUB_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY DEFAULT gen_random_uuid())`,
  `CREATE TABLE IF NOT EXISTS showtimes (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     status varchar(20) NOT NULL DEFAULT 'SCHEDULED',
     start_at timestamptz NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS seats (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     row_label varchar(5) NOT NULL, seat_number int NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS showtime_seats (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     showtime_id uuid NOT NULL REFERENCES showtimes(id),
     seat_id uuid NOT NULL REFERENCES seats(id),
     price int NOT NULL,
     status varchar(20) NOT NULL DEFAULT 'AVAILABLE',
     held_by uuid NULL REFERENCES users(id),
     held_until timestamptz NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     updated_at timestamptz NOT NULL DEFAULT now(),
     UNIQUE (showtime_id, seat_id))`,
];

export async function createHarness(): Promise<Harness> {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL must point to a dedicated test database');
  const ds = new DataSource({
    type: 'postgres',
    url,
    entities: [Booking, BookingSeat],
    synchronize: false,
    extra: { max: 40 },
  });
  await ds.initialize();
  for (const sql of STUB_SCHEMA) await ds.query(sql);
  const exists: { t: string | null }[] = await ds.query(`SELECT to_regclass('bookings') AS t`);
  if (!exists[0].t) {
    const runner = ds.createQueryRunner();
    await new CreateBookings1791158400000().up(runner);
    await runner.release();
  }

  const fake = new FakePayments();
  const inventory = new SeatInventoryRepository();
  const locker = new BookingLocker(inventory);
  const refunds = new BookingRefundService(ds.getRepository(Booking), fake);
  return {
    ds,
    fake,
    refunds,
    holds: new SeatHoldService(ds, inventory, new ConfigService({ SEAT_HOLD_MINUTES: 10 })),
    bookings: new BookingsService(ds, inventory, ds.getRepository(Booking), fake),
    payment: new BookingPaymentService(ds, inventory, locker, refunds),
    cancellation: new BookingCancellationService(ds, inventory, locker, refunds),
    expiry: new BookingExpiryService(ds, inventory),
  };
}

export async function resetData(ds: DataSource): Promise<void> {
  await ds.query(
    `TRUNCATE booking_seats, bookings, showtime_seats, seats, showtimes, users CASCADE`,
  );
}
