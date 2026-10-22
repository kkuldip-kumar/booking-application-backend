import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { OverrideCheckInDto } from './dto/override-check-in.dto';
import { ScanResponseDto } from './dto/scan-response.dto';
import { TicketOverrideService } from './ticket-override.service';
import { OVERRIDE_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from './tickets.constants';

@ApiTags('Tickets Admin')
@ApiBearerAuth()
@Controller('admin/tickets')
@Throttle({ default: { limit: OVERRIDE_RATE_LIMIT, ttl: RATE_LIMIT_WINDOW_MS } })
export class TicketsAdminController {
  constructor(private readonly overrides: TicketOverrideService) {}

  @Post(':ticketId/override-check-in')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.CINEMA_ADMIN)
  @ApiOperation({ summary: 'Manual check-in with mandatory reason; audited' })
  @ApiOkResponse({ type: ScanResponseDto })
  override(
    @CurrentUser() user: JwtUser,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() dto: OverrideCheckInDto,
  ): Promise<ScanResponseDto> {
    return this.overrides.checkIn(user, ticketId, dto);
  }
}
