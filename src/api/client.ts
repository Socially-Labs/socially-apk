export type AccountRole = 'crew' | 'captain';
export type BackendAccount = {
  id: string; displayName: string; username: string | null; role: AccountRole | null;
  bio: string; avatarUrl: string | null; bannerUrl: string | null;
  hideBalances: boolean; avatarKind: 'captain' | 'initials';
  mode: 'PAPER'; paperCash: { value: string; asset: 'USDC' };
};
export type ProfilePatch = Partial<Pick<BackendAccount, 'displayName' | 'bio' | 'avatarUrl' | 'bannerUrl' | 'hideBalances' | 'avatarKind'>> & {
  username?: string; role?: AccountRole;
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 0) { super(message); this.code = code; this.status = status; }
}
export function apiOrigin(value: string | undefined): string {
  if (!value) throw new ApiError('api_unconfigured', 'The account service is not configured.');
  let url: URL;
  try { url = new URL(value); } catch { throw new ApiError('api_unconfigured', 'The account service URL is invalid.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new ApiError('api_unconfigured', 'The account service URL must be an HTTP(S) origin.');
  }
  return url.origin;
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const imageUrl = (value: unknown) => value === null || (typeof value === 'string' && value.length <= 2048 && /^https:\/\//.test(value));
export function parseAccount(value: unknown): BackendAccount {
  if (!record(value) || typeof value.id !== 'string' || !uuid.test(value.id) || typeof value.displayName !== 'string' ||
    !(value.username === null || (typeof value.username === 'string' && /^[a-z0-9_]{3,24}$/.test(value.username))) ||
    !(value.role === null || value.role === 'crew' || value.role === 'captain') ||
    (value.username === null) !== (value.role === null) || typeof value.bio !== 'string' ||
    !imageUrl(value.avatarUrl) || !imageUrl(value.bannerUrl) || value.mode !== 'PAPER' ||
    !(value.hideBalances === undefined || typeof value.hideBalances === 'boolean') ||
    !(value.avatarKind === undefined || value.avatarKind === 'captain' || value.avatarKind === 'initials') ||
    !record(value.paperCash) || value.paperCash.asset !== 'USDC' || typeof value.paperCash.value !== 'string' ||
    !/^\d{1,20}(\.\d{1,18})?$/.test(value.paperCash.value)) {
    throw new ApiError('invalid_response', 'The account service returned an unexpected response. Please try again.');
  }
  return { ...value, hideBalances: value.hideBalances ?? false, avatarKind: value.avatarKind ?? 'captain' } as BackendAccount;
}

export function createApiClient({ origin, getAccessToken, fetchImpl = fetch, timeoutMs = 15_000 }: {
  origin: string | undefined; getAccessToken: () => Promise<string | null>;
  fetchImpl?: typeof fetch; timeoutMs?: number;
}) {
  async function request(path: string, { method = 'GET', body, signal, idempotencyKey, authenticated = true, retryConnection = false }: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown; signal?: AbortSignal; idempotencyKey?: string; authenticated?: boolean; retryConnection?: boolean;
  } = {}): Promise<unknown> {
    const base = apiOrigin(origin);
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const token = authenticated ? await new Promise<string | null>((resolve, reject) => {
          const cancelled = () => reject(new ApiError('request_cancelled', 'Account request cancelled.'));
          controller.signal.addEventListener('abort', cancelled, { once: true });
          if (controller.signal.aborted) { cancelled(); return; }
          getAccessToken().then(resolve, reject).finally(() => controller.signal.removeEventListener('abort', cancelled));
        }) : null;
        if (controller.signal.aborted) throw new ApiError('request_cancelled', 'Account request cancelled.');
        if (authenticated && !token) throw new ApiError('session_required', 'Please sign in again to connect your account.');
        const send = () => fetchImpl(`${base}${path}`, {
          method, signal: controller.signal,
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        let response: Response;
        try { response = await send(); }
        catch (cause) {
          if (!retryConnection || controller.signal.aborted) throw cause;
          // Only account reads and repeatable bootstrap opt in. Never replay a
          // trade/send merely because the response was lost during a restart.
          await new Promise<void>((resolve, reject) => {
            const cancelled = () => { clearTimeout(timer); reject(new ApiError('request_cancelled', 'Account request cancelled.')); };
            const timer = setTimeout(() => { controller.signal.removeEventListener('abort', cancelled); resolve(); }, 2_000);
            controller.signal.addEventListener('abort', cancelled, { once: true });
            if (controller.signal.aborted) cancelled();
          });
          response = await send();
        }
        // Account bootstrap/profile writes are repeatable. Financial requests must use their own replay policy.
        if (response.status === 401 && attempt === 0) continue;
        let result: unknown;
        try { result = await response.json(); } catch { throw new ApiError('invalid_response', 'The account service returned an unreadable response.'); }
        if (!response.ok) {
          const code = record(result) && typeof result.error === 'string' ? result.error : 'request_failed';
          const message = response.status === 401 ? 'Your session could not be verified. Please sign out and sign in again.'
            : response.status >= 500 ? 'The account service is unavailable. Please try again.'
              : record(result) && typeof result.message === 'string' ? result.message : 'Your account changes could not be saved.';
          throw new ApiError(code, message, response.status);
        }
        return result;
      }
      throw new ApiError('unauthorized', 'Please sign in again.');
    } catch (cause) {
      if (timedOut) throw new ApiError('timeout', 'The account service took too long to respond. Please try again.');
      if (controller.signal.aborted) throw new ApiError('request_cancelled', 'Account request cancelled.');
      if (cause instanceof ApiError) throw cause;
      throw new ApiError('network_error', 'Couldn’t connect to the account service. Check your connection and try again.');
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }
  return {
    publicOrigin: () => apiOrigin(origin),
    request,
    async bootstrap(subject: string, signal?: AbortSignal) {
      const result = await request('/v0/auth/privy', { method: 'POST', body: {}, signal, retryConnection: true });
      if (!record(result) || result.privyUserId !== subject || result.provider !== 'privy' || result.mode !== 'PAPER') {
        throw new ApiError('identity_mismatch', 'The account service returned a different account. Please sign in again.');
      }
      return parseAccount(result.user);
    },
    async me(signal?: AbortSignal) { return parseAccount(await request('/v0/me', { signal, retryConnection: true })); },
    async onboarding(body: { username: string; role: AccountRole; displayName?: string }, signal?: AbortSignal) {
      return parseAccount(await request('/v0/me/onboarding', { method: 'POST', body, signal }));
    },
    async updateProfile(body: ProfilePatch, signal?: AbortSignal) {
      return parseAccount(await request('/v0/me', { method: 'PATCH', body, signal }));
    },
    async submitSupport(body: { message: string; appVersion: string; platform: string }, signal?: AbortSignal) {
      const result = await request('/v0/me/support-requests', { method: 'POST', body, signal });
      if (!record(result) || typeof result.id !== 'string' || !uuid.test(result.id) || result.status !== 'OPEN') {
        throw new ApiError('invalid_response', 'Your support request could not be confirmed. Please try again.');
      }
      return { id: result.id, status: 'OPEN' as const };
    },
    async usernameAvailable(username: string, signal?: AbortSignal) {
      const result = await request(`/v0/users/username-availability?username=${encodeURIComponent(username)}`, { signal });
      if (!record(result) || result.username !== username || typeof result.available !== 'boolean' || result.mode !== 'PAPER') {
        throw new ApiError('invalid_response', 'Username availability could not be checked. Please try again.');
      }
      return result.available;
    },
  };
}
