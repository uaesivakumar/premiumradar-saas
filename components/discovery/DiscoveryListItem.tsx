/**
 * Discovery List Item Component
 * Sprint S55: Discovery UI
 *
 * Individual company card in the discovery list.
 */

import React from 'react';
import type { DiscoveryListItem as DiscoveryItemData } from '../../lib/discovery';

interface DiscoveryListItemProps {
  item: DiscoveryItemData;
  isSelected?: boolean;
  onSelect?: (objectId: string) => void;
  onHover?: (objectId: string) => void;
}

export function DiscoveryListItem({
  item,
  isSelected = false,
  onSelect,
  onHover,
}: DiscoveryListItemProps) {
  const freshnessStyles = {
    fresh: { bg: 'bg-green-100', text: 'text-green-700', label: 'Fresh' },
    recent: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Recent' },
    stale: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Stale' },
    unknown: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Unknown' },
  };

  const freshness = freshnessStyles[item.freshness];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className={`
        p-4 bg-white rounded-lg border transition-all cursor-pointer
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
      `}
      onClick={() => onSelect?.(item.objectId)}
      onMouseEnter={() => onHover?.(item.objectId)}
    >
      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-bold text-gray-600">#{item.rank}</span>
        </div>

        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.company.logo ? (
              <img
                src={item.company.logo}
                alt={item.company.name}
                className="w-6 h-6 rounded"
              />
            ) : (
              <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-500">
                {item.company.name[0]}
              </div>
            )}
            <h3 className="font-semibold text-gray-900 truncate">{item.company.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${freshness.bg} ${freshness.text}`}>
              {freshness.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>{item.company.industry}</span>
            <span>•</span>
            <span>{item.company.location.country}</span>
            <span>•</span>
            <span className="capitalize">{item.company.size}</span>
          </div>

          {item.company.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {item.company.description}
            </p>
          )}

          {/* Top Signals */}
          {item.signalsSummary.topSignals.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.signalsSummary.topSignals.slice(0, 3).map((signal, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded"
                >
                  {signal}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score & Metrics */}
        <div className="flex-shrink-0 text-right">
          <div className={`text-2xl font-bold ${getScoreColor(item.score.total)}`}>
            {Math.round(item.score.total)}
          </div>
          <div className="text-xs text-gray-500 mb-2">Score</div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div title="Evidence count">
              <span className="font-medium">{item.evidence.totalCount}</span> evidence
            </div>
            <div title="Signals">
              <span className="text-green-600">+{item.signalsSummary.positive}</span>
              {' / '}
              <span className="text-red-600">-{item.signalsSummary.negative}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscoveryListItem;
