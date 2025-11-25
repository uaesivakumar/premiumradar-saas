/**
 * Billing & Subscription Types
 *
 * Core types for Stripe integration and subscription management.
 */

// ============================================================
// PLAN & TIER TYPES
// ============================================================

export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface PricingPlan {
  id: string;
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  features: PlanFeature[];
  limits: PlanLimits;
  isPopular?: boolean;
  isCurrent?: boolean;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

export interface PlanLimits {
  users: number;
  apiCalls: number;
  exports: number;
  searches: number;
  outreach: number;
  storageMb: number;
}

// ============================================================
// STRIPE PRODUCT TYPES
// ============================================================

export interface StripeProduct {
  id: string;
  stripeProductId: string;
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
  tier: PlanTier;
  name: string;
  active: boolean;
  metadata: Record<string, string>;
  createdAt: Date;
}

export interface StripePrice {
  id: string;
  stripePriceId: string;
  productId: string;
  unitAmount: number;
  currency: string;
  interval: 'month' | 'year';
  active: boolean;
}

// ============================================================
// SUBSCRIPTION TYPES
// ============================================================

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired';

export interface Subscription {
  id: string;
  workspaceId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  tier: PlanTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  billingInterval: 'month' | 'year';
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  stripePriceId: string;
  quantity: number;
}

// ============================================================
// CHECKOUT TYPES
// ============================================================

export interface CheckoutSession {
  id: string;
  stripeSessionId: string;
  workspaceId: string;
  userId: string;
  tier: PlanTier;
  billingInterval: 'month' | 'year';
  status: 'pending' | 'completed' | 'expired';
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CheckoutRequest {
  workspaceId: string;
  userId: string;
  tier: PlanTier;
  billingInterval: 'month' | 'year';
  successUrl: string;
  cancelUrl: string;
}

// ============================================================
// BILLING PORTAL TYPES
// ============================================================

export interface BillingPortalSession {
  url: string;
  returnUrl: string;
}

export interface BillingPortalRequest {
  workspaceId: string;
  returnUrl: string;
}

// ============================================================
// INVOICE TYPES
// ============================================================

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'uncollectible'
  | 'void';

export interface Invoice {
  id: string;
  stripeInvoiceId: string;
  workspaceId: string;
  subscriptionId: string;
  number: string;
  status: InvoiceStatus;
  amountDue: number;
  amountPaid: number;
  currency: string;
  dueDate?: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  createdAt: Date;
}

// ============================================================
// USAGE & METERING TYPES
// ============================================================

export interface UsageRecord {
  id: string;
  workspaceId: string;
  subscriptionItemId: string;
  metric: UsageMetric;
  quantity: number;
  timestamp: Date;
  idempotencyKey: string;
}

export type UsageMetric =
  | 'api_calls'
  | 'exports'
  | 'searches'
  | 'outreach_sent'
  | 'storage_mb';

export interface UsageSummary {
  workspaceId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: Record<UsageMetric, number>;
  limits: Record<UsageMetric, number>;
}

// ============================================================
// SEAT-BASED BILLING TYPES
// ============================================================

export interface SeatAllocation {
  workspaceId: string;
  subscriptionId: string;
  totalSeats: number;
  usedSeats: number;
  pricePerSeat: number;
  billingInterval: 'month' | 'year';
}

export interface SeatChange {
  workspaceId: string;
  previousSeats: number;
  newSeats: number;
  proratedAmount: number;
  effectiveDate: Date;
}

// ============================================================
// WEBHOOK TYPES
// ============================================================

export type WebhookEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'invoice.upcoming'
  | 'customer.updated';

export interface WebhookEvent {
  id: string;
  stripeEventId: string;
  type: WebhookEventType;
  data: Record<string, unknown>;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  createdAt: Date;
}

// ============================================================
// DUNNING TYPES
// ============================================================

export type DunningEmailType =
  | 'payment_failed'
  | 'payment_retry'
  | 'subscription_canceled'
  | 'card_expiring';

export interface DunningEmail {
  id: string;
  workspaceId: string;
  type: DunningEmailType;
  recipientEmail: string;
  sentAt: Date;
  stripeInvoiceId?: string;
  metadata?: Record<string, string>;
}
