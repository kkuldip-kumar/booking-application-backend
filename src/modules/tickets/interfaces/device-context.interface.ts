import type { Request } from 'express';

export interface DeviceContext {
  readonly id: string;
  readonly cinemaId: string;
}

export interface DeviceRequest extends Request {
  device?: DeviceContext;
}
