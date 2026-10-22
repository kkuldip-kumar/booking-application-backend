import { Body, Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { HoldSeatsDto } from './dto/hold-seats.dto';
import { HoldResponseDto } from './dto/booking-response.dto';
import { SeatHoldService } from './services/seat-hold.service';

@ApiTags('seat-holds')
@ApiBearerAuth()
@Controller('showtimes/:showtimeId/seats/hold')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class SeatHoldsController {
  constructor(private readonly holds: SeatHoldService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Hold seats for the configured TTL (all-or-nothing)' })
  @ApiResponse({ status: 200, type: HoldResponseDto })
  @ApiResponse({ status: 409, description: 'A seat is unavailable' })
  hold(
    @CurrentUser() user: JwtUser,
    @Param('showtimeId', ParseUUIDPipe) showtimeId: string,
    @Body() dto: HoldSeatsDto,
  ): Promise<HoldResponseDto> {
    return this.holds.holdSeats(user.id, showtimeId, dto.showtimeSeatIds);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Release own holds that are not part of a booking' })
  @ApiResponse({ status: 204 })
  release(
    @CurrentUser() user: JwtUser,
    @Param('showtimeId', ParseUUIDPipe) showtimeId: string,
  ): Promise<void> {
    return this.holds.releaseHold(user.id, showtimeId);
  }
}
