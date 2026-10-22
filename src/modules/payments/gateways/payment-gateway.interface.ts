// src/modules/payments/gateways/payment-gateway.interface.ts
import { IncomingHttpHeaders } from 'http';

export interface GatewayOrder {
  gatewayOrderId: string;
}

export type WebhookEventType = 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'IGNORED';

export interface VerifiedWebhookEvent {
  type: WebhookEventType;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  amount: number;
  /** Minimal, secret-free subset kept for audit/replay. */
  summary: Record<string, string | number>;
}

export interface PaymentGateway {
  readonly name: string;
  getPublicKey(): string;
  createOrder(input: { receipt: string; amount: number; currency: string }): Promise<GatewayOrder>;
  /** Verifies signature + timestamp. Throws UnauthorizedException on failure. */
  parseWebhook(rawBody: Buffer, headers: IncomingHttpHeaders): VerifiedWebhookEvent;
}