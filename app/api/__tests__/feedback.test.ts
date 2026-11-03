/**
 * @jest-environment node
 */

/**
 * POST /api/feedback (CONTACT-02, CONTACT-03; D-02, D-04; 12-UI-SPEC "API
 * error contract"). The check order is locked: IP extraction, validateOrigin,
 * feedbackRateLimit.limit, then body parse, zod, the honeypot and the send.
 * Every body is `{ code, retryAfterS?, fields? }` from lib/contact/api-contract,
 * a failed send is 502 'send-failed' (never 200), and no console call during a
 * submission carries the visitor's name, email address or message.
 */

// Mocks must be declared before imports
jest.mock('@/lib/email', () => ({
  sendFeedbackEmail: jest.fn(),
}));

jest.mock('@/lib/csrf', () => ({
  validateOrigin: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  feedbackRateLimit: { limit: jest.fn() },
}));

import { POST } from '../feedback/route';
import { NextRequest } from 'next/server';
import { sendFeedbackEmail } from '@/lib/email';
import { validateOrigin } from '@/lib/csrf';
import { feedbackRateLimit } from '@/lib/rate-limit';

// Spy on all four console methods (D-04: no visitor text in any of them)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleSpies = [consoleLogSpy, consoleInfoSpy, consoleWarnSpy, consoleErrorSpy];

/**
 * Every distinctive name, email address and message used below. After each
 * test, no console argument may contain any of them (D-04, T-12-06).
 */
const VISITOR_TEXT = [
  'John Doe',
  'john@example.com',
  'This is a test message that is long enough.',
  'This is a test message.',
  'Jane Smith',
  'jane@example.com',
  'Hello, I would like to discuss a project.',
  'not-an-email',
  'Private Visitor',
  'private.visitor@example.org',
  'A confidential message body for Tim.',
];

/** All console arguments recorded so far, stringified. */
const consoleText = () =>
  consoleSpies
    .flatMap((spy) => spy.mock.calls)
    .map((args) => args.map((a) => (a instanceof Error ? `${a.name}: ${a.message}` : JSON.stringify(a))).join(' '))
    .join('\n');

/** The `[feedback]` log entries recorded so far. */
const feedbackLogs = () =>
  consoleSpies
    .flatMap((spy) => spy.mock.calls)
    .filter((args) => args[0] === '[feedback]')
    .map((args) => args[1] as Record<string, unknown>);

const outcomes = () => feedbackLogs().map((entry) => entry.outcome);

