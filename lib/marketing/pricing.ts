/**
 * Pricing Module
 *
 * Pricing tiers, features, and comparison data.
 */

import type { PricingTier, PricingFeature, PricingFAQ } from './types';

// ============================================================
// PRICING TIERS
// ============================================================

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For individuals exploring domain investing',
    price: {
      monthly: 0,
      yearly: 0,
      currency: 'USD',
    },
    features: [
      { name: 'Domain search', included: true, limit: '10/day' },
      { name: 'Basic scoring', included: true },
      { name: 'Watchlist', included: true, limit: '5 domains' },
      { name: 'AI valuations', included: false },
      { name: 'Export data', included: false },
      { name: 'API access', included: false },
      { name: 'Team features', included: false },
      { name: 'Priority support', included: false },
    ],
    limits: {
      domains: 5,
      searches: 10,
      aiAnalyses: 0,
      exports: 0,
      teamMembers: 1,
      apiCalls: 0,
    },
    ctaText: 'Start Free',
    ctaUrl: '/signup?plan=free',
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For active domain investors',
    price: {
      monthly: 29,
      yearly: 290,
      currency: 'USD',
    },
    features: [
      { name: 'Domain search', included: true, limit: '100/day' },
      { name: 'Advanced scoring', included: true },
      { name: 'Watchlist', included: true, limit: '50 domains' },
      { name: 'AI valuations', included: true, limit: '25/month' },
      { name: 'Export data', included: true, limit: 'CSV' },
      { name: 'API access', included: false },
      { name: 'Team features', included: false },
      { name: 'Email support', included: true },
    ],
    limits: {
      domains: 50,
      searches: 100,
      aiAnalyses: 25,
      exports: 10,
      teamMembers: 1,
      apiCalls: 0,
    },
    ctaText: 'Start Trial',
    ctaUrl: '/signup?plan=starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professional domain investors',
    price: {
      monthly: 79,
      yearly: 790,
      currency: 'USD',
    },
    features: [
      { name: 'Domain search', included: true, limit: 'Unlimited' },
      { name: 'Advanced scoring', included: true },
      { name: 'Watchlist', included: true, limit: '500 domains' },
      { name: 'AI valuations', included: true, limit: '100/month' },
      { name: 'Export data', included: true, limit: 'CSV, Excel, JSON' },
      { name: 'API access', included: true, limit: '10K calls/month' },
      { name: 'Team features', included: false },
      { name: 'Priority support', included: true },
    ],
    limits: {
      domains: 500,
      searches: 'unlimited',
      aiAnalyses: 100,
      exports: 50,
      teamMembers: 1,
      apiCalls: 10000,
    },
    highlighted: true,
    badge: 'Most Popular',
    ctaText: 'Start Trial',
    ctaUrl: '/signup?plan=pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For domain portfolio companies',
    price: {
      monthly: 299,
      yearly: 2990,
      currency: 'USD',
    },
    features: [
      { name: 'Domain search', included: true, limit: 'Unlimited' },
      { name: 'Advanced scoring', included: true },
      { name: 'Watchlist', included: true, limit: 'Unlimited' },
      { name: 'AI valuations', included: true, limit: 'Unlimited' },
      { name: 'Export data', included: true, limit: 'All formats + API' },
      { name: 'API access', included: true, limit: 'Unlimited' },
      { name: 'Team features', included: true, limit: 'Up to 10 users' },
      { name: 'Dedicated support', included: true },
    ],
    limits: {
      domains: 'unlimited',
      searches: 'unlimited',
      aiAnalyses: 'unlimited',
      exports: 'unlimited',
      teamMembers: 10,
      apiCalls: 'unlimited',
    },
    ctaText: 'Contact Sales',
    ctaUrl: '/contact-sales',
  },
];

// ============================================================
// FEATURE COMPARISON
// ============================================================

