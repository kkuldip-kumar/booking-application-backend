import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MailProcessor } from './mail.processor';
import { MAIL_QUEUE } from './mail.constants';
import { QueueAuthMailer } from './queue-auth-mailer';

@Module({
  imports: [BullModule.registerQueue({ name: MAIL_QUEUE })],
  providers: [QueueAuthMailer, MailProcessor],
  exports: [QueueAuthMailer],
})
export class NotificationsModule {}
