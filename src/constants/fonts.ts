/**
 * Inter by Rasmus Andersson, via `@expo-google-fonts/inter`.
 * Licensed under the SIL Open Font License 1.1 — see the package's LICENSE file.
 *
 * Why every weight is its own `fontFamily`:
 *
 * Inter declares a different family name per weight rather than one family with
 * many styles: `Inter_400Regular.ttf` and `Inter_700Bold.ttf` both use nameID 1
 * = "Inter", but Medium, SemiBold, ExtraBold, Black, Light, ExtraLight and Thin
 * each use their own ("Inter Medium", "Inter SemiBold", ...). So
 * `fontFamily: 'Inter'` + `fontWeight: '600'` resolves to nothing — the family
 * "Inter SemiBold" does not exist under that name.
 *
 * On top of that, Expo SDK 57 cannot interpolate weights inside a family:
 * `useFonts` only accepts a flat `Record<string, FontSource>` (the array form
 * with `FontFamilyDefinition` landed in SDK 58), and native variable-font support
 * also landed in SDK 58. So the static TTFs are the only option here, and each
 * one has to be its own family.
 *
 * Each key below is the font's PostScript name, which is also the filename. That
 * makes the name resolve identically on all three platforms:
 *   - Android: the config plugin derives the family from the filename
 *   - iOS:     React Native resolves `fontFamily` by PostScript name
 *   - Web:     `useFonts` emits an `@font-face` using the map key
 *
 * The practical consequence: to render a weight you set `fontFamily` to that
 * weight's name and leave `fontWeight` alone. Setting `fontWeight` on top of one
 * of these families is a no-op, and can trigger synthetic bolding on Android.
 *
 * Italics are not bundled — no screen renders them today. Add the
 * `*_Italic` files from the package and matching entries here if that changes.
 */

export const InterFont = {
  thin: 'Inter-Thin',
  extraLight: 'Inter-ExtraLight',
  light: 'Inter-Light',
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extraBold: 'Inter-ExtraBold',
  black: 'Inter-Black',
} as const;

export type InterFontFamily = (typeof InterFont)[keyof typeof InterFont];

/**
 * Pass straight to `useFonts`. Every weight is registered under its own
 * PostScript name so the `fontFamily` you write is the same string everywhere.
 */
export const InterFontMap = {
  [InterFont.thin]: require('@expo-google-fonts/inter/100Thin/Inter_100Thin.ttf'),
  [InterFont.extraLight]: require('@expo-google-fonts/inter/200ExtraLight/Inter_200ExtraLight.ttf'),
  [InterFont.light]: require('@expo-google-fonts/inter/300Light/Inter_300Light.ttf'),
  [InterFont.regular]: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  [InterFont.medium]: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  [InterFont.semiBold]: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  [InterFont.bold]: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  [InterFont.extraBold]: require('@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf'),
  [InterFont.black]: require('@expo-google-fonts/inter/900Black/Inter_900Black.ttf'),
} as const;

/** The editorial serif is reserved for the Socially wordmark. */
export const BrandFont = {
  wordmark: 'CormorantGaramond-SemiBold',
} as const;

// Load the actual 600 cut, rather than asking a regular face for synthetic bold.
// Bundled TTFs also make this work in Expo Go and existing development builds.
export const AppFontMap = {
  ...InterFontMap,
  [BrandFont.wordmark]: require('@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf'),
} as const;

/** Every real weight Inter ships, in CSS terms. There is a true 600, so the
 * 600s in the existing styles resolve to SemiBold rather than snapping up to
 * Bold the way they had to with a 5-weight family. */
export type InterWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const InterWeightMap = {
  100: InterFont.thin,
  200: InterFont.extraLight,
  300: InterFont.light,
  400: InterFont.regular,
  500: InterFont.medium,
  600: InterFont.semiBold,
  700: InterFont.bold,
  800: InterFont.extraBold,
  900: InterFont.black,
} as const satisfies Record<number, InterFontFamily>;

/**
 * Resolves a CSS `fontWeight` to a real Inter family. Prefer setting
 * `fontFamily` from the returned value over setting `fontWeight`, because SDK 57
 * cannot interpolate between the shipped cuts.
 */
export function interFamily(weight: number): InterFontFamily {
  const key = (weight in InterWeightMap ? weight : 400) as keyof typeof InterWeightMap;
  return InterWeightMap[key];
}