describe('Feedback API Route', () => {
  beforeEach(() => {
    consoleSpies.forEach((spy) => spy.mockClear());
    (sendFeedbackEmail as jest.Mock).mockReset();
    (sendFeedbackEmail as jest.Mock).mockResolvedValue(undefined);
    // Default: CSRF passes, rate limit passes
    (validateOrigin as jest.Mock).mockReset();
    (validateOrigin as jest.Mock).mockReturnValue(true);
    (feedbackRateLimit.limit as jest.Mock).mockReset();
    (feedbackRateLimit.limit as jest.Mock).mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 });
  });

  afterEach(() => {
    const logged = consoleText();
    for (const text of VISITOR_TEXT) {
      expect(logged).not.toContain(text);
    }
  });

  afterAll(() => {
    consoleSpies.forEach((spy) => spy.mockRestore());
  });

  interface FeedbackRequestBody {
    name: string;
    email: string;
    message: string;
    interestedInCollaboration?: boolean;
    trail_note?: string;
  }

  const createMockRequest = (body: Partial<FeedbackRequestBody> & Record<string, unknown>, headers: Record<string, string> = {}) => {
    return {
      json: jest.fn(async () => body),
      headers: new Map(Object.entries({ 'x-forwarded-for': '192.168.1.1', ...headers })),
    } as unknown as NextRequest;
  };

  /** A request whose body is any JSON value, including non-objects. */
  const createRawRequest = (value: unknown) => {
    return {
      json: jest.fn(async () => value),
      headers: new Map([['x-forwarded-for', '192.168.1.1']]),
    } as unknown as NextRequest;
  };

  const validBody = {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'This is a test message.',
  };

  describe('Validation', () => {
    it('accepts valid feedback data and sends it to Tim', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message that is long enough.',
        interestedInCollaboration: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ code: 'ok' });
      expect(sendFeedbackEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'This is a test message that is long enough.',
          interestedInCollaboration: true,
          timestamp: expect.any(String),
          ip: expect.any(String),
        })
      );
    });

    it('rejects empty name as required', async () => {
      const request = createMockRequest({ ...validBody, name: '' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ code: 'validation', fields: { name: 'required' } });
      expect(sendFeedbackEmail).not.toHaveBeenCalled();
    });

    it('rejects a missing name as required', async () => {
      const request = createMockRequest({ email: 'john@example.com', message: 'This is a test message.' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ code: 'validation', fields: { name: 'required' } });
    });

    it('rejects invalid email as invalid_email', async () => {
      const request = createMockRequest({ ...validBody, email: 'not-an-email' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ code: 'validation', fields: { email: 'invalid_email' } });
    });

    // IN-07 (CONTACT-03): the email check is Zod 4's z.email(); these pin the
    // same accept and reject set as the deprecated z.string().email().
    it.each(['visitor@example.com', 'first.last+tag@mail.example.co.uk'])(
      'accepts the plain address %s',
      async (email) => {
        const response = await POST(createMockRequest({ ...validBody, email }));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ code: 'ok' });
      },
    );

    it.each(['tim@', 'tim@example', 'two@@example.com', 'has space@example.com'])(
      'rejects %s as invalid_email',
      async (email) => {
        const response = await POST(createMockRequest({ ...validBody, email }));

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ code: 'validation', fields: { email: 'invalid_email' } });
      },
    );

    it('rejects an empty email as required', async () => {
      const request = createMockRequest({ ...validBody, email: '' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.fields).toEqual({ email: 'required' });
    });

    it('rejects message that is too short', async () => {
      const request = createMockRequest({ ...validBody, message: 'Short' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ code: 'validation', fields: { message: 'too_short' } });
    });

    it('rejects name that is too long', async () => {
      const request = createMockRequest({ ...validBody, name: 'a'.repeat(101) });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ code: 'validation', fields: { name: 'too_long' } });
    });

    it('rejects message that is too long', async () => {
      const request = createMockRequest({ ...validBody, message: 'a'.repeat(2001) });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ code: 'validation', fields: { message: 'too_long' } });
    });

    it('accepts boundary lengths: 100-character name and 10- and 2,000-character messages', async () => {
      for (const body of [
        { ...validBody, name: 'n'.repeat(100) },
        { ...validBody, message: 'm'.repeat(10) },
        { ...validBody, message: 'm'.repeat(2000) },
      ]) {
        const response = await POST(createMockRequest(body));
        expect(response.status).toBe(200);
      }
      expect(sendFeedbackEmail).toHaveBeenCalledTimes(3);
    });

    it('accepts feedback without collaboration flag', async () => {
      const request = createMockRequest(validBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ code: 'ok' });
    });

    it('maps every invalid field at once and never echoes submitted values', async () => {
      const submitted = { name: '', email: 'x', message: 'short' };
      const response = await POST(createRawRequest(submitted));
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(JSON.parse(text)).toEqual({
        code: 'validation',
        fields: { name: 'required', email: 'invalid_email', message: 'too_short' },
      });
      for (const value of Object.values(submitted)) {
        expect(text).not.toContain(JSON.stringify(value));
      }
    });

    it('never returns distinctive visitor text in a validation response', async () => {
      const submitted = {
        name: 'Private Visitor',
        email: 'private.visitor@example.org',
        message: 'A confidential message body for Tim.',
        interestedInCollaboration: 'yes',
      };
      const response = await POST(createRawRequest(submitted));
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(JSON.parse(text)).toEqual({ code: 'validation' });
      for (const value of [submitted.name, submitted.email, submitted.message]) {
        expect(text).not.toContain(value);
      }
    });

    it('logs validation-failed with metadata only', async () => {
      await POST(createMockRequest({ ...validBody, email: 'not-an-email' }));

      expect(outcomes()).toEqual(['validation-failed']);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[feedback]',
        { event: 'feedback', outcome: 'validation-failed', ip: '192.168.1.1', timestamp: expect.any(String) }
      );
    });
  });

  describe('Malformed bodies', () => {
    it('handles malformed JSON as a 400 validation without fields', async () => {
      const request = {
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON');
        },
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ code: 'validation' });
      expect(data).not.toHaveProperty('fields');
      expect(sendFeedbackEmail).not.toHaveBeenCalled();
      expect(outcomes()).toEqual(['validation-failed']);
    });

    it.each([
      ['null', null],
      ['an array', [validBody]],
      ['a string', 'John Doe'],
      ['a number', 42],
    ])('returns 400 validation without fields when the body is %s', async (_label, value) => {
      const response = await POST(createRawRequest(value));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ code: 'validation' });
      expect(sendFeedbackEmail).not.toHaveBeenCalled();
    });
  });

  describe('CSRF Protection', () => {
    it('rejects cross-origin requests with origin-rejected', async () => {
      (validateOrigin as jest.Mock).mockReturnValue(false);

      const request = createMockRequest(validBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ code: 'origin-rejected' });
      expect(sendFeedbackEmail).not.toHaveBeenCalled();
    });

    it('logs csrf-rejected with ip and timestamp only', async () => {
      (validateOrigin as jest.Mock).mockReturnValue(false);

      await POST(createMockRequest(validBody, { origin: 'https://evil.example', host: 'timlui.dev' }));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[feedback]',
        { event: 'feedback', outcome: 'csrf-rejected', ip: '192.168.1.1', timestamp: expect.any(String) }
      );
      expect(outcomes()).toEqual(['csrf-rejected']);
    });

    it('allows same-origin requests', async () => {
      (validateOrigin as jest.Mock).mockReturnValue(true);

      const request = createMockRequest(validBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ code: 'ok' });
    });

    it('rejects a bad origin with a filled honeypot as 403 and never calls the limiter or reads the body', async () => {
      (validateOrigin as jest.Mock).mockReturnValue(false);
      const request = createMockRequest({ ...validBody, trail_note: 'http://spam.example' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ code: 'origin-rejected' });
      expect(feedbackRateLimit.limit).not.toHaveBeenCalled();
      expect(request.json).not.toHaveBeenCalled();
      expect(sendFeedbackEmail).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('allows when rate limit not exceeded', async () => {
      (feedbackRateLimit.limit as jest.Mock).mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 });

      const request = createMockRequest(validBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ code: 'ok' });
    });

    it('rejects when rate limit exceeded with rate-limited, retryAfterS and a Retry-After header', async () => {
      (feedbackRateLimit.limit as jest.Mock).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 120_000,
      });

      const request = createMockRequest(validBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toEqual({ code: 'rate-limited', retryAfterS: 120 });
      expect(response.headers.get('Retry-After')).toBe('120');
      expect(sendFeedbackEmail).not.toHaveBeenCalled();
    });

    it('clamps the dev fallback reset of 0 to a 1-second Retry-After', async () => {
      (feedbackRateLimit.limit as jest.Mock).mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: 0 });

      const response = await POST(createMockRequest(validBody));
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toEqual({ code: 'rate-limited', retryAfterS: 1 });
      expect(response.headers.get('Retry-After')).toBe('1');
    });

    it('logs rate-limited with metadata only', async () => {
      (feedbackRateLimit.limit as jest.Mock).mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: 0 });

      await POST(createMockRequest(validBody));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[feedback]',
        { event: 'feedback', outcome: 'rate-limited', ip: '192.168.1.1', timestamp: expect.any(String) }
      );
      expect(outcomes()).toEqual(['rate-limited']);
    });

    it('answers 429, not 200, when rate limited with a filled honeypot, without reading the body', async () => {
      (feedbackRateLimit.limit as jest.Mock).mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: 0 });
      const request = createMockRequest({ ...validBody, trail_note: 'bot text' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.code).toBe('rate-limited');
      expect(request.json).not.toHaveBeenCalled();
      expect(outcomes()).not.toContain('honeypot');
    });

    it('runs validateOrigin, then the limiter, then the body parse', async () => {
      const order: string[] = [];
      (validateOrigin as jest.Mock).mockImplementation(() => {
        order.push('origin');
        return true;
      });
      (feedbackRateLimit.limit as jest.Mock).mockImplementation(async () => {
        order.push('limit');
        return { success: true, limit: 5, remaining: 4, reset: 0 };
      });
      (sendFeedbackEmail as jest.Mock).mockImplementation(async () => {
        order.push('send');
      });
      const request = {
        json: async () => {
          order.push('body');
          return validBody;
        },
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
      } as unknown as NextRequest;

      await POST(request);

      expect(order).toEqual(['origin', 'limit', 'body', 'send']);
    });

    it('extracts IP from x-forwarded-for header', async () => {
      const request = createMockRequest(validBody, { 'x-forwarded-for': '203.0.113.42, 10.0.0.1' });

      await POST(request);

      // Rate limiter should be called with the first IP in the chain
      expect(feedbackRateLimit.limit).toHaveBeenCalledWith('203.0.113.42');
    });

    it('falls back to x-real-ip when x-forwarded-for is not available', async () => {
      const request = {
        json: async () => validBody,
        headers: new Map<string, string>([['x-real-ip', '10.0.0.3']]),
      } as unknown as NextRequest;

      await POST(request);

      expect(feedbackRateLimit.limit).toHaveBeenCalledWith('10.0.0.3');
    });
  });

  describe('Honeypot (trail_note)', () => {
    it('answers a filled honeypot with 200 ok and sends nothing', async () => {
      const response = await POST(createMockRequest({ ...validBody, trail_note: 'x' }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ code: 'ok' });
      expect(sendFeedbackEmail).not.toHaveBeenCalled();
    });

    it('logs honeypot with metadata only', async () => {
      await POST(createMockRequest({ ...validBody, trail_note: 'x' }));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[feedback]',
        { event: 'feedback', outcome: 'honeypot', ip: '192.168.1.1', timestamp: expect.any(String) }
      );
      expect(outcomes()).toEqual(['honeypot']);
    });

    it('sends normally when trail_note is an empty string', async () => {
      const response = await POST(createMockRequest({ ...validBody, trail_note: '' }));

      expect(response.status).toBe(200);
      expect(sendFeedbackEmail).toHaveBeenCalledTimes(1);
      expect(outcomes()).toEqual(['sent']);
    });

    it('sends normally when trail_note is absent', async () => {
      await POST(createMockRequest(validBody));

      expect(sendFeedbackEmail).toHaveBeenCalledTimes(1);
    });

    it('takes the honeypot path for a 200-character value', async () => {
      const response = await POST(createMockRequest({ ...validBody, trail_note: 'b'.repeat(200) }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ code: 'ok' });
      expect(sendFeedbackEmail).not.toHaveBeenCalled();
    });

    it('rejects a 201-character value as 400 validation', async () => {
      const response = await POST(createMockRequest({ ...validBody, trail_note: 'b'.repeat(201) }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('validation');
      expect(sendFeedbackEmail).not.toHaveBeenCalled();
    });

    it('does not pass the honeypot field on to the email', async () => {
      await POST(createMockRequest({ ...validBody, trail_note: '' }));

      expect((sendFeedbackEmail as jest.Mock).mock.calls[0][0]).not.toHaveProperty('trail_note');
    });
  });

  describe('Data Logging', () => {
    it('logs one sent line with event, outcome, ip and timestamp', async () => {
      await POST(createMockRequest({ ...validBody, interestedInCollaboration: false }, { 'x-forwarded-for': '203.0.113.42' }));

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[feedback]',
        { event: 'feedback', outcome: 'sent', ip: '203.0.113.42', timestamp: expect.any(String) }
      );
      const [entry] = feedbackLogs();
      expect(new Date(entry.timestamp as string).toISOString()).toBe(entry.timestamp);
    });

    it('no longer logs the submission fields', async () => {
      await POST(createMockRequest(validBody));

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleText()).not.toContain('Feedback received');
    });

    it.each([
      ['sent', () => undefined],
      ['email-failed', () => (sendFeedbackEmail as jest.Mock).mockRejectedValue(new Error('Resend said no for john@example.com'))],
      ['rate-limited', () => (feedbackRateLimit.limit as jest.Mock).mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: 0 })],
      ['csrf-rejected', () => (validateOrigin as jest.Mock).mockReturnValue(false)],
    ])('writes exactly one [feedback] line for %s and no visitor text', async (outcome, arrange) => {
      arrange();

      await POST(createMockRequest({
        name: 'Private Visitor',
        email: 'private.visitor@example.org',
        message: 'A confidential message body for Tim.',
      }));

      expect(outcomes()).toEqual([outcome]);
      const logged = consoleText();
      expect(logged).not.toContain('Private Visitor');
      expect(logged).not.toContain('private.visitor@example.org');
      expect(logged).not.toContain('A confidential message body for Tim.');
    });
  });

  describe('Email Integration', () => {
    it('sends email on successful submission and returns exactly { code: ok }', async () => {
      const request = createMockRequest({
        name: 'Jane Smith',
        email: 'jane@example.com',
        message: 'Hello, I would like to discuss a project.',
        interestedInCollaboration: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toStrictEqual({ code: 'ok' });
      expect(sendFeedbackEmail).toHaveBeenCalledTimes(1);
      expect(sendFeedbackEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Smith',
          email: 'jane@example.com',
          message: 'Hello, I would like to discuss a project.',
          interestedInCollaboration: true,
        })
      );
    });

    it('returns 502 send-failed, never 200, when sending fails', async () => {
      (sendFeedbackEmail as jest.Mock).mockRejectedValueOnce(new Error('Email service error'));

      const request = createMockRequest(validBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data).toEqual({ code: 'send-failed' });
      expect(outcomes()).toEqual(['email-failed']);
    });

    it('returns 502 send-failed when the Resend key is missing', async () => {
      (sendFeedbackEmail as jest.Mock).mockRejectedValueOnce(new Error('RESEND_API_KEY environment variable is not set'));

      const response = await POST(createMockRequest(validBody));

      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ code: 'send-failed' });
    });
  });

  describe('Error Handling', () => {
    it('returns 500 server-error when the limiter throws', async () => {
      (feedbackRateLimit.limit as jest.Mock).mockRejectedValue(new TypeError('Upstash unreachable'));

      const response = await POST(createMockRequest(validBody));
      const text = await response.text();

      expect(response.status).toBe(500);
      expect(JSON.parse(text)).toEqual({ code: 'server-error' });
      expect(text).not.toContain('Upstash unreachable');
      expect(sendFeedbackEmail).not.toHaveBeenCalled();
    });

    it('logs only the error name for an unexpected throw', async () => {
      (feedbackRateLimit.limit as jest.Mock).mockRejectedValue(new TypeError('Upstash unreachable'));

      await POST(createMockRequest(validBody));

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logged = consoleText();
      expect(logged).toContain('TypeError');
      expect(logged).not.toContain('Upstash unreachable');
    });
  });
});
