import { PartialType } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsInt, IsString, Length, Max, Min } from 'class-validator';
import { ScreenStatus, ShowFormat } from '../../../common/enums/cinema.enums';
import { Screen } from '../entities/screen.entity';

export class CreateScreenDto {
  @IsString() @Length(1, 100) name!: string;
  @IsInt() @Min(1) @Max(99) screenNumber!: number;
  @IsArray() @ArrayUnique() @ArrayMaxSize(10) @IsEnum(ShowFormat, { each: true }) supportedFormats!: ShowFormat[];
}

export class UpdateScreenDto extends PartialType(CreateScreenDto) {}

export class UpdateScreenStatusDto {
  @IsEnum(ScreenStatus) status!: ScreenStatus;
}

export class ScreenResponseDto {
  id!: string;
  cinemaId!: string;
  name!: string;
  screenNumber!: number;
  capacity!: number;
  supportedFormats!: ShowFormat[];
  status!: ScreenStatus;

  static from(screen: Screen): ScreenResponseDto {
    return {
      id: screen.id, cinemaId: screen.cinemaId, name: screen.name, screenNumber: screen.screenNumber,
      capacity: screen.capacity, supportedFormats: screen.supportedFormats, status: screen.status,
    };
  }
}
