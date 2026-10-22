import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Request } from 'express';

export const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const key = ctx.switchToHttp().getRequest<Request>().headers[IDEMPOTENCY_KEY_HEADER];
    if (typeof key !== 'string' || !isUUID(key, '4')) {
      throw new BadRequestException('Idempotency-Key header must be a UUID v4');
    }
    return key;
  },
);