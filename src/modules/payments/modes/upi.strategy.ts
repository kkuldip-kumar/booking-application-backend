// src/modules/payments/modes/upi.strategy.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMode } from '../../../common/enums/payment-mode.enum';
import { VPA_PATTERN } from '../payments.constants';
import { ModeInput, PaymentModeStrategy, ResolvedMode } from './payment-mode.strategy';

@Injectable()
export class UpiStrategy implements PaymentModeStrategy {
  readonly mode = PaymentMode.UPI;

  resolve({ vpa }: ModeInput): ResolvedMode {
    if (vpa !== undefined && !VPA_PATTERN.test(vpa)) {
      throw new BadRequestException('Invalid UPI ID');
    }
    return { method: 'upi', details: {}, prefill: vpa ? { vpa } : {} };
  }
}