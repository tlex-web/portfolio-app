/**
 * Persistent rate limiter backed by Upstash Redis.
 *
 * Uses a sliding window of 5 requests per hour, scoped to the feedback endpoint.
 * In production (VERCEL_ENV === 'production') a limiter without credentials
 * refuses every request (GUARD-09, D-11). Elsewhere it falls back to a
 * permissive mock that warns once, so previews and local dev need no Redis (D-12).
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

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix: 'ratelimit:feedback',
    });
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
