'use client';

/**
 * SIVA Page - EB Journey
 * Full-screen SIVA Surface with EB context integration
 * SIVASurface uses useSalesContextStore internally for vertical-aware behavior
 */

import { SIVASurface } from '@/components/siva';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';

export default function SIVAPage() {
  // Access sales context - SIVASurface uses this internally
  const { vertical, subVertical, regions, isLocked } = useSalesContext();

  // Log context for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('[SIVA] Context:', { vertical, subVertical, regions, isLocked });
  }

  return <SIVASurface />;
}
