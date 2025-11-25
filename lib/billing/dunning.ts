/**
 * Dunning System
 *
 * Payment failure handling and recovery emails.
 */

import type { DunningEmail, DunningEmailType, Invoice } from './types';

// ============================================================
// DUNNING CONFIGURATION
// ============================================================

export interface DunningConfig {
  maxRetryAttempts: number;
  retryIntervalDays: number[];
  gracePeriodDays: number;
  enableEmails: boolean;
}

export const DEFAULT_DUNNING_CONFIG: DunningConfig = {
  maxRetryAttempts: 4,
  retryIntervalDays: [1, 3, 5, 7], // Days after initial failure
  gracePeriodDays: 14, // Days before cancellation
  enableEmails: true,
};

// ============================================================
// EMAIL TEMPLATES
// ============================================================

export interface DunningEmailTemplate {
  subject: string;
  body: string;
}

export const DUNNING_EMAIL_TEMPLATES: Record<DunningEmailType, DunningEmailTemplate> = {
  payment_failed: {
    subject: 'Action Required: Payment Failed for PremiumRadar',
    body: `Hi {{name}},

We were unable to process your payment of {{amount}} for your PremiumRadar subscription.

Please update your payment method to continue using PremiumRadar without interruption.

Update Payment Method: {{updateUrl}}

If you have any questions, please contact our support team.

Best regards,
The PremiumRadar Team`,
  },

  payment_retry: {
    subject: 'Payment Retry Scheduled - PremiumRadar',
    body: `Hi {{name}},

This is a reminder that we'll be retrying your payment of {{amount}} on {{retryDate}}.

To avoid any service interruption, please ensure your payment method is up to date.

Update Payment Method: {{updateUrl}}

Best regards,
The PremiumRadar Team`,
  },

  subscription_canceled: {
    subject: 'Your PremiumRadar Subscription Has Been Canceled',
    body: `Hi {{name}},

Due to unsuccessful payment attempts, your PremiumRadar subscription has been canceled.

Your account has been downgraded to the Free plan. You can reactivate your subscription at any time.

Reactivate Subscription: {{reactivateUrl}}

We hope to see you back soon!

Best regards,
The PremiumRadar Team`,
  },

  card_expiring: {
    subject: 'Your Card is Expiring Soon - PremiumRadar',
    body: `Hi {{name}},

The credit card ending in {{lastFour}} that you use for PremiumRadar is expiring on {{expiryDate}}.

Please update your payment method to ensure uninterrupted service.

Update Payment Method: {{updateUrl}}

Best regards,
The PremiumRadar Team`,
  },
};

// ============================================================
// DUNNING STORE (In-memory for demo)
// ============================================================

const dunningEmails: DunningEmail[] = [];

/**
 * Record a dunning email
 */
function recordDunningEmail(email: DunningEmail): void {
  dunningEmails.push(email);
}

/**
 * Get dunning history for a workspace
 */
export function getDunningHistory(workspaceId: string): DunningEmail[] {
  return dunningEmails.filter((e) => e.workspaceId === workspaceId);
}

