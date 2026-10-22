// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BookingPaymentBridgeRegistry,
  PAYMENT_PORT,
  PaymentResultRegistry,
} from '../../common/contracts/payment.contract';
import { AuditModule } from '../audit/audit.module';
import { Payment } from './entities/payment.entity';
import { RazorpayGateway } from './gateways/razorpay.gateway';
import { CreditCardStrategy, DebitCardStrategy } from './modes/card.strategy';
import { NetBankingStrategy } from './modes/net-banking.strategy';
import { PaymentModeRegistry } from './modes/payment-mode.registry';
import { PaymentModeStrategy } from './modes/payment-mode.strategy';
import { UpiStrategy } from './modes/upi.strategy';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentWebhookService } from './payment-webhook.service';
import { PaymentsController } from './payments.controller';
import { PAYMENT_GATEWAY, PAYMENT_MODE_STRATEGIES } from './payments.constants';
import { PaymentsService } from './payments.service';
import { WalletStrategy } from './wallet.strategy';

// Register new payment modes here (plus one strategy class); nothing else changes.
const STRATEGY_CLASSES = [
  UpiStrategy, CreditCardStrategy, DebitCardStrategy,
  NetBankingStrategy, WalletStrategy,
];

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), AuditModule],
  controllers: [PaymentsController, PaymentWebhookController],
  providers: [
    PaymentsService,
    PaymentWebhookService,
    PaymentResultRegistry,
    BookingPaymentBridgeRegistry,
    PaymentModeRegistry,
    ...STRATEGY_CLASSES,
    {
      provide: PAYMENT_MODE_STRATEGIES,
      useFactory: (...strategies: PaymentModeStrategy[]): PaymentModeStrategy[] => strategies,
      inject: STRATEGY_CLASSES,
    },
    { provide: PAYMENT_GATEWAY, useClass: RazorpayGateway },
    { provide: PAYMENT_PORT, useExisting: PaymentsService },
  ],
  exports: [PaymentResultRegistry, BookingPaymentBridgeRegistry, PAYMENT_PORT],
})
export class PaymentsModule {}