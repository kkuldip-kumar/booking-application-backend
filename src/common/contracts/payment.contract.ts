import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export interface CreatePaymentOrderInput {
  readonly bookingId: string;
  readonly userId: string;
  readonly amount: number;
  readonly currency: string;
  readonly idempotencyKey: string;
}

export interface PaymentOrder {
  readonly orderId: string;
  readonly providerOrderId: string;
  readonly amount: number;
  readonly currency: string;
}

export interface RefundInput {
  readonly bookingId: string;
  readonly amount: number;
  readonly reason: string;
  readonly idempotencyKey: string;
}

/** Implemented by PaymentsService. Both calls must be idempotent per idempotencyKey. */
export interface PaymentPort {
  createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder>;
  refund(input: RefundInput): Promise<void>;
}
export const PAYMENT_PORT = Symbol('PAYMENT_PORT');

export interface PaymentSuccessEvent {
  readonly bookingId: string;
  readonly providerPaymentId: string;
  readonly amountPaid: number;
}

export interface PaymentFailureEvent {
  readonly bookingId: string;
  readonly reason: string;
}

/** Implemented by the bookings module; invoked by payments after a verified, de-duplicated webhook. */
export interface PaymentResultHandler {
  onPaymentSuccess(event: PaymentSuccessEvent): Promise<void>;
  onPaymentFailure(event: PaymentFailureEvent): Promise<void>;
}

/** Provided/exported by PaymentsModule so payments never imports bookings (no cycle). */
@Injectable()
export class PaymentResultRegistry {
  private readonly handlers: PaymentResultHandler[] = [];

  register(handler: PaymentResultHandler): void {
    this.handlers.push(handler);
  }

  async publishSuccess(event: PaymentSuccessEvent): Promise<void> {
    for (const handler of this.handlers) {
      await handler.onPaymentSuccess(event);
    }
  }

  async publishFailure(event: PaymentFailureEvent): Promise<void> {
    for (const handler of this.handlers) {
      await handler.onPaymentFailure(event);
    }
  }
}

/** Booking fields payments needs in order to open a gateway order. */
export interface PayableBooking {
  readonly id: string;
  readonly reference: string;
  readonly totalAmount: number;
}

/**
 * Bookings registers this at startup. Payments calls it instead of importing BookingsModule,
 * which would cycle (bookings already imports payments).
 */
export interface BookingPaymentBridge {
  getPayableBooking(userId: string, bookingId: string): Promise<PayableBooking>;
  confirmFromPayment(manager: EntityManager, bookingId: string): Promise<void>;
}

@Injectable()
export class BookingPaymentBridgeRegistry {
  private bridge: BookingPaymentBridge | null = null;

  register(bridge: BookingPaymentBridge): void {
    this.bridge = bridge;
  }

  getPayableBooking(userId: string, bookingId: string): Promise<PayableBooking> {
    return this.require().getPayableBooking(userId, bookingId);
  }

  confirmFromPayment(manager: EntityManager, bookingId: string): Promise<void> {
    return this.require().confirmFromPayment(manager, bookingId);
  }

  private require(): BookingPaymentBridge {
    if (!this.bridge) {
      throw new InternalServerErrorException('Booking payment bridge is not registered');
    }
    return this.bridge;
  }
}
