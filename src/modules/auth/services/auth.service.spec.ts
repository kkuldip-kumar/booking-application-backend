import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { User } from '../../users/entities/user.entity';
import { AuthService, REGISTER_MESSAGE } from './auth.service';

const ctx = { ip: '127.0.0.1', userAgent: 'jest' };
const makeUser = (over: Partial<User> = {}): User =>
  ({ id: 'u1', email: 'a@b.co', name: 'A', passwordHash: 'hash', status: UserStatus.ACTIVE, lockedUntil: null, ...over }) as User;

function build(user: User | null, passwordOk = true) {
  const users = {
    findByEmail: jest.fn().mockResolvedValue(user),
    isLocked: jest.fn().mockReturnValue(false),
    registerFailedLogin: jest.fn(), clearLoginFailures: jest.fn(), create: jest.fn(),
  };
  const hasher = { verify: jest.fn().mockResolvedValue(passwordOk), hash: jest.fn().mockResolvedValue('h') };
  const rbac = { assignDefaultRole: jest.fn() };
  const sessions = { start: jest.fn().mockResolvedValue({ ok: true }), rotate: jest.fn() };
  const refresh = { revoke: jest.fn(), revokeAllForUser: jest.fn() };
  const verification = { issue: jest.fn().mockResolvedValue('tok') };
  const mailer = { sendEmailVerification: jest.fn() };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new AuthService(users as any, hasher as any, rbac as any, sessions as any, refresh as any, verification as any, mailer as any);
  return { service, users, hasher, sessions, mailer, rbac };
}

describe('AuthService', () => {
  it('login: unknown user still burns a hash verification and returns a generic error', async () => {
    const { service, hasher } = build(null);
    await expect(service.login({ email: 'x@y.z', password: 'pw' }, ctx)).rejects.toThrow(UnauthorizedException);
    expect(hasher.verify).toHaveBeenCalledTimes(1);
  });

  it('login: wrong password records a failure', async () => {
    const { service, users } = build(makeUser(), false);
    await expect(service.login({ email: 'a@b.co', password: 'bad' }, ctx)).rejects.toThrow(UnauthorizedException);
    expect(users.registerFailedLogin).toHaveBeenCalledWith('u1');
  });

  it('login: unverified email is rejected only after the password is correct', async () => {
    const { service, sessions } = build(makeUser({ status: UserStatus.PENDING_VERIFICATION }));
    await expect(service.login({ email: 'a@b.co', password: 'ok' }, ctx)).rejects.toThrow(ForbiddenException);
    expect(sessions.start).not.toHaveBeenCalled();
  });

  it('login: success clears failures and starts a session', async () => {
    const { service, users, sessions } = build(makeUser());
    await service.login({ email: 'a@b.co', password: 'ok' }, ctx);
    expect(users.clearLoginFailures).toHaveBeenCalledWith('u1');
    expect(sessions.start).toHaveBeenCalled();
  });

  it('register: existing email returns the same message and sends no mail', async () => {
    const { service, mailer, users } = build(makeUser());
    await expect(service.register({ email: 'a@b.co', name: 'A', password: 'Passw0rd1' })).resolves.toBe(REGISTER_MESSAGE);
    expect(users.create).not.toHaveBeenCalled();
    expect(mailer.sendEmailVerification).not.toHaveBeenCalled();
  });

  it('register: new email creates user, assigns default role, queues verification mail', async () => {
    const { service, users, mailer, rbac } = build(null);
    users.create.mockResolvedValue(makeUser({ status: UserStatus.PENDING_VERIFICATION }));
    await expect(service.register({ email: 'n@b.co', name: 'N', password: 'Passw0rd1' })).resolves.toBe(REGISTER_MESSAGE);
    expect(rbac.assignDefaultRole).toHaveBeenCalledWith('u1');
    expect(mailer.sendEmailVerification).toHaveBeenCalledTimes(1);
  });
});
