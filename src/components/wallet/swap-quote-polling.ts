/** One request at a time, three seconds between responses. Cleanup invalidates late replies. */
export function startSwapQuotePolling<T>({ request, onQuote, onError, onLoading }: {
  request: (signal: AbortSignal) => Promise<T>;
  onQuote: (quote: T) => void;
  onError: (error: unknown) => void;
  onLoading: () => void;
}) {
  const controller = new AbortController();
  let failures = 0;
  let timer: ReturnType<typeof setTimeout>;
  async function poll() {
    if (controller.signal.aborted) return;
    onLoading();
    try {
      const quote = await request(controller.signal);
      if (controller.signal.aborted) return;
      failures = 0;
      onQuote(quote);
    } catch (error) {
      if (controller.signal.aborted) return;
      failures++;
      onError(error);
    } finally {
      if (!controller.signal.aborted) timer = setTimeout(poll, failures ? Math.min(60_000, 3_000 * 2 ** failures) : 3_000);
    }
  }
  timer = setTimeout(poll, 450);
  return () => { controller.abort(); clearTimeout(timer); };
}
