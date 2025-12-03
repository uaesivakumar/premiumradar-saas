'use client';

/**
 * Intelligence Explorer Page
 * Sprint S56: Intelligence Explorer (Primary UI)
 *
 * Main intelligence dashboard combining all intelligence features.
 * IntelligenceDashboard fetches its own data internally.
 */

import { IntelligenceDashboard } from '@/components/intelligence';

export default function IntelligencePage() {
  return (
    <div className="h-full overflow-auto p-6">
      <IntelligenceDashboard vertical="banking" />
    </div>
  );
}
