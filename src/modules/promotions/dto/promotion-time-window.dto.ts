import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Matches, Max, Min } from 'class-validator';
import { TIME_REGEX } from '../../../common/constants/cinema.constants';

export class PromotionTimeWindowDto {
  @ApiProperty({ minimum: 0, maximum: 6, description: '0 = Sunday, 6 = Saturday' })
  @IsInt() @Min(0) @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: '10:00' })
  @Matches(TIME_REGEX)
  startTime!: string;

  @ApiProperty({ example: '22:00' })
  @Matches(TIME_REGEX)
  endTime!: string;
}
