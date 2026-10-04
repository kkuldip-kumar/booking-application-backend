import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEmail, IsLatitude, IsLongitude, IsOptional, IsString, Length, Matches } from 'class-validator';
import { TIME_REGEX } from '../../../common/constants/cinema.constants';
import { IsIanaTimezone } from '../../../common/decorators/is-iana-timezone.decorator';

export class CreateCinemaDto {
  @IsString() @Matches(/^[A-Z0-9_-]{3,20}$/, { message: 'code must be 3-20 chars of A-Z, 0-9, _ or -' })
  code!: string;

  @IsString() @Length(2, 150) name!: string;
  @IsString() @Length(5, 255) addressLine!: string;
  @IsString() @Length(2, 100) city!: string;
  @IsString() @Length(2, 100) state!: string;
  @IsOptional() @Matches(/^[A-Z]{2}$/) country?: string;
  @IsString() @Matches(/^[0-9A-Za-z -]{3,12}$/) postalCode!: string;
  @IsOptional() @Type(() => Number) @IsLatitude() latitude?: number;
  @IsOptional() @Type(() => Number) @IsLongitude() longitude?: number;
  @IsOptional() @IsIanaTimezone() timezone?: string;
  @IsOptional() @Matches(/^\+?[0-9 -]{7,20}$/) phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @Matches(TIME_REGEX) openingTime!: string;
  @Matches(TIME_REGEX) closingTime!: string;

  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @Length(2, 50, { each: true })
  facilities?: string[];
}
