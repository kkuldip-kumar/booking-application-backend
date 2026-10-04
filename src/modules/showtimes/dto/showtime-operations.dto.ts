import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDate, IsInt, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { MAX_PRICE_PAISE } from '../../../common/constants/cinema.constants';
import { SeatTypePriceDto } from './create-showtime.dto';

export class RescheduleShowtimeDto {
  @Type(() => Date) @IsDate() startAt!: Date;
}

export class ShowtimeReasonDto {
  @IsString() @Length(3, 255) reason!: string;
}

export class UpdateShowtimePricingDto {
  @IsOptional() @IsInt() @Min(0) @Max(MAX_PRICE_PAISE) basePrice?: number;

  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => SeatTypePriceDto)
  seatTypePrices?: SeatTypePriceDto[];
}
