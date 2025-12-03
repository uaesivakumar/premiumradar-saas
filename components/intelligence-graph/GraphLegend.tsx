'use client';

/**
 * GraphLegend Component
 * Sprint S60: Intelligence Graph
 *
 * Displays legend for graph node types and edge relationships.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface GraphLegendProps {
  showEdges?: boolean;
  className?: string;
}

export function GraphLegend({ showEdges = true, className }: GraphLegendProps) {
  const nodeTypes = [
    { type: 'persona', label: 'Persona', color: 'bg-blue-500', icon: '👤' },
    { type: 'journey', label: 'Journey', color: 'bg-green-500', icon: '🛤' },
    { type: 'signal', label: 'Signal', color: 'bg-yellow-500', icon: '📡' },
    { type: 'evidence', label: 'Evidence', color: 'bg-purple-500', icon: '📋' },
    { type: 'object', label: 'Object', color: 'bg-orange-500', icon: '📦' },
  ];

  const edgeTypes = [
    { type: 'triggers', label: 'Triggers', color: 'bg-yellow-400' },
    { type: 'generates', label: 'Generates', color: 'bg-green-400' },
    { type: 'supports', label: 'Supports', color: 'bg-blue-400' },
    { type: 'correlates', label: 'Correlates', color: 'bg-purple-400' },
    { type: 'contains', label: 'Contains', color: 'bg-orange-400' },
  ];

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        className
      )}
    >
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Legend
      </h4>

      {/* Node Types */}
      <div className="mb-4">
        <h5 className="text-xs text-gray-500 mb-2">Node Types</h5>
        <div className="space-y-2">
          {nodeTypes.map((node) => (
            <div key={node.type} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                  node.color
                )}
              >
                {node.icon}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {node.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edge Types */}
      {showEdges && (
        <div>
          <h5 className="text-xs text-gray-500 mb-2">Relationships</h5>
          <div className="space-y-2">
            {edgeTypes.map((edge) => (
              <div key={edge.type} className="flex items-center gap-2">
                <div className="w-6 flex items-center">
                  <div className={cn('h-0.5 w-full', edge.color)} />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {edge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GraphLegend;
