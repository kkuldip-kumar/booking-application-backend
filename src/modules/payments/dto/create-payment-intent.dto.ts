// src/modules/payments/dto/create-payment-intent.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { PaymentMode } from '../../../common/enums/payment-mode.enum';

export class CreatePaymentIntentDto {
  @ApiProperty()
  @IsUUID('4')
  bookingId!: string;

  @ApiProperty({ enum: PaymentMode })
  @IsEnum(PaymentMode)
  mode!: PaymentMode;

  @ApiPropertyOptional({ description: 'UPI mode: optional VPA, e.g. name@bank' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  vpa?: string;

  @ApiPropertyOptional({ description: 'NET_BANKING: 4-letter bank code, e.g. HDFC' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{4}$/)
  bankCode?: string;

  @ApiPropertyOptional({ description: 'WALLET: e.g. PAYTM' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  walletProvider?: string;

  @ApiPropertyOptional({ description: 'EMI: tenure in months' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  emiTenureMonths?: number;
}