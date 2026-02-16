import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendFeedbackEmail } from '@/lib/email';
import { validateOrigin } from '@/lib/csrf';
import { feedbackRateLimit } from '@/lib/rate-limit';

// Define and validate input schema
const feedbackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  interestedInCollaboration: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Extract IP for logging and rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = (forwarded ? forwarded.split(',')[0].trim() : null)
      || request.headers.get('x-real-ip')
      || 'unknown';

    // CSRF check: reject cross-origin requests
    if (!validateOrigin(request)) {
      const origin = request.headers.get('origin') ?? 'none';
      const host = request.headers.get('host') ?? 'none';
      console.warn('[csrf] Cross-origin request rejected', {
        event: 'csrf',
        ip,
        origin,
        host,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'Your session may have expired. Please refresh and resubmit.' },
        { status: 403 }
      );
    }

    // Rate limit check: persistent via Upstash Redis
    const { success } = await feedbackRateLimit.limit(ip);
    if (!success) {
      console.warn('[rate-limit] Rate limit exceeded', {
        event: 'ratelimit',
        ip,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'Please wait a bit before sending another message.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const data = feedbackSchema.parse(body);

    const timestamp = new Date().toISOString();

    // Log the feedback for debugging
    console.log('Feedback received:', {
      name: data.name,
      email: data.email,
      message: data.message,
      interestedInCollaboration: data.interestedInCollaboration,
      timestamp,
      ip,
    });

    // Send email notification
    try {
      await sendFeedbackEmail({
        name: data.name,
        email: data.email,
        message: data.message,
        interestedInCollaboration: data.interestedInCollaboration,
        timestamp,
        ip,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      // This allows form submissions to succeed even if email fails
      console.error('Failed to send email notification:', emailError);
    }

    // Success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    // Log server errors (do not expose details to client)
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
