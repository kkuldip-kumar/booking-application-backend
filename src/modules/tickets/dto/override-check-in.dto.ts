import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { OVERRIDE_REASON_MAX_LENGTH, OVERRIDE_REASON_MIN_LENGTH } from '../tickets.constants';

export class OverrideCheckInDto {
  @ApiProperty({ description: 'Why the QR flow could not be used' })
  @IsString()
  @MinLength(OVERRIDE_REASON_MIN_LENGTH)
  @MaxLength(OVERRIDE_REASON_MAX_LENGTH)
  reason!: string;
}
