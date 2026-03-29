/**
 * Pipeline utilities: timeout wrapping and retry logic.
 * These are pure functions with no side-effects — safe to use in any agent node.
 */

/**
 * Wraps a promise in a hard timeout.
 * If the promise does not resolve within `ms` milliseconds, rejects with a clear error.
 *
 * @param promise  The async operation to guard
 * @param ms       Deadline in milliseconds
 * @param label    Human-readable name for the operation (used in error message)
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`[Timeout] "${label}" exceeded ${ms}ms deadline`));
    }, ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Retries an async factory function up to `maxAttempts` times with exponential back-off.
 * Stops immediately on success; throws the last error if all attempts fail.
 *
 * @param fn           Factory that returns the promise to execute
 * @param maxAttempts  Maximum number of attempts (default: 2)
 * @param baseDelayMs  Initial back-off delay in ms — doubles each retry (default: 500)
 * @param label        Human-readable name for logging
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 2,
  baseDelayMs = 500,
  label = "operation"
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * 2 ** (attempt - 1);
        console.warn(`[Retry] "${label}" attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms…`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

// ── Timeout budgets (ms) ──────────────────────────────────────────────────────
// Centralised so the whole pipeline is easy to tune from one place.
export const TIMEOUTS = {
  vision:   20_000,  // Gemini vision: 20 s
  search:   10_000,  // SerpAPI HTTP:  10 s
  rank:     30_000,  // CLIP (model load + inference): 30 s
  refine:   15_000,  // Gemini text:   15 s
  generate: 60_000,  // DALL·E 3 × 3:  60 s
} as const;

// ── Iteration cap ─────────────────────────────────────────────────────────────
/** Hard maximum number of refine → search cycles before forcing generation. */
export const MAX_ITERATIONS = 2;
