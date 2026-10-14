import { ToneSwatches, toneOf } from './tones';

describe('toneOf', () => {
  it('uses the first colour family', () => {
    expect(toneOf(['red', 'gold'])).toBe(ToneSwatches.red);
  });

  it('skips families it has no swatch for', () => {
    expect(toneOf(['teal-ish', 'blue'])).toBe(ToneSwatches.blue);
  });

  it('gives no tint when the colour is unknown', () => {
    expect(toneOf([])).toBeNull();
    expect(toneOf(null)).toBeNull();
    expect(toneOf(undefined)).toBeNull();
  });

  it('has a swatch for every family the API reports', () => {
    const families = [
      'multi', 'beige', 'white', 'black', 'grey', 'brown', 'red', 'pink',
      'orange', 'yellow', 'green', 'blue', 'purple', 'gold', 'silver',
    ];

    for (const family of families) {
      expect(toneOf([family])).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
