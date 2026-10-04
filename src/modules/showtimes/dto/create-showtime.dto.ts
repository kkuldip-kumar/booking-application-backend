import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsDate, IsEnum, IsInt, IsOptional, IsUUID, Matches, Max, Min, ValidateNested,
} from 'class-validator';
import { DATE_REGEX, MAX_BUFFER_MINUTES, MAX_PRICE_PAISE, TIME_REGEX } from '../../../common/constants/cinema.constants';
import { ShowFormat } from '../../../common/enums/cinema.enums';

export class SeatTypePriceDto {
  @Matches(/^[A-Z_]{2,30}$/) seatTypeCode!: string;
  @IsInt() @Min(0) @Max(MAX_PRICE_PAISE) price!: number;
}

export abstract class ShowtimeBaseDto {
  @IsUUID('4') movieId!: string;
  @IsUUID('4') screenId!: string;
  @IsEnum(ShowFormat) format!: ShowFormat;
  @Matches(/^[a-z]{2,3}$/) languageCode!: string;
  @IsOptional() @Matches(/^[a-z]{2,3}$/) subtitleLanguageCode?: string;

  // Paise. Per-seat price = base x seat-type multiplier unless overridden in seatTypePrices.
  @IsInt() @Min(0) @Max(MAX_PRICE_PAISE) basePrice!: number;

  // Minutes added after the movie runtime (cleaning/ads) when computing endAt.
  @IsOptional() @IsInt() @Min(0) @Max(MAX_BUFFER_MINUTES) bufferMinutes?: number;
  @IsOptional() @Type(() => Date) @IsDate() bookingOpensAt?: Date;
  @IsOptional() @IsInt() @Min(0) @Max(MAX_BUFFER_MINUTES * 3) bookingCutoffMinutes?: number;

  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => SeatTypePriceDto)
  seatTypePrices?: SeatTypePriceDto[];
}

export class CreateShowtimeDto extends ShowtimeBaseDto {
  @Type(() => Date) @IsDate() startAt!: Date;
}

export class BulkCreateShowtimesDto extends ShowtimeBaseDto {
  // Calendar dates and times are interpreted in the cinema's timezone.
  @Matches(DATE_REGEX) fromDate!: string;
  @Matches(DATE_REGEX) toDate!: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(12) @ArrayUnique() @Matches(TIME_REGEX, { each: true })
  times!: string[];

  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(7) @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true })
  daysOfWeek?: number[];
}

