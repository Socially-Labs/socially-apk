import Constants from 'expo-constants';

export const appVersion = Constants.expoConfig?.version ?? '1.0.0';
export const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@socially.trade';
export const supportUrl = process.env.EXPO_PUBLIC_SUPPORT_URL?.trim() ?? '';
export const titles: Record<string, string> = {
  account: 'Account', profile: 'Edit profile', display: 'Display', referral: 'Refer a friend', support: 'Help & support',
  terms: 'Terms of Service', privacy: 'Privacy Policy', about: 'About Socially',
};
