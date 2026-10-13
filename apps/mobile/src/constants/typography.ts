import type { TextStyle } from 'react-native';

/**
 * Type scale, set in Bricolage Grotesque at Apple's text-style sizes (Large
 * Title 34, Title 2 22, Body 17, Subhead 15, Footnote 13, Caption 12/11).
 *
 * Bricolage ships as one variable font, but React Native cannot reliably pick
 * a weight or optical size from one — Android ignores the axes and iOS falls
 * back to the default instance (96pt ExtraBold). So `assets/fonts` holds
 * static cuts made from it:
 * - Text cuts (optical size 16) for everything up to 20pt: open and sturdy at
 *   small sizes.
 * - Display cuts (optical size 36) for titles: tighter, with more character.
 *
 * Each cut is its own family, named by its PostScript name — the same string
 * works on iOS and Android. So presets set `fontFamily` and never
 * `fontWeight`: a weight on top of a single-weight family makes Android fake
 * a bolder one.
 *
 * `Typography` is the layer components should use. `FontSizes` and
 * `FontFamilies` exist for the rare design that needs something off the scale.
 */
export const FontFamilies = {
  regular: 'BricolageGrotesque-Regular',
  medium: 'BricolageGrotesque-Medium',
  semibold: 'BricolageGrotesque-SemiBold',
  bold: 'BricolageGrotesque-Bold',
  displaySemibold: 'BricolageGrotesque-DisplaySemiBold',
  displayBold: 'BricolageGrotesque-DisplayBold',
} as const;

export const FontSizes = {
  largeTitle: 34,
  title1: 28,
  title2: 22,
  title3: 20,
  body: 17,
  callout: 16,
  subhead: 15,
  footnote: 13,
  caption1: 12,
  caption2: 11,
} as const;

export const Typography = {
  largeTitle_34_bold: {
    fontSize: FontSizes.largeTitle,
    lineHeight: 41,
    fontFamily: FontFamilies.displayBold,
    letterSpacing: -0.6,
  },

  title_28_bold: {
    fontSize: FontSizes.title1,
    lineHeight: 34,
    fontFamily: FontFamilies.displayBold,
    letterSpacing: -0.4,
  },

  title_22_bold: {
    fontSize: FontSizes.title2,
    lineHeight: 28,
    fontFamily: FontFamilies.displayBold,
    letterSpacing: -0.2,
  },

  title_20_semibold: {
    fontSize: FontSizes.title3,
    lineHeight: 25,
    fontFamily: FontFamilies.displaySemibold,
    letterSpacing: -0.1,
  },

  body_17_regular: {
    fontSize: FontSizes.body,
    lineHeight: 22,
    fontFamily: FontFamilies.regular,
  },

  body_17_semibold: {
    fontSize: FontSizes.body,
    lineHeight: 22,
    fontFamily: FontFamilies.semibold,
  },

  callout_16_semibold: {
    fontSize: FontSizes.callout,
    lineHeight: 21,
    fontFamily: FontFamilies.semibold,
  },

  subhead_15_regular: {
    fontSize: FontSizes.subhead,
    lineHeight: 20,
    fontFamily: FontFamilies.regular,
  },

  subhead_15_medium: {
    fontSize: FontSizes.subhead,
    lineHeight: 20,
    fontFamily: FontFamilies.medium,
  },

  subhead_15_semibold: {
    fontSize: FontSizes.subhead,
    lineHeight: 20,
    fontFamily: FontFamilies.semibold,
  },

  subhead_15_bold: {
    fontSize: FontSizes.subhead,
    lineHeight: 20,
    fontFamily: FontFamilies.bold,
  },

  footnote_13_regular: {
    fontSize: FontSizes.footnote,
    lineHeight: 18,
    fontFamily: FontFamilies.regular,
  },

  footnote_13_medium: {
    fontSize: FontSizes.footnote,
    lineHeight: 18,
    fontFamily: FontFamilies.medium,
  },

  footnote_13_semibold: {
    fontSize: FontSizes.footnote,
    lineHeight: 18,
    fontFamily: FontFamilies.semibold,
  },

  caption_12_regular: {
    fontSize: FontSizes.caption1,
    lineHeight: 16,
    fontFamily: FontFamilies.regular,
  },

  caption_12_semibold: {
    fontSize: FontSizes.caption1,
    lineHeight: 16,
    fontFamily: FontFamilies.semibold,
  },

  caption_11_medium: {
    fontSize: FontSizes.caption2,
    lineHeight: 14,
    fontFamily: FontFamilies.medium,
  },

  caption_11_bold: {
    fontSize: FontSizes.caption2,
    lineHeight: 14,
    fontFamily: FontFamilies.bold,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyToken = keyof typeof Typography;
