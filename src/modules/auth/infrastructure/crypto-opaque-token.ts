import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { OPAQUE_TOKEN_BYTES } from '../../../common/constants/auth.constants';
import { GeneratedToken, OpaqueTokenGenerator } from '../ports/opaque-token';

@Injectable()
export class CryptoOpaqueTokenGenerator extends OpaqueTokenGenerator {
  generate(): GeneratedToken {
    const raw = randomBytes(OPAQUE_TOKEN_BYTES).toString('base64url');
    return { raw, hash: this.hash(raw) };
  }

  hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
