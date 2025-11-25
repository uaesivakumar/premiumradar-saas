/**
 * Billing Settings Page
 *
 * Manage subscription, view usage, and billing history.
 */

'use client';

import { useEffect, useState } from 'react';
import { PricingCards, BillingHistory, UsageMeter } from '@/components/billing';
import {
  useSubscriptionStore,
  selectSubscription,
  selectCurrentTier,
  selectIsActive,
  selectIsCanceled,
  createMockSubscription,
  createMockInvoice,
  type PlanTier,
  type UsageSummary,
  type UsageMetric,
} from '@/lib/billing';

export default function BillingSettingsPage() {
  const subscription = useSubscriptionStore(selectSubscription);
  const currentTier = useSubscriptionStore(selectCurrentTier);
  const isActive = useSubscriptionStore(selectIsActive);
  const isCanceled = useSubscriptionStore(selectIsCanceled);
  const setSubscription = useSubscriptionStore((s) => s.setSubscription);
  const setInvoices = useSubscriptionStore((s) => s.setInvoices);

  const [isLoading, setIsLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // Mock usage data
  const [usage] = useState<UsageSummary>({
    workspaceId: 'ws_demo',
    period: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    },
    metrics: {
      api_calls: 45000,
      exports: 234,
      searches: 5600,
      outreach_sent: 1200,
      storage_mb: 3500,
    },
    limits: {
      api_calls: 100000,
      exports: 1000,
      searches: 10000,
      outreach_sent: 5000,
      storage_mb: 10000,
    },
  });

  // Initialize with mock data
  useEffect(() => {
    setSubscription(
      createMockSubscription({
        tier: 'professional',
        status: 'active',
      })
    );
    setInvoices([
      createMockInvoice({ number: 'INV-001', amountPaid: 14900 }),
      createMockInvoice({
        number: 'INV-002',
        amountPaid: 14900,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      }),
      createMockInvoice({
        number: 'INV-003',
        amountPaid: 14900,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      }),
    ]);
  }, [setSubscription, setInvoices]);

  const handleSelectPlan = async (tier: PlanTier, interval: 'month' | 'year') => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws_demo',
          userId: 'user_demo',
          email: 'demo@premiumradar.com',
          tier,
          billingInterval: interval,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws_demo',
          customerId: subscription?.stripeCustomerId,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Billing portal error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Billing & Subscription</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Current Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-2xl font-bold text-gray-900 capitalize">
                    {currentTier}
                  </span>
                  {isActive && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                  {isCanceled && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Cancels at period end
                    </span>
                  )}
                </div>
                {subscription && (
                  <p className="text-sm text-gray-500 mt-1">
                    Next billing date:{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPricing(!showPricing)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {showPricing ? 'Hide Plans' : 'Change Plan'}
                </button>
                {subscription && (
                  <button
                    onClick={handleManageBilling}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Manage Billing
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          {showPricing && (
            <PricingCards
              currentTier={currentTier}
              onSelectPlan={handleSelectPlan}
              isLoading={isLoading}
            />
          )}

          {/* Usage */}
          <UsageMeter usage={usage} />

          {/* Billing History */}
          <BillingHistory />
        </div>
      </div>
    </div>
  );
}
