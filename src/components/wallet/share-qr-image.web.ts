import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

async function captureCard(ref: RefObject<View | null>, height: number, canShare: () => boolean, width: number) {
  const uri = await captureRef(ref, { format: 'png', result: 'data-uri', width: 960, height: Math.round(height * 960 / width) });
  if (!canShare()) throw new Error('This request has ended. Create a new QR to share.');
  const blob = await (await fetch(uri)).blob();
  return new File([blob], 'socially-receive-qr.png', { type: 'image/png' });
}
function download(file: File) {
  const url = URL.createObjectURL(file), link = document.createElement('a');
  link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
export async function shareQrImage(ref: RefObject<View | null>, height: number, canShare: () => boolean, width = 320, message = '') {
  const file = await captureCard(ref, height, canShare, width);
  if (!canShare()) throw new Error('This request has ended. Create a new QR to share.');
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'My Socially QR', text: message }); }
    catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) throw error; }
    return;
  }
  download(file);
}
export async function saveQrImage(ref: RefObject<View | null>, height: number, canShare: () => boolean, width = 320) {
  const file = await captureCard(ref, height, canShare, width);
  if (!canShare()) throw new Error('This request has ended. Create a new QR to share.');
  download(file);
}
