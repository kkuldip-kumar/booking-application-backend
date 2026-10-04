import { OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CinemaStatus } from '../../../common/enums/cinema.enums';
import { CreateCinemaDto } from './create-cinema.dto';

export class UpdateCinemaDto extends PartialType(OmitType(CreateCinemaDto, ['code'] as const)) {}

export class UpdateCinemaStatusDto {
  @IsEnum(CinemaStatus) status!: CinemaStatus;
}
