/**
 * The feedback API contract the route and the contact form share
 * (CONTACT-02, CONTACT-03; 12-UI-SPEC "API error contract"). The codes are a
 * fixed, ordered list; the field limits match what the form shows (message 10
 * to 2,000 characters); the honeypot field is `trail_note`; and the
 * Retry-After value is whole seconds, never below 1, so the dev limiter's
 * `reset: 0` and any reset already in the past still give a usable wait.
 */
import {
  FEEDBACK_CODES,
  FEEDBACK_LIMITS,
  HONEYPOT_FIELD,
  retryAfterSeconds,
} from '../api-contract';

describe('feedback API contract', () => {
  it('lists the six response codes in contract order', () => {
    expect(FEEDBACK_CODES).toEqual([
      'ok',
      'validation',
      'origin-rejected',
      'rate-limited',
      'send-failed',
      'server-error',
    ]);
  });

  it('fixes the field limits the route enforces and the form shows', () => {
    expect(FEEDBACK_LIMITS).toEqual({
      nameMax: 100,
      messageMin: 10,
      messageMax: 2000,
      honeypotMax: 200,
    });
  });

  it('names the honeypot field trail_note', () => {
    expect(HONEYPOT_FIELD).toBe('trail_note');
  });

  describe('retryAfterSeconds', () => {
    const now = 1_000_000;

    it('clamps the dev fallback reset of 0 to 1 second', () => {
      expect(retryAfterSeconds(0, now)).toBe(1);
    });

    it('rounds a partial second up (1001 ms gives 2)', () => {
      expect(retryAfterSeconds(now + 1001, now)).toBe(2);
    });

    it('returns whole seconds for an exact minute', () => {
      expect(retryAfterSeconds(now + 60_000, now)).toBe(60);
    });

    it('clamps a reset in the past to 1 second', () => {
      expect(retryAfterSeconds(now - 5, now)).toBe(1);
    });

    it('gives 1 for exactly one second and for a reset equal to now', () => {
      expect(retryAfterSeconds(now + 1000, now)).toBe(1);
      expect(retryAfterSeconds(now, now)).toBe(1);
    });
  });
});
