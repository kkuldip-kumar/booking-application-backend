import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { REFRESH_COOKIE } from '../../common/constants/auth.constants';
import { ClientCtx, CurrentUser, Public } from '../../common/decorators';
import { ClientContext, JwtUser } from '../../common/interfaces/jwt-user.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';
import {
  ChangePasswordDto, EmailDto, LoginDto, RegisterDto, ResetPasswordDto, TokenDto,
} from './dto/auth.dto';
import { AuthCookieService } from './services/auth-cookie.service';
import { AuthService } from './services/auth.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordService } from './services/password.service';
import { AuthSession } from './services/session.service';

const STRICT = { default: { limit: 5, ttl: 60_000 } };
const NEUTRAL = 'If the account exists, an email has been sent';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly verification: EmailVerificationService,
    private readonly passwords: PasswordService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Public() @Throttle(STRICT) @Post('register')
  @ApiOperation({ summary: 'Register and receive a verification email' })
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return { message: await this.auth.register(dto) };
  }

  @Public() @Throttle(STRICT) @HttpCode(200) @Post('login')
  @ApiOperation({ summary: 'Login; sets access + refresh cookies' })
  async login(@Body() dto: LoginDto, @ClientCtx() ctx: ClientContext, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.login(dto, ctx));
  }

  @Public() @Throttle(STRICT) @HttpCode(200) @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token (cookie) and issue a new access token' })
  async refresh(@Req() req: Request, @ClientCtx() ctx: ClientContext, @Res({ passthrough: true }) res: Response) {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    return this.respond(res, await this.auth.refresh(raw, ctx));
  }

  @Public() @HttpCode(204) @Post('logout')
  @ApiOperation({ summary: 'Revoke current refresh token and clear cookies' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout((req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE]);
    this.cookies.clear(res);
  }

  @HttpCode(204) @Post('logout-all')
  @ApiOperation({ summary: 'Revoke every session of the current user' })
  async logoutAll(@CurrentUser() user: JwtUser, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logoutAll(user.id);
    this.cookies.clear(res);
  }

  @Public() @Throttle(STRICT) @HttpCode(200) @Post('verify-email')
  @ApiOperation({ summary: 'Confirm email address with the emailed token' })
  async verifyEmail(@Body() dto: TokenDto): Promise<{ message: string }> {
    await this.verification.verify(dto.token);
    return { message: 'Email verified' };
  }

  @Public() @Throttle(STRICT) @HttpCode(200) @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  async resend(@Body() dto: EmailDto): Promise<{ message: string }> {
    await this.verification.resend(dto.email);
    return { message: NEUTRAL };
  }

  @Public() @Throttle(STRICT) @HttpCode(200) @Post('forgot-password')
  @ApiOperation({ summary: 'Email a password reset link' })
  async forgot(@Body() dto: EmailDto): Promise<{ message: string }> {
    await this.passwords.requestReset(dto.email);
    return { message: NEUTRAL };
  }

  @Public() @Throttle(STRICT) @HttpCode(200) @Post('reset-password')
  @ApiOperation({ summary: 'Set a new password using the emailed token' })
  async reset(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.passwords.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password updated. Please log in again.' };
  }

  @HttpCode(204) @Post('change-password')
  @ApiOperation({ summary: 'Change password; revokes all sessions' })
  async change(@CurrentUser() user: JwtUser, @Body() dto: ChangePasswordDto, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.passwords.changePassword(user.id, dto.currentPassword, dto.newPassword);
    this.cookies.clear(res);
  }

  private respond(res: Response, session: AuthSession) {
    this.cookies.set(res, session);
    return {
      user: UserResponseDto.from(session.user, session.roles, session.permissions),
      accessTokenExpiresAt: session.accessExpiresAt,
    };
  }
}
