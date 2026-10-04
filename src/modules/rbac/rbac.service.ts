import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PG_UNIQUE_VIOLATION } from '../../common/constants/auth.constants';
import { SystemRole } from '../../common/enums/system-role.enum';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

export interface Authorities {
  readonly roles: string[];
  readonly permissions: string[];
  readonly cinemaIds: string[];
}

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Permission) private readonly permissions: Repository<Permission>,
    @InjectRepository(UserRole) private readonly userRoles: Repository<UserRole>,
  ) {}

  async getAuthorities(userId: string): Promise<Authorities> {
    const assignments = await this.userRoles.find({
      where: { userId },
      relations: { role: { permissions: true } },
    });
    const roles = new Set<string>();
    const permissions = new Set<string>();
    const cinemaIds = new Set<string>();
    for (const assignment of assignments) {
      roles.add(assignment.role.name);
      assignment.role.permissions.forEach((p) => permissions.add(p.code));
      if (assignment.cinemaId) cinemaIds.add(assignment.cinemaId);
    }
    return { roles: [...roles], permissions: [...permissions], cinemaIds: [...cinemaIds] };
  }

  async assignDefaultRole(userId: string): Promise<void> {
    const role = await this.roles.findOne({ where: { name: SystemRole.CUSTOMER } });
    if (!role) throw new NotFoundException('Default role is not seeded');
    await this.userRoles.save(this.userRoles.create({ userId, roleId: role.id, cinemaId: null }));
  }

  async assignRole(userId: string, roleId: string, cinemaId?: string): Promise<void> {
    await this.getRoleOrFail(roleId);
    try {
      await this.userRoles.save(this.userRoles.create({ userId, roleId, cinemaId: cinemaId ?? null }));
    } catch (error) {
      if ((error as { code?: string }).code === PG_UNIQUE_VIOLATION) throw new ConflictException('Role already assigned');
      throw error;
    }
  }

  async revokeRole(userId: string, roleId: string, cinemaId?: string): Promise<void> {
    await this.userRoles.delete({ userId, roleId, cinemaId: cinemaId ?? (null as unknown as undefined) });
  }

  listRoles(): Promise<Role[]> {
    return this.roles.find({ relations: { permissions: true }, order: { name: 'ASC' } });
  }

  listPermissions(): Promise<Permission[]> {
    return this.permissions.find({ order: { code: 'ASC' } });
  }

  async createRole(name: string, description?: string): Promise<Role> {
    if (await this.roles.exists({ where: { name } })) throw new ConflictException('Role already exists');
    return this.roles.save(this.roles.create({ name, description: description ?? null, isSystem: false }));
  }

  async setRolePermissions(roleId: string, codes: string[]): Promise<Role> {
    const role = await this.getRoleOrFail(roleId);
    const found = await this.permissions.find({ where: { code: In(codes) } });
    if (found.length !== new Set(codes).size) throw new NotFoundException('Unknown permission code');
    role.permissions = found;
    return this.roles.save(role);
  }

  private async getRoleOrFail(roleId: string): Promise<Role> {
    const role = await this.roles.findOne({ where: { id: roleId }, relations: { permissions: true } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }
}
