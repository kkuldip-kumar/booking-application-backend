import { BadRequestException } from '@nestjs/common';
import { MAX_BULK_DAYS, MAX_BULK_SHOWTIMES, MS_PER_DAY } from '../../common/constants/cinema.constants';
import { daysBetweenInclusive, formatIsoDate, parseIsoDate, zonedLocalToUtc } from '../../common/utils/timezone.util';

export interface BulkSlotInput {
  fromDate: string;
  toDate: string;
  times: readonly string[];
  daysOfWeek?: readonly number[];
  timezone: string;
}

function parseRange(fromDate: string, toDate: string): { fromMs: number; days: number } {
  const fromMs = parseIsoDate(fromDate);
  const toMs = parseIsoDate(toDate);
  if (fromMs === null || toMs === null) throw new BadRequestException('Invalid fromDate/toDate');
  const days = daysBetweenInclusive(fromMs, toMs);
  if (days < 1) throw new BadRequestException('toDate must not be before fromDate');
  if (days > MAX_BULK_DAYS) throw new BadRequestException(`Date range cannot exceed ${MAX_BULK_DAYS} days`);
  return { fromMs, days };
}

/** Expands a date range x time-of-day list into sorted UTC start instants (cinema-local wall-clock). */
export function expandBulkSlots(input: BulkSlotInput): Date[] {
  const { fromMs, days } = parseRange(input.fromDate, input.toDate);
  const allowedDays = input.daysOfWeek ? new Set(input.daysOfWeek) : null;
  const slots: Date[] = [];
  for (let i = 0; i < days; i++) {
    const dayMs = fromMs + i * MS_PER_DAY;
    if (allowedDays && !allowedDays.has(new Date(dayMs).getUTCDay())) continue;
    for (const time of input.times) slots.push(zonedLocalToUtc(formatIsoDate(dayMs), time, input.timezone));
  }
  if (slots.length === 0) throw new BadRequestException('No showtimes match the given schedule');
  if (slots.length > MAX_BULK_SHOWTIMES) throw new BadRequestException(`Cannot create more than ${MAX_BULK_SHOWTIMES} showtimes at once`);
  return slots.sort((a, b) => a.getTime() - b.getTime());
}
