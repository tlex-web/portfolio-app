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
  // fromEnv is mocked only to prove it is never used: it falls back per
  // variable, so it could pair an UPSTASH_ URL with a KV_ token
  Redis: Object.assign(jest.fn(), { fromEnv: jest.fn(() => ({})) }),
}));

import { Redis } from '@upstash/redis';
import { createRateLimiter, LIMIT_TIMEOUT_MS, upstashCredentials } from '@/lib/rate-limit';

const MockRedis = Redis as unknown as jest.Mock & { fromEnv: jest.Mock };

const UPSTASH_PAIR = {
  UPSTASH_REDIS_REST_URL: 'https://upstash.example.test',
  UPSTASH_REDIS_REST_TOKEN: 'upstash-token',
};
const KV_PAIR = {
  KV_REST_API_URL: 'https://kv.example.test',
  KV_REST_API_TOKEN: 'kv-token',
};

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
    MockRedis.mockClear();
    MockRedis.fromEnv.mockClear();
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

  describe('construction with credentials', () => {
    it('builds the limiter with slidingWindow(5, 1 h), its prefix, analytics and a 3000 ms timeout', () => {
      createRateLimiter({ ...UPSTASH_PAIR });

      expect(LIMIT_TIMEOUT_MS).toBe(3000);
      expect(mockSlidingWindow).toHaveBeenCalledWith(5, '1 h');
      expect(mockRatelimitConstructor).toHaveBeenCalledTimes(1);
      expect(mockRatelimitConstructor.mock.calls[0][0]).toMatchObject({
        limiter: { tokens: 5, window: '1 h' },
        analytics: true,
        prefix: 'ratelimit:feedback',
        timeout: 3000,
      });
    });

    it('builds Redis from the UPSTASH pair alone, never from the per-variable env factory', () => {
      createRateLimiter({ ...UPSTASH_PAIR });

      expect(MockRedis).toHaveBeenCalledWith({ url: UPSTASH_PAIR.UPSTASH_REDIS_REST_URL, token: 'upstash-token' });
      expect(MockRedis.fromEnv).not.toHaveBeenCalled();
    });

    it('builds Redis from the KV pair alone', () => {
      createRateLimiter({ ...KV_PAIR });

      expect(MockRedis).toHaveBeenCalledWith({ url: KV_PAIR.KV_REST_API_URL, token: 'kv-token' });
    });

    it('prefers the UPSTASH pair when both complete pairs are set', () => {
      createRateLimiter({ ...KV_PAIR, ...UPSTASH_PAIR });

      expect(MockRedis).toHaveBeenCalledTimes(1);
      expect(MockRedis).toHaveBeenCalledWith({ url: UPSTASH_PAIR.UPSTASH_REDIS_REST_URL, token: 'upstash-token' });
    });

    it('treats a mixed pair (UPSTASH URL with KV token) as unconfigured and refuses in production', async () => {
      const limiter = createRateLimiter({
        VERCEL_ENV: 'production',
        UPSTASH_REDIS_REST_URL: UPSTASH_PAIR.UPSTASH_REDIS_REST_URL,
        KV_REST_API_TOKEN: 'kv-token',
      });

      const result = await limiter.limit('1.2.3.4');

      expect(MockRedis).not.toHaveBeenCalled();
      expect(MockRedis.fromEnv).not.toHaveBeenCalled();
      expect(result.unavailable).toBe('unconfigured');
    });

    it('treats a mixed pair (KV URL with UPSTASH token) as unconfigured and refuses in production', async () => {
      const limiter = createRateLimiter({
        VERCEL_ENV: 'production',
        KV_REST_API_URL: KV_PAIR.KV_REST_API_URL,
        UPSTASH_REDIS_REST_TOKEN: 'upstash-token',
      });

      const result = await limiter.limit('1.2.3.4');

      expect(MockRedis).not.toHaveBeenCalled();
      expect(result.unavailable).toBe('unconfigured');
    });

    it('treats empty-string variables as missing and refuses in production', async () => {
      const limiter = createRateLimiter({
        VERCEL_ENV: 'production',
        UPSTASH_REDIS_REST_URL: '',
        UPSTASH_REDIS_REST_TOKEN: '',
        KV_REST_API_URL: KV_PAIR.KV_REST_API_URL,
        KV_REST_API_TOKEN: '',
      });

      const result = await limiter.limit('1.2.3.4');

      expect(MockRedis).not.toHaveBeenCalled();
      expect(result.unavailable).toBe('unconfigured');
    });
  });

  describe('production with credentials (D-11)', () => {
    const production = { VERCEL_ENV: 'production', ...UPSTASH_PAIR };

    it('refuses with unavailable error when the limiter rejects, and logs reason error', async () => {
      mockLimit.mockRejectedValue(new Error('fetch failed'));

      const result = await createRateLimiter(production).limit('1.2.3.4');

      expect(result).toEqual({ success: false, limit: 0, remaining: 0, reset: 0, unavailable: 'error' });
      expect(refusalLogs()).toEqual([
        { event: 'rate-limit', outcome: 'refused', reason: 'error', timestamp: expect.any(String) },
      ]);
    });

    it('refuses with unavailable timeout when the limiter answers success with reason timeout', async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 5, remaining: 5, reset: 0, reason: 'timeout', pending: Promise.resolve() });

      const result = await createRateLimiter(production).limit('1.2.3.4');

      expect(result).toEqual({ success: false, limit: 0, remaining: 0, reset: 0, unavailable: 'timeout' });
      expect(refusalLogs()).toEqual([
        { event: 'rate-limit', outcome: 'refused', reason: 'timeout', timestamp: expect.any(String) },
      ]);
    });

    it('passes an answered result through as success, limit, remaining and reset only', async () => {
      mockLimit.mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: 1_800_000_000_000, pending: Promise.resolve() });

      const result = await createRateLimiter(production).limit('1.2.3.4');

      expect(mockLimit).toHaveBeenCalledWith('1.2.3.4');
      expect(result).toEqual({ success: false, limit: 5, remaining: 0, reset: 1_800_000_000_000 });
      expect(refusalLogs()).toEqual([]);
    });
  });

  describe('preview with credentials (D-12)', () => {
    const preview = { VERCEL_ENV: 'preview', ...UPSTASH_PAIR };

    it('lets a limiter rejection propagate (the route answers 500 server-error)', async () => {
      mockLimit.mockRejectedValue(new Error('fetch failed'));

      await expect(createRateLimiter(preview).limit('1.2.3.4')).rejects.toThrow('fetch failed');
      expect(refusalLogs()).toEqual([]);
    });

    it('allows when the limiter times out', async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 5, remaining: 5, reset: 0, reason: 'timeout', pending: Promise.resolve() });

      const result = await createRateLimiter(preview).limit('1.2.3.4');

      expect(result).toEqual({ success: true, limit: 5, remaining: 5, reset: 0 });
      expect(refusalLogs()).toEqual([]);
    });
  });
});

