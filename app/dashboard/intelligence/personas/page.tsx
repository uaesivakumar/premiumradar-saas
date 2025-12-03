'use client';

/**
 * Persona Effectiveness Explorer Page
 * Sprint S56: Persona Performance Analytics
 *
 * Deep dive into persona performance metrics and effectiveness.
 */

import { usePersonaInsights } from '@/lib/intelligence-suite';
import { PersonaEffectiveness } from '@/components/intelligence';

export default function PersonasPage() {
  const { personas, isLoading, error } = usePersonaInsights();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading persona data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-red-500">Failed to load persona data</div>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!personas || personas.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No persona data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Persona Effectiveness
        </h1>
        <p className="text-gray-500 mt-1">
          Analyze persona performance and conversion metrics
        </p>
      </div>

      <PersonaEffectiveness
        personas={personas}
        className="w-full"
      />
    </div>
  );
}
