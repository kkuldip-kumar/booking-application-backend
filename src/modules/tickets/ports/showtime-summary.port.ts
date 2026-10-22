export interface ShowtimeSummary {
  readonly showtimeId: string;
  readonly movieTitle: string;
  readonly cinemaName: string;
  readonly screenName: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export abstract class ShowtimeSummaryPort {
  abstract findByIds(ids: readonly string[]): Promise<ShowtimeSummary[]>;
}
