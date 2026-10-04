import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, IsOptional, IsString, Length, Matches, Max, Min, ValidateNested } from 'class-validator';
import { MAX_LAYOUT_ROWS, MAX_SEATS_PER_ROW } from '../../../common/constants/cinema.constants';

export class LayoutRowDto {
  @Matches(/^[A-Z]{1,2}$/, { message: 'rowLabel must be 1-2 uppercase letters' }) rowLabel!: string;
  @IsInt() @Min(1) @Max(MAX_SEATS_PER_ROW) seatCount!: number;
  @Matches(/^[A-Z_]{2,30}$/) seatTypeCode!: string;

  // Empty grid columns before seat 1 (centres short rows).
  @IsOptional() @IsInt() @Min(0) @Max(20) gridOffset?: number;

  // Seat numbers after which a one-column aisle gap is drawn.
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(10) @IsInt({ each: true }) @Min(1, { each: true }) aisleAfter?: number[];

  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(MAX_SEATS_PER_ROW) @IsInt({ each: true }) @Min(1, { each: true }) accessibleSeats?: number[];
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(MAX_SEATS_PER_ROW) @IsInt({ each: true }) @Min(1, { each: true }) companionSeats?: number[];
}

export class CreateSeatLayoutDto {
  @IsString() @Length(2, 100) name!: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(MAX_LAYOUT_ROWS) @ValidateNested({ each: true }) @Type(() => LayoutRowDto)
  rows!: LayoutRowDto[];
}
