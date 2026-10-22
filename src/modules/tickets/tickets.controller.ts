import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('bookings/:bookingId/tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'List tickets (one per seat) for own confirmed booking' })
  @ApiOkResponse({ type: [TicketResponseDto] })
  list(
    @CurrentUser() user: JwtUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<TicketResponseDto[]> {
    return this.ticketsService.listForBooking(user.id, bookingId);
  }
}
