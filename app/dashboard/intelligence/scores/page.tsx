'use client';

/**
 * Score Explanation Engine Page
 * Sprint S61: Score Explanation Engine UI
 *
 * Deep dive into score composition and factor analysis.
 */

import { useState } from 'react';
import { useScoreInsights } from '@/lib/intelligence-suite';
import { ScoreExplanationPanel } from '@/components/intelligence';

// Sample object IDs for demo - in production these would come from a selection
const SAMPLE_OBJECT_IDS = [
  { id: 'obj-001', label: 'Acme Corp' },
  { id: 'obj-002', label: 'TechStart Inc' },
  { id: 'obj-003', label: 'Global Trading Co' },
];

export default function ScoresPage() {
  const [selectedObjectId, setSelectedObjectId] = useState(SAMPLE_OBJECT_IDS[0].id);
  const { data, isLoading, error } = useScoreInsights({ objectId: selectedObjectId });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Score Explanations
          </h1>
          <p className="text-gray-500 mt-1">
            Understand score composition and contributing factors
          </p>
        </div>
        <select
          value={selectedObjectId}
          onChange={(e) => setSelectedObjectId(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          {SAMPLE_OBJECT_IDS.map((obj) => (
            <option key={obj.id} value={obj.id}>
              {obj.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-gray-500">Loading score data...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-red-500">Failed to load score data</div>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No score data available for this object</div>
        </div>
      ) : (
        <ScoreExplanationPanel score={data} className="w-full" />
      )}
    </div>
  );
}
