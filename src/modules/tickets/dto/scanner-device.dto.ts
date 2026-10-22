import { ApiProperty } from '@nestjs/swagger';

export class ScannerDeviceDto {
  @ApiProperty() id!: string;
  @ApiProperty() cinemaId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() isActive!: boolean;
}

export class CreatedScannerDeviceDto extends ScannerDeviceDto {
  @ApiProperty({ description: 'Shown once. Send as x-device-key header.' })
  deviceKey!: string;
}
