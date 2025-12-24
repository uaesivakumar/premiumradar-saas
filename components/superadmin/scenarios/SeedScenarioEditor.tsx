'use client';

/**
 * Seed Scenario Editor (S259-F2)
 *
 * Create and edit golden/kill scenarios.
 */

import { useState, useEffect } from 'react';

interface SeedScenario {
  id?: string;
  sub_vertical_id: string;
  scenario_type: 'golden' | 'kill';
  name: string;
  description: string;
  input_data: Record<string, unknown>;
  expected_outcome: {
    min_score?: number;
    max_score?: number;
    expected_verdict?: 'accept' | 'reject' | 'defer';
    required_signals?: string[];
  };
  is_active: boolean;
}

interface SeedScenarioEditorProps {
  subVerticalId: string;
  scenario?: SeedScenario | null;
  onSave: (scenario: SeedScenario) => void;
  onCancel: () => void;
}

export function SeedScenarioEditor({
  subVerticalId,
  scenario,
  onSave,
  onCancel,
}: SeedScenarioEditorProps) {
  const [formData, setFormData] = useState<SeedScenario>({
    sub_vertical_id: subVerticalId,
    scenario_type: 'golden',
    name: '',
    description: '',
    input_data: {},
    expected_outcome: {
      expected_verdict: 'accept',
    },
    is_active: true,
  });
  const [inputDataJson, setInputDataJson] = useState('{}');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (scenario) {
      setFormData(scenario);
      setInputDataJson(JSON.stringify(scenario.input_data, null, 2));
    }
  }, [scenario]);

  const handleInputDataChange = (value: string) => {
    setInputDataJson(value);
    try {
      const parsed = JSON.parse(value);
      setFormData(prev => ({ ...prev, input_data: parsed }));
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (jsonError) {
      setError('Please fix the JSON errors');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const url = scenario?.id
        ? `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/seed-scenarios/${scenario.id}`
        : `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/seed-scenarios`;

      const response = await fetch(url, {
        method: scenario?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSave(data.scenario);
      } else {
        setError(data.error || 'Failed to save scenario');
      }
    } catch (err) {
      setError('Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {scenario?.id ? 'Edit Scenario' : 'New Scenario'}
        </h3>
      </div>

      <div className="px-6 py-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Scenario Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.scenario_type === 'golden'}
                onChange={() => setFormData(prev => ({ ...prev, scenario_type: 'golden' }))}
                className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Golden (should pass)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.scenario_type === 'kill'}
                onChange={() => setFormData(prev => ({ ...prev, scenario_type: 'kill' }))}
                className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Kill (should reject)</span>
            </label>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., High-growth company with payroll signals"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe what this scenario tests..."
          />
        </div>

        {/* Input Data (JSON) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Input Data (JSON)
          </label>
          <textarea
            value={inputDataJson}
            onChange={(e) => handleInputDataChange(e.target.value)}
            rows={8}
            className={`w-full px-3 py-2 font-mono text-sm border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
              jsonError ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder={`{
  "company_name": "Acme Corp",
  "headcount": 500,
  "signals": ["hiring-expansion", "office-opening"]
}`}
          />
          {jsonError && (
            <p className="mt-1 text-xs text-red-600">{jsonError}</p>
          )}
        </div>

        {/* Expected Outcome */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Expected Outcome</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expected Verdict</label>
              <select
                value={formData.expected_outcome.expected_verdict || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expected_outcome: {
                    ...prev.expected_outcome,
                    expected_verdict: e.target.value as 'accept' | 'reject' | 'defer' | undefined
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Not specified</option>
                <option value="accept">Accept</option>
                <option value="reject">Reject</option>
                <option value="defer">Defer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Minimum Score</label>
              <input
                type="number"
                value={formData.expected_outcome.min_score || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expected_outcome: {
                    ...prev.expected_outcome,
                    min_score: e.target.value ? parseInt(e.target.value) : undefined
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g., 70"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Maximum Score</label>
              <input
                type="number"
                value={formData.expected_outcome.max_score || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expected_outcome: {
                    ...prev.expected_outcome,
                    max_score: e.target.value ? parseInt(e.target.value) : undefined
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Required Signals (comma-sep)</label>
              <input
                type="text"
                value={formData.expected_outcome.required_signals?.join(', ') || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expected_outcome: {
                    ...prev.expected_outcome,
                    required_signals: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : undefined
                  }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g., hiring-expansion, funding-round"
              />
            </div>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label className="ml-2 text-sm text-gray-700">Active (include in validation runs)</label>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !!jsonError}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : scenario?.id ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  );
}
