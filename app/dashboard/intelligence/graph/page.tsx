'use client';

/**
 * Intelligence Graph Page
 * Sprint S60: Intelligence Graph
 *
 * Visual representation of entity relationships in the intelligence network.
 *
 * P2 VERTICALISATION: Now uses dynamic vertical from sales context.
 */

import { useState } from 'react';
import { useIntelligenceGraph } from '@/lib/intelligence-suite';
import { IntelligenceGraph, GraphControls, GraphLegend } from '@/components/intelligence-graph';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';

export default function GraphPage() {
  // P2 VERTICALISATION: Get vertical from sales context
  const vertical = useSalesContextStore(selectVertical);

  const { data, isLoading, error } = useIntelligenceGraph({ vertical });
  const [zoom, setZoom] = useState(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading graph data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-red-500">Failed to load graph data</div>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No graph data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Intelligence Graph
          </h1>
          <p className="text-gray-500 mt-1">
            Visualize entity relationships and connections
          </p>
        </div>
        <GraphControls
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
          onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
          onReset={() => setZoom(1)}
          onFitView={() => setZoom(1)}
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9">
          <IntelligenceGraph
            graph={data}
            onNodeClick={(node) => console.log('Node clicked:', node)}
            onEdgeClick={(edge) => console.log('Edge clicked:', edge)}
          />
        </div>
        <div className="col-span-3">
          <GraphLegend showEdges />
        </div>
      </div>
    </div>
  );
}
