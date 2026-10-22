import { ScanResult, TicketStatus } from '../../../common/enums/ticket.enums';
import { ScanResponseDto } from '../dto/scan-response.dto';
import { TicketResponseDto } from '../dto/ticket-response.dto';
import { Ticket } from '../entities/ticket.entity';
import { ShowtimeSummary } from '../ports/showtime-summary.port';
import { TICKET_ENTRY_GUIDANCE } from '../tickets.constants';

export function toTicketResponse(
  ticket: Ticket,
  summary: ShowtimeSummary,
  qrPayload: string,
): TicketResponseDto {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    qrPayload: ticket.status === TicketStatus.ISSUED ? qrPayload : null,
    bookingReference: ticket.bookingReference,
    movieTitle: summary.movieTitle,
    cinemaName: summary.cinemaName,
    screenName: summary.screenName,
    seatLabel: ticket.seatLabel,
    startsAt: summary.startsAt.toISOString(),
    endsAt: summary.endsAt.toISOString(),
    entryGuidance: [...TICKET_ENTRY_GUIDANCE],
  };
}

export function toScanResponse(
  scanId: string,
  result: ScanResult,
  ticket: Ticket | null,
): ScanResponseDto {
  return {
    scanId,
    result,
    ticket: ticket
      ? {
          ticketNumber: ticket.ticketNumber,
          seatLabel: ticket.seatLabel,
          bookingReference: ticket.bookingReference,
          checkedInAt: ticket.checkedInAt?.toISOString() ?? null,
        }
      : null,
  };
}
