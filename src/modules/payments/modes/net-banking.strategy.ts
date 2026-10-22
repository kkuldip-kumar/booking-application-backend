// src/modules/payments/modes/net-banking.strategy.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMode } from '../../../common/enums/payment-mode.enum';
import { BANK_CODE_PATTERN } from '../payments.constants';
import { ModeInput, PaymentModeStrategy, ResolvedMode } from './payment-mode.strategy';

@Injectable()
export class NetBankingStrategy implements PaymentModeStrategy {
  readonly mode = PaymentMode.NET_BANKING;

  resolve({ bankCode }: ModeInput): ResolvedMode {
    if (!bankCode || !BANK_CODE_PATTERN.test(bankCode)) {
      throw new BadRequestException('A valid bankCode is required for net banking');
    }
    const code = bankCode.toUpperCase();
    return { method: 'netbanking', details: { bankCode: code }, prefill: { bank: code } };
  }
}