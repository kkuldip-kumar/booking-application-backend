import { BookingResponseDto } from './dto/booking-response.dto';
import { Booking } from './entities/booking.entity';

export function toBookingResponse(booking: Booking): BookingResponseDto {
  return {
    id: booking.id,
    reference: booking.reference,
    showtimeId: booking.showtimeId,
    status: booking.status,
    refundStatus: booking.refundStatus,
    totalAmount: booking.totalAmount,
    expiresAt: booking.expiresAt,
    seats: (booking.seats ?? []).map((seat) => ({
      showtimeSeatId: seat.showtimeSeatId,
      label: seat.seatLabel,
      price: seat.unitPrice,
    })),
  };
}
