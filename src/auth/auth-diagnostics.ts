import { apiOrigin } from '../api/client.ts';

export type AuthOperation = 'send' | 'verify' | 'oauth' | 'logout';
export function authFailureDetails(cause: unknown) {
  const error = cause && typeof cause === 'object' ? cause as Record<string, unknown> : {};
  const code = typeof error.code === 'string' && /^[a-z][a-z0-9_]{0,79}$/i.test(error.code) ? error.code : 'unknown_error';
  const status = typeof error.status === 'number' && Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 ? error.status : undefined;
  return { code, ...(status ? { status } : {}) };
}

/** No email, OTP, token, raw provider message or account identifier leaves the app. */
export async function reportAuthFailure(operation: AuthOperation, cause: unknown, platform: string,
  origin = process.env.EXPO_PUBLIC_API_URL, fetchImpl: typeof fetch = fetch) {
  const details = { operation, platform, ...authFailureDetails(cause) };
  console.warn('[Socially auth] Privy operation failed', details);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3_000);
  try {
    await fetchImpl(`${apiOrigin(origin)}/v0/auth/client-events`, { method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) });
  } catch { /* Diagnostics cannot block sign-in or replace the provider's error. */ }
  finally { clearTimeout(timer); }
}
