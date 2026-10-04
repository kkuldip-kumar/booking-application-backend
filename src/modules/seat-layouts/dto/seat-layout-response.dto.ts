import { SeatLayoutStatus, SeatStatus } from '../../../common/enums/cinema.enums';
import { SeatLayout } from '../entities/seat-layout.entity';
import { SeatType } from '../entities/seat-type.entity';
import { Seat } from '../entities/seat.entity';

export class SeatTypeResponseDto {
  id!: string;
  code!: string;
  name!: string;
  priceMultiplierBps!: number;

  static from(type: SeatType): SeatTypeResponseDto {
    return { id: type.id, code: type.code, name: type.name, priceMultiplierBps: type.priceMultiplierBps };
  }
}

export class SeatResponseDto {
  id!: string;
  rowLabel!: string;
  seatNumber!: number;
  gridRow!: number;
  gridCol!: number;
  seatTypeCode!: string;
  isAccessible!: boolean;
  isCompanion!: boolean;
  status!: SeatStatus;

  static from(seat: Seat): SeatResponseDto {
    return {
      id: seat.id, rowLabel: seat.rowLabel, seatNumber: seat.seatNumber, gridRow: seat.gridRow, gridCol: seat.gridCol,
      seatTypeCode: seat.seatType.code, isAccessible: seat.isAccessible, isCompanion: seat.isCompanion, status: seat.status,
    };
  }
}

export class SeatLayoutResponseDto {
  id!: string;
  screenId!: string;
  version!: number;
  name!: string;
  status!: SeatLayoutStatus;
  rowCount!: number;
  columnCount!: number;
  seatCount?: number;
  seats?: SeatResponseDto[];

  static from(layout: SeatLayout, seats?: Seat[], seatCount?: number): SeatLayoutResponseDto {
    return {
      id: layout.id, screenId: layout.screenId, version: layout.version, name: layout.name, status: layout.status,
      rowCount: layout.rowCount, columnCount: layout.columnCount,
      seatCount: seats?.length ?? seatCount,
      seats: seats?.map((seat) => SeatResponseDto.from(seat)),
    };
  }
}
