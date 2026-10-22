import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentDevice } from './decorators/current-device.decorator';
import { DeviceOnly } from './decorators/device-only.decorator';
import { ScanResponseDto } from './dto/scan-response.dto';
import { ScanTicketDto } from './dto/scan-ticket.dto';
import { DeviceContext } from './interfaces/device-context.interface';
import { TicketCheckInService } from './ticket-check-in.service';
import { RATE_LIMIT_WINDOW_MS, SCAN_RATE_LIMIT } from './tickets.constants';

@ApiTags('Scanner')
@Controller('scanner')
@DeviceOnly()
@Throttle({ default: { limit: SCAN_RATE_LIMIT, ttl: RATE_LIMIT_WINDOW_MS } })
export class ScannerController {
  constructor(private readonly checkIn: TicketCheckInService) {}

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a QR and check the ticket in (atomic, idempotent by scanId)' })
  @ApiOkResponse({ type: ScanResponseDto })
  scan(@CurrentDevice() device: DeviceContext, @Body() dto: ScanTicketDto): Promise<ScanResponseDto> {
    return this.checkIn.scan(device, dto);
  }
}
