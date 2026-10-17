import { initials } from './Avatar';

describe('initials', () => {
  it('takes the first and last word', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('Muhammad Shaheem Khanzada')).toBe('MK');
  });

  it('copes with one word, extra spaces and non-Latin names', () => {
    expect(initials('  ada ')).toBe('A');
    expect(initials('عائشہ خان')).toBe('عخ');
    expect(initials('')).toBe('');
  });
});
