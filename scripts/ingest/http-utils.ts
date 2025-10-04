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

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);

      if (response.status >= 500 || response.status === 429) {
        lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
      } else {
        return response;
      }
    } catch (error) {
      lastError = error;
    }

    const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
    await wait(delay);
  }

  throw lastError ?? new Error('fetchWithRetry: unknown error');
};
