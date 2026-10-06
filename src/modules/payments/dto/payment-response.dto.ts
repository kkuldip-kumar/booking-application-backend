// src/modules/payments/dto/payment-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMode } from '../../../common/enums/payment-mode.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';
import { Payment } from '../entities/payment.entity';

export class CheckoutConfigDto {
  @ApiProperty() method!: string;
  @ApiProperty() prefill!: Record<string, string>;
}

export class PaymentIntentResponseDto {
  @ApiProperty() paymentId!: string;
  @ApiProperty() gatewayOrderId!: string;
  @ApiProperty() keyId!: string;
  @ApiProperty({ description: 'paise' }) amount!: number;
  @ApiProperty() currency!: string;
  @ApiProperty({ enum: PaymentMode }) mode!: PaymentMode;
  @ApiProperty({ type: CheckoutConfigDto }) checkout!: CheckoutConfigDto;

  static from(
    payment: Payment,
    keyId: string,
    prefill: Record<string, string>,
  ): PaymentIntentResponseDto {
    const dto = new PaymentIntentResponseDto();
    dto.paymentId = payment.id;
    dto.gatewayOrderId = payment.gatewayOrderId;
    dto.keyId = keyId;
    dto.amount = payment.amount;
    dto.currency = payment.currency;
    dto.mode = payment.mode;
    dto.checkout = { method: String(payment.modeDetails.method), prefill };
    return dto;
  }
}

export class PaymentStatusResponseDto {
  @ApiProperty() paymentId!: string;
  @ApiProperty() bookingId!: string;
  @ApiProperty({ enum: PaymentMode }) mode!: PaymentMode;
  @ApiProperty({ enum: PaymentStatus }) status!: PaymentStatus;
  @ApiProperty() amount!: number;
  @ApiProperty() createdAt!: Date;

  static from(payment: Payment): PaymentStatusResponseDto {
    const dto = new PaymentStatusResponseDto();
    dto.paymentId = payment.id;
    dto.bookingId = payment.bookingId;
    dto.mode = payment.mode;
    dto.status = payment.status;
    dto.amount = payment.amount;
    dto.createdAt = payment.createdAt;
    return dto;
  }
}