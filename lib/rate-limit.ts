/**
 * Persistent rate limiter for the feedback endpoint, backed by Upstash Redis:
 * a sliding window of 5 requests per hour under the `ratelimit:feedback` prefix.
 *
 * Credentials come from one complete pair: `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN`, or else `KV_REST_API_URL` and `KV_REST_API_TOKEN`
 * (the names Vercel's Upstash integration uses). Values are trimmed (a pasted
 * value often ends in a newline), empty or blank values count as missing, and
 * a mixed pair is never combined.
 *
 * Production fails closed (GUARD-09, D-11). With `VERCEL_ENV === 'production'`
 * the limiter refuses, rather than allows, when it has no usable credentials
 * (none, or a pair the Redis client rejects, such as a URL without https://),
 * when Redis errors, and when `@upstash/ratelimit` times out (the library
 * answers a timeout with `success: true`). A refusal carries `unavailable` and
 * writes one `[rate-limit]` error line with no visitor data; the route answers
 * it with 503 `server-error`. Building the limiter never throws in production:
 * `next build` and the route import this module.
 *
 * Previews and local dev keep today's behaviour (D-12): no credentials means an
 * allow-all fallback that warns once, a pair the Redis client rejects throws
 * at import, a Redis error propagates to the route's outer catch (500), and a
 * timeout allows.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/** Why a production limiter refused instead of answering. */
export type Unavailable = 'unconfigured' | 'error' | 'timeout';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  /** Set only when the limiter could not answer and refused (production). */
  unavailable?: Unavailable;
}

export interface RateLimiter {
  limit(identifier: string): Promise<RateLimitResult>;
}

type Env = Record<string, string | undefined>;

/**
 * How long one limit() call may wait for Redis before the library gives up.
 * Well inside the contact form's 15 s request abort, so a slow Redis becomes a
 * prompt refusal in production instead of a hung submission.
 */
export const LIMIT_TIMEOUT_MS = 3000;

/**
 * One complete credential pair with both values trimmed, or null. The UPSTASH
 * pair wins when both are set. Unlike the Redis client's env-based factory,
 * which falls back one variable at a time, this never pairs one name's URL
 * with the other's token.
 */
export function upstashCredentials(env: Env): { url: string; token: string } | null {
  const pair = (url: string | undefined, token: string | undefined) => {
    const u = url?.trim();
    const t = token?.trim();
    return u && t ? { url: u, token: t } : null;
  };
  return (
    pair(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN) ?? pair(env.KV_REST_API_URL, env.KV_REST_API_TOKEN)
  );
}

/** One metadata-only refusal line; never the identifier or any visitor data. */
function refuse(reason: Unavailable): RateLimitResult {
  console.error('[rate-limit]', {
    event: 'rate-limit',
    outcome: 'refused',
    reason,
    timestamp: new Date().toISOString(),
  });
  return { success: false, limit: 0, remaining: 0, reset: 0, unavailable: reason };
}

export function createRateLimiter(env: Env = process.env): RateLimiter {
  const production = env.VERCEL_ENV === 'production';
  const credentials = upstashCredentials(env);

  if (credentials) {
    let ratelimit: Ratelimit;
    try {
      ratelimit = new Ratelimit({
        redis: new Redis({ url: credentials.url, token: credentials.token }),
        limiter: Ratelimit.slidingWindow(5, '1 h'),
        analytics: true,
        prefix: 'ratelimit:feedback',
        timeout: LIMIT_TIMEOUT_MS,
      });
    } catch (error) {
      // The Redis client rejects some values at construction (a URL without
      // https://, or a quoted one). Outside production that stays loud.
      if (!production) throw error;
      // In production that pair is as unusable as a missing one: refuse every
      // call rather than fail the module's import (a bare 500 for every POST).
      return { limit: async () => refuse('unconfigured') };
    }
    return {
      async limit(identifier: string): Promise<RateLimitResult> {
        let result: Awaited<ReturnType<Ratelimit['limit']>>;
        try {
          result = await ratelimit.limit(identifier);
        } catch (error) {
          if (production) return refuse('error');
          throw error;
        }
        if (production && result.reason === 'timeout') return refuse('timeout');
        const { success, limit, remaining, reset } = result;
        return { success, limit, remaining, reset };
      },
    };
  }

  // No credentials. Never throw here: `next build` imports this module.
  let warned = false;
  return {
    async limit(_identifier: string): Promise<RateLimitResult> {
      if (production) return refuse('unconfigured');
      if (!warned) {
        console.warn(
          '[rate-limit] No Upstash credentials: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, ' +
            'or KV_REST_API_URL and KV_REST_API_TOKEN. Rate limiting is off outside production.'
        );
        warned = true;
      }
      return { success: true, limit: 5, remaining: 5, reset: 0 };
    },
  };
}

export const feedbackRateLimit: RateLimiter = createRateLimiter();
