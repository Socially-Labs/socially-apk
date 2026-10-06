export const OTP_LENGTH = 6;

/** A failed full code does not auto-retry on rerender or a duplicate autofill event. */
export function otpEdit(value: string, lastAttempt: string | null) {
  const code = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
  return { code, autoSubmit: code.length === OTP_LENGTH && code !== lastAttempt,
    lastAttempt: code.length < OTP_LENGTH ? null : code };
}
