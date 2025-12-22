'use client';

/**
 * Step 7: Published Summary
 *
 * Read-only summary showing:
 * - Vertical / Sub-Vertical / Persona / Policy status / Binding
 * - Timestamp
 * - Audit trail link filtered to these IDs
 *
 * Buttons:
 * - "Go to Control Plane"
 * - "Create another stack"
 */

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
        <h2 className="text-2xl font-semibold text-gray-900">Vertical Stack Published</h2>
        <p className="text-gray-500 mt-2">
          Your new vertical stack is now live and ready to use.
        </p>
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

          {/* Policy */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">4</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Policy</p>
              <p className="text-gray-900">Version {wizardState.policy_version}</p>
              {wizardState.policy_activated_at && (
                <p className="text-xs text-gray-500">
                  Activated: {new Date(wizardState.policy_activated_at).toLocaleString()}
                </p>
              )}
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
              {wizardState.policy_status}
            </span>
          </div>

          {/* Binding */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">5</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Workspace Binding</p>
              <p className="text-gray-900 font-mono text-sm">{wizardState.workspace_id}</p>
              <p className="text-xs text-gray-500">
                Tenant: {wizardState.tenant_id}
              </p>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
              Bound
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
            <span className="text-gray-500">binding_id: </span>
            <span className="text-gray-900">{wizardState.binding_id}</span>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-center text-sm text-gray-500">
        Published at {new Date().toLocaleString()}
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
