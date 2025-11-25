/**
 * Demo Discovery Component
 *
 * Display fake discovery results for demo mode.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  generateFakeDiscoveryList,
  generateFakeSearchSuggestions,
  generateDemoScore,
  DEFAULT_DEMO_LIMITS,
  type FakeDomain,
} from '@/lib/demo';

interface DemoDiscoveryProps {
  initialQuery?: string;
}

export function DemoDiscovery({ initialQuery = 'tech' }: DemoDiscoveryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<FakeDomain | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'traffic'>('score');

  // Generate results based on query
  const results = useMemo(() => {
    const domains = generateFakeDiscoveryList(
      DEFAULT_DEMO_LIMITS.maxSearchResults,
      query
    );

    // Sort results
    return domains.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.overallScore - a.overallScore;
        case 'price':
          return a.price - b.price;
        case 'traffic':
          return b.trafficScore - a.trafficScore;
        default:
          return 0;
      }
    });
  }, [query, sortBy]);

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    if (value.length >= 2) {
      setSuggestions(generateFakeSearchSuggestions(value));
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = () => {
    setQuery(searchInput);
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion);
    setQuery(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for domains..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span className="text-gray-400">🔍</span>{' '}
                      <span className="text-gray-700">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="mt-3 flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-200 rounded px-3 py-1.5"
            >
              <option value="score">Sort by Score</option>
              <option value="price">Sort by Price</option>
              <option value="traffic">Sort by Traffic</option>
            </select>
            <span className="text-sm text-gray-500">
              {results.length} results (demo limit: {DEFAULT_DEMO_LIMITS.maxSearchResults})
            </span>
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((domain) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            onClick={() => setSelectedDomain(domain)}
            isSelected={selectedDomain?.id === domain.id}
          />
        ))}
      </div>

      {/* Domain detail modal */}
      {selectedDomain && (
        <DomainDetailModal
          domain={selectedDomain}
          onClose={() => setSelectedDomain(null)}
        />
      )}
    </div>
  );
}

function DomainCard({
  domain,
  onClick,
  isSelected,
}: {
  domain: FakeDomain;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-400 shadow-md ring-2 ring-blue-100'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Domain name */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 truncate">
          {domain.fullDomain}
        </h3>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            domain.status === 'available'
              ? 'bg-green-100 text-green-700'
              : domain.status === 'premium'
                ? 'bg-purple-100 text-purple-700'
                : domain.status === 'aftermarket'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
          }`}
        >
          {domain.status}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
            domain.overallScore >= 75
              ? 'bg-green-100 text-green-700'
              : domain.overallScore >= 60
                ? 'bg-blue-100 text-blue-700'
                : domain.overallScore >= 45
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
          }`}
        >
          {domain.overallScore}
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">
            ${domain.price.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">
            Est. value: ${domain.estimatedValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <MetricBadge label="Traffic" value={domain.trafficScore} />
        <MetricBadge label="SEO" value={domain.seoScore} />
        <MetricBadge label="Brand" value={domain.brandScore} />
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{domain.vertical}</span>
        <span>{domain.age}y old</span>
        <span>{(domain.monthlyTraffic / 1000).toFixed(0)}K/mo</span>
      </div>

      {/* Keywords */}
      <div className="mt-2 flex flex-wrap gap-1">
        {domain.keywords.slice(0, 3).map((keyword) => (
          <span
            key={keyword}
            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}

function MetricBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div
        className={`text-sm font-medium ${
          value >= 70
            ? 'text-green-600'
            : value >= 50
              ? 'text-blue-600'
              : 'text-gray-600'
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function DomainDetailModal({
  domain,
  onClose,
}: {
  domain: FakeDomain;
  onClose: () => void;
}) {
  const score = generateDemoScore(domain.fullDomain);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {domain.fullDomain}
            </h3>
            <p className="text-sm text-gray-500">
              {domain.vertical} • {domain.age} years old
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Main metrics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {score.scores.composite}
              </div>
              <div className="text-sm text-gray-500">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${domain.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(domain.monthlyTraffic / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-500">Monthly Traffic</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {domain.backlinks.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Backlinks</div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Score Breakdown</h4>
            <div className="space-y-3">
              {Object.entries(score.scores).map(([key, value]) => {
                if (key === 'composite') return null;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-24 capitalize">
                      {key}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          value >= 70
                            ? 'bg-green-500'
                            : value >= 50
                              ? 'bg-blue-500'
                              : 'bg-gray-400'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Demo disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">{score.disclaimer}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Demo Mode • Data for illustration only
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Book Demo for Real Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
