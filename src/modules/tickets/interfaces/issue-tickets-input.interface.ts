export interface IssueTicketSeat {
  readonly bookingSeatId: string;
  readonly seatLabel: string;
}

export interface IssueTicketsInput {
  readonly bookingId: string;
  readonly bookingReference: string;
  readonly userId: string;
  readonly cinemaId: string;
  readonly showtimeId: string;
  readonly seats: readonly IssueTicketSeat[];
}
