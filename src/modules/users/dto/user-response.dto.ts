import { User } from '../entities/user.entity';

export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  phone!: string | null;
  emailVerified!: boolean;
  roles!: readonly string[];
  permissions!: readonly string[];

  static from(user: User, roles: readonly string[], permissions: readonly string[]): UserResponseDto {
    return {
      id: user.id, email: user.email, name: user.name, phone: user.phone,
      emailVerified: user.emailVerifiedAt !== null, roles, permissions,
    };
  }
}
