'use client';

/**
 * Intelligence Explorer Page
 * Sprint S56: Intelligence Explorer (Primary UI)
 *
 * Main intelligence dashboard combining all intelligence features.
 * IntelligenceDashboard fetches its own data internally.
 *
 * P2 VERTICALISATION: Now uses dynamic vertical from sales context.
 */

import { IntelligenceDashboard } from '@/components/intelligence';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';

export default function IntelligencePage() {
  // P2 VERTICALISATION: Get vertical from sales context
  const vertical = useSalesContextStore(selectVertical);

  return (
    <div className="h-full overflow-auto p-6">
      <IntelligenceDashboard vertical={vertical} />
    </div>
  );
}
