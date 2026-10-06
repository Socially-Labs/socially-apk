import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import type { UploadBody } from '@/api/account-store';

export const uploadFetch = fetch;
export async function readProfileUpload(uri: string, signal: AbortSignal): Promise<UploadBody> {
  if (signal.aborted) throw new Error('Image upload cancelled.');
  if (!uri.startsWith('file://') && !uri.startsWith('content://')) throw new Error('Choose a new photo from your device.');
  const file = new File(uri);
  if (!file.exists) throw new Error('This image is no longer available. Choose it again.');
  return { body: file, size: file.size };
}
