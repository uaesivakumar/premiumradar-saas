/**
 * Vertical Popularity Component
 *
 * Display domain vertical/category popularity metrics.
 */

'use client';

import { useState } from 'react';
import {
  useVerticalStore,
  VERTICALS,
  getVerticalInfo,
  getTrendInfo,
  calculateVerticalHealth,
  formatPrice,
  type VerticalMetrics,
  type VerticalPopularityData,
} from '@/lib/analytics';

interface VerticalPopularityProps {
  data: VerticalPopularityData;
  onSelectVertical?: (vertical: string) => void;
}

export function VerticalPopularity({ data, onSelectVertical }: VerticalPopularityProps) {
  const [sortBy, setSortBy] = useState<'searches' | 'purchases' | 'price' | 'trend'>(
    'searches'
  );
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);

  // Sort verticals
  const sortedVerticals = [...data.verticals].sort((a, b) => {
    switch (sortBy) {
      case 'searches':
        return b.searchCount - a.searchCount;
      case 'purchases':
        return b.purchaseCount - a.purchaseCount;
      case 'price':
        return b.averagePrice - a.averagePrice;
      case 'trend':
        return b.trendPercentage - a.trendPercentage;
      default:
        return 0;
    }
  });

  const handleSelectVertical = (vertical: string) => {
    setSelectedVertical(vertical);
    onSelectVertical?.(vertical);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Total Searches"
          value={data.totalSearches.toLocaleString()}
          icon="🔍"
        />
        <SummaryCard
          label="Total Views"
          value={data.totalViews.toLocaleString()}
          icon="👁️"
        />
        <SummaryCard
          label="Total Purchases"
          value={data.totalPurchases.toLocaleString()}
          icon="💰"
        />
      </div>

      {/* Vertical list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Vertical Popularity</h3>
            <p className="text-sm text-gray-500">
              {data.verticals.length} verticals tracked
            </p>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            <option value="searches">By Searches</option>
            <option value="purchases">By Purchases</option>
            <option value="price">By Avg Price</option>
            <option value="trend">By Trend</option>
          </select>
        </div>

        <div className="divide-y divide-gray-100">
          {sortedVerticals.map((vertical, index) => (
            <VerticalRow
              key={vertical.vertical}
              vertical={vertical}
              rank={index + 1}
              isSelected={selectedVertical === vertical.vertical}
              onSelect={() => handleSelectVertical(vertical.vertical)}
              totalSearches={data.totalSearches}
            />
          ))}
        </div>
      </div>

      {/* Selected vertical details */}
      {selectedVertical && (
        <VerticalDetails
          vertical={sortedVerticals.find((v) => v.vertical === selectedVertical)!}
          onClose={() => setSelectedVertical(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function VerticalRow({
  vertical,
  rank,
  isSelected,
  onSelect,
  totalSearches,
}: {
  vertical: VerticalMetrics;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
  totalSearches: number;
}) {
  const info = getVerticalInfo(
    VERTICALS.find((v) => v.name === vertical.vertical)?.id || 'unknown'
  );
  const trendInfo = getTrendInfo(vertical.trend);
  const health = calculateVerticalHealth(vertical);
  const percentage = (vertical.searchCount / totalSearches) * 100;

  return (
    <div
      onClick={onSelect}
      className={`px-6 py-4 flex items-center gap-4 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Rank */}
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
        {rank}
      </div>

      {/* Vertical info */}
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
        {info.icon}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{vertical.vertical}</div>
        <div className="text-sm text-gray-500">
          {vertical.searchCount.toLocaleString()} searches •{' '}
          {vertical.viewCount.toLocaleString()} views
        </div>
      </div>

      {/* Purchase count */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900">
          {vertical.purchaseCount}
        </div>
        <div className="text-xs text-gray-500">Purchases</div>
      </div>

      {/* Average price */}
      <div className="text-center w-24">
        <div className="text-sm font-medium text-gray-900">
          {formatPrice(vertical.averagePrice)}
        </div>
        <div className="text-xs text-gray-500">Avg Price</div>
      </div>

      {/* Trend */}
      <div
        className={`px-2 py-1 rounded text-xs font-medium ${
          vertical.trend === 'rising'
            ? 'bg-green-100 text-green-700'
            : vertical.trend === 'falling'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
        }`}
      >
        {trendInfo.icon} {vertical.trendPercentage > 0 ? '+' : ''}
        {vertical.trendPercentage}%
      </div>

      {/* Health score */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
          health.rating === 'excellent'
            ? 'bg-green-100 text-green-700'
            : health.rating === 'good'
              ? 'bg-blue-100 text-blue-700'
              : health.rating === 'fair'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
        }`}
      >
        {health.score}
      </div>

      {/* Share bar */}
      <div className="w-24">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          {percentage.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function VerticalDetails({
  vertical,
  onClose,
}: {
  vertical: VerticalMetrics;
  onClose: () => void;
}) {
  const health = calculateVerticalHealth(vertical);
  const trendInfo = getTrendInfo(vertical.trend);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{vertical.vertical} Details</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="p-6 grid grid-cols-3 gap-6">
        {/* Activity metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Activity</h4>
          <div className="space-y-3">
            <MetricRow label="Searches" value={vertical.searchCount.toLocaleString()} />
            <MetricRow label="Views" value={vertical.viewCount.toLocaleString()} />
            <MetricRow label="Purchases" value={vertical.purchaseCount.toLocaleString()} />
            <MetricRow
              label="Conversion"
              value={`${((vertical.purchaseCount / Math.max(vertical.viewCount, 1)) * 100).toFixed(2)}%`}
            />
          </div>
        </div>

        {/* Price metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Pricing</h4>
          <div className="space-y-3">
            <MetricRow label="Average" value={formatPrice(vertical.averagePrice)} />
            <MetricRow label="Median" value={formatPrice(vertical.medianPrice)} />
            <MetricRow label="Min" value={formatPrice(vertical.priceRange.min)} />
            <MetricRow label="Max" value={formatPrice(vertical.priceRange.max)} />
          </div>
        </div>

        {/* Health metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Health Score</h4>
          <div className="text-center mb-4">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${
                health.rating === 'excellent'
                  ? 'bg-green-100 text-green-700'
                  : health.rating === 'good'
                    ? 'bg-blue-100 text-blue-700'
                    : health.rating === 'fair'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
              }`}
            >
              {health.score}
            </div>
            <div className="mt-2 text-sm text-gray-500 capitalize">
              {health.rating}
            </div>
          </div>
          <div className="space-y-1">
            {health.factors.map((factor, i) => (
              <div key={i} className="text-xs text-gray-600 flex items-center gap-1">
                <span className="text-green-500">✓</span> {factor}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top domains */}
      {vertical.topDomains.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Domains</h4>
          <div className="flex flex-wrap gap-2">
            {vertical.topDomains.map((domain) => (
              <span
                key={domain}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {domain}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trend */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Trend</span>
          <span
            className={`px-2 py-1 rounded text-sm font-medium ${
              vertical.trend === 'rising'
                ? 'bg-green-100 text-green-700'
                : vertical.trend === 'falling'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {trendInfo.icon} {trendInfo.label} ({vertical.trendPercentage > 0 ? '+' : ''}
            {vertical.trendPercentage}%)
          </span>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          View All Domains →
        </button>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

// Trending verticals widget
export function TrendingVerticals({
  verticals,
}: {
  verticals: VerticalMetrics[];
}) {
  const trending = verticals
    .filter((v) => v.trend === 'rising')
    .sort((a, b) => b.trendPercentage - a.trendPercentage)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Trending Verticals</h3>

      {trending.length === 0 ? (
        <p className="text-gray-500 text-sm">No trending verticals</p>
      ) : (
        <div className="space-y-3">
          {trending.map((vertical, index) => {
            const info = getVerticalInfo(
              VERTICALS.find((v) => v.name === vertical.vertical)?.id || 'unknown'
            );
            return (
              <div key={vertical.vertical} className="flex items-center gap-3">
                <span className="text-xl">{info.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {vertical.vertical}
                  </div>
                  <div className="text-xs text-gray-500">
                    {vertical.searchCount.toLocaleString()} searches
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">
                  +{vertical.trendPercentage}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
