/**
 * Checkout API Route
 *
 * Create Stripe checkout session for subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createCheckoutSession,
  getOrCreateCustomer,
  type PlanTier,
} from '@/lib/billing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspaceId,
      userId,
      email,
      name,
      tier,
      billingInterval,
    } = body as {
      workspaceId: string;
      userId: string;
      email: string;
      name?: string;
      tier: PlanTier;
      billingInterval: 'month' | 'year';
    };

    // Validate required fields
    if (!workspaceId || !userId || !email || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer({
      workspaceId,
      email,
      name,
    });

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://premiumradar.com';
    const session = await createCheckoutSession(
      {
        workspaceId,
        userId,
        tier,
        billingInterval: billingInterval || 'month',
        successUrl: `${baseUrl}/settings/billing?success=true`,
        cancelUrl: `${baseUrl}/settings/billing?canceled=true`,
      },
      customer.id
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