export const FEATURE_CATEGORIES = [
  {
    name: 'Domain Research',
    features: [
      'Domain search',
      'Advanced filters',
      'Bulk lookup',
      'Historical data',
      'Comparable sales',
    ],
  },
  {
    name: 'Scoring & Valuation',
    features: [
      'Basic scoring',
      'Q/T/L/E scoring',
      'AI valuations',
      'Market analysis',
      'Custom models',
    ],
  },
  {
    name: 'Portfolio Management',
    features: [
      'Watchlist',
      'Pipeline tracking',
      'Bulk operations',
      'Tags & categories',
      'Portfolio analytics',
    ],
  },
  {
    name: 'Integrations',
    features: [
      'CSV export',
      'Excel export',
      'API access',
      'Webhooks',
      'CRM integrations',
    ],
  },
  {
    name: 'Support',
    features: [
      'Documentation',
      'Email support',
      'Priority support',
      'Dedicated CSM',
      'SLA',
    ],
  },
];

// ============================================================
// PRICING FAQ
// ============================================================

export const PRICING_FAQ: PricingFAQ[] = [
  {
    question: 'Can I change plans anytime?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, the new rate applies at your next billing cycle.',
    category: 'billing',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! We offer a 14-day free trial on Starter and Pro plans. No credit card required. You\'ll have full access to all features during the trial.',
    category: 'billing',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for Enterprise plans.',
    category: 'billing',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us for a full refund.',
    category: 'billing',
  },
  {
    question: 'What counts as an AI valuation?',
    answer: 'Each time you request an AI-powered domain valuation or analysis, it counts toward your monthly limit. Viewing cached valuations doesn\'t count.',
    category: 'features',
  },
  {
    question: 'Can I add more team members?',
    answer: 'Enterprise plans include up to 10 team members. Additional seats are available for $29/month each. Contact us for larger teams.',
    category: 'features',
  },
  {
    question: 'How does the API rate limiting work?',
    answer: 'API calls are metered monthly. Pro plans include 10K calls/month, Enterprise is unlimited. Calls roll over month-to-month up to 2x your limit.',
    category: 'features',
  },
  {
    question: 'Do you offer discounts for nonprofits?',
    answer: 'Yes! We offer 50% off for registered nonprofits and educational institutions. Contact us with your organization details.',
    category: 'billing',
  },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Get tier by ID
 */
export function getTierById(id: string): PricingTier | undefined {
  return PRICING_TIERS.find((tier) => tier.id === id);
}

/**
 * Calculate yearly savings
 */
export function calculateYearlySavings(tier: PricingTier): number {
  const monthlyTotal = tier.price.monthly * 12;
  const yearlyTotal = tier.price.yearly;
  return monthlyTotal - yearlyTotal;
}

/**
 * Calculate yearly savings percentage
 */
export function calculateYearlySavingsPercent(tier: PricingTier): number {
  if (tier.price.monthly === 0) return 0;
  const savings = calculateYearlySavings(tier);
  return Math.round((savings / (tier.price.monthly * 12)) * 100);
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency = 'USD'): string {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get feature limit display
 */
export function formatLimit(limit: number | 'unlimited'): string {
  if (limit === 'unlimited') return 'Unlimited';
  return limit.toLocaleString();
}

/**
 * Compare two tiers
 */
export function compareTiers(
  tierId1: string,
  tierId2: string
): { differences: string[]; recommendation: string } {
  const tier1 = getTierById(tierId1);
  const tier2 = getTierById(tierId2);

  if (!tier1 || !tier2) {
    return { differences: [], recommendation: '' };
  }

  const differences: string[] = [];
  const higherTier = tier1.price.monthly > tier2.price.monthly ? tier1 : tier2;
  const lowerTier = tier1.price.monthly > tier2.price.monthly ? tier2 : tier1;

  higherTier.features.forEach((feature, i) => {
    const lowerFeature = lowerTier.features[i];
    if (feature.included && !lowerFeature?.included) {
      differences.push(`${feature.name}: Available in ${higherTier.name}`);
    } else if (feature.limit !== lowerFeature?.limit) {
      differences.push(
        `${feature.name}: ${higherTier.name} has ${feature.limit} vs ${lowerFeature?.limit}`
      );
    }
  });

  const recommendation =
    differences.length > 3
      ? `${higherTier.name} offers significantly more features`
      : `${lowerTier.name} may be sufficient for your needs`;

  return { differences, recommendation };
}
