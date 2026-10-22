import { Role } from '../../../common/enums/role.enum';
import { JwtUser } from '../../../common/interfaces/jwt-user.interface';

export function canAccessCinema(user: JwtUser, cinemaId: string): boolean {
  return user.roles.includes(Role.SUPER_ADMIN) || user.cinemaIds.includes(cinemaId);
}
