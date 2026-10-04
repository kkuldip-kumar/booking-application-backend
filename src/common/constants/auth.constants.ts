import { VerificationTokenType } from '../enums/verification-token-type.enum';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;
export const OPAQUE_TOKEN_BYTES = 32;
export const PG_UNIQUE_VIOLATION = '23505';

export const VERIFICATION_TTL_MINUTES: Readonly<Record<VerificationTokenType, number>> = {
  [VerificationTokenType.EMAIL_VERIFICATION]: 24 * 60,
  [VerificationTokenType.PASSWORD_RESET]: 30,
};
