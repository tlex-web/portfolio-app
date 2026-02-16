/**
 * @jest-environment node
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

// Mock console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('Feedback API Route', () => {
  beforeEach(() => {
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
    (sendFeedbackEmail as jest.Mock).mockClear();
    (sendFeedbackEmail as jest.Mock).mockResolvedValue(undefined);
    // Default: CSRF passes, rate limit passes
    (validateOrigin as jest.Mock).mockReturnValue(true);
    (feedbackRateLimit.limit as jest.Mock).mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 });
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  interface FeedbackRequestBody {
    name: string;
    email: string;
    message: string;
    interestedInCollaboration?: boolean;
  }

  const createMockRequest = (body: Partial<FeedbackRequestBody> & Record<string, unknown>, headers: Record<string, string> = {}) => {
    return {
      json: async () => body,
      headers: new Map(Object.entries({ 'x-forwarded-for': '192.168.1.1', ...headers })),
    } as unknown as NextRequest;
  };

  describe('Validation', () => {
    it('accepts valid feedback data', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message that is long enough.',
        interestedInCollaboration: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Feedback received:',
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'This is a test message that is long enough.',
          interestedInCollaboration: true,
        })
      );
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

    it('rejects empty name', async () => {
      const request = createMockRequest({
        name: '',
        email: 'john@example.com',
        message: 'This is a test message.',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('rejects invalid email', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'not-an-email',
        message: 'This is a test message.',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('rejects message that is too short', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Short',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('rejects name that is too long', async () => {
      const request = createMockRequest({
        name: 'a'.repeat(101),
        email: 'john@example.com',
        message: 'This is a test message.',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('rejects message that is too long', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'a'.repeat(2001),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('accepts feedback without collaboration flag', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('CSRF Protection', () => {
    it('rejects cross-origin requests', async () => {
      (validateOrigin as jest.Mock).mockReturnValue(false);

      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Your session may have expired. Please refresh and resubmit.');
    });

    it('allows same-origin requests', async () => {
      (validateOrigin as jest.Mock).mockReturnValue(true);

      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('allows when rate limit not exceeded', async () => {
      (feedbackRateLimit.limit as jest.Mock).mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 0 });

      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('rejects when rate limit exceeded', async () => {
      (feedbackRateLimit.limit as jest.Mock).mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: 1000 });

      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Please wait a bit before sending another message.');
    });

    it('extracts IP from x-forwarded-for header', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
      }, { 'x-forwarded-for': '203.0.113.42, 10.0.0.1' });

      await POST(request);

      // Rate limiter should be called with the first IP in the chain
      expect(feedbackRateLimit.limit).toHaveBeenCalledWith('203.0.113.42');
    });

    it('falls back to x-real-ip when x-forwarded-for is not available', async () => {
      const request = {
        json: async () => ({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'This is a test message.',
        }),
        headers: new Map<string, string>([['x-real-ip', '10.0.0.3']]),
      } as unknown as NextRequest;

      await POST(request);

      expect(feedbackRateLimit.limit).toHaveBeenCalledWith('10.0.0.3');
    });
  });

  describe('Error Handling', () => {
    it('handles malformed JSON', async () => {
      const request = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Internal server error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Data Logging', () => {
    it('logs feedback with timestamp and IP', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
        interestedInCollaboration: false,
      }, { 'x-forwarded-for': '203.0.113.42' });

      await POST(request);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Feedback received:',
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'This is a test message.',
          interestedInCollaboration: false,
          timestamp: expect.any(String),
          ip: '203.0.113.42',
        })
      );
    });
  });

  describe('Email Integration', () => {
    it('sends email on successful submission', async () => {
      const request = createMockRequest({
        name: 'Jane Smith',
        email: 'jane@example.com',
        message: 'Hello, I would like to discuss a project.',
        interestedInCollaboration: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
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

    it('succeeds even if email sending fails', async () => {
      (sendFeedbackEmail as jest.Mock).mockRejectedValueOnce(new Error('Email service error'));

      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
      });

      const response = await POST(request);
      const data = await response.json();

      // Request should still succeed
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // But error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send email notification:',
        expect.any(Error)
      );
    });
  });
});
