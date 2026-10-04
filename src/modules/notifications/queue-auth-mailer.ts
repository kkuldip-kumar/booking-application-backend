import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AuthMailer, MailRecipient } from '../auth/ports/auth-mailer';
import { MAIL_QUEUE, MailJob } from './mail.constants';

const JOB_OPTIONS = { attempts: 5, backoff: { type: 'exponential', delay: 5_000 }, removeOnComplete: true, removeOnFail: 500 };

@Injectable()
export class QueueAuthMailer extends AuthMailer {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly queue: Queue<MailJob>) {
    super();
  }

  async sendEmailVerification(to: MailRecipient, rawToken: string): Promise<void> {
    await this.enqueue({ template: 'EMAIL_VERIFICATION', to: to.email, name: to.name, token: rawToken });
  }

  async sendPasswordReset(to: MailRecipient, rawToken: string): Promise<void> {
    await this.enqueue({ template: 'PASSWORD_RESET', to: to.email, name: to.name, token: rawToken });
  }

  async sendPasswordChanged(to: MailRecipient): Promise<void> {
    await this.enqueue({ template: 'PASSWORD_CHANGED', to: to.email, name: to.name });
  }

  private async enqueue(job: MailJob): Promise<void> {
    await this.queue.add(job.template, job, JOB_OPTIONS);
  }
}
