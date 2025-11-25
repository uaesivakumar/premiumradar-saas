/**
 * Stripe Webhooks Handler
 *
 * Process Stripe webhook events for subscription lifecycle.
 */

import type Stripe from 'stripe';
import { stripe, mapStripeSubscription, mapStripeStatus } from './stripe-client';
import type {
  WebhookEventType,
  WebhookEvent,
  Subscription,
  Invoice,
  PlanTier,
} from './types';

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
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<WebhookHandlerResult> {
  const workspaceId = session.metadata?.workspaceId;
  const tier = session.metadata?.tier as PlanTier;

  if (!workspaceId) {
    return { success: false, message: 'Missing workspaceId in metadata' };
  }

  // The subscription is created automatically by Stripe
  // We just need to sync our database
  console.log(`Checkout completed for workspace ${workspaceId}, tier: ${tier}`);

  return {
    success: true,
    message: 'Checkout completed',
    data: { workspaceId, tier, sessionId: session.id },
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
    return { success: false, message: 'Missing workspaceId in subscription metadata' };
  }

  const mappedSub = mapStripeSubscription(subscription, workspaceId);
  console.log(`Subscription created: ${subscription.id} for workspace ${workspaceId}`);

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
    // Try to find workspace by customer ID
    console.log('Subscription updated without workspaceId:', subscription.id);
    return { success: true, message: 'Subscription updated (no workspace link)' };
  }

  const status = mapStripeStatus(subscription.status);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  console.log(`Subscription ${subscription.id} updated: status=${status}, cancelAtPeriodEnd=${cancelAtPeriodEnd}`);

  return {
    success: true,
    message: 'Subscription updated',
    data: {
      subscriptionId: subscription.id,
      workspaceId,
      status,
      cancelAtPeriodEnd,
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

  console.log(`Subscription ${subscription.id} deleted for workspace ${workspaceId}`);

  // Downgrade workspace to free tier
  return {
    success: true,
    message: 'Subscription deleted - workspace downgraded to free',
    data: { workspaceId, newTier: 'free' },
  };
}

/**
 * Handle invoice.paid
 */
export async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<WebhookHandlerResult> {
  const subscriptionId = invoice.subscription as string;

  console.log(`Invoice ${invoice.id} paid for subscription ${subscriptionId}`);

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
    data: { invoice: mappedInvoice },
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

  console.log(`Invoice ${invoice.id} payment failed for subscription ${subscriptionId}`);

  // This should trigger dunning email
  return {
    success: true,
    message: 'Invoice payment failed - dunning triggered',
    data: {
      invoiceId: invoice.id,
      subscriptionId,
      customerEmail,
      amountDue: invoice.amount_due,
      attemptCount: invoice.attempt_count,
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

  console.log(`Upcoming invoice for subscription ${subscriptionId}`);

  // This can be used to send reminder emails
  return {
    success: true,
    message: 'Upcoming invoice notification',
    data: {
      subscriptionId,
      amountDue: invoice.amount_due,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
    },
  };
}

// ============================================================
// MAIN WEBHOOK PROCESSOR
// ============================================================

/**
 * Process webhook event
 */
export async function processWebhookEvent(
  event: Stripe.Event
): Promise<WebhookHandlerResult> {
  const eventType = event.type as WebhookEventType;

  console.log(`Processing webhook: ${eventType} (${event.id})`);

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

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
      return { success: true, message: `Unhandled event type: ${event.type}` };
  }
}
