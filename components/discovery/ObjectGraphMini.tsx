/**
 * Object Graph Mini Component
 * Sprint S55: Discovery UI
 *
 * Mini object graph visualization showing related entities.
 */

import React, { useState } from 'react';
import type { ObjectGraphMiniData, GraphNeighborNode } from '../../lib/discovery';

interface ObjectGraphMiniProps {
  data: ObjectGraphMiniData;
  isLoading?: boolean;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}

export function ObjectGraphMini({ data, isLoading = false, onNodeClick }: ObjectGraphMiniProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  if (isLoading) {
    return <ObjectGraphMiniSkeleton />;
  }

  const nodeTypes = [...new Set(data.neighbors.map((n) => n.type))];
  const filteredNeighbors = selectedType
    ? data.neighbors.filter((n) => n.type === selectedType)
    : data.neighbors;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Related Entities</h3>
          <span className="text-sm text-gray-500">{data.neighbors.length} connections</span>
        </div>
      </div>

      {/* Type Filter */}
      {nodeTypes.length > 1 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                selectedType === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({data.neighbors.length})
            </button>
            {nodeTypes.map((type) => {
              const count = data.neighbors.filter((n) => n.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    selectedType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {getTypeIcon(type)} {type} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Graph Visualization */}
      <div className="p-4">
        <div className="relative w-full h-48">
          {/* Center Node */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              <span className="text-xs text-center px-1 truncate">{data.label}</span>
            </div>
          </div>

          {/* Neighbor Nodes */}
          {filteredNeighbors.slice(0, 8).map((neighbor, i) => {
            const angle = (i / Math.min(filteredNeighbors.length, 8)) * 2 * Math.PI - Math.PI / 2;
            const radius = 70;
            const x = 50 + Math.cos(angle) * (radius / 1.5);
            const y = 50 + Math.sin(angle) * (radius / 1.2);

            return (
              <div
                key={neighbor.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {/* Node */}
                <button
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xs
                    transition-all cursor-pointer shadow-md
                    ${getNodeColor(neighbor.type)}
                    ${hoveredNode === neighbor.id ? 'scale-110 ring-2 ring-blue-300' : ''}
                  `}
                  onMouseEnter={() => setHoveredNode(neighbor.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => onNodeClick?.(neighbor.id, neighbor.type)}
                  title={`${neighbor.label} (${neighbor.type})`}
                >
                  <span className="truncate px-1">{getTypeIcon(neighbor.type)}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* More indicator */}
        {filteredNeighbors.length > 8 && (
          <p className="text-xs text-gray-400 text-center mt-2">
            +{filteredNeighbors.length - 8} more connections
          </p>
        )}
      </div>

      {/* Neighbor List */}
      <div className="border-t border-gray-100 max-h-48 overflow-y-auto">
        {filteredNeighbors.map((neighbor) => (
          <button
            key={neighbor.id}
            className={`
              w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors
              ${hoveredNode === neighbor.id ? 'bg-blue-50' : ''}
            `}
            onMouseEnter={() => setHoveredNode(neighbor.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => onNodeClick?.(neighbor.id, neighbor.type)}
          >
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getNodeColor(neighbor.type)}`}>
              {getTypeIcon(neighbor.type)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{neighbor.label}</p>
              <p className="text-xs text-gray-400 capitalize">{neighbor.type}</p>
            </div>
            <RelationshipBadge relationship={neighbor.relationship} />
          </button>
        ))}
      </div>
    </div>
  );
}

function RelationshipBadge({ relationship }: { relationship: string }) {
  return (
    <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500 capitalize">
      {relationship}
    </span>
  );
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    company: '🏢',
    person: '👤',
    domain: '🌐',
    signal: '📡',
    evidence: '📄',
    news: '📰',
    funding: '💰',
    hiring: '👥',
    default: '📌',
  };
  return icons[type.toLowerCase()] || icons.default;
}

function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    company: 'bg-blue-100 text-blue-700',
    person: 'bg-green-100 text-green-700',
    domain: 'bg-purple-100 text-purple-700',
    signal: 'bg-orange-100 text-orange-700',
    evidence: 'bg-cyan-100 text-cyan-700',
    news: 'bg-yellow-100 text-yellow-700',
    funding: 'bg-pink-100 text-pink-700',
    hiring: 'bg-indigo-100 text-indigo-700',
    default: 'bg-gray-100 text-gray-700',
  };
  return colors[type.toLowerCase()] || colors.default;
}

function ObjectGraphMiniSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="w-32 h-5 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="p-4">
        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="border-t border-gray-100 p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="w-24 h-4 bg-gray-200 rounded mb-1" />
              <div className="w-16 h-3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ObjectGraphMini;
