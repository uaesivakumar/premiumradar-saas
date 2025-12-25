'use client';

/**
 * Step 7: Published Summary (Zero-Manual-Ops v3.1)
 *
 * Read-only summary showing:
 * - Stack created
 * - Policy auto-activated
 * - Runtime auto-bound
 *
 * Links:
 * - View Runtime Status
 * - View Audit Log
 *
 * v3.1: Shows auto-managed operations instead of manual binding details
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWizard } from '../wizard-context';

export function PublishedStep() {
  const router = useRouter();
  const { wizardState } = useWizard();

  const goToControlPlane = () => {
    router.push('/superadmin/controlplane');
  };

  const createAnother = () => {
    // Reload the page to reset wizard state
    window.location.href = '/superadmin/controlplane/wizard/new';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <span className="text-3xl text-green-600">✓</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Vertical Stack Created</h2>
        <p className="text-gray-500 mt-2">
          Your new vertical stack is live with auto-managed activation and binding.
        </p>
      </div>

      {/* v3.1: Auto-Managed Operations Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-600 text-lg">✓</span>
          <span className="font-medium text-green-900">All Operations Auto-Managed</span>
        </div>
        <ul className="text-sm text-green-800 space-y-2">
          <li className="flex items-center gap-2">
            <span>✓</span>
            <span>Stack created</span>
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span>
            <span>Policy auto-activated (v{wizardState.policy_version})</span>
          </li>
          <li className="flex items-center gap-2">
            <span>✓</span>
            <span>Runtime auto-bound</span>
          </li>
        </ul>
      </div>

      {/* Summary Card */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Stack Summary</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Vertical */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Vertical</p>
              <p className="text-gray-900">{wizardState.vertical_name}</p>
              <p className="text-xs font-mono text-gray-500">{wizardState.vertical_key}</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
              Active
            </span>
          </div>

          {/* Sub-Vertical */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Sub-Vertical</p>
              <p className="text-gray-900">{wizardState.sub_vertical_name}</p>
              <p className="text-xs text-gray-500">
                Entity: {wizardState.primary_entity_type} | Agent: {wizardState.default_agent}
              </p>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
              Active
            </span>
          </div>

          {/* Persona */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">3</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Persona</p>
              <p className="text-gray-900">{wizardState.persona_name}</p>
              <p className="text-xs text-gray-500">
                Scope: {wizardState.scope}
                {wizardState.region_code && ` | Region: ${wizardState.region_code}`}
              </p>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
              Active
            </span>
          </div>

          {/* Policy - Auto-Activated */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 text-sm font-medium">4</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Policy</p>
              <p className="text-gray-900">Version {wizardState.policy_version}</p>
              <p className="text-xs text-emerald-600 font-medium">
                Auto-Activated
              </p>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-800">
              {wizardState.policy_status}
            </span>
          </div>

          {/* Binding - Auto-Managed */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 text-sm font-medium">5</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Runtime Binding</p>
              <p className="text-gray-900">System-Managed</p>
              <p className="text-xs text-emerald-600 font-medium">
                Auto-bound based on user type
              </p>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-800">
              Auto
            </span>
          </div>
        </div>
      </div>

      {/* IDs Reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Resource IDs</p>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="text-gray-500">vertical_id: </span>
            <span className="text-gray-900">{wizardState.vertical_id}</span>
          </div>
          <div>
            <span className="text-gray-500">sub_vertical_id: </span>
            <span className="text-gray-900">{wizardState.sub_vertical_id}</span>
          </div>
          <div>
            <span className="text-gray-500">persona_id: </span>
            <span className="text-gray-900">{wizardState.persona_id}</span>
          </div>
          <div>
            <span className="text-gray-500">policy_version: </span>
            <span className="text-gray-900">v{wizardState.policy_version}</span>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-center text-sm text-gray-500">
        Published at {new Date().toLocaleString()}
      </div>

      {/* v3.1: Quick Access Links */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-3">Quick Access</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/superadmin/controlplane"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-sm rounded hover:bg-blue-50"
          >
            <span>→</span>
            View Runtime Status
          </Link>
          <Link
            href="/superadmin/controlplane"
            onClick={(e) => {
              e.preventDefault();
              router.push('/superadmin/controlplane');
              // The audit viewer can be opened from the Control Plane
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-sm rounded hover:bg-blue-50"
          >
            <span>→</span>
            View Audit Log
          </Link>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={goToControlPlane}
          className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Control Plane
        </button>
        <button
          onClick={createAnother}
          className="px-6 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Create Another Stack
        </button>
      </div>
    </div>
  );
}
