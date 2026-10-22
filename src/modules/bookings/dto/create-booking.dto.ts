import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { HoldSeatsDto } from './hold-seats.dto';
import { Booking } from '../entities/booking.entity';

export class CreateBookingDto extends HoldSeatsDto {
  @ApiProperty()
  @IsUUID('4')
  showtimeId!: string;
}


export type PayableBooking = Pick<Booking, 'id' | 'userId' | 'totalAmount' | 'expiresAt'> & { currency: string };