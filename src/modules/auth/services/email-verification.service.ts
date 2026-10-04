import { Injectable } from '@nestjs/common';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { VerificationTokenType } from '../../../common/enums/verification-token-type.enum';
import { UsersService } from '../../users/users.service';
import { AuthMailer } from '../ports/auth-mailer';
import { VerificationTokenService } from './verification-token.service';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly users: UsersService,
    private readonly verification: VerificationTokenService,
    private readonly mailer: AuthMailer,
  ) {}

  async verify(rawToken: string): Promise<void> {
    const userId = await this.verification.consume(rawToken, VerificationTokenType.EMAIL_VERIFICATION);
    await this.users.markEmailVerified(userId);
  }

  /** Silent for unknown or already-verified emails. */
  async resend(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || user.status !== UserStatus.PENDING_VERIFICATION) return;
    const token = await this.verification.issue(user.id, VerificationTokenType.EMAIL_VERIFICATION);
    await this.mailer.sendEmailVerification({ email: user.email, name: user.name }, token);
  }
}
