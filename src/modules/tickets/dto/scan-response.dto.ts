import { ApiProperty } from '@nestjs/swagger';
import { ScanResult } from '../../../common/enums/ticket.enums';

export class ScanTicketViewDto {
  @ApiProperty() ticketNumber!: string;
  @ApiProperty() seatLabel!: string;
  @ApiProperty() bookingReference!: string;
  @ApiProperty({ type: String, nullable: true }) checkedInAt!: string | null;
}

export class ScanResponseDto {
  @ApiProperty() scanId!: string;
  @ApiProperty({ enum: ScanResult }) result!: ScanResult;
  @ApiProperty({ type: ScanTicketViewDto, nullable: true }) ticket!: ScanTicketViewDto | null;
}
