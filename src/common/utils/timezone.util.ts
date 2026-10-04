import { MS_PER_DAY, MS_PER_MINUTE } from '../constants/cinema.constants';

export function isIanaTimezone(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function offsetMinutes(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const part = (type: string): number => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'));
  return (asUtc - Math.floor(utcMs / 1000) * 1000) / MS_PER_MINUTE;
}

/** Converts a wall-clock date ("2026-10-05") + time ("18:30") in `timeZone` to a UTC Date. */
export function zonedLocalToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  return new Date(guess - offsetMinutes(guess, timeZone) * MS_PER_MINUTE);
}

export function parseIsoDate(value: string): number | null {
  const [y, m, d] = value.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d);
  const back = new Date(ms);
  const valid = back.getUTCFullYear() === y && back.getUTCMonth() === m - 1 && back.getUTCDate() === d;
  return valid ? ms : null;
}

export function formatIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function daysBetweenInclusive(fromMs: number, toMs: number): number {
  return Math.floor((toMs - fromMs) / MS_PER_DAY) + 1;
}
