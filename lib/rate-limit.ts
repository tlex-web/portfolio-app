/**
 * Persistent rate limiter backed by Upstash Redis.
 *
 * Uses a sliding window of 5 requests per hour, scoped to the feedback endpoint.
 * In development (when Upstash env vars are missing), falls back to a permissive
 * mock that always allows requests -- prevents crashes without requiring Redis.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export interface RateLimiter {
  limit(identifier: string): Promise<RateLimitResult>;
}

function createRateLimiter(): RateLimiter {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix: 'ratelimit:feedback',
    });
  }

  // Development fallback -- warn once, then always allow
  let warned = false;
  return {
    async limit(_identifier: string): Promise<RateLimitResult> {
      if (!warned) {
        console.warn(
          '[rate-limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. ' +
            'Rate limiting is disabled. Set these env vars for persistent rate limiting.'
        );
        warned = true;
      }
      return { success: true, limit: 5, remaining: 5, reset: 0 };
    },
  };
}

export const feedbackRateLimit: RateLimiter = createRateLimiter();
