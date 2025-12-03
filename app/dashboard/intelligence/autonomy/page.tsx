'use client';

/**
 * Autonomous Safety Surface Page
 * Sprint S58: Autonomous Safety UI
 *
 * Monitor and view autonomous agent operations (READ-ONLY).
 * Uses AutonomyDashboard which fetches its own data internally.
 */

import { AutonomyDashboard } from '@/components/autonomy';

export default function AutonomyPage() {
  return (
    <div className="p-6">
      <AutonomyDashboard />
    </div>
  );
}
