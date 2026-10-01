import { useEffect, useRef, useState } from 'react';

import { authErrorMessage, RESEND_COOLDOWN_MS, secondsUntilResend, validEmail } from '@/auth/auth-errors';
import { useAuth, type SocialProvider } from '@/auth/session';

export function useEmailAuth() {
  const { sendCode, verifyCode, loginWithSocial, oauthPending, oauthError, isReady } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [pending, setPending] = useState<'send' | 'verify' | 'resend' | SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissedOAuthError, setDismissedOAuthError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const busy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!resendAt) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= resendAt) clearInterval(interval);
    };
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [resendAt]);

  const updateEmail = (value: string) => {
    setEmail(value);
    setError(null);
    setDismissedOAuthError(oauthError);
  };
  const updateCode = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    setError(null);
    setDismissedOAuthError(oauthError);
    setNotice(null);
  };

  async function requestCode(resend = false) {
    if (busy.current || oauthPending || !isReady) return;
    if (resend && Date.now() < resendAt) return;
    const address = email.trim();
    if (!validEmail(address)) {
      setError('Enter a valid email address to continue.');
      return;
    }
    busy.current = true;
    setPending(resend ? 'resend' : 'send');
    setError(null);
    setDismissedOAuthError(oauthError);
    setNotice(null);
    try {
      await sendCode(address);
      if (!mounted.current) return;
      setEmail(address);
      setCode('');
      setStage('code');
      const time = Date.now();
      setNow(time);
      setResendAt(time + RESEND_COOLDOWN_MS);
      if (resend) setNotice('A new code is on its way.');
    } catch (cause) {
      if (mounted.current) setError(authErrorMessage(cause, 'send'));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(null);
    }
  }

  async function submitCode() {
    if (busy.current || oauthPending || !isReady) return;
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    busy.current = true;
    setPending('verify');
    setError(null);
    setNotice(null);
    try {
      await verifyCode(email, code);
      // The session provider updates the protected routes after verification.
    } catch (cause) {
      if (mounted.current) setError(authErrorMessage(cause, 'verify'));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(null);
    }
  }

  function changeEmail() {
    if (busy.current) return;
    setStage('email');
    setCode('');
    setError(null);
    setDismissedOAuthError(oauthError);
    setNotice(null);
  }

  async function requestSocial(provider: SocialProvider) {
    if (busy.current || oauthPending || !isReady) return;
    busy.current = true;
    setPending(provider);
    setError(null);
    setDismissedOAuthError(oauthError);
    try {
      await loginWithSocial(provider);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      if (mounted.current && !/cancel|dismiss/i.test(message)) setError(authErrorMessage(cause, 'oauth'));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(null);
    }
  }

  const oauthMessage = oauthError instanceof Error ? oauthError.message : '';
  const visibleOAuthError = oauthError && oauthError !== dismissedOAuthError && !/cancel|dismiss/i.test(oauthMessage)
    ? authErrorMessage(oauthError, 'oauth') : null;

  return {
    email, code, stage, pending, error: error || visibleOAuthError, notice, isReady, oauthPending,
    resendIn: secondsUntilResend(resendAt, now),
    updateEmail, updateCode, requestCode, submitCode, changeEmail, requestSocial,
  };
}
