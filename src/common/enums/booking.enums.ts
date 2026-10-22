export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

export enum RefundStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
}

export enum BookingSeatStatus {
  ACTIVE = 'ACTIVE',
  RELEASED = 'RELEASED',
}

export enum ShowtimeSeatStatus {
  AVAILABLE = 'AVAILABLE',
  HELD = 'HELD',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
}

export enum ShowtimeStatus {
  SCHEDULED = 'SCHEDULED',
  CANCELLED = 'CANCELLED',
}
