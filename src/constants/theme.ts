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

/** The airy, fixed-light voyage dashboard shown in the home reference. */
export const Dashboard = {
  background: '#F5F7FB',
  ink: '#070E27',
  secondary: '#8A97B1',
  icon: '#7B8BA9',
  line: '#E0E6F0',
  glass: 'rgba(255,255,255,0.82)',
  softGlass: 'rgba(255,255,255,0.64)',
  positive: '#00B875',
  positiveTint: 'rgba(0,184,117,0.07)',
  negative: '#FF3B57',
  negativeTint: 'rgba(255,59,87,0.06)',
  activeGradient: ['#657A9C', '#506587'] as const,
  shadow: '0 12px 34px rgba(84,107,146,0.12)',
  maxWidth: 560,
} as const;

/** Wallet surfaces stay light so the voyage artwork reads through the cards. */
export const WalletPalette = {
  ink: '#080D25', secondary: '#8390A8', surface: 'rgba(255,255,255,0.72)',
  assetSurface: 'rgba(255,255,255,0.48)',
  border: 'rgba(220,226,235,0.75)', muted: 'rgba(231,237,244,0.74)',
  veil: 'rgba(255,255,255,0.28)',
  deposit: ['#43E299', '#2DD483'] as const,
  withdraw: ['#86CDFF', '#60B8FA'] as const,
  selected: '#CAE4FF', selectedInk: '#384963', white: '#FFFFFF', usdc: '#3284D5',
  shadow: '0 8px 24px rgba(87,110,145,0.07)',
  headerTitleSize: 18, balanceSize: 39, bodySize: 15, actionLabelSize: 13, captionSize: 11,
} as const;

/** Rounded, inset detail sheets inherit the dashboard's cool white surfaces. */
export const DashboardSheetTheme = {
  surface: '#F6F9FD',
  gradient: ['#FCFDFF', '#F0F5FC'] as const,
  border: 'rgba(255,255,255,0.94)',
  body: 'rgba(255,255,255,0.7)',
  bodyBorder: 'rgba(221,229,241,0.64)',
  backdrop: 'rgba(27,44,70,0.3)',
  handle: '#AEBED2',
  close: '#E9EFF8',
  shadow: '0 20px 56px rgba(37,60,96,0.2)',
  radius: 32,
  bodyRadius: 22,
  titleSize: 20,
  inset: 8,
  openDuration: 360,
  closeDuration: 260,
} as const;

/** Water highlights and troughs sampled from the pale voyage artwork. */
export const SplashWaterPalette = {
  crest: '#F7FAFC',
  trough: '#879CA9',
} as const;

/** Settings extend the voyage cards with quieter icon wells and a blue crew badge. */
export const SettingsPalette = {
  ink: Dashboard.ink,
  secondary: '#78869F',
  surface: Dashboard.glass,
  iconWell: 'rgba(231,237,245,0.64)',
  avatar: '#DEE5EF',
  line: 'rgba(224,230,240,0.8)',
  badge: '#E4EFFF',
  accent: '#315E99',
  primary: '#596F90',
  primaryInk: '#FFFFFF',
  danger: '#A3333F',
  dangerTint: 'rgba(163,51,63,0.06)',
  field: 'rgba(255,255,255,0.88)',
  cardRadius: 24,
  titleSize: 28,
  rowTitleSize: 15,
  bodySize: 13,
} as const;
