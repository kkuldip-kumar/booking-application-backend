import { expandBulkSlots } from './showtime-slots.util';
import { computeSeatPrice } from './showtime-pricing.util';
import { zonedLocalToUtc } from '../../common/utils/timezone.util';

describe('zonedLocalToUtc', () => {
  it('converts IST wall-clock to UTC', () => {
    expect(zonedLocalToUtc('2026-10-05', '18:30', 'Asia/Kolkata').toISOString()).toBe('2026-10-05T13:00:00.000Z');
  });
  it('handles DST zones', () => {
    expect(zonedLocalToUtc('2026-07-01', '12:00', 'America/New_York').toISOString()).toBe('2026-07-01T16:00:00.000Z');
  });
});

describe('expandBulkSlots', () => {
  const base = { times: ['10:00', '14:00'], timezone: 'Asia/Kolkata' };
  it('expands range x times, sorted', () => {
    const slots = expandBulkSlots({ ...base, fromDate: '2026-10-05', toDate: '2026-10-06' });
    expect(slots.map((s) => s.toISOString())).toEqual([
      '2026-10-05T04:30:00.000Z', '2026-10-05T08:30:00.000Z', '2026-10-06T04:30:00.000Z', '2026-10-06T08:30:00.000Z',
    ]);
  });
  it('filters by weekday (2026-10-05 is Monday=1)', () => {
    expect(expandBulkSlots({ ...base, fromDate: '2026-10-05', toDate: '2026-10-11', daysOfWeek: [1] })).toHaveLength(2);
  });
  it.each([['2026-10-06', '2026-10-05'], ['2026-02-30', '2026-03-01'], ['2026-10-01', '2026-12-31']])('rejects %s..%s', (from, to) => {
    expect(() => expandBulkSlots({ ...base, fromDate: from, toDate: to })).toThrow();
  });
});

describe('computeSeatPrice', () => {
  it('applies multiplier and rounds to paise', () => {
    expect(computeSeatPrice(20000, 15000)).toBe(30000);
    expect(computeSeatPrice(333, 15000)).toBe(500);
  });
  it('override wins, including zero', () => {
    expect(computeSeatPrice(20000, 25000, 0)).toBe(0);
  });
});
