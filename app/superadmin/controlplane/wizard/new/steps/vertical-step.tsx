'use client';

/**
 * Step 1: Vertical Identity
 *
 * Fields:
 * - vertical_key (snake_case, immutable)
 * - vertical_name (required)
 *
 * On success: POST /api/superadmin/controlplane/verticals, store vertical_id
 */

import { useState, useCallback } from 'react';
import { useWizard } from '../wizard-context';

export function VerticalStep() {
  const { wizardState, updateWizardState, markStepComplete } = useWizard();

  const [key, setKey] = useState(wizardState.vertical_key || '');
  const [name, setName] = useState(wizardState.vertical_name || '');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Already created - show read-only
  const isCreated = !!wizardState.vertical_id;

  const validateKey = useCallback((value: string) => {
    if (!value) {
      setKeyError('Key is required');
      return false;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(value)) {
      setKeyError('Must be lowercase snake_case (e.g., banking, saas_sales)');
      return false;
    }
    setKeyError(null);
    return true;
  }, []);

  const validateName = useCallback((value: string) => {
    if (!value.trim()) {
      setNameError('Name is required');
      return false;
    }
    setNameError(null);
    return true;
  }, []);

  const handleSubmit = useCallback(async () => {
    const keyValid = validateKey(key);
    const nameValid = validateName(name);

    if (!keyValid || !nameValid) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch('/api/superadmin/controlplane/verticals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, name }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error === 'conflict') {
          setKeyError('This key already exists. Choose a unique key.');
        } else {
          setServerError(data.message || 'Failed to create vertical');
        }
        return;
      }

      // Success - store in wizard state
      updateWizardState({
        vertical_id: data.data.id,
        vertical_key: data.data.key,
        vertical_name: data.data.name,
      });
      markStepComplete(1);
    } catch (error) {
      setServerError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [key, name, validateKey, validateName, updateWizardState, markStepComplete]);

  if (isCreated) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Vertical Created</h2>
          <p className="text-sm text-gray-500 mt-1">
            This step is complete. Proceed to the next step.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-lg">✓</span>
            <span className="font-medium text-green-900">Vertical Created</span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Key</dt>
              <dd className="font-mono text-gray-900">{wizardState.vertical_key}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-900">{wizardState.vertical_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">ID</dt>
              <dd className="font-mono text-xs text-gray-600">{wizardState.vertical_id}</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Vertical Identity</h2>
        <p className="text-sm text-gray-500 mt-1">
          Define the industry vertical this stack will serve.
        </p>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {serverError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="vertical_key" className="block text-sm font-medium text-gray-700 mb-1">
            Vertical Key
          </label>
          <input
            type="text"
            id="vertical_key"
            value={key}
            onChange={(e) => {
              setKey(e.target.value.toLowerCase());
              validateKey(e.target.value.toLowerCase());
            }}
            placeholder="saas_sales"
            className={`w-full px-3 py-2 border rounded-lg font-mono text-sm text-gray-900 placeholder-gray-400 ${
              keyError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            } focus:outline-none focus:ring-2`}
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Immutable after creation. Use lowercase snake_case.
          </p>
          {keyError && <p className="mt-1 text-xs text-red-600">{keyError}</p>}
        </div>

        <div>
          <label htmlFor="vertical_name" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            id="vertical_name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              validateName(e.target.value);
            }}
            placeholder="SaaS Sales"
            className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 placeholder-gray-400 ${
              nameError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            } focus:outline-none focus:ring-2`}
            disabled={isSubmitting}
          />
          {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !key || !name}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            isSubmitting || !key || !name
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Creating...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