// ============================================================
// DUNNING EMAIL FUNCTIONS
// ============================================================

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(params: {
  workspaceId: string;
  recipientEmail: string;
  recipientName: string;
  amount: string;
  updateUrl: string;
  invoiceId: string;
}): Promise<DunningEmail> {
  const template = DUNNING_EMAIL_TEMPLATES.payment_failed;
  const body = template.body
    .replace('{{name}}', params.recipientName)
    .replace('{{amount}}', params.amount)
    .replace('{{updateUrl}}', params.updateUrl);

  // In production, send via email service (SendGrid, Resend, etc.)
  console.log(`[DUNNING] Sending payment_failed email to ${params.recipientEmail}`);
  console.log(`Subject: ${template.subject}`);

  const email: DunningEmail = {
    id: `dun_${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: params.workspaceId,
    type: 'payment_failed',
    recipientEmail: params.recipientEmail,
    sentAt: new Date(),
    stripeInvoiceId: params.invoiceId,
    metadata: { amount: params.amount },
  };

  recordDunningEmail(email);
  return email;
}

/**
 * Send payment retry notification
 */
export async function sendPaymentRetryEmail(params: {
  workspaceId: string;
  recipientEmail: string;
  recipientName: string;
  amount: string;
  retryDate: string;
  updateUrl: string;
}): Promise<DunningEmail> {
  const template = DUNNING_EMAIL_TEMPLATES.payment_retry;

  console.log(`[DUNNING] Sending payment_retry email to ${params.recipientEmail}`);

  const email: DunningEmail = {
    id: `dun_${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: params.workspaceId,
    type: 'payment_retry',
    recipientEmail: params.recipientEmail,
    sentAt: new Date(),
    metadata: { retryDate: params.retryDate },
  };

  recordDunningEmail(email);
  return email;
}

/**
 * Send subscription canceled email
 */
export async function sendSubscriptionCanceledEmail(params: {
  workspaceId: string;
  recipientEmail: string;
  recipientName: string;
  reactivateUrl: string;
}): Promise<DunningEmail> {
  console.log(`[DUNNING] Sending subscription_canceled email to ${params.recipientEmail}`);

  const email: DunningEmail = {
    id: `dun_${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: params.workspaceId,
    type: 'subscription_canceled',
    recipientEmail: params.recipientEmail,
    sentAt: new Date(),
  };

  recordDunningEmail(email);
  return email;
}

/**
 * Send card expiring email
 */
export async function sendCardExpiringEmail(params: {
  workspaceId: string;
  recipientEmail: string;
  recipientName: string;
  lastFour: string;
  expiryDate: string;
  updateUrl: string;
}): Promise<DunningEmail> {
  console.log(`[DUNNING] Sending card_expiring email to ${params.recipientEmail}`);

  const email: DunningEmail = {
    id: `dun_${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: params.workspaceId,
    type: 'card_expiring',
    recipientEmail: params.recipientEmail,
    sentAt: new Date(),
    metadata: { lastFour: params.lastFour, expiryDate: params.expiryDate },
  };

  recordDunningEmail(email);
  return email;
}

// ============================================================
// DUNNING WORKFLOW
// ============================================================

/**
 * Handle payment failure workflow
 */
export async function handlePaymentFailure(params: {
  workspaceId: string;
  recipientEmail: string;
  recipientName: string;
  invoice: Partial<Invoice>;
  attemptCount: number;
  config?: DunningConfig;
}): Promise<void> {
  const config = params.config || DEFAULT_DUNNING_CONFIG;
  const amount = `$${((params.invoice.amountDue || 0) / 100).toFixed(2)}`;
  const updateUrl = `https://premiumradar.com/settings/billing`;

  // First failure - send payment failed email
  if (params.attemptCount === 1) {
    await sendPaymentFailedEmail({
      workspaceId: params.workspaceId,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      amount,
      updateUrl,
      invoiceId: params.invoice.stripeInvoiceId || '',
    });
  }

  // Subsequent failures - send retry notifications
  if (params.attemptCount > 1 && params.attemptCount <= config.maxRetryAttempts) {
    const retryDay = config.retryIntervalDays[params.attemptCount - 1] || 7;
    const retryDate = new Date();
    retryDate.setDate(retryDate.getDate() + retryDay);

    await sendPaymentRetryEmail({
      workspaceId: params.workspaceId,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      amount,
      retryDate: retryDate.toLocaleDateString(),
      updateUrl,
    });
  }

  // Max attempts exceeded - cancel subscription
  if (params.attemptCount > config.maxRetryAttempts) {
    await sendSubscriptionCanceledEmail({
      workspaceId: params.workspaceId,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      reactivateUrl: `https://premiumradar.com/pricing`,
    });
  }
}
