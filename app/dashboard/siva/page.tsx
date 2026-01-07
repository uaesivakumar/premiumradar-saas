'use client';

/**
 * DEPRECATED: Dashboard SIVA Page
 *
 * S371: Redirects to /workspace
 * Chat-based SIVA surface is replaced by card-centric WorkspaceSurface.
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SIVAPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/workspace');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-950">
      <p className="text-gray-400">Redirecting to workspace...</p>
    </div>
  );
}
