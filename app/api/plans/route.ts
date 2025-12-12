/**
 * Pricing Plans API
 *
 * GET /api/plans - Get available pricing plans
 *
 * Public endpoint - no auth required
 */

import { NextResponse } from 'next/server';
import { PRICING_PLANS } from '@/lib/billing/plans';

export async function GET() {
  try {
    // Return sanitized plans (without Stripe price IDs for public)
    const plans = PRICING_PLANS.map(plan => ({
      id: plan.id,
      tier: plan.tier,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      limits: plan.limits,
      features: plan.features,
      isPopular: plan.isPopular || false,
    }));

    return NextResponse.json({
      success: true,
      data: {
        plans,
        count: plans.length,
      },
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
