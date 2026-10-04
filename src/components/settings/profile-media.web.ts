export type ProfileMediaKind = 'photo' | 'banner';

export async function pickProfileMedia(kind: ProfileMediaKind): Promise<string | null> {
  // Keep the file dialog synchronous with the press, including mobile Safari.
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  const file = await new Promise<File | null>(resolve => {
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => resolve(null), { once: true });
    input.click();
  });
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('Choose an image for your profile.');
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.src = url;
    await image.decode();
    const ratio = kind === 'photo' ? 1 : 3;
    const cropWidth = Math.min(image.naturalWidth, image.naturalHeight * ratio);
    const cropHeight = cropWidth / ratio;
    const canvas = document.createElement('canvas');
    canvas.width = kind === 'photo' ? 512 : 1200;
    canvas.height = canvas.width / ratio;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser couldn’t process this image. Try another browser.');
    context.drawImage(image, (image.naturalWidth - cropWidth) / 2, (image.naturalHeight - cropHeight) / 2,
      cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    // A bounded JPEG persists across reloads, unlike a temporary blob URL.
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally { URL.revokeObjectURL(url); }
}

export function restoreMediaUri(uri: unknown): string | null {
  return typeof uri === 'string' && uri.startsWith('data:image/jpeg;base64,') ? uri : null;
}
export async function persistMedia(uri: string | null) { return uri; }
export async function deleteMedia(_uri: string | null) {}
