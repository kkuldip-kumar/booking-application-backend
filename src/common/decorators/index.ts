import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { ClientContext, JwtUser } from '../interfaces/jwt-user.interface';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
/** Any-of: user needs at least one listed role. */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);
/** All-of: user needs every listed permission. */
export const RequirePermissions = (...codes: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, codes);

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): JwtUser => {
  return ctx.switchToHttp().getRequest<Request & { user: JwtUser }>().user;
});

export const ClientCtx = createParamDecorator((_: unknown, ctx: ExecutionContext): ClientContext => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return { ip: req.ip ?? 'unknown', userAgent: (req.headers['user-agent'] ?? 'unknown').slice(0, 255) };
});
