import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform, Share } from 'react-native';

export async function openSettingsLink(url: string) {
  if (!url.startsWith('https://')) throw new Error('This link is unavailable. Please try again later.');
  try { await WebBrowser.openBrowserAsync(url); }
  catch { throw new Error('The page couldn’t be opened. Please try again or copy the link below.'); }
}

export async function shareSettingsText(title: string, message: string): Promise<'shared' | 'copied' | 'cancelled'> {
  if (Platform.OS === 'web') {
    if (navigator.share) {
      try { await navigator.share({ title, text: message }); return 'shared'; }
      catch (cause) { if (cause instanceof Error && cause.name === 'AbortError') return 'cancelled'; }
    }
    if (navigator.clipboard) {
      try { await navigator.clipboard.writeText(message); return 'copied'; }
      catch { /* Keep the visible, selectable link as the final fallback. */ }
    }
    throw new Error('Sharing isn’t available in this browser. Select and copy the text below.');
  }
  const result = await Share.share({ title, message });
  return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
}

export async function contactSupport(email: string, subject: string, message: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Support contact details are currently unavailable.');
  try { await Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`); }
  catch { throw new Error(`A mail app couldn’t be opened. You can email ${email} directly.`); }
}
