// src/modules/payments/payment-webhook.controller.ts
import {
  BadRequestException, Controller, Headers, HttpCode, Post, Req, RawBodyRequest,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { IncomingHttpHeaders } from 'http';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentWebhookService } from './payment-webhook.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentWebhookController {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  @Public() // authenticated by gateway HMAC signature instead of JWT
  @Post('webhook')
  @HttpCode(200)
  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  @ApiOperation({ summary: 'Gateway webhook (signature-verified, idempotent)' })
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: IncomingHttpHeaders,
  ): Promise<void> {
    if (!req.rawBody) throw new BadRequestException('Missing body');
    await this.webhookService.handle(req.rawBody, headers);
  }
}