import { BadRequestException } from '@nestjs/common';
import { MAX_SEATS_PER_LAYOUT } from '../../common/constants/cinema.constants';
import { LayoutRowDto } from './dto/create-seat-layout.dto';

export interface SeatDraft {
  seatTypeId: string;
  rowLabel: string;
  seatNumber: number;
  gridRow: number;
  gridCol: number;
  isAccessible: boolean;
  isCompanion: boolean;
}

export interface LayoutDraft {
  seats: SeatDraft[];
  rowCount: number;
  columnCount: number;
}

function assertSeatNumbers(row: LayoutRowDto, numbers: readonly number[] | undefined, field: string): void {
  if (numbers?.some((n) => n > row.seatCount)) {
    throw new BadRequestException(`Row ${row.rowLabel}: ${field} contains a seat number above seatCount`);
  }
}

function buildRow(row: LayoutRowDto, gridRow: number, seatTypeId: string): SeatDraft[] {
  assertSeatNumbers(row, row.aisleAfter, 'aisleAfter');
  assertSeatNumbers(row, row.accessibleSeats, 'accessibleSeats');
  assertSeatNumbers(row, row.companionSeats, 'companionSeats');
  const aisles = new Set(row.aisleAfter ?? []);
  const accessible = new Set(row.accessibleSeats ?? []);
  const companion = new Set(row.companionSeats ?? []);
  const seats: SeatDraft[] = [];
  let gridCol = row.gridOffset ?? 0;
  for (let seatNumber = 1; seatNumber <= row.seatCount; seatNumber++) {
    seats.push({
      seatTypeId, rowLabel: row.rowLabel, seatNumber, gridRow, gridCol,
      isAccessible: accessible.has(seatNumber), isCompanion: companion.has(seatNumber),
    });
    gridCol += aisles.has(seatNumber) ? 2 : 1;
  }
  return seats;
}

function assertUniqueRowLabels(rows: readonly LayoutRowDto[]): void {
  const labels = new Set(rows.map((row) => row.rowLabel));
  if (labels.size !== rows.length) throw new BadRequestException('Duplicate rowLabel in layout');
}

/** Pure function: expands row specs into positioned seats. Row order = top-to-bottom grid order. */
export function buildLayout(rows: readonly LayoutRowDto[], typeIdByCode: ReadonlyMap<string, string>): LayoutDraft {
  assertUniqueRowLabels(rows);
  const seats: SeatDraft[] = [];
  rows.forEach((row, gridRow) => {
    const seatTypeId = typeIdByCode.get(row.seatTypeCode);
    if (!seatTypeId) throw new BadRequestException(`Unknown seat type ${row.seatTypeCode}`);
    for (const seat of buildRow(row, gridRow, seatTypeId)) seats.push(seat);
  });
  if (seats.length > MAX_SEATS_PER_LAYOUT) throw new BadRequestException(`Layout exceeds ${MAX_SEATS_PER_LAYOUT} seats`);
  const columnCount = seats.reduce((max, seat) => Math.max(max, seat.gridCol + 1), 0);
  return { seats, rowCount: rows.length, columnCount };
}
