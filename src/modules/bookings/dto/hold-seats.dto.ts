import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { BOOKING_LIMITS } from '../../../common/constants/booking.constants';

export class HoldSeatsDto {
  @ApiProperty({ type: [String], maxItems: BOOKING_LIMITS.MAX_SEATS_PER_HOLD })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BOOKING_LIMITS.MAX_SEATS_PER_HOLD)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  showtimeSeatIds!: string[];
}
