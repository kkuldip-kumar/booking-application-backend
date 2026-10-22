import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { TICKET_TOKEN_MAX_LENGTH } from '../tickets.constants';

export class ScanTicketDto {
  @ApiProperty({ description: 'Opaque QR payload read from the ticket' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(TICKET_TOKEN_MAX_LENGTH)
  token!: string;

  @ApiProperty({ description: 'Showtime the gate is currently admitting' })
  @IsUUID('4')
  showtimeId!: string;

  @ApiProperty({ description: 'Client-generated UUID; makes retries idempotent' })
  @IsUUID('4')
  scanId!: string;
}
