import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { DeviceAuthGuard } from '../guards/device-auth.guard';

/** Skips the user JWT guard; the route is reachable only with a valid scanner-device key. */
export const DeviceOnly = (): ClassDecorator & MethodDecorator =>
  applyDecorators(Public(), UseGuards(DeviceAuthGuard), ApiSecurity('device-key'));
