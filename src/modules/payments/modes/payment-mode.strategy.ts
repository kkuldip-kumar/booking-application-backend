// src/modules/payments/modes/payment-mode.strategy.ts
import { PaymentMode } from '../../../common/enums/payment-mode.enum';

export type GatewayMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi';
export type StoredModeDetails = Record<string, string | number>;

export interface ModeInput {
  vpa?: string;
  bankCode?: string;
  walletProvider?: string;
  emiTenureMonths?: number;
}

export interface ResolvedMode {
  method: GatewayMethod;
  /** Non-sensitive; persisted. */
  details: StoredModeDetails;
  /** May contain PII (e.g. VPA); returned to the client, never persisted. */
  prefill: Record<string, string>;
}

export interface PaymentModeStrategy {
  readonly mode: PaymentMode;
  resolve(input: ModeInput): ResolvedMode;
}