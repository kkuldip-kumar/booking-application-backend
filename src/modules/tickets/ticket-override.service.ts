import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';
import { ScanMethod, ScanResult, TicketStatus } from '../../common/enums/ticket.enums';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { OverrideCheckInDto } from './dto/override-check-in.dto';
import { ScanResponseDto } from './dto/scan-response.dto';
import { TicketScanLog } from './entities/ticket-scan-log.entity';
import { Ticket } from './entities/ticket.entity';
import { canAccessCinema } from './utils/cinema-access.util';
import { toScanResponse } from './utils/ticket.mapper';

@Injectable()
export class TicketOverrideService {
  private readonly logger = new Logger(TicketOverrideService.name);

  constructor(private readonly dataSource: DataSource) {}

  /** Manual check-in when the QR flow is unusable. Idempotent for already checked-in tickets. */
  checkIn(actor: JwtUser, ticketId: string, dto: OverrideCheckInDto): Promise<ScanResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const ticket = await manager.findOne(Ticket, { where: { id: ticketId } });
      if (!ticket || !canAccessCinema(actor, ticket.cinemaId)) {
        throw new NotFoundException('Ticket not found');
      }
      if (ticket.status === TicketStatus.CHECKED_IN) {
        return toScanResponse(randomUUID(), ScanResult.ALREADY_USED, ticket);
      }
      if (ticket.status !== TicketStatus.ISSUED) {
        throw new ConflictException(`Ticket is ${ticket.status.toLowerCase()}`);
      }
      return this.applyOverride(manager, actor, ticket, dto.reason);
    });
  }

  private async applyOverride(
    manager: EntityManager,
    actor: JwtUser,
    ticket: Ticket,
    reason: string,
  ): Promise<ScanResponseDto> {
    const checkedInAt = new Date();
    const updated = await manager.update(
      Ticket,
      { id: ticket.id, status: TicketStatus.ISSUED },
      { status: TicketStatus.CHECKED_IN, checkedInAt, checkedInByUserId: actor.id },
    );
    if (updated.affected !== 1) {
      throw new ConflictException('Ticket state changed; retry');
    }
    const scanId = randomUUID();
    await manager.insert(TicketScanLog, {
      scanId,
      deviceId: null,
      actorUserId: actor.id,
      ticketId: ticket.id,
      cinemaId: ticket.cinemaId,
      showtimeId: ticket.showtimeId,
      method: ScanMethod.MANUAL_OVERRIDE,
      result: ScanResult.VALID,
      reason,
    });
    this.logger.warn(`manual check-in ticket=${ticket.id} actor=${actor.id}`);
    return toScanResponse(scanId, ScanResult.VALID, {
      ...ticket,
      status: TicketStatus.CHECKED_IN,
      checkedInAt,
    });
  }
}
