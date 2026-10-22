import { QueryFailedError } from 'typeorm';

const PG_UNIQUE_VIOLATION = '23505';
const PG_FK_VIOLATION = '23503';

// export function isUniqueViolation(error: unknown): boolean {
//   if (!(error instanceof QueryFailedError)) return false;
//   const driverError: unknown = error.driverError;
//   return (
//     typeof driverError === 'object' &&
//     driverError !== null &&
//     (driverError as { code?: unknown }).code === PG_UNIQUE_VIOLATION
//   );
// }

const hasPgCode = (error: unknown, code: string): boolean =>
  error instanceof QueryFailedError &&
  (error.driverError as { code?: string }).code === code;

export const isUniqueViolation = (error: unknown): boolean =>
  hasPgCode(error, PG_UNIQUE_VIOLATION);
export const isForeignKeyViolation = (error: unknown): boolean =>
  hasPgCode(error, PG_FK_VIOLATION);
