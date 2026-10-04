import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AccessTokenService } from '../../modules/auth/services/access-token.service';
import { ACCESS_COOKIE } from '../constants/auth.constants';
import { IS_PUBLIC_KEY } from '../decorators';
import { JwtUser } from '../interfaces/jwt-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly accessTokens: AccessTokenService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('Authentication required');
    req.user = await this.accessTokens.verify(token);
    return true;
  }

  private extractToken(req: Request): string | undefined {
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
    if (cookieToken) return cookieToken;
    const [scheme, bearer] = (req.headers.authorization ?? '').split(' ');
    return scheme === 'Bearer' ? bearer : undefined;
  }
}
