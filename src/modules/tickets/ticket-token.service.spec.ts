import { ConfigService } from '@nestjs/config';
import { TicketTokenService } from './ticket-token.service';

const buildService = (secret: string): TicketTokenService =>
  new TicketTokenService({ getOrThrow: () => secret } as unknown as ConfigService);

describe('TicketTokenService', () => {
  const service = buildService('a'.repeat(32));

  it('round-trips a generated token id', () => {
    const tokenId = service.generateTokenId();
    expect(service.extractTokenId(service.buildToken(tokenId))).toBe(tokenId);
  });

  it('rejects a token with a tampered MAC', () => {
    const [version, id, mac] = service.buildToken(service.generateTokenId()).split('.');
    const flipped = `${mac[0] === 'A' ? 'B' : 'A'}${mac.slice(1)}`;
    expect(service.extractTokenId(`${version}.${id}.${flipped}`)).toBeNull();
  });

  it('rejects a token signed with another secret', () => {
    const foreign = buildService('b'.repeat(32));
    expect(service.extractTokenId(foreign.buildToken(foreign.generateTokenId()))).toBeNull();
  });

  it.each(['', 'garbage', 'v2.AAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAA', 'v1.short.short'])(
    'rejects malformed token %p',
    (token) => {
      expect(service.extractTokenId(token)).toBeNull();
    },
  );

  it('hashes deterministically and never returns the token itself', () => {
    const token = service.buildToken(service.generateTokenId());
    expect(service.hashToken(token)).toBe(service.hashToken(token));
    expect(service.hashToken(token)).not.toContain(token);
    expect(service.hashToken(token)).toHaveLength(64);
  });

  it('generates unique token ids', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => service.generateTokenId()));
    expect(ids.size).toBe(1000);
  });
});
