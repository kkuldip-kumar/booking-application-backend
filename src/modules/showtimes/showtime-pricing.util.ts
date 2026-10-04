import { SEAT_PRICE_DIVISOR_BPS } from '../../common/constants/cinema.constants';

/** Explicit per-seat-type override wins; otherwise base price x multiplier (basis points), rounded to paise. */
export function computeSeatPrice(basePrice: number, multiplierBps: number, override?: number): number {
  if (override !== undefined) return override;
  return Math.round((basePrice * multiplierBps) / SEAT_PRICE_DIVISOR_BPS);
}
