import { NotFoundException } from '@nestjs/common';
import { Role } from '../enums/role.enum';
import { JwtUser } from '../interfaces/jwt-user.interface';

export function hasGlobalCinemaAccess(user: JwtUser): boolean {
  return user.roles.includes(Role.SUPER_ADMIN);
}

// 404 (not 403) so cinema ids of other tenants cannot be enumerated (THREAT_MODEL T1/T9).
export function assertCinemaAccess(user: JwtUser, cinemaId: string): void {
  if (hasGlobalCinemaAccess(user)) return;
  if (!user.cinemaIds.includes(cinemaId)) throw new NotFoundException('Resource not found');
}
