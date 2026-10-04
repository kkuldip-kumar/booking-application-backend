import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from '../../common/constants/auth.constants';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';

export interface NewUser {
  readonly email: string;
  readonly name: string;
  readonly phone?: string;
  readonly passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async getByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  create(input: NewUser): Promise<User> {
    return this.users.save(
      this.users.create({ email: input.email, name: input.name, phone: input.phone ?? null, passwordHash: input.passwordHash }),
    );
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.users.update(
      { id: userId, status: UserStatus.PENDING_VERIFICATION },
      { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
    );
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.users.update({ id: userId }, { passwordHash, failedLoginAttempts: 0, lockedUntil: null });
  }

  isLocked(user: User): boolean {
    return user.lockedUntil !== null && user.lockedUntil.getTime() > Date.now();
  }

  async registerFailedLogin(userId: string): Promise<void> {
    await this.users.increment({ id: userId }, 'failedLoginAttempts', 1);
    const user = await this.findById(userId);
    if (user && user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);
      await this.users.update({ id: userId }, { lockedUntil, failedLoginAttempts: 0 });
    }
  }

  async clearLoginFailures(userId: string): Promise<void> {
    await this.users.update({ id: userId }, { failedLoginAttempts: 0, lockedUntil: null });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    await this.users.update({ id: userId }, { ...(dto.name && { name: dto.name }), ...(dto.phone && { phone: dto.phone }) });
    return this.getByIdOrFail(userId);
  }
}
