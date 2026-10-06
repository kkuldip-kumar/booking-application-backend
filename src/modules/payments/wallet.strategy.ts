// src/modules/payments/modes/wallet.strategy.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMode } from '../../../common/enums/payment-mode.enum';
import { SUPPORTED_WALLETS } from '../payments.constants';
import { ModeInput, PaymentModeStrategy, ResolvedMode } from './payment-mode.strategy';

@Injectable()
export class WalletStrategy implements PaymentModeStrategy {
  readonly mode = PaymentMode.WALLET;

  resolve({ walletProvider }: ModeInput): ResolvedMode {
    const provider = walletProvider?.toUpperCase();
    if (!provider || !SUPPORTED_WALLETS.includes(provider)) {
      throw new BadRequestException(
        `walletProvider must be one of: ${SUPPORTED_WALLETS.join(', ')}`,
      );
    }
    return {
      method: 'wallet',
      details: { walletProvider: provider },
      prefill: { wallet: provider.toLowerCase() },
    };
  }
}