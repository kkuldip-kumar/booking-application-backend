// src/modules/payments/gateways/razorpay.gateway.ts
import { createHmac, timingSafeEqual } from 'crypto';
import { IncomingHttpHeaders } from 'http';
import {
  BadGatewayException, Injectable, Logger, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CURRENCY_INR, GATEWAY_TIMEOUT_MS, WEBHOOK_TOLERANCE_MS,
} from '../payments.constants';
import {
  GatewayOrder, PaymentGateway, VerifiedWebhookEvent, WebhookEventType,
} from './payment-gateway.interface';

const ORDERS_URL = 'https://api.razorpay.com/v1/orders';
const SIGNATURE_HEADER = 'x-razorpay-signature';
const EVENT_TYPES: Readonly<Record<string, WebhookEventType>> = {
  'payment.captured': 'PAYMENT_SUCCESS',
  'payment.failed': 'PAYMENT_FAILED',
};

interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  method: string;
}
interface RazorpayEvent {
  event: string;
  created_at: number;
  payload: { payment: { entity: RazorpayPayment } };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const isRazorpayEvent = (v: unknown): v is RazorpayEvent => {
  if (!isRecord(v) || typeof v.event !== 'string' || typeof v.created_at !== 'number') {
    return false;
  }
  const entity = isRecord(v.payload) && isRecord(v.payload.payment)
    ? v.payload.payment.entity
    : undefined;
  return (
    isRecord(entity) &&
    typeof entity.id === 'string' &&
    typeof entity.order_id === 'string' &&
    typeof entity.amount === 'number' &&
    typeof entity.method === 'string'
  );
};

@Injectable()
export class RazorpayGateway implements PaymentGateway {
  readonly name = 'RAZORPAY';
  private readonly logger = new Logger(RazorpayGateway.name);

  constructor(private readonly config: ConfigService) {}

  getPublicKey(): string {
    return this.config.getOrThrow<string>('PAYMENT_GATEWAY_KEY');
  }

  async createOrder(input: {
    receipt: string;
    amount: number;
    currency: string;
  }): Promise<GatewayOrder> {
    const credentials = `${this.getPublicKey()}:${this.config.getOrThrow<string>('PAYMENT_GATEWAY_SECRET')}`;
    const response = await fetch(ORDERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(credentials).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency || CURRENCY_INR,
        receipt: input.receipt,
      }),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    }).catch((error: unknown) => {
      this.logger.error(`Order creation request failed: ${String(error)}`);
      throw new BadGatewayException('Payment gateway unavailable');
    });

    const body: unknown = await response.json().catch(() => undefined);
    if (!response.ok || !isRecord(body) || typeof body.id !== 'string') {
      this.logger.error(`Order creation rejected status=${response.status}`);
      throw new BadGatewayException('Payment gateway unavailable');
    }
    return { gatewayOrderId: body.id };
  }

  parseWebhook(rawBody: Buffer, headers: IncomingHttpHeaders): VerifiedWebhookEvent {
    this.assertSignature(rawBody, headers[SIGNATURE_HEADER]);

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new UnauthorizedException('Invalid webhook');
    }
    if (!isRazorpayEvent(parsed)) throw new UnauthorizedException('Invalid webhook');
    if (Math.abs(Date.now() - parsed.created_at * 1000) > WEBHOOK_TOLERANCE_MS) {
      throw new UnauthorizedException('Stale webhook');
    }

    const payment = parsed.payload.payment.entity;
    return {
      type: EVENT_TYPES[parsed.event] ?? 'IGNORED',
      gatewayOrderId: payment.order_id,
      gatewayPaymentId: payment.id,
      amount: payment.amount,
      summary: {
        event: parsed.event,
        paymentId: payment.id,
        orderId: payment.order_id,
        method: payment.method,
        amount: payment.amount,
      },
    };
  }

  private assertSignature(rawBody: Buffer, header: string | string[] | undefined): void {
    const signature = typeof header === 'string' ? header : '';
    const expected = createHmac(
      'sha256',
      this.config.getOrThrow<string>('PAYMENT_WEBHOOK_SECRET'),
    )
      .update(rawBody)
      .digest();
    const received = Buffer.from(signature, 'hex');
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new UnauthorizedException('Invalid signature');
    }
  }
}