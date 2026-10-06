import { ApiError, type AccountRole, type BackendAccount, type ProfilePatch, type createApiClient } from './client.ts';

type Api = ReturnType<typeof createApiClient>;
export type AccountState = { subject: string | null; status: 'idle' | 'loading' | 'ready' | 'error'; account: BackendAccount | null; error: string | null };
export const idleAccount: AccountState = { subject: null, status: 'idle', account: null, error: null };
export type UploadBody = { body: Blob; size: number };

/** One current identity, cancellable requests, and no persistent access tokens. */
export class AccountStore {
  private state: AccountState = idleAccount;
  private generation = 0;
  private listeners = new Set<() => void>();
  private requests = new Set<AbortController>();
  private api: Api;
  constructor(api: Api) { this.api = api; }
  snapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(state: AccountState) { this.state = state; for (const listener of this.listeners) listener(); }
  stop = () => {
    this.generation++;
    for (const request of this.requests) request.abort();
    this.requests.clear();
    this.publish(idleAccount);
  };
  start = (subject: string | null) => {
    if (subject === this.state.subject && ['loading', 'ready'].includes(this.state.status)) return;
    this.stop();
    if (!subject) return;
    const generation = this.generation;
    const controller = new AbortController();
    this.requests.add(controller);
    this.publish({ subject, status: 'loading', account: null, error: null });
    void this.api.bootstrap(subject, controller.signal).then(async bootstrapped => {
      const account = await this.api.me(controller.signal);
      if (account.id !== bootstrapped.id) throw new ApiError('identity_mismatch', 'The account service returned a different account.');
      return account;
    }).then(account => {
      if (!controller.signal.aborted && generation === this.generation) {
        this.publish({ subject, status: 'ready', account, error: null });
      }
    }).catch(cause => {
      if (!controller.signal.aborted && generation === this.generation) {
        this.publish({ subject, status: 'error', account: null,
          error: cause instanceof Error ? cause.message : 'Your account could not be loaded.' });
      }
    }).finally(() => this.requests.delete(controller));
  };
  retry = () => { const subject = this.state.subject; this.stop(); this.start(subject); };
  private async scoped<T>(work: (signal: AbortSignal) => Promise<T>, externalSignal?: AbortSignal): Promise<T> {
    if (this.state.status !== 'ready') throw new ApiError('session_required', 'Wait for your account to connect.');
    const generation = this.generation;
    const controller = new AbortController();
    const abort = () => controller.abort();
    externalSignal?.addEventListener('abort', abort, { once: true });
    if (externalSignal?.aborted) controller.abort();
    this.requests.add(controller);
    // Covers the complete upload flow, including signed storage requests.
    const timeout = setTimeout(abort, 45_000);
    try {
      if (controller.signal.aborted) throw new ApiError('request_cancelled', 'Account request cancelled.');
      const result = await work(controller.signal);
      if (controller.signal.aborted || generation !== this.generation) throw new ApiError('request_cancelled', 'Account request cancelled.');
      return result;
    } finally {
      clearTimeout(timeout); externalSignal?.removeEventListener('abort', abort); this.requests.delete(controller);
    }
  }
  private async save(work: (signal: AbortSignal) => Promise<BackendAccount>) {
    const result = await this.scoped(work);
    if (result.id !== this.state.account?.id) throw new ApiError('identity_mismatch', 'The profile response belongs to a different account.');
    this.publish({ ...this.state, status: 'ready', account: result, error: null });
    return result;
  }
  usernameAvailable = (username: string, signal?: AbortSignal) => this.scoped(ownSignal => this.api.usernameAvailable(username, ownSignal), signal);
  saveProfile = (patch: ProfilePatch) => this.save(signal => this.api.updateProfile(patch, signal));
  submitSupport = (body: { message: string; appVersion: string; platform: string }) => this.scoped(signal => this.api.submitSupport(body, signal));
  completeSignup = (username: string, role: AccountRole, displayName?: string) => this.save(signal => this.api.onboarding({ username, role, displayName }, signal));
  uploadImage = (kind: 'avatar' | 'banner', uri: string,
    readImage: (uri: string, signal: AbortSignal) => Promise<UploadBody>, uploadFetch: typeof fetch): Promise<string> => {
    return this.scoped(async signal => {
      const { body, size } = await readImage(uri, signal);
      if (size < 1 || size > 5_242_880) throw new Error('Choose an image smaller than 5 MB.');
      const result = await this.api.request('/v0/me/assets/uploads', { method: 'POST', signal,
        body: { kind, contentType: 'image/jpeg', byteSize: size } });
      if (!result || typeof result !== 'object' || !('uploadId' in result) || typeof result.uploadId !== 'string' ||
        !/^[0-9a-f-]{36}$/i.test(result.uploadId) || !('uploadUrl' in result) || typeof result.uploadUrl !== 'string' || !result.uploadUrl.startsWith('https://')) {
        throw new ApiError('invalid_response', 'Image upload could not be prepared.');
      }
      const response = await uploadFetch(result.uploadUrl, { method: 'PUT', signal, headers: { 'Content-Type': 'image/jpeg' }, body });
      if (!response.ok) throw new Error('Your image could not be uploaded. Please try again.');
      const completed = await this.api.request(`/v0/me/assets/uploads/${encodeURIComponent(result.uploadId)}/complete`, { method: 'POST', body: {}, signal });
      if (!completed || typeof completed !== 'object' || !('asset' in completed) || !completed.asset || typeof completed.asset !== 'object' ||
        !('url' in completed.asset) || typeof completed.asset.url !== 'string' || !completed.asset.url.startsWith('https://')) {
        throw new ApiError('invalid_response', 'Image upload could not be confirmed.');
      }
      return completed.asset.url;
    });
  };
}
