'use client';

/**
 * Step 2: Sub-Vertical Sales Motion
 *
 * Fields:
 * - sub_vertical_key (snake_case)
 * - sub_vertical_name
 * - primary_entity_type (required dropdown: company | individual | deal)
 * - related_entity_types (optional multi-select)
 * - default_agent (required dropdown from /api/superadmin/controlplane/agents)
 *
 * On success: POST /api/superadmin/controlplane/sub-verticals, store sub_vertical_id
 */

import { useState, useCallback, useEffect } from 'react';
import { useWizard } from '../wizard-context';

interface Agent {
  key: string;
  label: string;
  description?: string;
}

const ENTITY_TYPES = [
  { value: 'company', label: 'Company' },
  { value: 'individual', label: 'Individual' },
  { value: 'deal', label: 'Deal' },
];

export function SubVerticalStep() {
  const { wizardState, updateWizardState, markStepComplete } = useWizard();

  const [key, setKey] = useState(wizardState.sub_vertical_key || '');
  const [name, setName] = useState(wizardState.sub_vertical_name || '');
  const [primaryEntityType, setPrimaryEntityType] = useState(wizardState.primary_entity_type || '');
  const [relatedEntityTypes, setRelatedEntityTypes] = useState<string[]>([]);
  const [defaultAgent, setDefaultAgent] = useState(wizardState.default_agent || '');

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  const [keyError, setKeyError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [entityError, setEntityError] = useState<string | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isCreated = !!wizardState.sub_vertical_id;

  // Fetch agents on mount
  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch('/api/superadmin/controlplane/agents');
        const data = await response.json();
        if (data.success) {
          setAgents(data.agents);
          // Default to first agent if not set
          if (!defaultAgent && data.agents.length > 0) {
            setDefaultAgent(data.agents[0].key);
          }
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      } finally {
        setLoadingAgents(false);
      }
    }
    fetchAgents();
  }, [defaultAgent]);

  const validateKey = useCallback((value: string) => {
    if (!value) {
      setKeyError('Key is required');
      return false;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(value)) {
      setKeyError('Must be lowercase snake_case');
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

    if (!primaryEntityType) {
      setEntityError('Entity type is required');
      return;
    }
    setEntityError(null);

    if (!defaultAgent) {
      setAgentError('Default agent is required');
      return;
    }
    setAgentError(null);

    if (!keyValid || !nameValid) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch('/api/superadmin/controlplane/sub-verticals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical_id: wizardState.vertical_id,
          key,
          name,
          primary_entity_type: primaryEntityType,
          related_entity_types: relatedEntityTypes,
          default_agent: defaultAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error === 'conflict') {
          setKeyError('This key already exists within the vertical.');
        } else {
          setServerError(data.message || 'Failed to create sub-vertical');
        }
        return;
      }

      // Success
      updateWizardState({
        sub_vertical_id: data.data.id,
        sub_vertical_key: data.data.key,
        sub_vertical_name: data.data.name,
        primary_entity_type: data.data.primary_entity_type,
        default_agent: data.data.default_agent,
      });
      markStepComplete(2);
    } catch (error) {
      setServerError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    key,
    name,
    primaryEntityType,
    relatedEntityTypes,
    defaultAgent,
    wizardState.vertical_id,
    validateKey,
    validateName,
    updateWizardState,
    markStepComplete,
  ]);

  const toggleRelatedType = useCallback((type: string) => {
    setRelatedEntityTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  if (isCreated) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sub-Vertical Created</h2>
          <p className="text-sm text-gray-500 mt-1">
            This step is complete. Proceed to the next step.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-lg">✓</span>
            <span className="font-medium text-green-900">Sub-Vertical Created</span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Key</dt>
              <dd className="font-mono text-gray-900">{wizardState.sub_vertical_key}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-900">{wizardState.sub_vertical_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Entity Type</dt>
              <dd className="text-gray-900">{wizardState.primary_entity_type}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Default Agent</dt>
              <dd className="text-gray-900">{wizardState.default_agent}</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Sub-Vertical Sales Motion</h2>
        <p className="text-sm text-gray-500 mt-1">
          Define the specific sales function within {wizardState.vertical_name || 'this vertical'}.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        <strong>Note:</strong> Entity type is immutable after creation.
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {serverError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="sv_key" className="block text-sm font-medium text-gray-700 mb-1">
            Sub-Vertical Key
          </label>
          <input
            type="text"
            id="sv_key"
            value={key}
            onChange={(e) => {
              setKey(e.target.value.toLowerCase());
              validateKey(e.target.value.toLowerCase());
            }}
            placeholder="employee_banking"
            className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
              keyError ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isSubmitting}
          />
          {keyError && <p className="mt-1 text-xs text-red-600">{keyError}</p>}
        </div>

        <div>
          <label htmlFor="sv_name" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            id="sv_name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              validateName(e.target.value);
            }}
            placeholder="Employee Banking"
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
              nameError ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isSubmitting}
          />
          {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
        </div>

        <div>
          <label htmlFor="entity_type" className="block text-sm font-medium text-gray-700 mb-1">
            Primary Entity Type <span className="text-red-500">*</span>
          </label>
          <select
            id="entity_type"
            value={primaryEntityType}
            onChange={(e) => {
              setPrimaryEntityType(e.target.value);
              // Remove from related if selected as primary
              setRelatedEntityTypes((prev) => prev.filter((t) => t !== e.target.value));
              setEntityError(null);
            }}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
              entityError ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={isSubmitting}
          >
            <option value="">Select entity type...</option>
            {ENTITY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {entityError && <p className="mt-1 text-xs text-red-600">{entityError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related Entity Types (Optional)
          </label>
          <div className="flex gap-2">
            {ENTITY_TYPES.filter((t) => t.value !== primaryEntityType).map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleRelatedType(type.value)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  relatedEntityTypes.includes(type.value)
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
                disabled={isSubmitting}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="agent" className="block text-sm font-medium text-gray-700 mb-1">
            Default Agent <span className="text-red-500">*</span>
          </label>
          {loadingAgents ? (
            <p className="text-sm text-gray-500">Loading agents...</p>
          ) : (
            <select
              id="agent"
              value={defaultAgent}
              onChange={(e) => {
                setDefaultAgent(e.target.value);
                setAgentError(null);
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${
                agentError ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isSubmitting}
            >
              <option value="">Select agent...</option>
              {agents.map((agent) => (
                <option key={agent.key} value={agent.key}>
                  {agent.label}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Controls tool routing and workflows for this sub-vertical.
          </p>
          {agentError && <p className="mt-1 text-xs text-red-600">{agentError}</p>}
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !key || !name || !primaryEntityType || !defaultAgent}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            isSubmitting || !key || !name || !primaryEntityType || !defaultAgent
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
