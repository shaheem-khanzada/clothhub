/**
 * Layout spacing scale. Use these for padding, margin and gap instead of raw
 * numbers — component dimensions (a 44pt button, a 40pt avatar) are not
 * spacing and stay as literals.
 */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  twoAndOne: 12,
  three: 16,
  twenty: 20,
  four: 24,
  five: 32,
  six: 64,
} as const;

export type SpacingToken = keyof typeof Spacing;
