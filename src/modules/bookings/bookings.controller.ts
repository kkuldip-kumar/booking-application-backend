import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { PaginatedResult } from './booking.types';
import { BookingResponseDto, CreateBookingResponseDto } from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';
import { BookingCancellationService } from './services/booking-cancellation.service';
import { BookingsService } from './services/bookings.service';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly cancellation: BookingCancellationService,
  ) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a PENDING booking from held seats and open a payment order' })
  @ApiResponse({ status: 201, type: CreateBookingResponseDto })
  create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateBookingDto,
  ): Promise<CreateBookingResponseDto> {
    return this.bookings.create(user.id, dto);
  }

  @Get()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'List own bookings' })
  @ApiResponse({ status: 200, type: [BookingResponseDto] })
  list(
    @CurrentUser() user: JwtUser,
    @Query() query: ListBookingsQueryDto,
  ): Promise<PaginatedResult<BookingResponseDto>> {
    return this.bookings.list(user.id, query.page, query.limit);
  }

  @Get(':id')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get own booking' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  @ApiResponse({ status: 404 })
  findOne(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookingResponseDto> {
    return this.bookings.findOne(user.id, id);
  }

  @Post(':id/cancel')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Cancel own booking before the cutoff; refund is issued if paid' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  @ApiResponse({ status: 409, description: 'Not cancellable / cutoff passed' })
  cancel(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BookingResponseDto> {
    return this.cancellation.cancelByUser(user.id, id);
  }
}
