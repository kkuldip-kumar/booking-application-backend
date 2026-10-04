import { BadRequestException } from '@nestjs/common';
import { LayoutRowDto } from './dto/create-seat-layout.dto';
import { buildLayout } from './seat-layout.builder';

const types = new Map([['REGULAR', 't-reg'], ['PREMIUM', 't-pre']]);
const row = (over: Partial<LayoutRowDto>): LayoutRowDto => ({ rowLabel: 'A', seatCount: 4, seatTypeCode: 'REGULAR', ...over });

describe('buildLayout', () => {
  it('positions seats with aisle gaps and offsets', () => {
    const { seats, columnCount, rowCount } = buildLayout([row({ aisleAfter: [2] }), row({ rowLabel: 'B', gridOffset: 1, seatTypeCode: 'PREMIUM' })], types);
    expect(seats.filter((s) => s.rowLabel === 'A').map((s) => s.gridCol)).toEqual([0, 1, 3, 4]);
    expect(seats.filter((s) => s.rowLabel === 'B').map((s) => s.gridCol)).toEqual([1, 2, 3, 4]);
    expect(columnCount).toBe(5);
    expect(rowCount).toBe(2);
  });

  it('flags accessible and companion seats', () => {
    const { seats } = buildLayout([row({ accessibleSeats: [1], companionSeats: [2] })], types);
    expect(seats[0].isAccessible).toBe(true);
    expect(seats[1].isCompanion).toBe(true);
  });

  it.each([
    ['duplicate row labels', [row({}), row({})]],
    ['unknown seat type', [row({ seatTypeCode: 'GOLD' })]],
    ['seat number above seatCount', [row({ accessibleSeats: [9] })]],
  ])('rejects %s', (_name, rows) => {
    expect(() => buildLayout(rows, types)).toThrow(BadRequestException);
  });
});
