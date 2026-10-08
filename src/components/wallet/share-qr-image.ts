import type { RefObject } from 'react';
import { Platform, type View } from 'react-native';

async function captureCard(ref: RefObject<View | null>, height: number, width: number) {
  const { captureRef } = await import('react-native-view-shot');
  return captureRef(ref, { format: 'png', result: 'tmpfile', fileName: 'socially-receive-qr', width: 960, height: Math.round(height * 960 / width) });
}

/** Outgoing images use the system chooser; no WhatsApp-specific permissions. */
export async function shareQrImage(ref: RefObject<View | null>, height: number, canShare: () => boolean, width = 320, message = '') {
  const { default: Share } = await import('react-native-share');
  const { releaseCapture } = await import('react-native-view-shot');
  const uri = await captureCard(ref, height, width);
  try {
    if (!canShare()) throw new Error('This request has ended. Create a new QR to share.');
    await Share.open({ url: uri, type: 'image/png', message, title: 'Share your Socially QR', failOnCancel: false });
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
