import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ShowtimeSummary, ShowtimeSummaryPort } from '../ports/showtime-summary.port';

const SHOWTIME_SUMMARY_SQL = `
  SELECT s.id AS "showtimeId", m.title AS "movieTitle", c.name AS "cinemaName",
         sc.screen_name AS "screenName", s.start_at AS "startsAt", s.end_at AS "endsAt"
  FROM showtimes s
  JOIN movies m ON m.id = s.movie_id
  JOIN screens sc ON sc.id = s.screen_id
  JOIN cinemas c ON c.id = sc.cinema_id
  WHERE s.id = ANY($1::uuid[])`;

@Injectable()
export class TypeOrmShowtimeSummaryAdapter extends ShowtimeSummaryPort {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  findByIds(ids: readonly string[]): Promise<ShowtimeSummary[]> {
    return this.dataSource.query<ShowtimeSummary[]>(SHOWTIME_SUMMARY_SQL, [ids]);
  }
}
