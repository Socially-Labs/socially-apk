export function authErrorMessage(error: unknown, operation: 'send' | 'verify' | 'logout' | 'oauth'): string {
  const message = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'error' in error && typeof error.error === 'string' ? error.error : '';
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const text = `${message} ${code}`.toLowerCase();
  if (text.includes('auth_not_configured')) return 'Sign-in is temporarily unavailable. Please try again soon.';
  if (/rate.limit|too.many|429/.test(text)) return 'Too many attempts. Please wait a moment and try again.';
  if (/network|fetch|offline|connection/.test(text)) return 'Check your connection and try again.';
  if (/invalid_native_app_id|app.?identifier|app.?client|client.?id|configuration_error|email.*disabled|login.*disabled/.test(text)) {
    return 'Sign-in is unavailable for this app. Please contact support.';
  }
  if (operation === 'verify') {
    if (/expired|invalid.*code|invalid.*otp|incorrect.*code|code.*invalid|invalid_credentials/.test(text)) {
      return 'That code is invalid or has expired. Check it or request a new one.';
    }
    return 'We couldn’t verify your code. Please try again.';
  }
  if (operation === 'logout') return 'We couldn’t sign you out. Please try again.';
  if (operation === 'oauth') return 'We couldn’t complete sign-in. Please try again or continue with email.';
  return 'We couldn’t send your code. Check your email address and try again.';
}

export function validEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const RESEND_COOLDOWN_MS = 30_000;

export function secondsUntilResend(resendAt: number, now: number): number {
  return Math.max(0, Math.ceil((resendAt - now) / 1000));
}
