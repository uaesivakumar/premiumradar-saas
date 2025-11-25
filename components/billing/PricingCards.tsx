/**
 * Pricing Cards
 *
 * Display pricing tiers with features and CTA.
 */

'use client';

import { useState } from 'react';
import {
  PRICING_PLANS,
  formatPrice,
  calculateYearlySavings,
  type PlanTier,
  type PricingPlan,
} from '@/lib/billing';

interface PricingCardsProps {
  currentTier?: PlanTier;
  onSelectPlan?: (tier: PlanTier, interval: 'month' | 'year') => void;
  isLoading?: boolean;
}

export function PricingCards({
  currentTier = 'free',
  onSelectPlan,
  isLoading = false,
}: PricingCardsProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const getButtonText = (plan: PricingPlan) => {
    if (plan.tier === currentTier) return 'Current Plan';
    if (plan.tier === 'free') return 'Downgrade';
    return 'Upgrade';
  };

  const getButtonStyle = (plan: PricingPlan) => {
    if (plan.tier === currentTier) {
      return 'bg-gray-100 text-gray-500 cursor-default';
    }
    if (plan.isPopular) {
      return 'bg-blue-600 text-white hover:bg-blue-700';
    }
    return 'bg-gray-900 text-white hover:bg-gray-800';
  };

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span
          className={`text-sm ${
            billingInterval === 'month' ? 'text-gray-900 font-medium' : 'text-gray-500'
          }`}
        >
          Monthly
        </span>
        <button
          onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
          className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              billingInterval === 'year' ? 'translate-x-7' : ''
            }`}
          />
        </button>
        <span
          className={`text-sm ${
            billingInterval === 'year' ? 'text-gray-900 font-medium' : 'text-gray-500'
          }`}
        >
          Yearly
          <span className="ml-1 text-green-600 text-xs font-medium">Save 20%</span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRICING_PLANS.map((plan) => {
          const price = billingInterval === 'year' ? plan.yearlyPrice : plan.monthlyPrice;
          const savings =
            billingInterval === 'year'
              ? calculateYearlySavings(plan.monthlyPrice, plan.yearlyPrice)
              : 0;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 ${
                plan.isPopular
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'border-gray-200'
              } ${plan.tier === currentTier ? 'ring-2 ring-green-500' : ''}`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Badge */}
              {plan.tier === currentTier && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Current
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {price === 0 ? 'Free' : `$${price}`}
                  </span>
                  {price > 0 && (
                    <span className="text-gray-500">/{billingInterval === 'year' ? 'yr' : 'mo'}</span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-sm text-green-600 mt-1">Save ${savings}/year</p>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() =>
                  plan.tier !== currentTier && onSelectPlan?.(plan.tier, billingInterval)
                }
                disabled={plan.tier === currentTier || isLoading}
                className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${getButtonStyle(
                  plan
                )} disabled:opacity-50`}
              >
                {isLoading ? 'Loading...' : getButtonText(plan)}
              </button>

              {/* Features */}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    {feature.included ? (
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-gray-300 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <span
                      className={`text-sm ${
                        feature.included ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      {feature.name}
                      {feature.limit && (
                        <span className="text-gray-500 ml-1">({feature.limit})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
