import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PG_UNIQUE_VIOLATION } from '../../../common/constants/auth.constants';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { VerificationTokenType } from '../../../common/enums/verification-token-type.enum';
import { ClientContext } from '../../../common/interfaces/jwt-user.interface';
import { RbacService } from '../../rbac/rbac.service';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { AuthMailer } from '../ports/auth-mailer';
import { PasswordHasher } from '../ports/password-hasher';
import { RefreshTokenService } from './refresh-token.service';
import { AuthSession, SessionService } from './session.service';
import { VerificationTokenService } from './verification-token.service';

export const REGISTER_MESSAGE = 'If the address can be registered, a verification email has been sent';
const INVALID_CREDENTIALS = 'Invalid credentials';

@Injectable()
export class AuthService {
  private dummyHash?: string;

  constructor(
    private readonly users: UsersService,
    private readonly hasher: PasswordHasher,
    private readonly rbac: RbacService,
    private readonly sessions: SessionService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly verification: VerificationTokenService,
    private readonly mailer: AuthMailer,
  ) {}

  /** Same response whether or not the email exists, so registration cannot enumerate accounts. */
  async register(dto: RegisterDto): Promise<string> {
    if (await this.users.findByEmail(dto.email)) return REGISTER_MESSAGE;
    const user = await this.createUser(dto);
    if (!user) return REGISTER_MESSAGE;
    await this.rbac.assignDefaultRole(user.id);
    const token = await this.verification.issue(user.id, VerificationTokenType.EMAIL_VERIFICATION);
    await this.mailer.sendEmailVerification({ email: user.email, name: user.name }, token);
    return REGISTER_MESSAGE;
  }

  async login(dto: LoginDto, ctx: ClientContext): Promise<AuthSession> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      await this.hasher.verify(await this.getDummyHash(), dto.password);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (this.users.isLocked(user)) throw new UnauthorizedException(INVALID_CREDENTIALS);
    if (!(await this.hasher.verify(user.passwordHash, dto.password))) {
      await this.users.registerFailedLogin(user.id);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    this.assertCanLogin(user);
    await this.users.clearLoginFailures(user.id);
    return this.sessions.start(user, ctx);
  }

  refresh(rawRefresh: string | undefined, ctx: ClientContext): Promise<AuthSession> {
    if (!rawRefresh) throw new UnauthorizedException('Missing refresh token');
    return this.sessions.rotate(rawRefresh, ctx);
  }

  async logout(rawRefresh: string | undefined): Promise<void> {
    if (rawRefresh) await this.refreshTokens.revoke(rawRefresh);
  }

  logoutAll(userId: string): Promise<void> {
    return this.refreshTokens.revokeAllForUser(userId);
  }

  private assertCanLogin(user: User): void {
    if (user.status === UserStatus.PENDING_VERIFICATION) throw new ForbiddenException('Email not verified');
    if (user.status === UserStatus.SUSPENDED) throw new UnauthorizedException(INVALID_CREDENTIALS);
  }

  private async createUser(dto: RegisterDto): Promise<User | null> {
    try {
      return await this.users.create({
        email: dto.email, name: dto.name, phone: dto.phone, passwordHash: await this.hasher.hash(dto.password),
      });
    } catch (error) {
      if ((error as { code?: string }).code === PG_UNIQUE_VIOLATION) return null;
      throw error;
    }
  }

  private async getDummyHash(): Promise<string> {
    this.dummyHash ??= await this.hasher.hash('timing-equalizer-not-a-real-password');
    return this.dummyHash;
  }
}
