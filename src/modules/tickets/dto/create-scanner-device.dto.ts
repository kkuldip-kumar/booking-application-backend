import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { DEVICE_NAME_MAX_LENGTH, DEVICE_NAME_MIN_LENGTH } from '../tickets.constants';

export class CreateScannerDeviceDto {
  @ApiProperty()
  @IsUUID('4')
  cinemaId!: string;

  @ApiProperty({ example: 'Gate 2 - Screen 4' })
  @IsString()
  @MinLength(DEVICE_NAME_MIN_LENGTH)
  @MaxLength(DEVICE_NAME_MAX_LENGTH)
  name!: string;
}
