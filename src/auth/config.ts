import Constants from 'expo-constants';

type PrivyPublicConfig = { appId?: string; clientId?: string };
const config = Constants.expoConfig?.extra?.privy as PrivyPublicConfig | undefined;

export const privyConfig = {
  appId: (process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? config?.appId ?? '').trim(),
  clientId: (process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? config?.clientId ?? '').trim(),
};

// Published policies can be supplied without inventing legal copy for the app.
export const policyUrls = {
  terms: process.env.EXPO_PUBLIC_TERMS_URL?.trim() || 'https://socially.trade/terms',
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || 'https://socially.trade/privacy',
  site: process.env.EXPO_PUBLIC_SITE_URL?.trim() || 'https://socially.trade',
};
