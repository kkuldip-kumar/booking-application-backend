import { OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ShowtimeStatus } from '../../../common/enums/cinema.enums';

export class QueryShowtimesDto extends PaginationQueryDto {
  @IsOptional() @IsUUID('4') movieId?: string;
  @IsOptional() @IsUUID('4') cinemaId?: string;
  @IsOptional() @IsUUID('4') screenId?: string;
  @IsOptional() @Type(() => Date) @IsDate() from?: Date;
  @IsOptional() @Type(() => Date) @IsDate() to?: Date;
  @IsOptional() @IsEnum(ShowtimeStatus) status?: ShowtimeStatus;
}

export class QueryPublicShowtimesDto extends OmitType(QueryShowtimesDto, ['status', 'screenId'] as const) {}
