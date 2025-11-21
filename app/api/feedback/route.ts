import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define and validate input schema
const feedbackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  interestedInCollaboration: z.boolean().optional(),
});

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit (5 requests per hour)
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
    return true;
  }

  if (limit.count >= 5) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const data = feedbackSchema.parse(body);

    // Log the feedback (in production, you would send an email or save to database)
    console.log('Feedback received:', {
      name: data.name,
      email: data.email,
      message: data.message,
      interestedInCollaboration: data.interestedInCollaboration,
      timestamp: new Date().toISOString(),
      ip,
    });

    // TODO: In production, integrate with email service (SendGrid, Resend, etc.)
    // Example:
    // await sendEmail({
    //   to: process.env.FEEDBACK_EMAIL!,
    //   subject: `Feedback from ${data.name}`,
    //   text: `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}\n\nInterested in collaboration: ${data.interestedInCollaboration ? 'Yes' : 'No'}`,
    // });

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

