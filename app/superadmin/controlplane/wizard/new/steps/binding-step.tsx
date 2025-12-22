'use client';

/**
 * Step 5: Workspace Binding
 *
 * Fields:
 * - tenant_id (dropdown or input)
 * - workspace_id (text input)
 * - is_active toggle (default ON)
 *
 * UX: "Create demo workspace" shortcut prefills demo-workspace-001
 * On success: PUT /api/superadmin/controlplane/workspaces/:id/binding
 */

import { useState, useCallback, useEffect } from 'react';
import { useWizard } from '../wizard-context';

interface Tenant {
  id: string;
  name: string;
}

export function BindingStep() {
  const { wizardState, updateWizardState, markStepComplete } = useWizard();

  const [tenantId, setTenantId] = useState(wizardState.tenant_id || '');
  const [workspaceId, setWorkspaceId] = useState(wizardState.workspace_id || '');
  const [isActive, setIsActive] = useState(true);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  const [tenantError, setTenantError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isCreated = !!wizardState.binding_id;

  // Fetch tenants on mount
  useEffect(() => {
    async function fetchTenants() {
      try {
        const response = await fetch('/api/admin/tenants');
        const data = await response.json();
        if (data.tenants) {
          setTenants(data.tenants);
          // Default to first tenant if available
          if (!tenantId && data.tenants.length > 0) {
            setTenantId(data.tenants[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
        // Use demo tenant as fallback
        setTenants([{ id: 'demo-tenant-001', name: 'Demo Tenant' }]);
        if (!tenantId) {
          setTenantId('demo-tenant-001');
        }
      } finally {
        setLoadingTenants(false);
      }
    }
    fetchTenants();
  }, [tenantId]);

  const useDemoWorkspace = useCallback(() => {
    setWorkspaceId('demo-workspace-001');
    if (!tenantId) {
      setTenantId('demo-tenant-001');
    }
  }, [tenantId]);

  const handleSubmit = useCallback(async () => {
    if (!tenantId) {
      setTenantError('Tenant is required');
      return;
    }
    setTenantError(null);

    if (!workspaceId.trim()) {
      setWorkspaceError('Workspace ID is required');
      return;
    }
    setWorkspaceError(null);

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/workspaces/${workspaceId}/binding`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenantId,
            vertical_id: wizardState.vertical_id,
            sub_vertical_id: wizardState.sub_vertical_id,
            persona_id: wizardState.persona_id,
            is_active: isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setServerError(data.message || 'Failed to create binding');
        return;
      }

      // Success
      updateWizardState({
        binding_id: data.data.id,
        tenant_id: tenantId,
        workspace_id: workspaceId,
      });
      markStepComplete(5);
    } catch (error) {
      setServerError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    tenantId,
    workspaceId,
    isActive,
    wizardState.vertical_id,
    wizardState.sub_vertical_id,
    wizardState.persona_id,
    updateWizardState,
    markStepComplete,
  ]);

  if (isCreated) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Workspace Bound</h2>
          <p className="text-sm text-gray-500 mt-1">
            This step is complete. Proceed to verification.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-lg">✓</span>
            <span className="font-medium text-green-900">Binding Created</span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Tenant ID</dt>
              <dd className="font-mono text-gray-900">{wizardState.tenant_id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Workspace ID</dt>
              <dd className="font-mono text-gray-900">{wizardState.workspace_id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Binding ID</dt>
              <dd className="font-mono text-xs text-gray-600">{wizardState.binding_id}</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Bind Workspace</h2>
        <p className="text-sm text-gray-500 mt-1">
          Link a tenant workspace to the {wizardState.persona_name || 'persona'} you created.
        </p>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {serverError}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-800">
            <strong>Quick Start:</strong> Use a demo workspace for testing.
          </div>
          <button
            type="button"
            onClick={useDemoWorkspace}
            className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Demo Workspace
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="tenant" className="block text-sm font-medium text-gray-700 mb-1">
            Tenant <span className="text-red-500">*</span>
          </label>
          {loadingTenants ? (
            <p className="text-sm text-gray-500">Loading tenants...</p>
          ) : tenants.length > 0 ? (
            <select
              id="tenant"
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                setTenantError(null);
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                tenantError ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isSubmitting}
            >
              <option value="">Select tenant...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.id})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              id="tenant"
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                setTenantError(null);
              }}
              placeholder="demo-tenant-001"
              className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
                tenantError ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isSubmitting}
            />
          )}
          {tenantError && <p className="mt-1 text-xs text-red-600">{tenantError}</p>}
        </div>

        <div>
          <label htmlFor="workspace" className="block text-sm font-medium text-gray-700 mb-1">
            Workspace ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="workspace"
            value={workspaceId}
            onChange={(e) => {
              setWorkspaceId(e.target.value);
              setWorkspaceError(null);
            }}
            placeholder="demo-workspace-001"
            className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
              workspaceError ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Unique identifier for this workspace within the tenant.
          </p>
          {workspaceError && <p className="mt-1 text-xs text-red-600">{workspaceError}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">
            Active binding
          </label>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !tenantId || !workspaceId}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            isSubmitting || !tenantId || !workspaceId
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Creating Binding...' : 'Create Binding & Continue'}
        </button>
      </div>
    </div>
  );
}
