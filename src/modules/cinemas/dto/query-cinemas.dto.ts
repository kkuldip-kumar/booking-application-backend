import { OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CinemaStatus } from '../../../common/enums/cinema.enums';

export class QueryCinemasDto extends PaginationQueryDto {
  @IsOptional() @IsString() @Length(2, 100) city?: string;
  @IsOptional() @IsString() @Length(1, 100) q?: string;
  @IsOptional() @IsEnum(CinemaStatus) status?: CinemaStatus;
}

export class QueryPublicCinemasDto extends OmitType(QueryCinemasDto, ['status'] as const) {}
