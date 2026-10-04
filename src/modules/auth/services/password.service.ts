import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { VerificationTokenType } from '../../../common/enums/verification-token-type.enum';
import { UsersService } from '../../users/users.service';
import { AuthMailer } from '../ports/auth-mailer';
import { PasswordHasher } from '../ports/password-hasher';
import { RefreshTokenService } from './refresh-token.service';
import { VerificationTokenService } from './verification-token.service';

@Injectable()
export class PasswordService {
  constructor(
    private readonly users: UsersService,
    private readonly hasher: PasswordHasher,
    private readonly verification: VerificationTokenService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly mailer: AuthMailer,
  ) {}

  /** Silent for unknown or inactive accounts. */
  async requestReset(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || user.status === UserStatus.SUSPENDED) return;
    const token = await this.verification.issue(user.id, VerificationTokenType.PASSWORD_RESET);
    await this.mailer.sendPasswordReset({ email: user.email, name: user.name }, token);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const userId = await this.verification.consume(rawToken, VerificationTokenType.PASSWORD_RESET);
    await this.applyNewPassword(userId, newPassword);
    // A reset proves mailbox ownership, so it also verifies a still-pending account.
    await this.users.markEmailVerified(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.users.getByIdOrFail(userId);
    if (!(await this.hasher.verify(user.passwordHash, currentPassword))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.applyNewPassword(userId, newPassword);
  }

  private async applyNewPassword(userId: string, newPassword: string): Promise<void> {
    await this.users.updatePasswordHash(userId, await this.hasher.hash(newPassword));
    await this.refreshTokens.revokeAllForUser(userId);
    const user = await this.users.getByIdOrFail(userId);
    await this.mailer.sendPasswordChanged({ email: user.email, name: user.name });
  }
}
