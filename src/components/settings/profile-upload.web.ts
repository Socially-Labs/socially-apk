import type { UploadBody } from '@/api/account-store';
export const uploadFetch = fetch;
export async function readProfileUpload(uri: string, signal: AbortSignal): Promise<UploadBody> {
  if (!uri.startsWith('data:image/jpeg;base64,')) throw new Error('Choose a new photo from your device.');
  const body = await (await fetch(uri, { signal })).blob();
  return { body, size: body.size };
}
