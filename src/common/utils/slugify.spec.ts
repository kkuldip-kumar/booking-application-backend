import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases, strips diacritics and punctuation', () => {
    expect(slugify('  Amélie: The Return!! ')).toBe('amelie-the-return');
  });

  it('falls back for titles with no latin characters', () => {
    expect(slugify('कल्कि 2898')).toBe('2898');
    expect(slugify('कल्कि')).toBe('movie');
  });

  it('caps length without a trailing dash', () => {
    const slug = slugify(`${'a'.repeat(79)} b`);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith('-')).toBe(false);
  });
});
