'use client';

/**
 * S338: Harden Mode Landing Page
 *
 * Redirects to Control Plane main view or shows entity selector
 * if accessed directly without entity context.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function HardenModePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-6">
          <Link href="/superadmin/controlplane" className="hover:text-white">
            Control Plane
          </Link>
          <span>/</span>
          <span className="text-white">Harden Mode</span>
        </nav>

        {/* Header */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-amber-400" />
            <h1 className="text-lg font-medium text-white">Harden Mode</h1>
          </div>
          <p className="text-sm text-neutral-400">
            Post-creation audit & edit for existing vertical stacks.
            Edit MVT, Signals, Kill Rules, and Policies without creating new entities.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-sm font-medium text-white mb-4">How to use Harden Mode</h2>

          <ol className="space-y-4 text-sm text-neutral-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-xs font-medium">
                1
              </span>
              <div>
                <p className="text-white">Go to Control Plane</p>
                <p className="text-neutral-500 text-xs mt-0.5">
                  Navigate to the Control Plane main view
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-xs font-medium">
                2
              </span>
              <div>
                <p className="text-white">Find the entity to harden</p>
                <p className="text-neutral-500 text-xs mt-0.5">
                  Locate the sub-vertical or persona you want to audit/edit
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-xs font-medium">
                3
              </span>
              <div>
                <p className="text-white">Click the Harden button</p>
                <p className="text-neutral-500 text-xs mt-0.5">
                  The amber &quot;Harden&quot; button appears next to each entity
                </p>
              </div>
            </li>
          </ol>

          <Link
            href="/superadmin/controlplane"
            className="mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Control Plane
          </Link>
        </div>
      </div>
    </div>
  );
}
