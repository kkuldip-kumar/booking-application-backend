import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { DeviceRequest } from '../interfaces/device-context.interface';
import { ScannerDevicesService } from '../scanner-devices.service';
import { DEVICE_KEY_HEADER } from '../tickets.constants';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly devices: ScannerDevicesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DeviceRequest>();
    const header = request.headers[DEVICE_KEY_HEADER];
    const device = await this.devices.authenticate(typeof header === 'string' ? header : undefined);
    if (!device) {
      throw new UnauthorizedException('Invalid device credentials');
    }
    request.device = device;
    return true;
  }
}
