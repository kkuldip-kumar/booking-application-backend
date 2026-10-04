import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager, IsNull } from 'typeorm';
import { ClientContext } from '../../../common/interfaces/jwt-user.interface';
import { authConfig } from '../../../config/auth.config';
import { RefreshToken } from '../entities/refresh-token.entity';
import { OpaqueTokenGenerator } from '../ports/opaque-token';

export interface IssuedRefreshToken {
  readonly raw: string;
  readonly userId: string;
  readonly expiresAt: Date;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly tokens: OpaqueTokenGenerator,
    @Inject(authConfig.KEY) private readonly cfg: ConfigType<typeof authConfig>,
  ) {}

  issue(userId: string, ctx: ClientContext): Promise<IssuedRefreshToken> {
    return this.dataSource.transaction((m) => this.create(m, userId, randomUUID(), ctx));
  }

  /** Single-use rotation. Presenting an already-rotated token revokes the whole family. */
  async rotate(raw: string, ctx: ClientContext): Promise<IssuedRefreshToken> {
    const outcome = await this.dataSource.transaction(async (m) => {
      const current = await m.findOne(RefreshToken, {
        where: { tokenHash: this.tokens.hash(raw) }, lock: { mode: 'pessimistic_write' },
      });
      if (!current) return null;
      if (current.revokedAt) {
        await this.revokeFamily(m, current.familyId);
        this.logger.warn(`Refresh token reuse detected for user ${current.userId}`);
        return null;
      }
      if (current.expiresAt.getTime() <= Date.now()) return null;
      await m.update(RefreshToken, { id: current.id }, { revokedAt: new Date() });
      return this.create(m, current.userId, current.familyId, ctx);
    });
    if (!outcome) throw new UnauthorizedException('Invalid refresh token');
    return outcome;
  }

  async revoke(raw: string): Promise<void> {
    await this.dataSource.manager.update(
      RefreshToken, { tokenHash: this.tokens.hash(raw), revokedAt: IsNull() }, { revokedAt: new Date() },
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.dataSource.manager
      .createQueryBuilder().update(RefreshToken).set({ revokedAt: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId }).execute();
  }

  private async create(m: EntityManager, userId: string, familyId: string, ctx: ClientContext): Promise<IssuedRefreshToken> {
    const { raw, hash } = this.tokens.generate();
    const expiresAt = new Date(Date.now() + this.cfg.refreshTtlDays * 86_400_000);
    await m.save(RefreshToken, m.create(RefreshToken, {
      userId, familyId, tokenHash: hash, expiresAt, revokedAt: null, ip: ctx.ip, userAgent: ctx.userAgent,
    }));
    return { raw, userId, expiresAt };
  }

  private async revokeFamily(m: EntityManager, familyId: string): Promise<void> {
    await m.createQueryBuilder().update(RefreshToken).set({ revokedAt: new Date() })
      .where('family_id = :familyId AND revoked_at IS NULL', { familyId }).execute();
  }
}
