import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientContext } from '../../../common/interfaces/jwt-user.interface';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { RbacService } from '../../rbac/rbac.service';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { AccessTokenService } from './access-token.service';
import { IssuedRefreshToken, RefreshTokenService } from './refresh-token.service';

export interface AuthSession {
  readonly user: User;
  readonly accessToken: string;
  readonly accessExpiresAt: Date;
  readonly refresh: IssuedRefreshToken;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

@Injectable()
export class SessionService {
  constructor(
    private readonly access: AccessTokenService,
    private readonly refresh: RefreshTokenService,
    private readonly rbac: RbacService,
    private readonly users: UsersService,
  ) {}

  async start(user: User, ctx: ClientContext): Promise<AuthSession> {
    return this.build(user, await this.refresh.issue(user.id, ctx));
  }

  async rotate(rawRefresh: string, ctx: ClientContext): Promise<AuthSession> {
    const refresh = await this.refresh.rotate(rawRefresh, ctx);
    const user = await this.users.findById(refresh.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.refresh.revokeAllForUser(refresh.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.build(user, refresh);
  }

  private async build(user: User, refresh: IssuedRefreshToken): Promise<AuthSession> {
    const { roles, permissions } = await this.rbac.getAuthorities(user.id);
    const accessToken = await this.access.sign({ id: user.id, email: user.email, roles, permissions });
    return {
      user, accessToken, refresh, roles, permissions,
      accessExpiresAt: new Date(Date.now() + this.access.ttlSeconds * 1000),
    };
  }
}
