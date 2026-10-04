import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { CreateSeatLayoutDto } from './dto/create-seat-layout.dto';
import { SeatLayoutResponseDto, SeatResponseDto, SeatTypeResponseDto } from './dto/seat-layout-response.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { SeatLayoutsService } from './seat-layouts.service';

@ApiTags('Admin / Seat Layouts')
@Roles(Role.SUPER_ADMIN, Role.CINEMA_ADMIN)
@Controller('admin')
export class SeatLayoutsController {
  constructor(private readonly layoutsService: SeatLayoutsService) {}

  @Get('seat-types')
  @ApiOperation({ summary: 'List seat types and price multipliers' })
  @ApiOkResponse({ type: SeatTypeResponseDto, isArray: true })
  seatTypes(): Promise<SeatTypeResponseDto[]> {
    return this.layoutsService.listSeatTypes();
  }

  @Post('screens/:screenId/seat-layouts')
  @ApiOperation({ summary: 'Create a DRAFT layout from row specs' })
  @ApiOkResponse({ type: SeatLayoutResponseDto })
  create(@CurrentUser() user: JwtUser, @Param('screenId', ParseUUIDPipe) screenId: string, @Body() dto: CreateSeatLayoutDto): Promise<SeatLayoutResponseDto> {
    return this.layoutsService.create(user, screenId, dto);
  }

  @Get('screens/:screenId/seat-layouts')
  @ApiOperation({ summary: 'List layout versions of a screen' })
  list(@CurrentUser() user: JwtUser, @Param('screenId', ParseUUIDPipe) screenId: string): Promise<SeatLayoutResponseDto[]> {
    return this.layoutsService.listByScreen(user, screenId);
  }

  @Get('seat-layouts/:id')
  @ApiOperation({ summary: 'Get a layout with all seats' })
  get(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<SeatLayoutResponseDto> {
    return this.layoutsService.getDetail(user, id);
  }

  @Post('seat-layouts/:id/clone')
  @ApiOperation({ summary: 'Clone any layout into a new DRAFT version' })
  clone(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<SeatLayoutResponseDto> {
    return this.layoutsService.clone(user, id);
  }

  @Post('seat-layouts/:id/activate')
  @ApiOperation({ summary: 'Activate a DRAFT layout (archives the current one, updates screen capacity)' })
  activate(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<SeatLayoutResponseDto> {
    return this.layoutsService.activate(user, id);
  }

  @Patch('seat-layouts/:id/seats/:seatId')
  @ApiOperation({ summary: 'Edit one seat of a DRAFT layout' })
  updateSeat(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('seatId', ParseUUIDPipe) seatId: string,
    @Body() dto: UpdateSeatDto,
  ): Promise<SeatResponseDto> {
    return this.layoutsService.updateSeat(user, id, seatId, dto);
  }

  @Delete('seat-layouts/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a DRAFT layout' })
  remove(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.layoutsService.removeDraft(user, id);
  }
}
