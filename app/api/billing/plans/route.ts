/**
 * Billing Plans API
 * Sprint S57: Billing, Plans & Feature Flags
 *
 * GET /api/billing/plans - Get all pricing plans
 * GET /api/billing/plans?tier=X - Get specific plan
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  PRICING_PLANS,
  getPlanByTier,
  getPlanLimits,
  isValidUpgrade,
  isValidDowngrade,
  calculateYearlySavings,
} from '@/lib/billing/plans';
import type { PlanTier } from '@/lib/billing/types';

/**
 * GET - Get pricing plans
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') as PlanTier | null;
    const currentTier = searchParams.get('currentTier') as PlanTier | null;
    const includeComparison = searchParams.get('compare') === 'true';

    // Get specific plan
    if (tier) {
      const plan = getPlanByTier(tier);

      if (!plan) {
        return NextResponse.json(
          { success: false, error: `Plan not found: ${tier}` },
          { status: 404 }
        );
      }

      const response: Record<string, unknown> = {
        success: true,
        data: {
          ...plan,
          yearlySavings: calculateYearlySavings(plan.monthlyPrice, plan.yearlyPrice),
        },
      };

      // Add upgrade/downgrade info if current tier provided
      if (currentTier) {
        response.data = {
          ...(response.data as Record<string, unknown>),
          canUpgrade: isValidUpgrade(currentTier, tier),
          canDowngrade: isValidDowngrade(currentTier, tier),
        };
      }

      return NextResponse.json(response);
    }

    // Get all plans
    const plans = PRICING_PLANS.map((plan) => ({
      ...plan,
      yearlySavings: calculateYearlySavings(plan.monthlyPrice, plan.yearlyPrice),
      ...(currentTier
        ? {
            canUpgrade: isValidUpgrade(currentTier, plan.tier),
            canDowngrade: isValidDowngrade(currentTier, plan.tier),
            isCurrent: currentTier === plan.tier,
          }
        : {}),
    }));

    // Include feature comparison if requested
    if (includeComparison) {
      const featureMatrix = buildFeatureMatrix();
      return NextResponse.json({
        success: true,
        data: {
          plans,
          featureMatrix,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { plans },
    });
  } catch (error) {
    console.error('Plans API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get plans' },
      { status: 500 }
    );
  }
}

/**
 * Build feature comparison matrix
 */
function buildFeatureMatrix(): {
  features: { name: string; category: string }[];
  comparison: Record<string, Record<PlanTier, string | boolean>>;
} {
  const features = [
    { name: 'Company Discovery', category: 'Core' },
    { name: 'Signal Detection', category: 'Core' },
    { name: 'Lead Scoring', category: 'Core' },
    { name: 'Analytics', category: 'Core' },
    { name: 'API Access', category: 'Integration' },
    { name: 'Export Data', category: 'Integration' },
    { name: 'Team Members', category: 'Collaboration' },
    { name: 'AI Outreach', category: 'Outreach' },
    { name: 'Custom Branding', category: 'Enterprise' },
    { name: 'SSO Integration', category: 'Enterprise' },
    { name: 'Dedicated Support', category: 'Enterprise' },
  ];

  const comparison: Record<string, Record<PlanTier, string | boolean>> = {
    'Company Discovery': {
      free: '100/mo',
      starter: '1K/mo',
      professional: '10K/mo',
      enterprise: 'Unlimited',
      saas: '1K/mo',
    },
    'Signal Detection': {
      free: true,
      starter: true,
      professional: true,
      enterprise: true,
      saas: true,
    },
    'Lead Scoring': {
      free: true,
      starter: true,
      professional: true,
      enterprise: true,
      saas: true,
    },
    Analytics: {
      free: 'Basic',
      starter: 'Advanced',
      professional: 'Advanced',
      enterprise: 'Custom',
      saas: 'Advanced',
    },
    'API Access': {
      free: false,
      starter: '10K/mo',
      professional: '100K/mo',
      enterprise: 'Unlimited',
      saas: '50K/mo',
    },
    'Export Data': {
      free: '10/mo',
      starter: '100/mo',
      professional: '1K/mo',
      enterprise: 'Unlimited',
      saas: '100/mo',
    },
    'Team Members': {
      free: '2',
      starter: '5',
      professional: '20',
      enterprise: '100',
      saas: '3',
    },
    'AI Outreach': {
      free: false,
      starter: '500/mo',
      professional: '5K/mo',
      enterprise: '50K/mo',
      saas: '100/mo',
    },
    'Custom Branding': {
      free: false,
      starter: false,
      professional: true,
      enterprise: true,
      saas: false,
    },
    'SSO Integration': {
      free: false,
      starter: false,
      professional: false,
      enterprise: true,
      saas: false,
    },
    'Dedicated Support': {
      free: false,
      starter: false,
      professional: false,
      enterprise: true,
      saas: true,
    },
  };

  return { features, comparison };
}
