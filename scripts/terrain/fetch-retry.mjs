/**
 * The networked fetchers' shared bounded retry (16-REVIEW IN-08; RESEARCH
 * Pitfall 3): fetch-bev and fetch-overview retry a dropped socket or an HTTP 5xx
 * the same way, and give up with a failure that names what they were reading.
 *
 * Side-effect free: importing it starts no request and keeps no state. A
 * caller that counts its retries for a report does so through `onRetry`.
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** An error's message with its cause (undici reports `fetch failed` and puts the socket error in `cause`). */
export const reasonOf = (e) => {
  const msg = e && e.message ? e.message : String(e);
  return e && e.cause && e.cause.message ? `${msg} (${e.cause.message})` : msg;
};

/** A failure that a retry cannot fix (a 4xx status, a missing header, an ignored range, a wrong shape). */
export function finalError(msg) {
  const e = new Error(msg);
  e.final = true;
  return e;
}

/**
 * `attempt()` up to `attempts` times, waiting `backoffMs` x the attempt number
 * in between, and calling `onRetry(n, error)` before each wait. A failure made
 * by finalError is thrown at once; any other failure is retried. The last
 * failure throws `failText(label, attempts, error)`, by default
 * `<label> failed after <attempts> attempts: <reason>`.
 */
export async function withRetry(label, attempt, { attempts, backoffMs, onRetry, failText } = {}) {
  if (!Number.isInteger(attempts) || attempts < 1)
    throw new TypeError(
      `withRetry: attempts must be a whole number of at least 1 (got ${attempts})`
    );
  if (!Number.isFinite(backoffMs) || backoffMs < 0)
    throw new TypeError(`withRetry: backoffMs must be 0 or more (got ${backoffMs})`);
  for (let n = 1; ; n++) {
    try {
      return await attempt();
    } catch (e) {
      if (e && e.final) throw e;
      if (n >= attempts)
        throw new Error(
          failText
            ? failText(label, attempts, e)
            : `${label} failed after ${attempts} attempts: ${reasonOf(e)}`
        );
      if (onRetry) onRetry(n, e);
      await sleep(backoffMs * n);
    }
  }
}
