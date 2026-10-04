export interface MailRecipient {
  readonly email: string;
  readonly name: string;
}

export abstract class AuthMailer {
  abstract sendEmailVerification(to: MailRecipient, rawToken: string): Promise<void>;
  abstract sendPasswordReset(to: MailRecipient, rawToken: string): Promise<void>;
  abstract sendPasswordChanged(to: MailRecipient): Promise<void>;
}
