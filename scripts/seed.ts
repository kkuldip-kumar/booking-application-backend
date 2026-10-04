import 'reflect-metadata';
import * as argon2 from 'argon2';
import { Logger } from '@nestjs/common';
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from '../src/common/constants/permissions';
import { SystemRole } from '../src/common/enums/system-role.enum';
import { UserStatus } from '../src/common/enums/user-status.enum';
import AppDataSource from '../src/database/data-source';
import { Permission } from '../src/modules/rbac/entities/permission.entity';
import { Role } from '../src/modules/rbac/entities/role.entity';
import { UserRole } from '../src/modules/rbac/entities/user-role.entity';
import { User } from '../src/modules/users/entities/user.entity';

const logger = new Logger('Seed');

async function seedPermissions(): Promise<Map<string, Permission>> {
  const repo = AppDataSource.getRepository(Permission);
  const byCode = new Map((await repo.find()).map((p) => [p.code, p]));
  for (const code of PERMISSIONS) {
    if (byCode.has(code)) continue;
    const [module, action] = code.split(':');
    byCode.set(code, await repo.save(repo.create({ code, module, action })));
  }
  return byCode;
}

async function seedRoles(permissions: Map<string, Permission>): Promise<Map<string, Role>> {
  const repo = AppDataSource.getRepository(Role);
  const roles = new Map<string, Role>();
  for (const name of Object.values(SystemRole)) {
    const role = (await repo.findOne({ where: { name } })) ?? repo.create({ name, isSystem: true, description: null });
    role.permissions = DEFAULT_ROLE_PERMISSIONS[name].map((code) => permissions.get(code) as Permission);
    roles.set(name, await repo.save(role));
  }
  return roles;
}

async function seedSuperAdmin(roles: Map<string, Role>): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return logger.warn('SEED_ADMIN_EMAIL/PASSWORD not set; skipping super admin');
  const users = AppDataSource.getRepository(User);
  if (await users.exists({ where: { email } })) return;
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await users.save(users.create({
    email, name: 'Super Admin', passwordHash, status: UserStatus.ACTIVE, emailVerifiedAt: new Date(), phone: null,
  }));
  const roleId = (roles.get(SystemRole.SUPER_ADMIN) as Role).id;
  const userRoles = AppDataSource.getRepository(UserRole);
  await userRoles.save(userRoles.create({ userId: user.id, roleId, cinemaId: null }));
  logger.log(`Super admin created: ${email}`);
}

async function main(): Promise<void> {
  await AppDataSource.initialize();
  const roles = await seedRoles(await seedPermissions());
  await seedSuperAdmin(roles);
  await AppDataSource.destroy();
  logger.log('Seed complete');
}

main().catch((error: unknown) => {
  logger.error(error instanceof Error ? error.message : 'Seed failed');
  process.exit(1);
});
