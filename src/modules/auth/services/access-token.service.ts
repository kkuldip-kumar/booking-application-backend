import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { authConfig } from '../../../config/auth.config';
import { JwtUser } from '../../../common/interfaces/jwt-user.interface';

interface AccessPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  cinemaIds?: string[];
}

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY) private readonly cfg: ConfigType<typeof authConfig>,
  ) {}

  get ttlSeconds(): number {
    return this.cfg.jwtAccessTtlSeconds;
  }

  sign(user: JwtUser): Promise<string> {
    const payload: AccessPayload = {
      sub: user.id,
      email: user.email,
      roles: [...user.roles],
      permissions: [...user.permissions],
      cinemaIds: [...user.cinemaIds],
    };
    return this.jwt.signAsync(payload, {
      secret: this.cfg.jwtAccessSecret, algorithm: 'HS256', expiresIn: this.cfg.jwtAccessTtlSeconds,
    });
  }

  async verify(token: string): Promise<JwtUser> {
    try {
      const p = await this.jwt.verifyAsync<AccessPayload>(token, {
        secret: this.cfg.jwtAccessSecret, algorithms: ['HS256'],
      });
      return {
        id: p.sub,
        email: p.email,
        roles: p.roles,
        permissions: p.permissions,
        cinemaIds: p.cinemaIds ?? [],
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
