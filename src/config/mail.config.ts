import { registerAs } from '@nestjs/config';

export const mailConfig = registerAs('mail', () => ({
  host: process.env.SMTP_HOST as string,
  port: Number(process.env.SMTP_PORT ?? 587),
  user: process.env.SMTP_USER || undefined,
  pass: process.env.SMTP_PASS || undefined,
  from: process.env.MAIL_FROM as string,
}));
