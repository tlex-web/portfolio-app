/**
 * @jest-environment node
 */

/**
 * lib/rate-limit.ts: the contact form's limiter fails closed in production
 * (GUARD-09; 13-CONTEXT D-11, D-12).
 *
 * D-11: with VERCEL_ENV === 'production', an unconfigured limiter refuses the
 * submission instead of allowing it, so the route answers 503 'server-error'
 * and the form shows its existing send-failure copy. Each refusal writes one
 * `[rate-limit]` error line carrying the event, outcome, reason and timestamp
 * only, never visitor data.
 * D-12: previews and local dev (VERCEL_ENV not 'production') keep the
 * allow-all fallback with a single warning, so preview UAT and local
 * Playwright runs need no Redis.
 *
 * Every case passes an explicit env object to createRateLimiter(env) and never
 * mutates process.env. The Upstash packages are mocked, so nothing here touches
 * the network.
 */

const mockLimit = jest.fn();
const mockSlidingWindow = jest.fn((tokens: number, window: string) => ({ tokens, window }));
const mockRatelimitConstructor = jest.fn();

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = (tokens: number, window: string) => mockSlidingWindow(tokens, window);
    limit = mockLimit;
    constructor(config: unknown) {
      mockRatelimitConstructor(config);
    }
  },
}));

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(),
}));

import { createRateLimiter } from '@/lib/rate-limit';

const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

/** The `[rate-limit]` entries written with console.error so far. */
const refusalLogs = () =>
  consoleErrorSpy.mock.calls
    .filter((args) => args[0] === '[rate-limit]')
    .map((args) => args[1] as Record<string, unknown>);

/** The `[rate-limit]` warnings written so far. */
const rateLimitWarnings = () =>
  consoleWarnSpy.mock.calls.filter((args) => typeof args[0] === 'string' && args[0].startsWith('[rate-limit]'));

describe('createRateLimiter', () => {
  beforeEach(() => {
    consoleWarnSpy.mockClear();
    consoleErrorSpy.mockClear();
    mockLimit.mockReset();
    mockSlidingWindow.mockClear();
    mockRatelimitConstructor.mockClear();
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('production with no credentials (D-11)', () => {
    it('refuses with unavailable unconfigured and logs one [rate-limit] refusal', async () => {
      const limiter = createRateLimiter({ VERCEL_ENV: 'production' });

      const result = await limiter.limit('1.2.3.4');

      expect(result).toEqual({ success: false, limit: 0, remaining: 0, reset: 0, unavailable: 'unconfigured' });
      expect(refusalLogs()).toEqual([
        { event: 'rate-limit', outcome: 'refused', reason: 'unconfigured', timestamp: expect.any(String) },
      ]);
    });

    it('never writes the identifier into the refusal line', async () => {
      await createRateLimiter({ VERCEL_ENV: 'production' }).limit('203.0.113.99');

      expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain('203.0.113.99');
    });
  });

  describe('outside production with no credentials (D-12)', () => {
    it('allows and warns once across two calls', async () => {
      const limiter = createRateLimiter({});

      const first = await limiter.limit('1.2.3.4');
      const second = await limiter.limit('1.2.3.4');

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(first.unavailable).toBeUndefined();
      expect(rateLimitWarnings()).toHaveLength(1);
      expect(refusalLogs()).toEqual([]);
    });

    it('names both accepted pairs in the warning', async () => {
      await createRateLimiter({ VERCEL_ENV: 'preview' }).limit('1.2.3.4');

      const [warning] = rateLimitWarnings();
      expect(warning[0]).toContain('UPSTASH_REDIS_REST_URL');
      expect(warning[0]).toContain('KV_REST_API_URL');
    });
  });
});
