/**
 * Billing Portal API Route
 *
 * Create Stripe billing portal session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBillingPortalSession, stripe } from '@/lib/billing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, customerId } = body as {
      workspaceId: string;
      customerId: string;
    };

    if (!workspaceId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Billing not configured' },
        { status: 503 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://premiumradar.com';
    const session = await createBillingPortalSession(
      {
        workspaceId,
        returnUrl: `${baseUrl}/settings/billing`,
      },
      customerId
    );

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
