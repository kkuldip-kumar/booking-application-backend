import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { EXPIRY_QUEUE } from '../../../common/constants/booking.constants';
import { BookingExpiryService } from '../services/booking-expiry.service';
import { BookingRefundService } from '../services/booking-refund.service';

@Processor(EXPIRY_QUEUE)
export class BookingExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingExpiryProcessor.name);

  constructor(
    private readonly expiry: BookingExpiryService,
    private readonly refunds: BookingRefundService,
  ) {
    super();
  }

  async process(): Promise<void> {
    const expired = await this.expiry.expireStale();
    const retried = await this.refunds.retryPendingRefunds();
    if (expired.expiredBookings + expired.releasedHolds + retried > 0) {
      this.logger.log(
        `expired=${expired.expiredBookings} releasedHolds=${expired.releasedHolds} refundRetries=${retried}`,
      );
    }
  }
}
