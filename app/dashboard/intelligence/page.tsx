'use client';

/**
 * Intelligence Explorer Page
 * Sprint S56: Intelligence Explorer (Primary UI)
 *
 * Main intelligence dashboard combining all intelligence features.
 * IntelligenceDashboard fetches its own data internally.
 *
 * VERTICAL FIX: Now reads vertical from sales-context-store
 * instead of hardcoding 'banking'.
 */

import { IntelligenceDashboard } from '@/components/intelligence';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';

export default function IntelligencePage() {
  // Read vertical from sales context (synced from onboarding)
  const vertical = useSalesContextStore(selectVertical);

  return (
    <div className="h-full overflow-auto p-6">
      <IntelligenceDashboard vertical={vertical} />
    </div>
  );
}
