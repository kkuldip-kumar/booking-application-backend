import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus, RefundStatus } from '../../../common/enums/booking.enums';

export class BookingSeatResponseDto {
  @ApiProperty() showtimeSeatId!: string;
  @ApiProperty() label!: string;
  @ApiProperty() price!: number;
}

export class BookingResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() reference!: string;
  @ApiProperty() showtimeId!: string;
  @ApiProperty({ enum: BookingStatus }) status!: BookingStatus;
  @ApiProperty({ enum: RefundStatus }) refundStatus!: RefundStatus;
  @ApiProperty() totalAmount!: number;
  @ApiProperty() expiresAt!: Date;
  @ApiProperty({ type: [BookingSeatResponseDto] }) seats!: BookingSeatResponseDto[];
}

export class PaymentOrderResponseDto {
  @ApiProperty() orderId!: string;
  @ApiProperty() providerOrderId!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() currency!: string;
}

export class CreateBookingResponseDto {
  @ApiProperty({ type: BookingResponseDto }) booking!: BookingResponseDto;
  @ApiProperty({ type: PaymentOrderResponseDto }) payment!: PaymentOrderResponseDto;
}

export class HoldResponseDto {
  @ApiProperty() heldUntil!: Date;
  @ApiProperty({ type: [String] }) showtimeSeatIds!: string[];
}
