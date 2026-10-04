import { detectImage } from './image-signature';

describe('detectImage', () => {
  it('detects JPEG, PNG and WebP by magic bytes', () => {
    expect(detectImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]))?.mime).toBe('image/jpeg');
    expect(detectImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]))?.mime).toBe('image/png');
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);
    expect(detectImage(webp)?.extension).toBe('webp');
  });

  it('rejects scripts, SVG and empty input even if named like an image', () => {
    expect(detectImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(detectImage(Buffer.from('<?php system($_GET[1]); ?>'))).toBeNull();
    expect(detectImage(Buffer.alloc(0))).toBeNull();
  });
});
