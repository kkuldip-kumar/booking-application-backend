import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '../../../common/enums/ticket.enums';

export class TicketResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() ticketNumber!: string;
  @ApiProperty({ enum: TicketStatus }) status!: TicketStatus;
  @ApiProperty({ type: String, nullable: true, description: 'Opaque QR payload; null once unusable' })
  qrPayload!: string | null;
  @ApiProperty() bookingReference!: string;
  @ApiProperty() movieTitle!: string;
  @ApiProperty() cinemaName!: string;
  @ApiProperty() screenName!: string;
  @ApiProperty() seatLabel!: string;
  @ApiProperty() startsAt!: string;
  @ApiProperty() endsAt!: string;
  @ApiProperty({ type: [String] }) entryGuidance!: string[];
}
