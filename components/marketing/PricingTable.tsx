/**
 * Pricing Table Component
 *
 * Display pricing tiers with comparison.
 */

'use client';

import { useState } from 'react';
import {
  PRICING_TIERS,
  PRICING_FAQ,
  formatPrice,
  calculateYearlySavingsPercent,
  type PricingTier,
} from '@/lib/marketing';

interface PricingTableProps {
  onSelectPlan?: (planId: string) => void;
}

export function PricingTable({ onSelectPlan }: PricingTableProps) {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Billing toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
          <button
            onClick={() => setIsYearly(false)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              !isYearly
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              isYearly
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs text-green-600 font-semibold">
              Save up to 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {PRICING_TIERS.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            isYearly={isYearly}
            onSelect={() => onSelectPlan?.(tier.id)}
          />
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PRICING_FAQ.slice(0, 6).map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  tier,
  isYearly,
  onSelect,
}: {
  tier: PricingTier;
  isYearly: boolean;
  onSelect: () => void;
}) {
  const price = isYearly ? tier.price.yearly / 12 : tier.price.monthly;
  const savingsPercent = calculateYearlySavingsPercent(tier);

  return (
    <div
      className={`relative rounded-2xl border p-8 ${
        tier.highlighted
          ? 'border-blue-500 shadow-xl scale-105'
          : 'border-gray-200'
      }`}
    >
      {/* Badge */}
      {tier.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
            {tier.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
        <p className="text-gray-500 mt-2">{tier.description}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center">
          <span className="text-4xl font-bold text-gray-900">
            {formatPrice(price)}
          </span>
          {tier.price.monthly > 0 && (
            <span className="text-gray-500 ml-2">/month</span>
          )}
        </div>
        {isYearly && savingsPercent > 0 && (
          <p className="text-sm text-green-600 mt-2">
            Save {savingsPercent}% with yearly billing
          </p>
        )}
        {isYearly && tier.price.monthly > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Billed {formatPrice(tier.price.yearly)} annually
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          tier.highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {tier.ctaText}
      </button>

      {/* Features */}
      <ul className="mt-8 space-y-4">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                feature.included
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {feature.included ? '✓' : '×'}
            </span>
            <span
              className={`text-sm ${
                feature.included ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {feature.name}
              {feature.limit && (
                <span className="text-gray-400"> ({feature.limit})</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-medium text-gray-900">{question}</span>
        <span className="text-gray-400 ml-4">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <p className="mt-3 text-gray-600 text-sm">{answer}</p>}
    </div>
  );
}

// Compact pricing comparison
export function PricingComparison() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-4 px-4">Feature</th>
            {PRICING_TIERS.map((tier) => (
              <th
                key={tier.id}
                className={`text-center py-4 px-4 ${
                  tier.highlighted ? 'bg-blue-50' : ''
                }`}
              >
                {tier.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PRICING_TIERS[0].features.map((_, featureIndex) => (
            <tr key={featureIndex} className="border-t border-gray-100">
              <td className="py-3 px-4 text-sm text-gray-700">
                {PRICING_TIERS[0].features[featureIndex].name}
              </td>
              {PRICING_TIERS.map((tier) => {
                const feature = tier.features[featureIndex];
                return (
                  <td
                    key={tier.id}
                    className={`text-center py-3 px-4 ${
                      tier.highlighted ? 'bg-blue-50' : ''
                    }`}
                  >
                    {feature.included ? (
                      <span className="text-green-600">
                        {feature.limit || '✓'}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
