/**
 * Pricing Plans Configuration
 *
 * Tier mapping and plan definitions for PremiumRadar.
 */

import type { PricingPlan, PlanTier, PlanLimits } from './types';

// ============================================================
// PLAN LIMITS BY TIER
// ============================================================

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    users: 2,
    apiCalls: 1000,
    exports: 10,
    searches: 100,
    outreach: 50,
    storageMb: 100,
  },
  starter: {
    users: 5,
    apiCalls: 10000,
    exports: 100,
    searches: 1000,
    outreach: 500,
    storageMb: 1000,
  },
  professional: {
    users: 20,
    apiCalls: 100000,
    exports: 1000,
    searches: 10000,
    outreach: 5000,
    storageMb: 10000,
  },
  enterprise: {
    users: 100,
    apiCalls: 1000000,
    exports: 10000,
    searches: 100000,
    outreach: 50000,
    storageMb: 100000,
  },
};

// ============================================================
// PRICING PLANS
// ============================================================

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'plan_free',
    tier: 'free',
    name: 'Free',
    description: 'For individuals exploring PremiumRadar',
    monthlyPrice: 0,
    yearlyPrice: 0,
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
    limits: PLAN_LIMITS.free,
    features: [
      { name: 'Company Discovery', included: true, limit: '100 searches/mo' },
      { name: 'Basic Analytics', included: true },
      { name: 'Email Support', included: true },
      { name: 'API Access', included: false },
      { name: 'Team Members', included: true, limit: '2 users' },
      { name: 'Export Data', included: true, limit: '10 exports/mo' },
      { name: 'AI Outreach', included: false },
      { name: 'Custom Branding', included: false },
    ],
  },
  {
    id: 'plan_starter',
    tier: 'starter',
    name: 'Starter',
    description: 'For small teams getting started',
    monthlyPrice: 49,
    yearlyPrice: 470, // ~20% discount
    stripePriceIdMonthly: 'price_starter_monthly',
    stripePriceIdYearly: 'price_starter_yearly',
    limits: PLAN_LIMITS.starter,
    features: [
      { name: 'Company Discovery', included: true, limit: '1,000 searches/mo' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Email Support', included: true },
      { name: 'API Access', included: true, limit: '10K calls/mo' },
      { name: 'Team Members', included: true, limit: '5 users' },
      { name: 'Export Data', included: true, limit: '100 exports/mo' },
      { name: 'AI Outreach', included: true, limit: '500 msgs/mo' },
      { name: 'Custom Branding', included: false },
    ],
  },
  {
    id: 'plan_professional',
    tier: 'professional',
    name: 'Professional',
    description: 'For growing teams with advanced needs',
    monthlyPrice: 149,
    yearlyPrice: 1430, // ~20% discount
    stripePriceIdMonthly: 'price_professional_monthly',
    stripePriceIdYearly: 'price_professional_yearly',
    limits: PLAN_LIMITS.professional,
    isPopular: true,
    features: [
      { name: 'Company Discovery', included: true, limit: '10,000 searches/mo' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Support + Slack', included: true },
      { name: 'API Access', included: true, limit: '100K calls/mo' },
      { name: 'Team Members', included: true, limit: '20 users' },
      { name: 'Export Data', included: true, limit: '1,000 exports/mo' },
      { name: 'AI Outreach', included: true, limit: '5,000 msgs/mo' },
      { name: 'Custom Branding', included: true },
    ],
  },
  {
    id: 'plan_enterprise',
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    monthlyPrice: 499,
    yearlyPrice: 4790, // ~20% discount
    stripePriceIdMonthly: 'price_enterprise_monthly',
    stripePriceIdYearly: 'price_enterprise_yearly',
    limits: PLAN_LIMITS.enterprise,
    features: [
      { name: 'Unlimited Discovery', included: true },
      { name: 'Advanced Analytics + Custom', included: true },
      { name: 'Dedicated Account Manager', included: true },
      { name: 'API Access', included: true, limit: 'Unlimited' },
      { name: 'Team Members', included: true, limit: '100 users' },
      { name: 'Export Data', included: true, limit: 'Unlimited' },
      { name: 'AI Outreach', included: true, limit: '50,000 msgs/mo' },
      { name: 'Custom Branding + SSO', included: true },
    ],
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get plan by tier
 */
export function getPlanByTier(tier: PlanTier): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.tier === tier);
}

/**
 * Get plan limits by tier
 */
export function getPlanLimits(tier: PlanTier): PlanLimits {
  return PLAN_LIMITS[tier];
}

/**
 * Check if tier upgrade is valid
 */
export function isValidUpgrade(currentTier: PlanTier, newTier: PlanTier): boolean {
  const tierOrder: PlanTier[] = ['free', 'starter', 'professional', 'enterprise'];
  return tierOrder.indexOf(newTier) > tierOrder.indexOf(currentTier);
}

/**
 * Check if tier downgrade is valid
 */
export function isValidDowngrade(currentTier: PlanTier, newTier: PlanTier): boolean {
  const tierOrder: PlanTier[] = ['free', 'starter', 'professional', 'enterprise'];
  return tierOrder.indexOf(newTier) < tierOrder.indexOf(currentTier);
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: PlanTier): string {
  const plan = getPlanByTier(tier);
  return plan?.name || tier;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, interval: 'month' | 'year' = 'month'): string {
  if (amount === 0) return 'Free';
  return `$${amount}/${interval === 'month' ? 'mo' : 'yr'}`;
}

/**
 * Calculate yearly savings
 */
export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  const yearlyIfMonthly = monthlyPrice * 12;
  return yearlyIfMonthly - yearlyPrice;
}

/**
 * Get all paid tiers
 */
export function getPaidTiers(): PlanTier[] {
  return ['starter', 'professional', 'enterprise'];
}

/**
 * Check if tier has feature
 */
export function tierHasFeature(tier: PlanTier, featureName: string): boolean {
  const plan = getPlanByTier(tier);
  if (!plan) return false;
  const feature = plan.features.find((f) => f.name === featureName);
  return feature?.included ?? false;
}
