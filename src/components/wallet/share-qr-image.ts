import type { RefObject } from 'react';
import { Platform, ToastAndroid, TurboModuleRegistry, type View } from 'react-native';
import { QrSharingUnavailableError } from './qr-share-error';

async function captureCard(ref: RefObject<View | null>, height: number, width: number) {
  const { captureRef } = await import('react-native-view-shot');
  return captureRef(ref, { format: 'png', result: 'tmpfile', fileName: 'socially-receive-qr', width: 960, height: Math.round(height * 960 / width) });
}

/** Outgoing images use the system chooser; no WhatsApp-specific permissions. */
export async function shareQrImage(ref: RefObject<View | null>, height: number, canShare: () => boolean, width = 320, message = '', onFallback?: (notice: string) => void) {
  // Check before importing: RNShare calls getEnforcing at module evaluation time.
  // Expo Go and binaries built before this dependency cannot load that module.
  const nativeReady = !!TurboModuleRegistry.get('RNShare');
  const Sharing = nativeReady ? null : await import('expo-sharing');
  if (Sharing && !await Sharing.isAvailableAsync()) throw new QrSharingUnavailableError();
  const Share = nativeReady ? (await import('react-native-share')).default : null;
  const { releaseCapture } = await import('react-native-view-shot');
  const uri = await captureCard(ref, height, width);
  try {
    if (!canShare()) throw new Error('This request has ended. Create a new QR to share.');
    if (Share) await Share.open({ url: uri, type: 'image/png', message, title: 'Share your Socially QR', failOnCancel: false });
    else if (Sharing) {
      // Expo Go supports image sharing, but its file API cannot attach a caption.
      let copied = false;
      try { copied = !!message && await (await import('expo-clipboard')).setStringAsync(message); } catch { /* The image remains shareable if the clipboard is unavailable. */ }
      if (!canShare()) throw new Error('This request has ended. Create a new QR to share.');
      const notice = copied ? 'Greeting and address copied. Paste them as the image caption.' : 'The QR image includes your full wallet address.';
      onFallback?.(notice);
      if (Platform.OS === 'android') ToastAndroid.show(notice, ToastAndroid.LONG);
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share your Socially QR' });
    }
    // Keep the temporary file alive for receiving apps. View-shot cleans it at app exit.
  } catch (error) { releaseCapture(uri); throw error; }
}

export async function saveQrImage(ref: RefObject<View | null>, height: number, canShare: () => boolean, width = 320) {
  // SDK 57 retains this save-only API under /legacy; the root export throws.
  const MediaLibrary = await import('expo-media-library/legacy');
  if (Platform.OS === 'ios' || (Platform.OS === 'android' && Number(Platform.Version) < 33)) {
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) throw new Error('Allow photo saving in Settings, or use Share image instead.');
  }
  const { releaseCapture } = await import('react-native-view-shot');
  const uri = await captureCard(ref, height, width);
  try {
    if (!canShare()) throw new Error('This request has ended. Create a new QR to share.');
    await MediaLibrary.saveToLibraryAsync(uri);
  } finally { releaseCapture(uri); }
}
