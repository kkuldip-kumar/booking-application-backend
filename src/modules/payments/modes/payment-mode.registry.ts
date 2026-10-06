// src/modules/payments/modes/payment-mode.registry.ts
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PaymentMode } from '../../../common/enums/payment-mode.enum';
import { PAYMENT_MODE_STRATEGIES } from '../payments.constants';
import { PaymentModeStrategy } from './payment-mode.strategy';

@Injectable()
export class PaymentModeRegistry {
  private readonly byMode: ReadonlyMap<PaymentMode, PaymentModeStrategy>;

  constructor(@Inject(PAYMENT_MODE_STRATEGIES) strategies: PaymentModeStrategy[]) {
    this.byMode = new Map(strategies.map((s) => [s.mode, s]));
  }

  get(mode: PaymentMode): PaymentModeStrategy {
    const strategy = this.byMode.get(mode);
    if (!strategy) throw new BadRequestException('Unsupported payment mode');
    return strategy;
  }
}