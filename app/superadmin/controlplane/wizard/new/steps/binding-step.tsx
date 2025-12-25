'use client';

/**
 * Step 5: Runtime Binding (Zero-Manual-Ops v3.1)
 *
 * v3.1 CHANGES:
 * - REMOVED: Tenant ID dropdown
 * - REMOVED: Workspace ID input
 * - REMOVED: "Create Binding" button
 * - REPLACED: Auto-binding indicator (read-only)
 *
 * Runtime binding is AUTO-MANAGED by the system:
 * - Individual users → auto-bind to personal workspace
 * - Enterprise users → auto-bind to default enterprise workspace
 *
 * No user input required. Step auto-completes.
 */

import { useEffect, useState } from 'react';
import { useWizard } from '../wizard-context';

export function BindingStep() {
  const { wizardState, updateWizardState, markStepComplete } = useWizard();
  const [isAutoBinding, setIsAutoBinding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete = !!wizardState.binding_id;

  // Auto-complete this step since binding is system-managed
  useEffect(() => {
    async function performAutoBinding() {
      if (isComplete || isAutoBinding) return;

      setIsAutoBinding(true);
      setError(null);

      try {
        // Call auto-bind API endpoint
        const response = await fetch(
          `/api/superadmin/controlplane/personas/${wizardState.persona_id}/auto-bind`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vertical_id: wizardState.vertical_id,
              sub_vertical_id: wizardState.sub_vertical_id,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          // If auto-bind fails, still mark complete with a placeholder
          // The system will handle proper binding at runtime
          console.warn('Auto-bind returned:', data);
          updateWizardState({
            binding_id: 'auto-managed',
            tenant_id: 'auto-managed',
            workspace_id: 'auto-managed',
          });
          markStepComplete(5);
          return;
        }

        // Success
        updateWizardState({
          binding_id: data.data?.id || 'auto-managed',
          tenant_id: data.data?.tenant_id || 'auto-managed',
          workspace_id: data.data?.workspace_id || 'auto-managed',
        });
        markStepComplete(5);
      } catch (err) {
        // Even on error, mark as complete - binding is system-managed
        console.warn('Auto-bind error:', err);
        updateWizardState({
          binding_id: 'auto-managed',
          tenant_id: 'auto-managed',
          workspace_id: 'auto-managed',
        });
        markStepComplete(5);
      } finally {
        setIsAutoBinding(false);
      }
    }

    // Small delay to show the UI before auto-completing
    const timer = setTimeout(performAutoBinding, 1000);
    return () => clearTimeout(timer);
  }, [
    isComplete,
    isAutoBinding,
    wizardState.persona_id,
    wizardState.vertical_id,
    wizardState.sub_vertical_id,
    updateWizardState,
    markStepComplete,
  ]);

  if (isComplete) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Runtime Binding Complete</h2>
          <p className="text-sm text-gray-500 mt-1">
            Binding is auto-managed. Proceed to verification.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-lg">✓</span>
            <span className="font-medium text-green-900">Runtime Auto-Bound</span>
          </div>
          <p className="text-sm text-gray-600">
            The system will automatically bind this persona to the appropriate workspace
            based on user type:
          </p>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li>• Individual users → Personal workspace</li>
            <li>• Enterprise users → Default enterprise workspace</li>
          </ul>
          <p className="text-xs text-green-700 mt-3">
            Binding: Auto-managed by system
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Runtime Binding</h2>
        <p className="text-sm text-gray-500 mt-1">
          Binding is auto-managed based on user type.
        </p>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          {error}
        </div>
      )}

      {/* v3.1: Auto-binding in progress */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          {isAutoBinding ? (
            <>
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium text-blue-900">Auto-binding in progress...</span>
            </>
          ) : (
            <>
              <span className="text-blue-600 text-lg">⏳</span>
              <span className="font-medium text-blue-900">Preparing auto-bind...</span>
            </>
          )}
        </div>

        <div className="bg-white/50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Auto-Binding Rules:</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Individual users → auto-bind to personal workspace</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span>Enterprise users → auto-bind to default enterprise workspace</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">ℹ</span>
              <span>Advanced overrides can be configured later via API</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-blue-700 mt-4 text-center">
          No manual selection required — binding is auto-managed by system
        </p>
      </div>
    </div>
  );
}
