import { Type } from 'class-transformer';
import { IsDate, IsString, Length } from 'class-validator';
import { ScreenMaintenance } from '../entities/screen-maintenance.entity';

export class CreateMaintenanceDto {
  @Type(() => Date) @IsDate() startAt!: Date;
  @Type(() => Date) @IsDate() endAt!: Date;
  @IsString() @Length(3, 255) reason!: string;
}

export class MaintenanceResponseDto {
  id!: string;
  screenId!: string;
  startAt!: Date;
  endAt!: Date;
  reason!: string;

  static from(row: ScreenMaintenance): MaintenanceResponseDto {
    return { id: row.id, screenId: row.screenId, startAt: row.startAt, endAt: row.endAt, reason: row.reason };
  }
}
