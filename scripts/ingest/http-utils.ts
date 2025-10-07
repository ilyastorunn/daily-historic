import { logDebug, logWarn } from './logger';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init: RequestInit,
  options: RetryOptions = {}
): Promise<Response> => {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 400;
  const maxDelayMs = options.maxDelayMs ?? 2_000;

  let lastError: unknown;


  const requestLabel =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : '[Request]';

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const meta = { request: requestLabel, attempt: attempt + 1, attempts };
    try {
      const response = await fetch(input, init);

      if (response.status >= 500 || response.status === 429) {
        lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
        logWarn('retryable-response', { ...meta, status: response.status });
      } else {
        if (attempt > 0) {
          logDebug('retry-recovered', meta);
        }
        return response;
      }
    } catch (error) {
      lastError = error;
      logWarn('retryable-error', { ...meta, error: (error as Error).message });
    }

    const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
    await wait(delay);
  }

  logWarn('retry-failed', { request: requestLabel, attempts });
  throw lastError ?? new Error('fetchWithRetry: unknown error');
};
