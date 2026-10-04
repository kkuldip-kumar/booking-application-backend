export const MAIL_QUEUE = 'mail';

export type MailTemplate = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PASSWORD_CHANGED';

export interface MailJob {
  readonly template: MailTemplate;
  readonly to: string;
  readonly name: string;
  readonly token?: string;
}
