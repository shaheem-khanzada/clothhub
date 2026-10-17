/**
 * Semantic colour tokens.
 *
 * Components read these through `useTheme()` and never reach for a raw hex —
 * a token says what a colour *means* (`surface`, `textSecondary`), so the
 * palette can change without touching a single screen.
 *
 * ClothHub ships dark-only: product photography reads best on a near-black
 * page, and the reel is full-bleed imagery. The type below is still the
 * contract a light scheme would have to fill if one is ever added.
 */

/** Raw values. Only `darkTheme` should read from this; screens use the semantic tokens. */
const palette = {
  /** Pure black behind full-bleed photos, so letterboxing disappears into the bezel. */
  black: '#000000',
  /** Page background — near-black, a touch warm so photos don't look cold. */
  ink: '#0B0B0C',
  /** Cards, inputs, sheet bodies. */
  graphite: '#1A1A1C',
  /** One step brighter: chips, pressed rows, filled controls. */
  graphiteRaised: '#262629',

  white: '#FFFFFF',
  fog: '#A1A1A6',
  smoke: '#6E6E73',

  /** The cream primary action ("Visit Brand", "Apply"). */
  cream: '#F2EDE4',
  inkOnCream: '#111111',

  green: '#4ADE80',
  greenDeep: '#173A26',

  red: '#FF453A',

  /** The saved heart: iOS's dark-mode system pink, warmer than alarm red. */
  rose: '#FF375F',
  roseLight: '#FF7A9A',
  blush: '#FFC2D1',

  hairline: '#2C2C2E',

  /** Translucent fill for controls floating on photos when Liquid Glass is unavailable. */
  frost: 'rgba(28, 28, 30, 0.55)',
  frostBorder: 'rgba(255, 255, 255, 0.14)',

  /** Darkens photos under text. */
  scrim: 'rgba(0, 0, 0, 0.55)',
  shimmer: '#2A2A2D',

  /** Translucent white washes for controls that sit on a sheet. */
  wash: 'rgba(255, 255, 255, 0.08)',
  washStrong: 'rgba(255, 255, 255, 0.14)',
} as const;

const darkTheme = {
  background: palette.ink,
  /** Behind the reel's full-screen photos. */
  mediaBackground: palette.black,
  surface: palette.graphite,
  surfaceRaised: palette.graphiteRaised,

  text: palette.white,
  textSecondary: palette.fog,
  textTertiary: palette.smoke,

  primary: palette.cream,
  onPrimary: palette.inkOnCream,

  /** Discount badges and in-stock dots. */
  success: palette.green,
  successSoft: palette.greenDeep,

  danger: palette.red,

  /** A saved heart, and the burst around it. */
  like: palette.rose,
  likeSoft: palette.roseLight,
  likeFaint: palette.blush,

  border: palette.hairline,

  glassFallback: palette.frost,
  glassBorder: palette.frostBorder,

  scrim: palette.scrim,
  skeleton: palette.shimmer,

  /**
   * The body of a sheet where there's no Liquid Glass (Android). A step up
   * from `background`, so a sheet reads as a layer above the page rather than
   * black on black.
   */
  sheetBackground: palette.graphite,

  /**
   * Grouped rows, inputs and chips inside sheets. Translucent rather than a
   * grey, so they're one step up from whatever is behind them: the Liquid
   * Glass of an iOS 26 sheet (where a solid grey would sit as a slab) or
   * `sheetBackground` on Android.
   */
  sheetFill: palette.wash,
  sheetFillStrong: palette.washStrong,
} as const;

/** Every semantic colour the app can ask for. */
export type ThemeColors = Record<keyof typeof darkTheme, string>;

export const Colors = {
  dark: darkTheme,
} as const satisfies Record<string, ThemeColors>;

export type ColorScheme = keyof typeof Colors;

export type ThemeColor = keyof ThemeColors;
