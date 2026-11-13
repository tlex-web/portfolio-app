import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendFeedbackEmail } from '@/lib/email';
import { validateOrigin } from '@/lib/csrf';
import { feedbackRateLimit } from '@/lib/rate-limit';
import {
  FEEDBACK_LIMITS,
  HONEYPOT_FIELD,
  retryAfterSeconds,
  type FeedbackField,
  type FeedbackOutcome,
  type FeedbackResponse,
  type FieldIssue,
} from '@/lib/contact/api-contract';

/**
 * POST /api/feedback (CONTACT-02, CONTACT-03; D-02, D-04; 12-UI-SPEC "API
 * error contract"). The order is locked: IP extraction, validateOrigin,
 * the rate limiter, then body parse, zod, the honeypot and the send.
 * Every body is a FeedbackResponse code; a failed send is 502 'send-failed'
 * (never 200); logs carry the outcome, IP and timestamp only, never what the
 * visitor wrote.
 */

// Define and validate input schema
const feedbackSchema = z.object({
  name: z.string().min(1).max(FEEDBACK_LIMITS.nameMax),
  email: z.email(),
  message: z.string().min(FEEDBACK_LIMITS.messageMin).max(FEEDBACK_LIMITS.messageMax),
  interestedInCollaboration: z.boolean().optional(),
  [HONEYPOT_FIELD]: z.string().max(FEEDBACK_LIMITS.honeypotMax).optional(),
});

const FIELDS: readonly FeedbackField[] = ['name', 'email', 'message'];

/** One metadata-only `[feedback]` line per submission (D-04). */
function logFeedback(outcome: FeedbackOutcome, ip: string): void {
  const entry = { event: 'feedback', outcome, ip, timestamp: new Date().toISOString() };
  if (outcome === 'sent') {
    console.info('[feedback]', entry);
  } else {
    console.warn('[feedback]', entry);
  }
}

function respond(body: FeedbackResponse, status: number, headers?: HeadersInit): NextResponse<FeedbackResponse> {
  return NextResponse.json<FeedbackResponse>(body, { status, headers });
}

/**
 * Maps zod issues to one issue code per visible field. Values are never
 * copied: an empty or missing value is 'required', otherwise the issue kind.
 */
function fieldIssues(error: z.ZodError, body: unknown): FeedbackResponse['fields'] {
  const fields: Partial<Record<FeedbackField, FieldIssue>> = {};
  const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== 'string' || !FIELDS.includes(field as FeedbackField)) continue;
    const key = field as FeedbackField;
    if (fields[key]) continue;
    const value = record[key];
    if (value === undefined || value === null || value === '' || issue.code === 'invalid_type') {
      fields[key] = 'required';
    } else if (issue.code === 'too_small') {
      fields[key] = 'too_short';
    } else if (issue.code === 'too_big') {
      fields[key] = 'too_long';
    } else {
      fields[key] = 'invalid_email';
    }
  }
  return Object.keys(fields).length > 0 ? fields : undefined;
}

export async function POST(request: NextRequest) {
  try {
    // Extract IP for logging and rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = (forwarded ? forwarded.split(',')[0].trim() : null)
      || request.headers.get('x-real-ip')
      || 'unknown';

    // CSRF check: reject cross-origin requests
    if (!validateOrigin(request)) {
      logFeedback('csrf-rejected', ip);
      return respond({ code: 'origin-rejected' }, 403);
    }

    // Rate limit check: persistent via Upstash Redis
    const { success, reset, unavailable } = await feedbackRateLimit.limit(ip);
    // A production limiter that cannot answer refuses (GUARD-09, D-11): 503 with
    // the existing server-error code, so the form shows its send-failure copy
    if (unavailable) {
      logFeedback('limiter-unavailable', ip);
      return respond({ code: 'server-error' }, 503);
    }
    if (!success) {
      const retryAfterS = retryAfterSeconds(reset, Date.now());
      logFeedback('rate-limited', ip);
      return respond({ code: 'rate-limited', retryAfterS }, 429, { 'Retry-After': String(retryAfterS) });
    }

    // Parse the body on its own: malformed JSON is a validation error, not a 500
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      logFeedback('validation-failed', ip);
      return respond({ code: 'validation' }, 400);
    }

    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      logFeedback('validation-failed', ip);
      const fields = fieldIssues(parsed.error, body);
      return respond(fields ? { code: 'validation', fields } : { code: 'validation' }, 400);
    }
    const data = parsed.data;

    // Honeypot: only after the origin check and the rate limit (CONTACT-03)
    if (data[HONEYPOT_FIELD]) {
      logFeedback('honeypot', ip);
      return respond({ code: 'ok' }, 200);
    }

    // Send email notification; a failed send is an error, never a confirmation (D-02)
    try {
      await sendFeedbackEmail({
        name: data.name,
        email: data.email,
        message: data.message,
        interestedInCollaboration: data.interestedInCollaboration,
        timestamp: new Date().toISOString(),
        ip,
      });
    } catch {
      logFeedback('email-failed', ip);
      return respond({ code: 'send-failed' }, 502);
    }

    logFeedback('sent', ip);
    return respond({ code: 'ok' }, 200);
  } catch (error) {
    // Log only the error name (D-04); never expose details to the client
    console.error('[feedback]', {
      event: 'feedback',
      error: error instanceof Error ? error.name : 'unknown',
      timestamp: new Date().toISOString(),
    });
    return respond({ code: 'server-error' }, 500);
  }
}
