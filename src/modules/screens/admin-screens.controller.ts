import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { CreateMaintenanceDto, MaintenanceResponseDto } from './dto/maintenance.dto';
import { CreateScreenDto, ScreenResponseDto, UpdateScreenDto, UpdateScreenStatusDto } from './dto/screen.dto';
import { ScreensService } from './screens.service';

@ApiTags('Admin / Screens')
@Roles(Role.SUPER_ADMIN, Role.CINEMA_ADMIN)
@Controller('admin')
export class AdminScreensController {
  constructor(private readonly screensService: ScreensService) {}

  @Post('cinemas/:cinemaId/screens')
  @ApiOperation({ summary: 'Create a screen in a cinema' })
  @ApiOkResponse({ type: ScreenResponseDto })
  create(@CurrentUser() user: JwtUser, @Param('cinemaId', ParseUUIDPipe) cinemaId: string, @Body() dto: CreateScreenDto): Promise<ScreenResponseDto> {
    return this.screensService.create(user, cinemaId, dto);
  }

  @Get('cinemas/:cinemaId/screens')
  @ApiOperation({ summary: 'List all screens of a cinema' })
  list(@CurrentUser() user: JwtUser, @Param('cinemaId', ParseUUIDPipe) cinemaId: string): Promise<ScreenResponseDto[]> {
    return this.screensService.listByCinema(user, cinemaId);
  }

  @Get('screens/:id')
  @ApiOperation({ summary: 'Get a screen' })
  get(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<ScreenResponseDto> {
    return this.screensService.getOne(user, id);
  }

  @Patch('screens/:id')
  @ApiOperation({ summary: 'Update a screen' })
  update(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateScreenDto): Promise<ScreenResponseDto> {
    return this.screensService.update(user, id, dto);
  }

  @Patch('screens/:id/status')
  @ApiOperation({ summary: 'Set screen status' })
  setStatus(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateScreenStatusDto): Promise<ScreenResponseDto> {
    return this.screensService.setStatus(user, id, dto.status);
  }

  @Post('screens/:id/maintenance')
  @ApiOperation({ summary: 'Schedule a maintenance window' })
  addMaintenance(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateMaintenanceDto): Promise<MaintenanceResponseDto> {
    return this.screensService.addMaintenance(user, id, dto);
  }

  @Get('screens/:id/maintenance')
  @ApiOperation({ summary: 'List maintenance windows' })
  listMaintenance(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string): Promise<MaintenanceResponseDto[]> {
    return this.screensService.listMaintenance(user, id);
  }

  @Delete('screens/:id/maintenance/:maintenanceId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a maintenance window' })
  removeMaintenance(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string, @Param('maintenanceId', ParseUUIDPipe) maintenanceId: string): Promise<void> {
    return this.screensService.removeMaintenance(user, id, maintenanceId);
  }
}
