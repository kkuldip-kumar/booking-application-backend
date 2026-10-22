import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { DeviceContext, DeviceRequest } from '../interfaces/device-context.interface';

export const CurrentDevice = createParamDecorator(
  (_data: unknown, context: ExecutionContext): DeviceContext => {
    const request = context.switchToHttp().getRequest<DeviceRequest>();
    if (!request.device) {
      throw new UnauthorizedException('Invalid device credentials');
    }
    return request.device;
  },
);