describe('upstashCredentials', () => {
  it('returns the UPSTASH pair, then the KV pair, and null for a mixed or empty pair', () => {
    expect(upstashCredentials({ ...KV_PAIR, ...UPSTASH_PAIR })).toEqual({
      url: UPSTASH_PAIR.UPSTASH_REDIS_REST_URL,
      token: 'upstash-token',
    });
    expect(upstashCredentials({ ...KV_PAIR })).toEqual({ url: KV_PAIR.KV_REST_API_URL, token: 'kv-token' });
    expect(
      upstashCredentials({ UPSTASH_REDIS_REST_URL: UPSTASH_PAIR.UPSTASH_REDIS_REST_URL, KV_REST_API_TOKEN: 'kv-token' })
    ).toBeNull();
    expect(upstashCredentials({ UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '' })).toBeNull();
    expect(upstashCredentials({})).toBeNull();
  });
});

describe('module import (T-13-07)', () => {
  it('does not throw with production env and no credentials (next build imports the module)', () => {
    // The only case that swaps process.env, because it is the one that reads it;
    // the replacement is restored before the test ends.
    const env = jest.replaceProperty(process, 'env', { NODE_ENV: 'test', VERCEL_ENV: 'production' });
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- fresh registry under the swapped env
        expect(() => require('@/lib/rate-limit')).not.toThrow();
      });
    } finally {
      env.restore();
    }
  });
});
