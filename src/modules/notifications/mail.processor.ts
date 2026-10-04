import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Job } from 'bullmq';
import { createTransport, Transporter } from 'nodemailer';
import { authConfig } from '../../config/auth.config';
import { mailConfig } from '../../config/mail.config';
import { MAIL_QUEUE, MailJob } from './mail.constants';

interface Rendered {
  readonly subject: string;
  readonly text: string;
}

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly transport: Transporter;

  constructor(
    @Inject(mailConfig.KEY) private readonly mail: ConfigType<typeof mailConfig>,
    @Inject(authConfig.KEY) private readonly auth: ConfigType<typeof authConfig>,
  ) {
    super();
    this.transport = createTransport({
      host: mail.host, port: mail.port, auth: mail.user ? { user: mail.user, pass: mail.pass } : undefined,
    });
  }

  async process(job: Job<MailJob>): Promise<void> {
    const { subject, text } = this.render(job.data);
    await this.transport.sendMail({ from: this.mail.from, to: job.data.to, subject, text });
  }

  private render(job: MailJob): Rendered {
    const link = (path: string): string => `${this.auth.appBaseUrl}/${path}?token=${encodeURIComponent(job.token ?? '')}`;
    switch (job.template) {
      case 'EMAIL_VERIFICATION':
        return { subject: 'Verify your CinemaHub email', text: `Hi ${job.name},\n\nVerify your email (valid 24 hours):\n${link('verify-email')}\n` };
      case 'PASSWORD_RESET':
        return { subject: 'Reset your CinemaHub password', text: `Hi ${job.name},\n\nReset your password (valid 30 minutes):\n${link('reset-password')}\n\nIgnore this email if you did not ask for it.\n` };
      case 'PASSWORD_CHANGED':
        return { subject: 'Your CinemaHub password was changed', text: `Hi ${job.name},\n\nYour password was just changed and all sessions were signed out. If this wasn't you, reset it immediately.\n` };
    }
  }
}
