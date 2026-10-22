import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ScanMethod, ScanResult, TicketStatus } from '../../common/enums/ticket.enums';
import { ScanResponseDto } from './dto/scan-response.dto';
import { ScanTicketDto } from './dto/scan-ticket.dto';
import { ScannerDevice } from './entities/scanner-device.entity';
import { TicketScanLog } from './entities/ticket-scan-log.entity';
import { Ticket } from './entities/ticket.entity';
import { DeviceContext } from './interfaces/device-context.interface';
import { TicketTokenService } from './ticket-token.service';
import { NON_ISSUED_STATUS_RESULT, PG_UNIQUE_VIOLATION } from './tickets.constants';
import { hasPgErrorCode } from './utils/db-errors.util';
import { toScanResponse } from './utils/ticket.mapper';

interface ScanOutcome {
  readonly result: ScanResult;
  readonly ticket: Ticket | null;
}

const UNKNOWN_OUTCOME: ScanOutcome = { result: ScanResult.UNKNOWN, ticket: null };

@Injectable()
export class TicketCheckInService {
  private readonly logger = new Logger(TicketCheckInService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly tokens: TicketTokenService,
  ) {}

  async scan(device: DeviceContext, dto: ScanTicketDto): Promise<ScanResponseDto> {
    try {
      return await this.runScan(device, dto);
    } catch (error) {
      if (!hasPgErrorCode(error, PG_UNIQUE_VIOLATION)) {
        throw error;
      }
      // A concurrent request with the same scanId committed first; replay its stored result.
      return this.runScan(device, dto);
    }
  }

  private runScan(device: DeviceContext, dto: ScanTicketDto): Promise<ScanResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const prior = await manager.findOne(TicketScanLog, {
        where: { deviceId: device.id, scanId: dto.scanId },
      });
      if (prior) {
        return this.replay(manager, prior, dto);
      }
      const outcome = await this.evaluate(manager, device, dto);
      await this.recordScan(manager, device, dto, outcome);
      await manager.update(ScannerDevice, { id: device.id }, { lastSeenAt: new Date() });
      this.logger.log(`scan device=${device.id} result=${outcome.result}`);
      return toScanResponse(dto.scanId, outcome.result, outcome.ticket);
    });
  }

  private async replay(
    manager: EntityManager,
    prior: TicketScanLog,
    dto: ScanTicketDto,
  ): Promise<ScanResponseDto> {
    if (prior.presentedTokenHash !== this.tokens.hashToken(dto.token)) {
      throw new ConflictException('scanId was already used for a different token');
    }
    const ticket = prior.ticketId
      ? await manager.findOne(Ticket, { where: { id: prior.ticketId } })
      : null;
    return toScanResponse(prior.scanId, prior.result, ticket);
  }

  private async evaluate(
    manager: EntityManager,
    device: DeviceContext,
    dto: ScanTicketDto,
  ): Promise<ScanOutcome> {
    if (this.tokens.extractTokenId(dto.token) === null) {
      return UNKNOWN_OUTCOME;
    }
    const ticket = await manager.findOne(Ticket, {
      where: { qrTokenHash: this.tokens.hashToken(dto.token) },
    });
    // Other cinemas' tickets are reported as unknown so scanners cannot probe them.
    if (!ticket || ticket.cinemaId !== device.cinemaId) {
      return UNKNOWN_OUTCOME;
    }
    if (ticket.status !== TicketStatus.ISSUED) {
      return { result: NON_ISSUED_STATUS_RESULT[ticket.status], ticket };
    }
    if (ticket.showtimeId !== dto.showtimeId) {
      return { result: ScanResult.WRONG_SESSION, ticket };
    }
    return this.claim(manager, ticket, device.id);
  }

  /** The conditional UPDATE is the atomic point: exactly one caller can win. */
  private async claim(
    manager: EntityManager,
    ticket: Ticket,
    deviceId: string,
  ): Promise<ScanOutcome> {
    const checkedInAt = new Date();
    const updated = await manager.update(
      Ticket,
      { id: ticket.id, status: TicketStatus.ISSUED },
      { status: TicketStatus.CHECKED_IN, checkedInAt, checkedInDeviceId: deviceId },
    );
    if (updated.affected === 1) {
      const claimed = { ...ticket, status: TicketStatus.CHECKED_IN, checkedInAt };
      return { result: ScanResult.VALID, ticket: claimed };
    }
    const current = await manager.findOneOrFail(Ticket, { where: { id: ticket.id } });
    if (current.status === TicketStatus.ISSUED) {
      throw new ConflictException('Check-in could not be completed');
    }
    return { result: NON_ISSUED_STATUS_RESULT[current.status], ticket: current };
  }

  private recordScan(
    manager: EntityManager,
    device: DeviceContext,
    dto: ScanTicketDto,
    outcome: ScanOutcome,
  ): Promise<unknown> {
    return manager.insert(TicketScanLog, {
      scanId: dto.scanId,
      deviceId: device.id,
      ticketId: outcome.ticket?.id ?? null,
      cinemaId: device.cinemaId,
      showtimeId: dto.showtimeId,
      method: ScanMethod.DEVICE_SCAN,
      result: outcome.result,
      presentedTokenHash: this.tokens.hashToken(dto.token),
    });
  }
}
