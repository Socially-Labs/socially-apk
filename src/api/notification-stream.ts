/** Authenticated wakeups only. REST supplies durable, validated inbox records. */
export function subscribeNotificationChanges(options: {
  origin: string; getAccessToken: () => Promise<string | null>; cursor: () => string;
  onChange: () => void; onWalletChange?: () => void; onConnection: (connected: boolean) => void;
  socketFactory?: (url: string) => WebSocket;
}) {
  let stopped = false, socket: WebSocket | undefined, attempts = 0, lastMessage = Date.now();
  let retry: ReturnType<typeof setTimeout> | undefined, deadline: ReturnType<typeof setTimeout> | undefined;
  let reauthenticate: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    options.onConnection(false);
    if (!stopped) retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)) * (0.75 + Math.random() * 0.5));
  };
  const connect = () => {
    if (stopped) return;
    try { socket = (options.socketFactory ?? (url => new WebSocket(url)))(`${options.origin.replace(/^http/, 'ws').replace(/\/$/, '')}/v0/ws`); }
    catch { schedule(); return; }
    const current = socket;
    lastMessage = Date.now();
    const authenticate = () => { void options.getAccessToken().then(token => {
      if (stopped || socket !== current || current.readyState !== 1) return;
      if (token) current.send(JSON.stringify({ type: 'authenticate', accessToken: token })); else current.close();
    }).catch(() => current.close()); };
    deadline = setTimeout(() => current.close(), 10000);
    current.onopen = authenticate;
    current.onmessage = event => {
      if (stopped || socket !== current) return;
      lastMessage = Date.now();
      try {
        const message = JSON.parse(String(event.data));
        if (message.type === 'authenticated') {
          current.send(JSON.stringify({ type: 'subscribe', channel: 'account.notifications', cursorVersion: 2, after: options.cursor() }));
          clearTimeout(reauthenticate);
          const expiry = Date.parse(message.expiresAt);
          if (Number.isFinite(expiry)) reauthenticate = setTimeout(authenticate, Math.max(15000, expiry - Date.now() - 60000));
        } else if (message.channel === 'account.notifications' && message.type === 'subscribed') {
          clearTimeout(deadline); attempts = 0; options.onConnection(true); options.onChange();
        } else if (message.channel === 'account.notifications' && ['resync_required', 'notification'].includes(message.type)) options.onChange();
        else if (message.channel === 'account.notifications' && message.type === 'wallet.updated') options.onWalletChange?.();
        else if (['authentication_required', 'auth_expired', 'stream_unavailable', 'error'].includes(message.type)) current.close();
      } catch { /* Ignore malformed frames. They cannot create a notification. */ }
    };
    current.onerror = () => current.close();
    current.onclose = () => { if (socket !== current || stopped) return; clearTimeout(deadline); clearTimeout(reauthenticate); schedule(); };
  };
  const watchdog=setInterval(()=>{if(socket?.readyState===1 && Date.now()-lastMessage>60000)socket.close();},15000);
  connect();
  return () => { stopped = true; clearInterval(watchdog); clearTimeout(retry); clearTimeout(deadline); clearTimeout(reauthenticate); if (socket) { socket.onclose = null; socket.onmessage = null; socket.close(); } options.onConnection(false); };
}
