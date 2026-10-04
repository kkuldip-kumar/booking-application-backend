import { QueryFailedError } from 'typeorm';

const PG_UNIQUE = '23505';
const PG_FOREIGN_KEY = '23503';
const PG_EXCLUSION = '23P01';

function pgCode(error: unknown): string | undefined {
  if (!(error instanceof QueryFailedError)) return undefined;
  const driver: unknown = error.driverError;
  if (typeof driver === 'object' && driver !== null && 'code' in driver) {
    return String((driver as { code: unknown }).code);
  }
  return undefined;
}

export const isUniqueViolation = (error: unknown): boolean => pgCode(error) === PG_UNIQUE;
export const isForeignKeyViolation = (error: unknown): boolean => pgCode(error) === PG_FOREIGN_KEY;
export const isExclusionViolation = (error: unknown): boolean => pgCode(error) === PG_EXCLUSION;
