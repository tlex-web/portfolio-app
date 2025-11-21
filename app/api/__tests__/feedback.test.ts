/**
 * @jest-environment node
 */
import { POST } from '../feedback/route';
import { NextRequest } from 'next/server';

// Mock console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('Feedback API Route', () => {
  let testCounter = 0;

  beforeEach(() => {
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
    testCounter++;
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
    return {
      json: async () => body,
      headers: new Map(Object.entries({ 'x-forwarded-for': `192.168.1.${testCounter}`, ...headers })),
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

  describe('Rate Limiting', () => {
    it('allows requests within rate limit', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
      }, { 'x-forwarded-for': '10.0.0.1' });

      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it('blocks requests exceeding rate limit', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
      }, { 'x-forwarded-for': '10.0.0.2' });

      // Send 5 requests (at the limit)
      for (let i = 0; i < 5; i++) {
        await POST(request);
      }

      // 6th request should be blocked
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Too many requests');
    });

    it('uses x-real-ip header when x-forwarded-for is not available', async () => {
      const request = createMockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message.',
      }, { 'x-real-ip': '10.0.0.3' });

      // Remove x-forwarded-for
      delete (request.headers as any).get;
      (request.headers as any).get = (key: string) => {
        if (key === 'x-real-ip') return '10.0.0.3';
        return null;
      };

      const response = await POST(request);
      expect(response.status).toBe(200);
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
});
