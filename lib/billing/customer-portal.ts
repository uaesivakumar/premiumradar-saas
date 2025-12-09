/**
 * Stripe Customer Portal Service - Sprint S142.2
 *
 * Enables customers to:
 * - Update payment method
 * - Cancel subscription
 * - Switch plan
 * - View invoices
 */

import { stripe } from './stripe-client';

// ============================================================
// TYPES
// ============================================================

export interface PortalSessionResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface CustomerPortalConfig {
  workspaceId: string;
  stripeCustomerId: string;
  returnUrl: string;
}

// ============================================================
// CUSTOMER PORTAL
// ============================================================

/**
 * Create Stripe Customer Portal session
 * Allows user to manage their subscription
 */
export async function createPortalSession(
  config: CustomerPortalConfig
): Promise<PortalSessionResult> {
  if (!stripe) {
    return {
      success: false,
      error: 'Stripe not configured',
    };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: config.stripeCustomerId,
      return_url: config.returnUrl,
    });

    return {
      success: true,
      url: session.url,
    };
  } catch (error) {
    console.error('[Portal] Error creating portal session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create portal session',
    };
  }
}

/**
 * Get portal configuration (for custom portal UI)
 */
export async function getPortalConfiguration(): Promise<{
  success: boolean;
  features?: {
    customerUpdate: boolean;
    invoiceHistory: boolean;
    paymentMethodUpdate: boolean;
    subscriptionCancel: boolean;
    subscriptionPause: boolean;
    subscriptionUpdate: boolean;
  };
  error?: string;
}> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    // Get the default portal configuration
    const configurations = await stripe.billingPortal.configurations.list({
      limit: 1,
      active: true,
    });

    if (configurations.data.length === 0) {
      return {
        success: true,
        features: {
          customerUpdate: true,
          invoiceHistory: true,
          paymentMethodUpdate: true,
          subscriptionCancel: true,
          subscriptionPause: false,
          subscriptionUpdate: true,
        },
      };
    }

    const config = configurations.data[0];

    return {
      success: true,
      features: {
        customerUpdate: config.features.customer_update.enabled,
        invoiceHistory: config.features.invoice_history.enabled,
        paymentMethodUpdate: config.features.payment_method_update.enabled,
        subscriptionCancel: config.features.subscription_cancel.enabled,
        subscriptionPause: config.features.subscription_pause?.enabled ?? false,
        subscriptionUpdate: config.features.subscription_update.enabled,
      },
    };
  } catch (error) {
    console.error('[Portal] Error getting portal configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get portal configuration',
    };
  }
}

// ============================================================
// SUBSCRIPTION MANAGEMENT (Direct API calls)
// ============================================================

/**
 * Cancel subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return { success: true };
  } catch (error) {
    console.error('[Portal] Error canceling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return { success: true };
  } catch (error) {
    console.error('[Portal] Error reactivating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reactivate subscription',
    };
  }
}

/**
 * Change subscription plan
 */
export async function changePlan(
  subscriptionId: string,
  newPriceId: string,
  options?: {
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  }
): Promise<{ success: boolean; error?: string }> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    // Get current subscription to find item ID
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0]?.id;

    if (!itemId) {
      return { success: false, error: 'No subscription item found' };
    }

    // Update subscription with new price
    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: itemId,
          price: newPriceId,
        },
      ],
      proration_behavior: options?.prorationBehavior || 'create_prorations',
    });

    return { success: true };
  } catch (error) {
    console.error('[Portal] Error changing plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change plan',
    };
  }
}

/**
 * Get customer invoices
 */
export async function getCustomerInvoices(
  customerId: string,
  limit: number = 10
): Promise<{
  success: boolean;
  invoices?: Array<{
    id: string;
    number: string | null;
    status: string | null;
    amountDue: number;
    amountPaid: number;
    currency: string;
    created: Date;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
  }>;
  error?: string;
}> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return {
      success: true,
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        created: new Date(inv.created * 1000),
        hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
        invoicePdf: inv.invoice_pdf ?? null,
      })),
    };
  } catch (error) {
    console.error('[Portal] Error getting invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invoices',
    };
  }
}

/**
 * Get customer payment methods
 */
export async function getPaymentMethods(
  customerId: string
): Promise<{
  success: boolean;
  paymentMethods?: Array<{
    id: string;
    type: string;
    card?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
    isDefault: boolean;
  }>;
  error?: string;
}> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethod =
      typeof customer !== 'string' && !customer.deleted
        ? (customer.invoice_settings?.default_payment_method as string | null)
        : null;

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return {
      success: true,
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            }
          : undefined,
        isDefault: pm.id === defaultPaymentMethod,
      })),
    };
  } catch (error) {
    console.error('[Portal] Error getting payment methods:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment methods',
    };
  }
}

export default {
  createPortalSession,
  getPortalConfiguration,
  cancelSubscriptionAtPeriodEnd,
  reactivateSubscription,
  changePlan,
  getCustomerInvoices,
  getPaymentMethods,
};
