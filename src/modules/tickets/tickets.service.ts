import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { EntityManager, In, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { TicketStatus } from '../../common/enums/ticket.enums';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { Ticket } from './entities/ticket.entity';
import { IssueTicketSeat, IssueTicketsInput } from './interfaces/issue-tickets-input.interface';
import { ShowtimeSummaryPort } from './ports/showtime-summary.port';
import { TicketTokenService } from './ticket-token.service';
import { TICKET_NUMBER_PREFIX, TICKET_NUMBER_RANDOM_BYTES } from './tickets.constants';
import { toTicketResponse } from './utils/ticket.mapper';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
    private readonly tokens: TicketTokenService,
    private readonly showtimes: ShowtimeSummaryPort,
  ) {}

  /** Call inside the payment-confirmation transaction. Replays are no-ops. */
  async issueForBooking(manager: EntityManager, input: IssueTicketsInput): Promise<Ticket[]> {
    if (input.seats.length === 0) {
      throw new BadRequestException('Cannot issue tickets without seats');
    }
    const repo = manager.getRepository(Ticket);
    const rows = input.seats.map((seat) => this.buildRow(input, seat));
    await repo.createQueryBuilder().insert().into(Ticket).values(rows).orIgnore().execute();
    const issued = await repo.find({
      where: { bookingId: input.bookingId },
      order: { seatLabel: 'ASC' },
    });
    if (issued.length !== input.seats.length) {
      throw new InternalServerErrorException('Ticket issuance incomplete');
    }
    return issued;
  }

  async listForBooking(userId: string, bookingId: string): Promise<TicketResponseDto[]> {
    const tickets = await this.tickets.find({
      where: { bookingId, userId },
      order: { seatLabel: 'ASC' },
    });
    if (tickets.length === 0) {
      throw new NotFoundException('Tickets not found');
    }
    const [summary] = await this.showtimes.findByIds([tickets[0].showtimeId]);
    if (!summary) {
      throw new NotFoundException('Tickets not found');
    }
    return tickets.map((ticket) =>
      toTicketResponse(ticket, summary, this.tokens.buildToken(ticket.qrTokenId)),
    );
  }

  markCancelled(manager: EntityManager, bookingId: string): Promise<void> {
    return this.transition(manager, bookingId, [TicketStatus.ISSUED], TicketStatus.CANCELLED);
  }

  markRefunded(manager: EntityManager, bookingId: string): Promise<void> {
    return this.transition(
      manager,
      bookingId,
      [TicketStatus.ISSUED, TicketStatus.CANCELLED],
      TicketStatus.REFUNDED,
    );
  }

  // CHECKED_IN tickets are intentionally never rewritten: entry already happened.
  private async transition(
    manager: EntityManager,
    bookingId: string,
    from: TicketStatus[],
    to: TicketStatus,
  ): Promise<void> {
    await manager.getRepository(Ticket).update({ bookingId, status: In(from) }, { status: to });
  }

  private buildRow(input: IssueTicketsInput, seat: IssueTicketSeat): QueryDeepPartialEntity<Ticket> {
    const tokenId = this.tokens.generateTokenId();
    return {
      ticketNumber: this.generateTicketNumber(),
      qrTokenId: tokenId,
      qrTokenHash: this.tokens.hashToken(this.tokens.buildToken(tokenId)),
      bookingId: input.bookingId,
      bookingSeatId: seat.bookingSeatId,
      userId: input.userId,
      cinemaId: input.cinemaId,
      showtimeId: input.showtimeId,
      bookingReference: input.bookingReference,
      seatLabel: seat.seatLabel,
      status: TicketStatus.ISSUED,
    };
  }

  private generateTicketNumber(): string {
    const random = randomBytes(TICKET_NUMBER_RANDOM_BYTES).toString('hex').toUpperCase();
    return `${TICKET_NUMBER_PREFIX}-${random}`;
  }
}
