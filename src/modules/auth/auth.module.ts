import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueueAuthMailer } from '../notifications/queue-auth-mailer';
import { RbacModule } from '../rbac/rbac.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entities/refresh-token.entity';
import { VerificationToken } from './entities/verification-token.entity';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { CryptoOpaqueTokenGenerator } from './infrastructure/crypto-opaque-token';
import { AuthMailer } from './ports/auth-mailer';
import { OpaqueTokenGenerator } from './ports/opaque-token';
import { PasswordHasher } from './ports/password-hasher';
import { AccessTokenService } from './services/access-token.service';
import { AuthCookieService } from './services/auth-cookie.service';
import { AuthService } from './services/auth.service';
import { EmailVerificationService } from './services/email-verification.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { SessionService } from './services/session.service';
import { VerificationTokenService } from './services/verification-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, VerificationToken]),
    JwtModule.register({}),
    UsersModule,
    RbacModule,
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService, EmailVerificationService, PasswordService, SessionService, AccessTokenService,
    RefreshTokenService, VerificationTokenService, AuthCookieService,
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: OpaqueTokenGenerator, useClass: CryptoOpaqueTokenGenerator },
    { provide: AuthMailer, useExisting: QueueAuthMailer },
    // Order matters: throttle -> authenticate -> role check -> permission check.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AccessTokenService],
})
export class AuthModule {}
