import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Socially',
  slug: config.slug ?? 'socially-trade',
  ios: { ...config.ios, bundleIdentifier: config.ios?.bundleIdentifier ?? 'com.socially.trade' },
  android: { ...config.android, ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}), package: config.android?.package ?? 'com.socially.trade' },
  plugins: [
    ...(config.plugins ?? []),
    ['expo-sharing', { ios: { enabled: false }, android: { enabled: false } }],
    ['expo-media-library', { photosPermission: false, savePhotosPermission: 'Allow Socially to save your QR card to Photos.', granularPermissions: [] }],
  ],
  extra: {
    ...config.extra,
    ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID ? { eas: { ...config.extra?.eas, projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } } : {}),
    // App/client IDs are public. Never copy PRIVY_APP_SECRET into client config.
    privy: {
      appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? process.env.PRIVY_APP_ID ?? '',
      clientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? process.env.PRIVY_CLIENT_ID ?? '',
    },
  },
});
