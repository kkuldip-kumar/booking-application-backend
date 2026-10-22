import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import {
  TICKET_TOKEN_ID_BYTES,
  TICKET_TOKEN_MAC_BYTES,
  TICKET_TOKEN_PATTERN,
  TICKET_TOKEN_VERSION,
} from './tickets.constants';

/**
 * Token format: v1.<tokenId>.<mac>. The id is random and the MAC is
 * HMAC(secret, version.id), so forged tokens are rejected before any DB hit
 * and the owner can re-display the same QR without storing the plaintext.
 */
@Injectable()
export class TicketTokenService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    this.key = Buffer.from(config.getOrThrow<string>('TICKET_QR_SECRET'), 'utf8');
  }

  generateTokenId(): string {
    return randomBytes(TICKET_TOKEN_ID_BYTES).toString('base64url');
  }

  buildToken(tokenId: string): string {
    return `${TICKET_TOKEN_VERSION}.${tokenId}.${this.mac(tokenId).toString('base64url')}`;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  extractTokenId(token: string): string | null {
    const match = TICKET_TOKEN_PATTERN.exec(token);
    if (!match) {
      return null;
    }
    const [, tokenId, presentedMac] = match;
    const presented = Buffer.from(presentedMac, 'base64url');
    const expected = this.mac(tokenId);
    if (presented.length !== expected.length || !timingSafeEqual(presented, expected)) {
      return null;
    }
    return tokenId;
  }

  private mac(tokenId: string): Buffer {
    return createHmac('sha256', this.key)
      .update(`${TICKET_TOKEN_VERSION}.${tokenId}`)
      .digest()
      .subarray(0, TICKET_TOKEN_MAC_BYTES);
  }
}
