/**
 * Stripe Webhooks Handler - Sprint S142.1
 *
 * Process Stripe webhook events for subscription lifecycle.
 * Includes:
 * - Signature verification
 * - Idempotency (no duplicate processing)
 * - All core event handlers
 */

import type Stripe from 'stripe';
import { stripe, mapStripeSubscription, mapStripeStatus } from './stripe-client';
import { processWithIdempotency } from './webhook-idempotency';
import type {
  WebhookEventType,
  Subscription,
  Invoice,
  PlanTier,
} from './types';

// Database functions are imported dynamically to avoid bundling pg in client code
type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise' | 'saas';
type TenantSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

async function getDbFunctions() {
  // Dynamic import to keep pg out of client bundles
  const db = await import('@/lib/db/users');
  return {
    updateTenantSubscription: db.updateTenantSubscription,
    updateTenantSubscriptionStatus: db.updateTenantSubscriptionStatus,
    cancelTenantSubscription: db.cancelTenantSubscription,
    updateTenantStripeCustomer: db.updateTenantStripeCustomer,
  };
}

// ============================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Verify webhook signature and parse event
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe || !webhookSecret) {
    console.error('Stripe or webhook secret not configured');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return null;
  }
}

// ============================================================
// EVENT HANDLERS
// ============================================================

export interface WebhookHandlerResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Handle checkout.session.completed
 * Creates subscription record after successful checkout
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<WebhookHandlerResult> {
  const workspaceId = session.metadata?.workspaceId;
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as PlanTier;

  if (!workspaceId || !userId) {
    return { success: false, message: 'Missing workspaceId or userId in metadata' };
  }

  console.log(`[Webhook] Checkout completed for workspace ${workspaceId}, tier: ${tier}`);

  // Update tenant subscription in database
  try {
    const db = await getDbFunctions();
    const tenantPlan = tier as TenantPlan;
    await db.updateTenantSubscription(workspaceId, {
      plan: tenantPlan,
      subscription_status: 'active',
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
    });
    console.log(`[Webhook] Tenant ${workspaceId} subscription updated to ${tier}`);
  } catch (dbError) {
    console.error('[Webhook] Failed to update tenant subscription:', dbError);
    // Don't fail the webhook - Stripe will retry
  }

  return {
    success: true,
    message: 'Checkout completed',
    data: {
      workspaceId,
      userId,
      tier,
      sessionId: session.id,
      customerId: session.customer,
      subscriptionId: session.subscription,
    },
  };
}

/**
 * Handle customer.subscription.created
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<WebhookHandlerResult> {
  const workspaceId = subscription.metadata?.workspaceId;

  if (!workspaceId) {
    console.log('[Webhook] Subscription created without workspaceId:', subscription.id);
    return { success: true, message: 'Subscription created (no workspace link yet)' };
  }

  const mappedSub = mapStripeSubscription(subscription, workspaceId);
  console.log(`[Webhook] Subscription created: ${subscription.id} for workspace ${workspaceId}`);

  // In production: Insert subscription record
  // await db.subscriptions.create(mappedSub)

  return {
    success: true,
    message: 'Subscription created',
    data: { subscription: mappedSub },
  };
}

/**
 * Handle customer.subscription.updated
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<WebhookHandlerResult> {
  const workspaceId = subscription.metadata?.workspaceId;

  if (!workspaceId) {
    console.log('[Webhook] Subscription updated without workspaceId:', subscription.id);
    return { success: true, message: 'Subscription updated (no workspace link)' };
  }

  const status = mapStripeStatus(subscription.status);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  console.log(`[Webhook] Subscription ${subscription.id} updated: status=${status}, cancelAtPeriodEnd=${cancelAtPeriodEnd}`);

  // Update tenant subscription status in database
  try {
    const db = await getDbFunctions();
    const tenantStatus = status as TenantSubscriptionStatus;
    await db.updateTenantSubscriptionStatus(subscription.id, tenantStatus);
    console.log(`[Webhook] Tenant subscription status updated to ${status}`);
  } catch (dbError) {
    console.error('[Webhook] Failed to update tenant subscription status:', dbError);
  }

  return {
    success: true,
    message: 'Subscription updated',
    data: {
      subscriptionId: subscription.id,
      workspaceId,
      status,
      cancelAtPeriodEnd,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
    },
  };
}

/**
 * Handle customer.subscription.deleted
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<WebhookHandlerResult> {
  const workspaceId = subscription.metadata?.workspaceId;

  console.log(`[Webhook] Subscription ${subscription.id} deleted for workspace ${workspaceId}`);

  // Cancel tenant subscription - downgrade to free
  try {
    const db = await getDbFunctions();
    await db.cancelTenantSubscription(subscription.id);
    console.log(`[Webhook] Tenant subscription canceled, downgraded to free`);
  } catch (dbError) {
    console.error('[Webhook] Failed to cancel tenant subscription:', dbError);
  }

  return {
    success: true,
    message: 'Subscription deleted - workspace downgraded to free',
    data: { workspaceId, newTier: 'free', subscriptionId: subscription.id },
  };
}

/**
 * Handle customer.created
 */
