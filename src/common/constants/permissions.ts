import { SystemRole } from '../enums/system-role.enum';

/** Permission codes follow `<module>:<action>`. Extend as new modules land. */
export const PERMISSIONS = [
  'dashboard:read', 'reports:read',
  'movies:read', 'movies:write',
  'cinemas:read', 'cinemas:write',
  'screens:read', 'screens:write',
  'showtimes:read', 'showtimes:write',
  'bookings:read', 'bookings:write', 'bookings:cancel',
  'checkin:scan',
  'payments:read', 'payments:refund',
  'users:read', 'users:write',
  'roles:read', 'roles:write',
  'audit:read',
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];

export const DEFAULT_ROLE_PERMISSIONS: Readonly<Record<SystemRole, readonly PermissionCode[]>> = {
  [SystemRole.SUPER_ADMIN]: PERMISSIONS,
  [SystemRole.CINEMA_ADMIN]: [
    'dashboard:read', 'reports:read', 'cinemas:read', 'screens:read', 'screens:write',
    'showtimes:read', 'showtimes:write', 'bookings:read', 'bookings:write', 'bookings:cancel',
    'checkin:scan', 'movies:read',
  ],
  [SystemRole.CONTENT_MANAGER]: ['movies:read', 'movies:write', 'dashboard:read'],
  [SystemRole.BOX_OFFICE]: ['showtimes:read', 'bookings:read', 'bookings:write', 'bookings:cancel'],
  [SystemRole.FINANCE_ADMIN]: ['dashboard:read', 'reports:read', 'payments:read', 'payments:refund', 'bookings:read'],
  [SystemRole.THEATRE_STAFF]: ['checkin:scan', 'bookings:read', 'showtimes:read'],
  [SystemRole.CUSTOMER]: [],
};
