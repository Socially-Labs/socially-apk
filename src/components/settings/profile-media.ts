import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type ProfileMediaKind = 'photo' | 'banner';

export async function pickProfileMedia(kind: ProfileMediaKind): Promise<string | null> {
  // The system picker grants access to the selected image without broad library access.
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], allowsEditing: kind === 'photo', aspect: [1, 1], quality: 1,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  try {
    const ratio = kind === 'photo' ? 1 : 3;
    let { width, height } = asset;
    if (!width || !height) {
      const source = await context.renderAsync();
      width = source.width; height = source.height; source.release();
    }
    const cropWidth = Math.min(width, height * ratio);
    const cropHeight = cropWidth / ratio;
    context.crop({ originX: (width - cropWidth) / 2, originY: (height - cropHeight) / 2, width: cropWidth, height: cropHeight });
    context.resize({ width: kind === 'photo' ? 512 : 1200 });
    const rendered = await context.renderAsync();
    try { return (await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 })).uri; }
    finally { rendered.release(); }
  } finally { context.release(); }
}

export function restoreMediaUri(uri: unknown): string | null {
  if (typeof uri !== 'string') return null;
  // Only restore files created by this app. Resolve against the current sandbox,
  // which can change on iOS when the app is updated or restored.
  const filename = uri.split('/').pop();
  if (!filename || !/^profile-[\w-]+\.jpg$/.test(filename)) return null;
  const file = new File(Paths.document, 'profile-media', filename);
  return file.exists ? file.uri : null;
}

export async function persistMedia(uri: string | null): Promise<string | null> {
  if (!uri) return null;
  const directory = new Directory(Paths.document, 'profile-media');
  if (uri.startsWith(directory.uri)) return uri;
  await directory.create({ idempotent: true, intermediates: true });
  const target = new File(directory, `profile-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
  try { await new File(uri).copy(target); }
  catch (error) { await deleteMedia(target.uri); throw error; }
  return target.uri;
}

export async function deleteMedia(uri: string | null) {
  if (!uri || !uri.startsWith(new Directory(Paths.document, 'profile-media').uri)) return;
  try { const file = new File(uri); if (file.exists) await file.delete(); } catch { /* Cleanup never invalidates a saved profile. */ }
}
