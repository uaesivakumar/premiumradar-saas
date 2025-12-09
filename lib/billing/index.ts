/**
 * Billing Module
 *
 * Stripe integration and subscription management.
 */

// Types
export type {
  PlanTier,
  PricingPlan,
  PlanFeature,
  PlanLimits,
  StripeProduct,
  StripePrice,
  SubscriptionStatus,
  Subscription,
  SubscriptionItem,
  CheckoutSession,
  CheckoutRequest,
  BillingPortalSession,
  BillingPortalRequest,
  InvoiceStatus,
  Invoice,
  UsageRecord,
  UsageMetric,
  UsageSummary,
  SeatAllocation,
  SeatChange,
  WebhookEventType,
  WebhookEvent,
  DunningEmailType,
  DunningEmail,
} from './types';

// Plans & Pricing
export {
  PLAN_LIMITS,
  PRICING_PLANS,
  getPlanByTier,
  getPlanLimits,
  isValidUpgrade,
  isValidDowngrade,
  getTierDisplayName,
  formatPrice,
  calculateYearlySavings,
  getPaidTiers,
  tierHasFeature,
} from './plans';

// Stripe Client
export {
  stripe,
  createStripeProducts,
  getOrCreateCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  getStripeSubscription,
  cancelSubscriptionAtPeriodEnd,
  resumeSubscription,
  updateSubscriptionTier,
  mapStripeStatus,
  mapStripeSubscription,
} from './stripe-client';

// Subscription Store
export {
  useSubscriptionStore,
  selectSubscription,
  selectCurrentTier,
  selectIsActive,
  selectIsCanceled,
  selectInvoices,
  selectUsage,
  selectIsLoading,
  selectIsCheckingOut,
  createMockSubscription,
  createMockInvoice,
} from './subscription-store';

// Webhooks
export {
  verifyWebhookSignature,
  processWebhookEvent,
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleInvoiceUpcoming,
} from './webhooks';

// Metered Usage
export {
  recordUsage,
  getCurrentUsage,
  getUsageSummary,
  isLimitExceeded,
  getUsagePercentage,
  resetUsage,
  checkAndTrackUsage,
} from './metered-usage';

// Seat Billing
export {
  SEAT_PRICES,
  BASE_SEATS,
  getSeatAllocation,
  initializeSeatAllocation,
  addSeats,
  removeSeats,
  useSeat,
  releaseSeat,
  getAvailableSeats,
  needsMoreSeats,
  calculateSeatCost,
  getSeatUsagePercentage,
} from './seat-billing';

// Dunning
export {
  DEFAULT_DUNNING_CONFIG,
  DUNNING_EMAIL_TEMPLATES,
  getDunningHistory,
  sendPaymentFailedEmail,
  sendPaymentRetryEmail,
  sendSubscriptionCanceledEmail,
  sendCardExpiringEmail,
  handlePaymentFailure,
} from './dunning';

// Overage Alerts (S57)
export {
  DEFAULT_THRESHOLDS,
  getWorkspaceAlerts,
  getActiveAlerts,
  createAlert,
  acknowledgeAlert,
  markNotificationSent,
  checkUsageAndAlert,
  getUsageWithAlerts,
  generateAlertNotification,
  clearAlerts,
  cleanupOldAlerts,
} from './overage-alerts';
export type {
  AlertLevel,
  AlertResource,
  OverageAlert,
  AlertThreshold,
  AlertNotification,
} from './overage-alerts';

// Webhook Idempotency (S142.1)
export {
  isEventProcessed,
  getEventRecord,
  acquireEventLock,
  markEventSuccess,
  markEventFailed,
  processWithIdempotency,
} from './webhook-idempotency';
export type { WebhookEventRecord } from './webhook-idempotency';

// Customer Portal (S142.2)
export {
  createPortalSession,
  getPortalConfiguration,
  cancelSubscriptionAtPeriodEnd as cancelSubscription,
  reactivateSubscription,
  changePlan,
  getCustomerInvoices,
  getPaymentMethods,
} from './customer-portal';
export type { PortalSessionResult, CustomerPortalConfig } from './customer-portal';

// Usage Metering (S142.3)
export {
  logUsage,
  getTenantUsage,
  getUserUsage,
  checkUsageAllowed,
  getUsageSummary as getUsageSummaryV2,
  checkUsageAlerts,
  formatUsageType,
  getUsageLog,
  trackAndCheckUsage,
  PLAN_LIMITS as USAGE_PLAN_LIMITS,
} from './usage-metering';
export type {
  UsageType,
  UsageLogEntry,
  UsageSummary as UsageSummaryV2,
  UsageCheckResult,
  UsageAlert,
} from './usage-metering';
