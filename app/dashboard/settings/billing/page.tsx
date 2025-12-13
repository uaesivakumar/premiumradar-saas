/**
 * Billing Settings Page
 * VS12.6: Wired to real API data
 *
 * Manage subscription, view usage, and billing history.
 * Now fetches real data from /api/billing/usage
 *
 * Authorization Code: VS12-FRONTEND-WIRING-20251213
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { PricingCards, BillingHistory, UsageMeter } from '@/components/billing';
import {
  useSubscriptionStore,
  selectSubscription,
  selectCurrentTier,
  selectIsActive,
  selectIsCanceled,
  type PlanTier,
  type UsageSummary,
} from '@/lib/billing';

export default function BillingSettingsPage() {
  const subscription = useSubscriptionStore(selectSubscription);
  const currentTier = useSubscriptionStore(selectCurrentTier);
  const isActive = useSubscriptionStore(selectIsActive);
  const isCanceled = useSubscriptionStore(selectIsCanceled);
  const setSubscription = useSubscriptionStore((s) => s.setSubscription);
  const setInvoices = useSubscriptionStore((s) => s.setInvoices);

  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);

  // VS12.6: Real usage data from API
  const [usage, setUsage] = useState<UsageSummary>({
    workspaceId: '',
    period: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    },
    metrics: {
      api_calls: 0,
      exports: 0,
      searches: 0,
      outreach_sent: 0,
      storage_mb: 0,
    },
    limits: {
      api_calls: 100000,
      exports: 1000,
      searches: 10000,
      outreach_sent: 5000,
      storage_mb: 10000,
    },
  });

  // VS12.6: Fetch real billing data from API
  const fetchBillingData = useCallback(async () => {
    setIsDataLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/usage');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch billing data');
      }

      // Set subscription from API
      if (result.data?.subscription) {
        setSubscription({
          id: result.data.subscription.id || 'sub_default',
          workspaceId: result.data.subscription.workspaceId || 'ws_default',
          tier: result.data.subscription.tier || 'starter',
          status: result.data.subscription.status || 'active',
          billingInterval: result.data.subscription.billingInterval || 'month',
          stripeCustomerId: result.data.subscription.stripeCustomerId,
          stripeSubscriptionId: result.data.subscription.stripeSubscriptionId,
          currentPeriodStart: new Date(result.data.subscription.currentPeriodStart || Date.now()),
          currentPeriodEnd: new Date(result.data.subscription.currentPeriodEnd || Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: result.data.subscription.cancelAtPeriodEnd || false,
          createdAt: new Date(result.data.subscription.createdAt || Date.now()),
          updatedAt: new Date(result.data.subscription.updatedAt || Date.now()),
        });
      }

      // Set invoices from API
      if (result.data?.invoices) {
        setInvoices(result.data.invoices.map((inv: {
          id: string;
          number: string;
          amountDue: number;
          amountPaid: number;
          status: string;
          createdAt: string;
          pdfUrl?: string;
        }) => ({
          id: inv.id,
          workspaceId: 'ws_default',
          stripeInvoiceId: inv.id,
          number: inv.number,
          amountDue: inv.amountDue,
          amountPaid: inv.amountPaid,
          currency: 'usd',
          status: inv.status as 'draft' | 'open' | 'paid' | 'void' | 'uncollectible',
          createdAt: new Date(inv.createdAt),
          pdfUrl: inv.pdfUrl,
        })));
      }

      // Set usage from API
      if (result.data?.usage) {
        setUsage({
          workspaceId: result.data.usage.workspaceId || 'ws_default',
          period: {
            start: new Date(result.data.usage.period?.start || new Date().setDate(1)),
            end: new Date(result.data.usage.period?.end || new Date()),
          },
          metrics: result.data.usage.metrics || usage.metrics,
          limits: result.data.usage.limits || usage.limits,
        });
      }

    } catch (err) {
      console.error('[Billing] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setIsDataLoading(false);
    }
  }, [setSubscription, setInvoices, usage.metrics, usage.limits]);

  // VS12.6: Fetch data on mount
  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

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

  // VS12.6: Loading state
  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  // VS12.6: Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to load billing</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchBillingData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Billing & Subscription</h1>
            <button
              onClick={fetchBillingData}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh billing data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
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
