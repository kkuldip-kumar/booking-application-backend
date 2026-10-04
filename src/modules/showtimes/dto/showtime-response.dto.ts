import { ShowFormat, ShowtimeStatus } from '../../../common/enums/cinema.enums';
import { Showtime } from '../entities/showtime.entity';

export interface SeatSummary {
  total: number;
  available: number;
  held: number;
  booked: number;
  blocked: number;
}

export class ShowtimeResponseDto {
  id!: string;
  movie!: { id: string; title: string };
  screen!: { id: string; name: string; cinemaId: string; cinemaName: string };
  seatLayoutId!: string;
  format!: ShowFormat;
  languageCode!: string;
  subtitleLanguageCode!: string | null;
  startAt!: Date;
  endAt!: Date;
  basePrice!: number;
  bookingOpensAt!: Date | null;
  bookingCutoffMinutes!: number;
  status!: ShowtimeStatus;
  statusReason!: string | null;
  seatSummary?: SeatSummary;

  static from(s: Showtime, seatSummary?: SeatSummary): ShowtimeResponseDto {
    return {
      id: s.id,
      movie: { id: s.movie.id, title: s.movie.title },
      screen: { id: s.screen.id, name: s.screen.name, cinemaId: s.screen.cinemaId, cinemaName: s.screen.cinema.name },
      seatLayoutId: s.seatLayoutId, format: s.format, languageCode: s.languageCode,
      subtitleLanguageCode: s.subtitleLanguageCode, startAt: s.startAt, endAt: s.endAt, basePrice: s.basePrice,
      bookingOpensAt: s.bookingOpensAt, bookingCutoffMinutes: s.bookingCutoffMinutes,
      status: s.status, statusReason: s.statusReason, seatSummary,
    };
  }
}

export class BulkCreateResultDto {
  count!: number;
  showtimeIds!: string[];
}
