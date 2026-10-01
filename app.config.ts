import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Socially',
  slug: config.slug ?? 'socially-trade',
  ios: { ...config.ios, bundleIdentifier: config.ios?.bundleIdentifier ?? 'com.socially.trade' },
  android: { ...config.android, package: config.android?.package ?? 'com.socially.trade' },
  extra: {
    ...config.extra,
    // App/client IDs are public. Never copy PRIVY_APP_SECRET into client config.
    privy: {
      appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? process.env.PRIVY_APP_ID ?? '',
      clientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? process.env.PRIVY_CLIENT_ID ?? '',
    },
  },
});
