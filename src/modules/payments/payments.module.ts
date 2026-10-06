// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { BookingsModule } from '../bookings/bookings.module';
import { Payment } from './entities/payment.entity';
import { RazorpayGateway } from './gateways/razorpay.gateway';
import { CreditCardStrategy, DebitCardStrategy } from './modes/card.strategy';
import { EmiStrategy } from './modes/emi.strategy';
import { NetBankingStrategy } from './modes/net-banking.strategy';
import { PaymentModeRegistry } from './modes/payment-mode.registry';
import { PaymentModeStrategy } from './modes/payment-mode.strategy';
import { UpiStrategy } from './modes/upi.strategy';
import { WalletStrategy } from './modes/wallet.strategy';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentWebhookService } from './payment-webhook.service';
import { PaymentsController } from './payments.controller';
import { PAYMENT_GATEWAY, PAYMENT_MODE_STRATEGIES } from './payments.constants';
import { PaymentsService } from './payments.service';

// Register new payment modes here (plus one strategy class); nothing else changes.
const STRATEGY_CLASSES = [
  UpiStrategy, CreditCardStrategy, DebitCardStrategy,
  NetBankingStrategy, WalletStrategy, EmiStrategy,
];

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), BookingsModule, AuditLogsModule],
  controllers: [PaymentsController, PaymentWebhookController],
  providers: [
    PaymentsService,
    PaymentWebhookService,
    PaymentModeRegistry,
    ...STRATEGY_CLASSES,
    {
      provide: PAYMENT_MODE_STRATEGIES,
      useFactory: (...strategies: PaymentModeStrategy[]): PaymentModeStrategy[] => strategies,
      inject: STRATEGY_CLASSES,
    },
    { provide: PAYMENT_GATEWAY, useClass: RazorpayGateway },
  ],
})
export class PaymentsModule {}