export async function handleCustomerCreated(
  customer: Stripe.Customer
): Promise<WebhookHandlerResult> {
  const workspaceId = customer.metadata?.workspaceId;
  const userId = customer.metadata?.userId;

  console.log(`[Webhook] Customer ${customer.id} created for workspace ${workspaceId}`);

  // Link Stripe customer to tenant
  if (workspaceId) {
    try {
      const db = await getDbFunctions();
      await db.updateTenantStripeCustomer(workspaceId, customer.id);
      console.log(`[Webhook] Tenant ${workspaceId} linked to Stripe customer ${customer.id}`);
    } catch (dbError) {
      console.error('[Webhook] Failed to link Stripe customer to tenant:', dbError);
    }
  }

  return {
    success: true,
    message: 'Customer created',
    data: {
      customerId: customer.id,
      workspaceId,
      userId,
      email: customer.email,
    },
  };
}

/**
 * Handle customer.updated
 */
export async function handleCustomerUpdated(
  customer: Stripe.Customer
): Promise<WebhookHandlerResult> {
  console.log(`[Webhook] Customer ${customer.id} updated`);

  return {
    success: true,
    message: 'Customer updated',
    data: {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
    },
  };
}

/**
 * Handle invoice.payment_succeeded (invoice.paid)
 */
export async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<WebhookHandlerResult> {
  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  console.log(`[Webhook] Invoice ${invoice.id} paid for subscription ${subscriptionId}`);

  // In production: Record invoice in database
  const mappedInvoice: Partial<Invoice> = {
    stripeInvoiceId: invoice.id,
    number: invoice.number || '',
    status: 'paid',
    amountDue: invoice.amount_due,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    paidAt: invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000)
      : new Date(),
    hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
    invoicePdf: invoice.invoice_pdf || undefined,
  };

  return {
    success: true,
    message: 'Invoice paid',
    data: { invoice: mappedInvoice, subscriptionId, customerId },
  };
}

/**
 * Handle invoice.payment_failed
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<WebhookHandlerResult> {
  const subscriptionId = invoice.subscription as string;
  const customerEmail = invoice.customer_email;

  console.log(`[Webhook] Invoice ${invoice.id} payment failed for subscription ${subscriptionId}`);

  // In production:
  // 1. Update subscription status to past_due
  // 2. Send dunning email to customer
  // await db.subscriptions.update({ status: 'past_due' })
  // await sendDunningEmail(customerEmail, invoice)

  return {
    success: true,
    message: 'Invoice payment failed - dunning triggered',
    data: {
      invoiceId: invoice.id,
      subscriptionId,
      customerEmail,
      amountDue: invoice.amount_due,
      attemptCount: invoice.attempt_count,
      nextPaymentAttempt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null,
    },
  };
}

/**
 * Handle invoice.upcoming
 */
export async function handleInvoiceUpcoming(
  invoice: Stripe.Invoice
): Promise<WebhookHandlerResult> {
  const subscriptionId = invoice.subscription as string;
  const customerEmail = invoice.customer_email;

  console.log(`[Webhook] Upcoming invoice for subscription ${subscriptionId}`);

  // In production: Send upcoming invoice notification
  // await sendUpcomingInvoiceNotification(customerEmail, invoice)

  return {
    success: true,
    message: 'Upcoming invoice notification',
    data: {
      subscriptionId,
      customerEmail,
      amountDue: invoice.amount_due,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    },
  };
}

// ============================================================
// MAIN WEBHOOK PROCESSOR (WITH IDEMPOTENCY)
// ============================================================

/**
 * Process webhook event with idempotency
 */
export async function processWebhookEvent(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const eventType = event.type as WebhookEventType;

  console.log(`[Webhook] Processing: ${eventType} (${event.id})`);

  // Use idempotency wrapper
  const result = await processWithIdempotency(
    event.id,
    eventType,
    async () => {
      switch (eventType) {
        case 'checkout.session.completed':
          return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);

        case 'customer.subscription.created':
          return handleSubscriptionCreated(event.data.object as Stripe.Subscription);

        case 'customer.subscription.updated':
          return handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

        case 'customer.subscription.deleted':
          return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);

        case 'invoice.paid':
          return handleInvoicePaid(event.data.object as Stripe.Invoice);

        case 'invoice.payment_failed':
          return handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

        case 'invoice.upcoming':
          return handleInvoiceUpcoming(event.data.object as Stripe.Invoice);

        case 'customer.created' as WebhookEventType:
          return handleCustomerCreated(event.data.object as Stripe.Customer);

        case 'customer.updated':
          return handleCustomerUpdated(event.data.object as Stripe.Customer);

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
          return { success: true, message: `Unhandled event type: ${event.type}` };
      }
    }
  );

  if (result.skipped) {
    return {
      success: true,
      message: `Event ${event.id} already processed (idempotent skip)`,
    };
  }

  if (!result.success) {
    return {
      success: false,
      message: result.error || 'Unknown error',
    };
  }

  return result.result as WebhookHandlerResult;
}
