import { BullModule } from '@nestjs/bullmq';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EXPIRY_QUEUE } from '../../common/constants/booking.constants';
import {
  BookingPaymentBridgeRegistry,
  PaymentResultRegistry,
} from '../../common/contracts/payment.contract';
import { PaymentsModule } from '../payments/payments.module';
import { TicketsModule } from '../tickets/tickets.module';
import { BookingsController } from './bookings.controller';
import { BookingSeat } from './entities/booking-seat.entity';
import { Booking } from './entities/booking.entity';
import { BookingExpiryProcessor } from './jobs/booking-expiry.processor';
import { BookingExpiryScheduler } from './jobs/booking-expiry.scheduler';
import { BookingLocker } from './repositories/booking-locker';
import { SeatInventoryRepository } from './repositories/seat-inventory.repository';
import { SeatHoldsController } from './seat-holds.controller';
import { BookingCancellationService } from './services/booking-cancellation.service';
import { BookingExpiryService } from './services/booking-expiry.service';
import { BookingPaymentService } from './services/booking-payment.service';
import { BookingRefundService } from './services/booking-refund.service';
import { BookingsService } from './services/bookings.service';
import { SeatHoldService } from './services/seat-hold.service';

@Module({
  imports: [
    ConfigModule,
    PaymentsModule,
    TicketsModule,
    TypeOrmModule.forFeature([Booking, BookingSeat]),
    BullModule.registerQueue({ name: EXPIRY_QUEUE }),
  ],
  controllers: [BookingsController, SeatHoldsController],
  providers: [
    SeatInventoryRepository,
    BookingLocker,
    SeatHoldService,
    BookingsService,
    BookingRefundService,
    BookingPaymentService,
    BookingCancellationService,
    BookingExpiryService,
    BookingExpiryProcessor,
    BookingExpiryScheduler,
  ],
  exports: [BookingCancellationService],
})
export class BookingsModule implements OnModuleInit {
  constructor(
    private readonly registry: PaymentResultRegistry,
    private readonly bridge: BookingPaymentBridgeRegistry,
    private readonly paymentHandler: BookingPaymentService,
    private readonly bookings: BookingsService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.paymentHandler);
    this.bridge.register(this.bookings);
  }
}
