// src/modules/payments/payments.controller.ts
import {
  Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post,
} from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentIntentResponseDto, PaymentStatusResponseDto } from './dto/payment-response.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Roles(Role.USER)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a gateway order for a PENDING booking' })
  @ApiHeader({ name: 'Idempotency-Key', description: 'UUID v4, unique per attempt' })
  @ApiOkResponse({ type: PaymentIntentResponseDto })
  createIntent(
    @CurrentUser() user: JwtUser,
    @Headers('idempotency-key', new ParseUUIDPipe({ version: '4' })) idempotencyKey: string,
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    return this.paymentsService.createIntent(user.id, dto, idempotencyKey);
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Payment attempts for own booking' })
  @ApiOkResponse({ type: PaymentStatusResponseDto, isArray: true })
  getByBooking(
    @CurrentUser() user: JwtUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<PaymentStatusResponseDto[]> {
    return this.paymentsService.getByBooking(user.id, bookingId);
  }
}