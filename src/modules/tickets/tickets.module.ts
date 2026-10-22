import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmShowtimeSummaryAdapter } from './adapters/typeorm-showtime-summary.adapter';
import { ScannerDevice } from './entities/scanner-device.entity';
import { TicketScanLog } from './entities/ticket-scan-log.entity';
import { Ticket } from './entities/ticket.entity';
import { DeviceAuthGuard } from './guards/device-auth.guard';
import { ShowtimeSummaryPort } from './ports/showtime-summary.port';
import { ScannerDevicesController } from './scanner-devices.controller';
import { ScannerDevicesService } from './scanner-devices.service';
import { ScannerController } from './scanner.controller';
import { TicketCheckInService } from './ticket-check-in.service';
import { TicketOverrideService } from './ticket-override.service';
import { TicketTokenService } from './ticket-token.service';
import { TicketsAdminController } from './tickets-admin.controller';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, TicketScanLog, ScannerDevice])],
  controllers: [
    TicketsController,
    TicketsAdminController,
    ScannerController,
    ScannerDevicesController,
  ],
  providers: [
    TicketsService,
    TicketCheckInService,
    TicketOverrideService,
    TicketTokenService,
    ScannerDevicesService,
    DeviceAuthGuard,
    { provide: ShowtimeSummaryPort, useClass: TypeOrmShowtimeSummaryAdapter },
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
