import { ScanResult, TicketStatus } from '../../common/enums/ticket.enums';

export const TICKET_TOKEN_VERSION = 'v1';
export const TICKET_TOKEN_ID_BYTES = 12;
export const TICKET_TOKEN_MAC_BYTES = 16;
export const TICKET_TOKEN_MAX_LENGTH = 128;
// base64url length: 12 id bytes -> 16 chars, 16 MAC bytes -> 22 chars
export const TICKET_TOKEN_PATTERN = /^v1\.([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]{22})$/;

export const TICKET_NUMBER_PREFIX = 'TKT';
export const TICKET_NUMBER_RANDOM_BYTES = 6;

export const DEVICE_KEY_HEADER = 'x-device-key';
export const DEVICE_KEY_SEPARATOR = '.';
export const DEVICE_KEY_SECRET_BYTES = 32;
export const DEVICE_KEY_SECRET_MAX_LENGTH = 64;
export const DEVICE_KEY_HASH_HEX_LENGTH = 64;

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const SCAN_RATE_LIMIT = 120;
export const OVERRIDE_RATE_LIMIT = 20;
export const DEVICE_ADMIN_RATE_LIMIT = 20;

export const OVERRIDE_REASON_MIN_LENGTH = 10;
export const OVERRIDE_REASON_MAX_LENGTH = 500;
export const DEVICE_NAME_MIN_LENGTH = 3;
export const DEVICE_NAME_MAX_LENGTH = 80;

export const PG_UNIQUE_VIOLATION = '23505';
export const PG_FOREIGN_KEY_VIOLATION = '23503';

export const TICKET_ENTRY_GUIDANCE: readonly string[] = [
  'Show this QR code at the entrance; one scan admits one seat.',
  'Do not share the code. Screenshots work only until the first scan.',
  'Staff may ask for the booking reference if the code cannot be read.',
];

export const NON_ISSUED_STATUS_RESULT: Readonly<
  Record<Exclude<TicketStatus, TicketStatus.ISSUED>, ScanResult>
> = {
  [TicketStatus.CHECKED_IN]: ScanResult.ALREADY_USED,
  [TicketStatus.CANCELLED]: ScanResult.CANCELLED,
  [TicketStatus.REFUNDED]: ScanResult.REFUNDED,
};
