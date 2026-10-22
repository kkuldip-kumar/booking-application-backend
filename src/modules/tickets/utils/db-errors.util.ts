import { QueryFailedError } from 'typeorm';

export function hasPgErrorCode(error: unknown, code: string): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError: unknown = error.driverError;
  return typeof driverError === 'object' && driverError !== null && 'code' in driverError
    ? driverError.code === code
    : false;
}
