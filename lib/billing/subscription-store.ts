/**
 * Subscription Store
 *
 * Zustand store for subscription state management.
 */

import { create } from 'zustand';
import type { Subscription, PlanTier, Invoice, UsageSummary } from './types';

interface SubscriptionState {
  // Current subscription
  subscription: Subscription | null;

  // Invoices
  invoices: Invoice[];

  // Usage
  usage: UsageSummary | null;

  // Loading states
  isLoading: boolean;
  isCheckingOut: boolean;
  error: string | null;

  // Actions
  setSubscription: (subscription: Subscription | null) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setUsage: (usage: UsageSummary | null) => void;
  setLoading: (loading: boolean) => void;
  setCheckingOut: (checkingOut: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  subscription: null,
  invoices: [],
  usage: null,
  isLoading: false,
  isCheckingOut: false,
  error: null,
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  ...initialState,

  setSubscription: (subscription) => set({ subscription }),
  setInvoices: (invoices) => set({ invoices }),
  setUsage: (usage) => set({ usage }),
  setLoading: (isLoading) => set({ isLoading }),
  setCheckingOut: (isCheckingOut) => set({ isCheckingOut }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

// ============================================================
// SELECTORS
// ============================================================

export const selectSubscription = (state: SubscriptionState) => state.subscription;
export const selectCurrentTier = (state: SubscriptionState): PlanTier =>
  state.subscription?.tier || 'free';
export const selectIsActive = (state: SubscriptionState) =>
  state.subscription?.status === 'active' || state.subscription?.status === 'trialing';
export const selectIsCanceled = (state: SubscriptionState) =>
  state.subscription?.cancelAtPeriodEnd === true;
export const selectInvoices = (state: SubscriptionState) => state.invoices;
export const selectUsage = (state: SubscriptionState) => state.usage;
export const selectIsLoading = (state: SubscriptionState) => state.isLoading;
export const selectIsCheckingOut = (state: SubscriptionState) => state.isCheckingOut;

// ============================================================
// MOCK DATA HELPERS
// ============================================================

export function createMockSubscription(
  overrides?: Partial<Subscription>
): Subscription {
  return {
    id: 'sub_' + Math.random().toString(36).substr(2, 9),
    workspaceId: 'ws_demo',
    stripeSubscriptionId: 'sub_stripe_' + Math.random().toString(36).substr(2, 9),
    stripeCustomerId: 'cus_' + Math.random().toString(36).substr(2, 9),
    tier: 'professional',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    billingInterval: 'month',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockInvoice(overrides?: Partial<Invoice>): Invoice {
  return {
    id: 'inv_' + Math.random().toString(36).substr(2, 9),
    stripeInvoiceId: 'in_' + Math.random().toString(36).substr(2, 9),
    workspaceId: 'ws_demo',
    subscriptionId: 'sub_demo',
    number: 'INV-' + Math.random().toString().substr(2, 6),
    status: 'paid',
    amountDue: 14900,
    amountPaid: 14900,
    currency: 'usd',
    paidAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}
