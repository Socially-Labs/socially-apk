/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

import { InterFont } from './fonts';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Text faces. Inter is the app's default for everything that is prose — see
 * ./fonts for why each weight is its own family name and why you should set
 * `fontFamily` rather than `fontWeight`.
 *
 * `rounded` and `mono` stay on the platform system faces: Inter ships neither a
 * rounded nor a monospaced cut, and pointing those at Inter would be wrong.
 * These two keep the CSS variables on web, where the font stack needs a real
 * `font-family` list rather than a single name.
 */
export const Fonts = {
  /** Default text and display face. */
  sans: InterFont.regular,
  /** Inter is a grotesque rather than a serif, so serif requests keep Georgia. */
  serif: Platform.select({
    ios: 'ui-serif',
    web: 'var(--font-serif)',
    default: 'serif',
  }),
  /** No rounded cut in Inter — keep the platform's rounded face. */
  rounded: Platform.select({
    ios: 'ui-rounded',
    web: 'var(--font-rounded)',
    default: 'normal',
  }),
  /** No monospaced cut in Inter — keep the platform's mono stack. */
  mono: Platform.select({
    ios: 'ui-monospace',
    web: 'var(--font-mono)',
    default: 'monospace',
  }),
  ...InterFont,
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** The fixed light auth panel sits over the voyage artwork in either theme. */
export const AuthPanel = {
  backdrop: '#D9E5EF',
  surface: '#FFFFFF',
  glass: ['rgba(255,255,255,0.94)', 'rgba(249,251,255,0.94)'] as const,
  field: 'rgba(246,248,252,0.32)',
  ink: '#191E43',
  secondary: '#7D8DAC',
  caption: '#94A2BF',
  placeholder: '#66758C',
  border: '#E1E6F0',
  divider: '#D8DFEC',
  focusBorder: '#8C9EB7',
  primary: '#596C86',
  primaryGradient: ['#60728A', '#576981'] as const,
  disabled: '#748299',
  clear: '#BDC5D3',
  error: '#A3333F',
  panelShadow: '0 18px 54px rgba(72, 95, 127, 0.12)',
  buttonShadow: 'none',
  // Measured against the supplied 853px reference at a 393pt phone width.
  inputSize: 13,
  codeSize: 26,
  bodySize: 14,
  captionSize: 10,
  buttonSize: 13,
  socialSize: 13,
  panelRadius: 22,
  controlRadius: 10,
} as const;
