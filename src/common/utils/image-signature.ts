export interface DetectedImage {
  readonly mime: string;
  readonly extension: string;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const RIFF_TAG = 'RIFF';
const WEBP_TAG = 'WEBP';
const WEBP_TAG_OFFSET = 8;
const WEBP_MIN_LENGTH = 12;

// Content is sniffed from magic bytes; the client-declared mime type and filename are never trusted.
export function detectImage(data: Buffer): DetectedImage | null {
  if (data.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) {
    return { mime: 'image/jpeg', extension: 'jpg' };
  }
  if (data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return { mime: 'image/png', extension: 'png' };
  }
  const isWebp =
    data.length >= WEBP_MIN_LENGTH &&
    data.toString('ascii', 0, RIFF_TAG.length) === RIFF_TAG &&
    data.toString('ascii', WEBP_TAG_OFFSET, WEBP_TAG_OFFSET + WEBP_TAG.length) === WEBP_TAG;
  return isWebp ? { mime: 'image/webp', extension: 'webp' } : null;
}
