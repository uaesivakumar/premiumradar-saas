/**
 * Stripe Webhook Handler
 *
 * Process Stripe webhook events.
 */

import { NextRequest, NextResponse } from 'next/server';
// Import directly from webhooks module (server-only, not exported from barrel)
import { verifyWebhookSignature, processWebhookEvent } from '@/lib/billing/webhooks';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(payload, signature);

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Process the event
    const result = await processWebhookEvent(event);

    if (!result.success) {
      console.error('Webhook processing failed:', result.message);
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      received: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Note: In App Router, request.text() already provides raw body
// No additional config needed for webhook signature verification
