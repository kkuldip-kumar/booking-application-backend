// src/modules/payments/modes/card.strategy.ts
import { Injectable } from '@nestjs/common';
import { PaymentMode } from '../../../common/enums/payment-mode.enum';
import { PaymentModeStrategy, ResolvedMode } from './payment-mode.strategy';

abstract class CardPaymentStrategy implements PaymentModeStrategy {
  abstract readonly mode: PaymentMode;
  protected abstract readonly cardType: 'credit' | 'debit';

  resolve(): ResolvedMode {
    return { method: 'card', details: { cardType: this.cardType }, prefill: {} };
  }
}

@Injectable()
export class CreditCardStrategy extends CardPaymentStrategy {
  readonly mode = PaymentMode.CREDIT_CARD;
  protected readonly cardType = 'credit';
}

@Injectable()
export class DebitCardStrategy extends CardPaymentStrategy {
  readonly mode = PaymentMode.DEBIT_CARD;
  protected readonly cardType = 'debit';
}