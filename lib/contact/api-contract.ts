/**
 * The feedback API contract shared by `POST /api/feedback` and the contact
 * form (CONTACT-02, CONTACT-03; D-02, D-04; 12-UI-SPEC "API error contract").
 * Import-free and client-safe: keep it to erasable TypeScript and never add an
 * import, so the form can read it without pulling server code into the bundle.
 *
 * Every response body is `{ code, retryAfterS?, fields? }`:
 *
 * | Code              | HTTP                    |
 * |-------------------|-------------------------|
 * | `ok`              | 200                     |
 * | `validation`      | 400 (optional `fields`) |
 * | `origin-rejected` | 403                     |
 * | `rate-limited`    | 429 + `Retry-After`     |
 * | `send-failed`     | 502                     |
 * | `server-error`    | 500                     |
 *
 * A send that fails is `send-failed`, never `ok` (D-02). Bodies carry codes
 * only: the `fields` map names an issue per field and never echoes a submitted
 * value, and server logs carry an outcome, the IP and a timestamp, never a
 * visitor's name, address or message (D-04).
 */

/** The response codes, in contract order. */
export const FEEDBACK_CODES = [
  'ok',
  'validation',
  'origin-rejected',
  'rate-limited',
  'send-failed',
  'server-error',
] as const;

export type FeedbackCode = (typeof FEEDBACK_CODES)[number];

/** The visible fields the `fields` map can name. */
export type FeedbackField = 'name' | 'email' | 'message';

/** What is wrong with a field; never the value itself. */
export type FieldIssue = 'required' | 'too_short' | 'too_long' | 'invalid_email';

/** The body of every `/api/feedback` response. */
export interface FeedbackResponse {
  code: FeedbackCode;
  /** Whole seconds until another attempt is allowed; only with `rate-limited`. */
  retryAfterS?: number;
  /** One issue per invalid field; only with `validation`. */
  fields?: Partial<Record<FeedbackField, FieldIssue>>;
}

/** The outcome written to the server's `[feedback]` log line (D-04). */
export type FeedbackOutcome =
  | 'sent'
  | 'email-failed'
  | 'rate-limited'
  | 'csrf-rejected'
  | 'honeypot'
  | 'validation-failed';

/** Field limits the route enforces and the form shows (message 10 to 2,000). */
export const FEEDBACK_LIMITS = {
  nameMax: 100,
  messageMin: 10,
  messageMax: 2000,
  honeypotMax: 200,
} as const;

/**
 * The hidden honeypot field (CONTACT-03). A person leaves it empty; a bot that
 * fills every input gets a success-shaped 200 and no email is sent.
 */
export const HONEYPOT_FIELD = 'trail_note';

/**
 * Seconds until the rate limit resets, for the `Retry-After` header and
 * `retryAfterS`: `max(1, ceil((resetMs - nowMs) / 1000))`. `resetMs` is a
 * millisecond epoch (Upstash); the dev fallback's `0`, or any reset already in
 * the past, gives 1.
 */
export function retryAfterSeconds(resetMs: number, nowMs: number): number {
  return Math.max(1, Math.ceil((resetMs - nowMs) / 1000));
}
