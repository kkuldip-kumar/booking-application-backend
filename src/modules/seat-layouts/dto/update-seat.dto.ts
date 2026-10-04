import { IsBoolean, IsEnum, IsOptional, Matches } from 'class-validator';
import { SeatStatus } from '../../../common/enums/cinema.enums';

export class UpdateSeatDto {
  @IsOptional() @Matches(/^[A-Z_]{2,30}$/) seatTypeCode?: string;
  @IsOptional() @IsBoolean() isAccessible?: boolean;
  @IsOptional() @IsBoolean() isCompanion?: boolean;
  @IsOptional() @IsEnum(SeatStatus) status?: SeatStatus;
}
