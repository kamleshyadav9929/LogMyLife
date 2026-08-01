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
};
