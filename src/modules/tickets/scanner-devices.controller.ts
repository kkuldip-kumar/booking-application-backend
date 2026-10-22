import { Body, Controller, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { CreateScannerDeviceDto } from './dto/create-scanner-device.dto';
import { CreatedScannerDeviceDto, ScannerDeviceDto } from './dto/scanner-device.dto';
import { ScannerDevicesService } from './scanner-devices.service';
import { DEVICE_ADMIN_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from './tickets.constants';

@ApiTags('Scanner Devices Admin')
@ApiBearerAuth()
@Controller('admin/scanner-devices')
@Roles(Role.SUPER_ADMIN, Role.CINEMA_ADMIN)
@Throttle({ default: { limit: DEVICE_ADMIN_RATE_LIMIT, ttl: RATE_LIMIT_WINDOW_MS } })
export class ScannerDevicesController {
  constructor(private readonly devices: ScannerDevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a gate scanner; the key is returned once' })
  @ApiCreatedResponse({ type: CreatedScannerDeviceDto })
  create(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateScannerDeviceDto,
  ): Promise<CreatedScannerDeviceDto> {
    return this.devices.create(user, dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Revoke a scanner device' })
  @ApiOkResponse({ type: ScannerDeviceDto })
  deactivate(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ScannerDeviceDto> {
    return this.devices.deactivate(user, id);
  }
}
