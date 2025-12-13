/**
 * VS10.4: Email Webhook Route
 * Sprint: S1 (VS10)
 *
 * Handles email events from Resend:
 * - email.delivered
 * - email.opened
 * - email.clicked
 * - email.bounced
 * - email.complained
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordTrackingEvent } from '@/lib/email/send';

// ============================================================
// TYPES
// ============================================================

interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    click?: {
      link: string;
      timestamp: string;
    };
  };
}

// ============================================================
// HANDLER
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify webhook signature (in production)
    const signature = request.headers.get('svix-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (webhookSecret && !signature) {
      console.warn('[Email Webhook] Missing signature');
      // In production, reject unsigned requests
      // return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // TODO: Verify signature using Resend's verification
    // https://resend.com/docs/dashboard/webhooks/verify-webhook-signature

    const event = await request.json() as ResendWebhookEvent;

    console.log('[Email Webhook] Received event:', {
      type: event.type,
      emailId: event.data.email_id,
      to: event.data.to,
    });

    // Map Resend event type to our tracking type
    const eventTypeMap: Record<string, 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained'> = {
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
    };

    const trackingType = eventTypeMap[event.type];

    if (trackingType) {
      // Record tracking event for each recipient
      for (const recipient of event.data.to) {
        recordTrackingEvent({
          type: trackingType,
          messageId: event.data.email_id,
          recipient,
          timestamp: new Date(event.created_at),
          metadata: {
            subject: event.data.subject,
            from: event.data.from,
            ...(event.data.click && { clickedLink: event.data.click.link }),
          },
        });
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Email Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Allow Resend to verify webhook endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'Email webhook endpoint active' });
}
