import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { VERIFICATION_TTL_MINUTES } from '../../../common/constants/auth.constants';
import { VerificationTokenType } from '../../../common/enums/verification-token-type.enum';
import { VerificationToken } from '../entities/verification-token.entity';
import { OpaqueTokenGenerator } from '../ports/opaque-token';

@Injectable()
export class VerificationTokenService {
  constructor(private readonly dataSource: DataSource, private readonly tokens: OpaqueTokenGenerator) {}

  /** Issues a fresh token and invalidates any outstanding one of the same type for the user. */
  async issue(userId: string, type: VerificationTokenType): Promise<string> {
    const { raw, hash } = this.tokens.generate();
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MINUTES[type] * 60_000);
    await this.dataSource.transaction(async (m) => {
      await m.delete(VerificationToken, { userId, type });
      await m.save(VerificationToken, m.create(VerificationToken, { userId, type, tokenHash: hash, expiresAt, consumedAt: null }));
    });
    return raw;
  }

  /** Atomically marks the token consumed and returns its owner. */
  async consume(raw: string, type: VerificationTokenType): Promise<string> {
    const userId = await this.dataSource.transaction(async (m) => {
      const token = await m.findOne(VerificationToken, {
        where: { tokenHash: this.tokens.hash(raw), type }, lock: { mode: 'pessimistic_write' },
      });
      if (!token || token.consumedAt || token.expiresAt.getTime() <= Date.now()) return null;
      await m.update(VerificationToken, { id: token.id }, { consumedAt: new Date() });
      return token.userId;
    });
    if (!userId) throw new BadRequestException('Invalid or expired token');
    return userId;
  }
}
