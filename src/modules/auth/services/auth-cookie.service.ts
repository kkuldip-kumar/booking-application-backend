import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { ACCESS_COOKIE, REFRESH_COOKIE, REFRESH_COOKIE_PATH } from '../../../common/constants/auth.constants';
import { authConfig } from '../../../config/auth.config';
import { AuthSession } from './session.service';

@Injectable()
export class AuthCookieService {
  constructor(@Inject(authConfig.KEY) private readonly cfg: ConfigType<typeof authConfig>) {}

  set(res: Response, session: AuthSession): void {
    res.cookie(ACCESS_COOKIE, session.accessToken, { ...this.base('/'), expires: session.accessExpiresAt });
    res.cookie(REFRESH_COOKIE, session.refresh.raw, { ...this.base(REFRESH_COOKIE_PATH), expires: session.refresh.expiresAt });
  }

  clear(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, this.base('/'));
    res.clearCookie(REFRESH_COOKIE, this.base(REFRESH_COOKIE_PATH));
  }

  /** Refresh cookie is path-scoped so it is never sent to ordinary API routes. */
  private base(path: string): CookieOptions {
    return { httpOnly: true, secure: this.cfg.cookieSecure, sameSite: 'strict', domain: this.cfg.cookieDomain, path };
  }
}
