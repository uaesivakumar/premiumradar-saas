/**
 * Evidence Summary Panel Component
 * Sprint S55: Discovery UI
 *
 * Panel showing evidence breakdown by provider and category.
 */

import React, { useState } from 'react';
import type { EvidencePanelData, FreshnessStatus } from '../../lib/discovery';

interface EvidenceSummaryPanelProps {
  data: EvidencePanelData;
  isLoading?: boolean;
}

export function EvidenceSummaryPanel({ data, isLoading = false }: EvidenceSummaryPanelProps) {
  const [activeTab, setActiveTab] = useState<'providers' | 'categories' | 'timeline'>('providers');

  if (isLoading) {
    return <EvidenceSummaryPanelSkeleton />;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Evidence Summary</h3>
          <FreshnessBadge freshness={data.freshnessBreakdown} />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Evidence:</span>
            <span className="ml-1 font-semibold text-gray-900">{data.totalEvidence}</span>
          </div>
          <div>
            <span className="text-gray-500">Providers:</span>
            <span className="ml-1 font-semibold text-gray-900">{data.providers.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Categories:</span>
            <span className="ml-1 font-semibold text-gray-900">{data.categories.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('providers')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'providers'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          By Provider
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          By Category
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'timeline'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Timeline
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'providers' && <ProviderList providers={data.providers} />}
        {activeTab === 'categories' && <CategoryList categories={data.categories} />}
        {activeTab === 'timeline' && <Timeline entries={data.timeline} />}
      </div>
    </div>
  );
}

function FreshnessBadge({ freshness }: { freshness: EvidencePanelData['freshnessBreakdown'] }) {
  const total = freshness.fresh + freshness.recent + freshness.stale + freshness.unknown;
  const freshPercent = total > 0 ? Math.round((freshness.fresh / total) * 100) : 0;

  let status: FreshnessStatus = 'unknown';
  if (freshPercent >= 60) status = 'fresh';
  else if (freshPercent >= 30) status = 'recent';
  else if (total > 0) status = 'stale';

  const statusStyles = {
    fresh: { bg: 'bg-green-100', text: 'text-green-700', label: 'Fresh' },
    recent: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Recent' },
    stale: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Stale' },
    unknown: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Unknown' },
  };

  const style = statusStyles[status];

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${style.bg} ${style.text}`}>
      {style.label} ({freshPercent}%)
    </span>
  );
}

function ProviderList({ providers }: { providers: EvidencePanelData['providers'] }) {
  if (providers.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No providers available</p>;
  }

  const maxCount = Math.max(...providers.map((p) => p.count));

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <div key={provider.provider} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{provider.provider}</span>
            <span className="text-gray-500">{provider.count} items</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(provider.count / maxCount) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Confidence: {Math.round(provider.confidence * 100)}%</span>
            <span>•</span>
            <span>Updated {formatRelativeTime(provider.lastFetched)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryList({ categories }: { categories: EvidencePanelData['categories'] }) {
  if (categories.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No categories available</p>;
  }

  const total = categories.reduce((sum, c) => sum + c.count, 0);

  const categoryColors: Record<string, string> = {
    company: 'bg-blue-500',
    financial: 'bg-green-500',
    hiring: 'bg-purple-500',
    news: 'bg-orange-500',
    social: 'bg-pink-500',
    technology: 'bg-cyan-500',
    default: 'bg-gray-500',
  };

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const color = categoryColors[category.category.toLowerCase()] || categoryColors.default;
        const percentage = total > 0 ? ((category.count / total) * 100).toFixed(1) : '0';

        return (
          <div key={category.category} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 capitalize">{category.category}</span>
                <span className="text-gray-500">{category.count} ({percentage}%)</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${color} rounded-full transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Timeline({ entries }: { entries: EvidencePanelData['timeline'] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No timeline data available</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {entries.map((entry, i) => (
          <div key={i} className="relative pl-8">
            <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-700">{entry.count} items</span>
                <span className="text-xs text-gray-400">{formatRelativeTime(entry.date)}</span>
              </div>
              <p className="text-gray-600 text-xs">
                From: {entry.providers.join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function EvidenceSummaryPanelSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="w-32 h-5 bg-gray-200 rounded" />
          <div className="w-20 h-5 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-24 h-4 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
      <div className="flex border-b border-gray-100">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 px-4 py-2">
            <div className="w-20 h-4 bg-gray-200 rounded mx-auto" />
          </div>
        ))}
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="w-24 h-4 bg-gray-200 rounded" />
              <div className="w-16 h-4 bg-gray-200 rounded" />
            </div>
            <div className="h-2 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default EvidenceSummaryPanel;
