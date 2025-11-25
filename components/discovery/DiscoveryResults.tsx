/**
 * Discovery Results Component
 *
 * Display domain discovery search results.
 */

'use client';

import { useState } from 'react';
import {
  type DiscoveryResult,
  type DiscoveryResponse,
  formatMatchReason,
  sortResults,
  useDiscoveryStore,
} from '@/lib/discovery';

interface DiscoveryResultsProps {
  response: DiscoveryResponse;
  onSelect?: (result: DiscoveryResult) => void;
  onAddToWatchlist?: (domain: string) => void;
}

export function DiscoveryResults({
  response,
  onSelect,
  onAddToWatchlist,
}: DiscoveryResultsProps) {
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'length' | 'match'>('score');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const isInWatchlist = useDiscoveryStore((s) => s.isInWatchlist);
  const sortedResults = sortResults(response.results, sortBy);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {response.totalCount} Results Found
          </h3>
          <p className="text-sm text-gray-500">
            Processed in {response.processingTime}ms
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
          >
            <option value="score">Sort by Score</option>
            <option value="match">Sort by Match</option>
            <option value="price">Sort by Price</option>
            <option value="length">Sort by Length</option>
          </select>

          {/* View Toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-sm ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {response.suggestions.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Try also:</span>
          {response.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedResults.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              isWatched={isInWatchlist(result.domain)}
              onSelect={onSelect}
              onWatch={onAddToWatchlist}
            />
          ))}
        </div>
      ) : (
        <ResultsTable
          results={sortedResults}
          isInWatchlist={isInWatchlist}
          onSelect={onSelect}
          onWatch={onAddToWatchlist}
        />
      )}

      {/* Load More */}
      {response.hasMore && (
        <div className="text-center py-4">
          <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Load More Results
          </button>
        </div>
      )}
    </div>
  );
}

function ResultCard({
  result,
  isWatched,
  onSelect,
  onWatch,
}: {
  result: DiscoveryResult;
  isWatched: boolean;
  onSelect?: (result: DiscoveryResult) => void;
  onWatch?: (domain: string) => void;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onSelect?.(result)}
    >
      {/* Domain Name */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 text-lg">{result.domain}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{result.length} chars</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                result.available
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {result.available ? 'Available' : 'Registered'}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWatch?.(result.domain);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            isWatched
              ? 'bg-yellow-100 text-yellow-600'
              : 'bg-gray-100 text-gray-400 hover:text-yellow-600'
          }`}
        >
          ★
        </button>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <ScorePill label="Q" value={result.scores.quality} />
        <ScorePill label="T" value={result.scores.traffic} />
        <ScorePill label="L" value={result.scores.liquidity} />
        <ScorePill label="E" value={result.scores.endUser} />
      </div>

      {/* Composite Score */}
      <div className="flex items-center justify-between py-2 border-t border-gray-100">
        <div>
          <span className="text-sm text-gray-500">Composite</span>
          <div className="text-xl font-bold text-gray-900">
            {result.scores.composite}
          </div>
        </div>
        {result.price && (
          <div className="text-right">
            <span className="text-sm text-gray-500">Price</span>
            <div className="text-lg font-semibold text-green-600">
              ${result.price.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Match Reason */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{formatMatchReason(result.matchReason)}</span>
          <span className="font-medium text-blue-600">{result.matchScore}% match</span>
        </div>
      </div>

      {/* Vertical Tag */}
      {result.vertical && (
        <div className="mt-2">
          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
            {result.vertical}
          </span>
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70
      ? 'bg-green-100 text-green-700'
      : value >= 50
        ? 'bg-blue-100 text-blue-700'
        : 'bg-gray-100 text-gray-600';

  return (
    <div className={`px-2 py-1 rounded text-center ${color}`}>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

function ResultsTable({
  results,
  isInWatchlist,
  onSelect,
  onWatch,
}: {
  results: DiscoveryResult[];
  isInWatchlist: (domain: string) => boolean;
  onSelect?: (result: DiscoveryResult) => void;
  onWatch?: (domain: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Domain
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Q/T/L/E
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Composite
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Match
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Price
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {results.map((result) => (
            <tr
              key={result.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelect?.(result)}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{result.domain}</div>
                <div className="text-xs text-gray-500">
                  {result.length} chars •{' '}
                  {result.available ? (
                    <span className="text-green-600">Available</span>
                  ) : (
                    <span className="text-gray-500">Registered</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-center text-sm text-gray-600">
                {result.scores.quality}/{result.scores.traffic}/{result.scores.liquidity}/
                {result.scores.endUser}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-bold text-gray-900">{result.scores.composite}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="text-blue-600 font-medium">{result.matchScore}%</span>
              </td>
              <td className="px-4 py-3 text-right">
                {result.price ? (
                  <span className="text-green-600 font-medium">
                    ${result.price.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWatch?.(result.domain);
                  }}
                  className={`p-1 rounded ${
                    isInWatchlist(result.domain)
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-500'
                  }`}
                >
                  ★
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
