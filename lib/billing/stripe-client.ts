/**
 * Stripe Client
 *
 * Server-side Stripe SDK wrapper for billing operations.
 */

import Stripe from 'stripe';
import type {
  PlanTier,
  CheckoutRequest,
  BillingPortalRequest,
  Subscription,
  SubscriptionStatus,
} from './types';
import { getPlanByTier, PRICING_PLANS } from './plans';

// ============================================================
// STRIPE CLIENT INITIALIZATION
// ============================================================

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not set - billing features disabled');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
  : null;

// ============================================================
// PRODUCT MANAGEMENT
// ============================================================

/**
 * Create Stripe products and prices for all tiers
 */
export async function createStripeProducts(): Promise<void> {
  if (!stripe) throw new Error('Stripe not configured');

  for (const plan of PRICING_PLANS) {
    if (plan.tier === 'free') continue; // Skip free tier

    // Create product
    const product = await stripe.products.create({
      name: `PremiumRadar ${plan.name}`,
      description: plan.description,
      metadata: {
        tier: plan.tier,
        planId: plan.id,
      },
    });

    // Create monthly price
    if (plan.monthlyPrice > 0) {
      await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice * 100, // Convert to cents
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: {
          tier: plan.tier,
          interval: 'month',
        },
      });
    }

    // Create yearly price
    if (plan.yearlyPrice > 0) {
      await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyPrice * 100,
        currency: 'usd',
        recurring: { interval: 'year' },
        metadata: {
          tier: plan.tier,
          interval: 'year',
        },
      });
    }

    console.log(`Created Stripe product for ${plan.name}`);
  }
}

/**
 * Get or create Stripe customer for workspace
 */
export async function getOrCreateCustomer(params: {
  workspaceId: string;
  email: string;
  name?: string;
}): Promise<Stripe.Customer> {
  if (!stripe) throw new Error('Stripe not configured');

  // Search for existing customer
  const existingCustomers = await stripe.customers.list({
    email: params.email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      workspaceId: params.workspaceId,
    },
  });
}

// ============================================================
// CHECKOUT SESSION
// ============================================================

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
  request: CheckoutRequest,
  customerId: string
): Promise<Stripe.Checkout.Session> {
  if (!stripe) throw new Error('Stripe not configured');

  const plan = getPlanByTier(request.tier);
  if (!plan) throw new Error(`Invalid tier: ${request.tier}`);

  const priceId =
    request.billingInterval === 'year'
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly;

  if (!priceId) throw new Error(`No price configured for ${request.tier} ${request.billingInterval}`);

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
    subscription_data: {
      metadata: {
        workspaceId: request.workspaceId,
        userId: request.userId,
        tier: request.tier,
      },
    },
    metadata: {
      workspaceId: request.workspaceId,
      userId: request.userId,
      tier: request.tier,
    },
  });
}

// ============================================================
// BILLING PORTAL
// ============================================================

/**
 * Create billing portal session
 */
export async function createBillingPortalSession(
  request: BillingPortalRequest,
  customerId: string
): Promise<Stripe.BillingPortal.Session> {
  if (!stripe) throw new Error('Stripe not configured');

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: request.returnUrl,
  });
}

// ============================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================

/**
 * Get subscription from Stripe
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) throw new Error('Stripe not configured');

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) throw new Error('Stripe not configured');

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume canceled subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  if (!stripe) throw new Error('Stripe not configured');

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription tier
 */
export async function updateSubscriptionTier(
  subscriptionId: string,
  newTier: PlanTier,
  billingInterval: 'month' | 'year'
): Promise<Stripe.Subscription> {
  if (!stripe) throw new Error('Stripe not configured');

  const plan = getPlanByTier(newTier);
  if (!plan) throw new Error(`Invalid tier: ${newTier}`);

  const newPriceId =
    billingInterval === 'year' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
    metadata: {
      tier: newTier,
    },
  });
}

// ============================================================
// STATUS MAPPING
// ============================================================

/**
 * Map Stripe status to our status
 */
export function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    paused: 'active', // Map paused to active for simplicity
  };

  return statusMap[stripeStatus] || 'active';
}

/**
 * Convert Stripe subscription to our Subscription type
 */
export function mapStripeSubscription(
  stripeSub: Stripe.Subscription,
  workspaceId: string
): Omit<Subscription, 'id'> {
  const tier = (stripeSub.metadata.tier as PlanTier) || 'starter';

  return {
    workspaceId,
    stripeSubscriptionId: stripeSub.id,
    stripeCustomerId: stripeSub.customer as string,
    tier,
    status: mapStripeStatus(stripeSub.status),
    currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : undefined,
    trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : undefined,
    billingInterval: stripeSub.items.data[0]?.price.recurring?.interval === 'year' ? 'year' : 'month',
    createdAt: new Date(stripeSub.created * 1000),
    updatedAt: new Date(),
  };
}
