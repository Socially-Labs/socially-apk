const localHost = (host: string) => {
  if (host === 'localhost' || host === '[::1]') return true;
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 192 && parts[1] === 168 || parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
};

/** Opt-in local development only. Keep API port and never reroute a hosted API. */
export function developmentOrigin(configured: string | undefined, hostUri: string | undefined, enabled: boolean): string | undefined {
  if (!enabled || !configured || !hostUri) return configured;
  try {
    const api = new URL(configured);
    const metro = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`);
    if (api.protocol !== 'http:' || api.username || api.password || api.pathname !== '/' || api.search || api.hash ||
      !['http:', 'https:'].includes(metro.protocol) || metro.username || metro.password ||
      !localHost(api.hostname) || !localHost(metro.hostname)) return configured;
    api.hostname = metro.hostname;
    return api.origin;
  } catch { return configured; }
}
