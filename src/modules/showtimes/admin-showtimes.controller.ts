import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { Paginated } from '../../common/utils/pagination.util';
import { BulkCreateShowtimesDto, CreateShowtimeDto } from './dto/create-showtime.dto';
import { QueryShowtimesDto } from './dto/query-showtimes.dto';
import { RescheduleShowtimeDto, ShowtimeReasonDto, UpdateShowtimePricingDto } from './dto/showtime-operations.dto';
import { BulkCreateResultDto, ShowtimeResponseDto } from './dto/showtime-response.dto';
import { ShowtimeOperationsService } from './showtime-operations.service';
import { ShowtimeQueryService } from './showtime-query.service';
import { ShowtimesService } from './showtimes.service';

@ApiTags('Admin / Showtimes')
@Roles(Role.SUPER_ADMIN, Role.CINEMA_ADMIN)
@Controller('admin/showtimes')
export class AdminShowtimesController {
  constructor(
    private readonly showtimesService: ShowtimesService,
    private readonly operations: ShowtimeOperationsService,
    private readonly queries: ShowtimeQueryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a showtime; generates its seat inventory' })
  @ApiOkResponse({ type: ShowtimeResponseDto })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateShowtimeDto): Promise<ShowtimeResponseDto> {
    return this.showtimesService.create(user, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk-create showtimes over a date range (all-or-nothing)' })
  @ApiOkResponse({ type: BulkCreateResultDto })
  createBulk(@CurrentUser() user: JwtUser, @Body() dto: BulkCreateShowtimesDto): Promise<BulkCreateResultDto> {
    return this.showtimesService.createBulk(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List showtimes in the caller\'s cinemas' })
  list(@CurrentUser() user: JwtUser, @Query() query: QueryShowtimesDto): Promise<Paginated<ShowtimeResponseDto>> {
    return this.queries.findAllAdmin(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a showtime with seat counts' })
  get(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<ShowtimeResponseDto> {
    return this.queries.findOneAdmin(user, id);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Move a showtime (only when no seats are held or booked)' })
  reschedule(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RescheduleShowtimeDto): Promise<ShowtimeResponseDto> {
    return this.operations.reschedule(user, id, dto);
  }

  @Patch(':id/pricing')
  @ApiOperation({ summary: 'Update pricing; re-prices AVAILABLE seats only' })
  updatePricing(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateShowtimePricingDto): Promise<ShowtimeResponseDto> {
    return this.operations.updatePricing(user, id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a showtime' })
  cancel(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ShowtimeReasonDto): Promise<ShowtimeResponseDto> {
    return this.operations.cancel(user, id, dto.reason);
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Block a session (e.g. maintenance); keeps the slot reserved' })
  block(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ShowtimeReasonDto): Promise<ShowtimeResponseDto> {
    return this.operations.block(user, id, dto.reason);
  }

  @Post(':id/unblock')
  @ApiOperation({ summary: 'Re-open a blocked session' })
  unblock(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<ShowtimeResponseDto> {
    return this.operations.unblock(user, id);
  }
}
