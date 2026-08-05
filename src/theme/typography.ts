import { TextStyle } from 'react-native';

export const FONTS = {
  // Gilroy - Primary Display Font (Used for Screen Titles, Main Headings, Hero Numbers, Card Headers)
  gilroyExtraBold: 'Gilroy-ExtraBold',
  gilroyLight: 'Gilroy-Light',

  // Plus Jakarta Sans - Secondary Body & UI Font (Used for Body Text, Subtitles, Form Inputs, Buttons, Badges)
  jakartaBold: 'PlusJakartaSans-Bold',
  jakartaSemibold: 'PlusJakartaSans-SemiBold',
  jakartaMedium: 'PlusJakartaSans-Medium',
  jakartaRegular: 'PlusJakartaSans-Regular',

  // Aliases for clean component usage
  displayBold: 'Gilroy-ExtraBold',
  displayLight: 'Gilroy-Light',
  groteskBold: 'PlusJakartaSans-Bold',
  groteskSemibold: 'PlusJakartaSans-SemiBold',
  groteskMedium: 'PlusJakartaSans-Medium',
  groteskRegular: 'PlusJakartaSans-Regular',

  // Standard Short Aliases
  extraBold: 'Gilroy-ExtraBold',
  bold: 'PlusJakartaSans-Bold',
  semiBold: 'PlusJakartaSans-SemiBold',
  medium: 'PlusJakartaSans-Medium',
  regular: 'PlusJakartaSans-Regular',
};

// Compact, mobile-optimized typography scale considering phone screen sizes
export const TYPOGRAPHY: Record<string, TextStyle> = {
  heroDisplay: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  titleLarge: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  titleMedium: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  titleSmall: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 14,
    lineHeight: 18,
  },
  cardTitle: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 14,
    lineHeight: 18,
  },
  subtitle1: {
    fontFamily: FONTS.jakartaSemibold,
    fontSize: 13,
    lineHeight: 17,
  },
  subtitle2: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  body1: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  body2: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 11,
    lineHeight: 15,
  },
  button: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  caption: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  badge: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  statNumber: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 20,
    lineHeight: 24,
  },

  // ── Material Design 3 Type Scale ─────────────────────────────────────────
  // Maps the M3 type system to the app's Gilroy + Plus Jakarta Sans stack.
  // Display roles use Gilroy (expressive); all others use Plus Jakarta Sans.

  /** Display Large – 57sp, weight 400, tracking -0.25 */
  m3DisplayLarge: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 57,
    lineHeight: 64,
    letterSpacing: -0.25,
  },

  /** Headline Large – 32sp, weight 400, tracking 0 */
  m3HeadlineLarge: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
  },

  /** Headline Medium – 28sp, weight 400, tracking 0 */
  m3HeadlineMedium: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
  },

  /** Headline Small – 24sp, weight 400, tracking 0 */
  m3HeadlineSmall: {
    fontFamily: FONTS.gilroyExtraBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },

  /** Title Large – 22sp, weight 400, tracking 0 */
  m3TitleLarge: {
    fontFamily: FONTS.jakartaSemibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  },

  /** Title Medium – 16sp, weight 500, tracking +0.15 */
  m3TitleMedium: {
    fontFamily: FONTS.jakartaSemibold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
  },

  /** Title Small – 14sp, weight 500, tracking +0.1 */
  m3TitleSmall: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  /** Body Large – 16sp, weight 400, tracking +0.5 */
  m3BodyLarge: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  },

  /** Body Medium – 14sp, weight 400, tracking +0.25 */
  m3BodyMedium: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
  },

  /** Body Small – 12sp, weight 400, tracking +0.4 */
  m3BodySmall: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },

  /** Label Large – 14sp, weight 500, tracking +0.1 */
  m3LabelLarge: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  /** Label Medium – 12sp, weight 500, tracking +0.5 */
  m3LabelMedium: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },

  /** Label Small – 11sp, weight 500, tracking +0.5 */
  m3LabelSmall: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};
