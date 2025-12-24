'use client';

/**
 * Real-time Validation Feedback (S257-F4)
 *
 * Shows real-time validation issues and warnings for control plane config.
 */

import { useState, useEffect } from 'react';

interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  entity_type: string;
  entity_id: string;
  entity_name: string;
  message: string;
  suggestion?: string;
}

interface ValidationFeedbackProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ValidationFeedback({
  autoRefresh = false,
  refreshInterval = 30000,
}: ValidationFeedbackProps) {
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');

  useEffect(() => {
    fetchValidation();

    if (autoRefresh) {
      const interval = setInterval(fetchValidation, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchValidation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/controlplane/config-health?include_validation=true');
      const data = await response.json();

      if (data.success && data.validation_issues) {
        setIssues(data.validation_issues);
        setError(null);
      } else {
        // Generate issues from health data
        const generatedIssues: ValidationIssue[] = [];

        if (data.health?.subVerticals) {
          const { mvtValid, runtimeEligible, total } = data.health.subVerticals;
          if (total - runtimeEligible > 0) {
            generatedIssues.push({
              id: 'sv-eligibility',
              severity: 'error',
              entity_type: 'sub_verticals',
              entity_id: 'aggregate',
              entity_name: 'Sub-Verticals',
              message: `${total - runtimeEligible} sub-verticals are not runtime-eligible`,
              suggestion: 'Ensure each sub-vertical has a valid active MVT version and active persona policy',
            });
          }
          if (total - mvtValid > 0) {
            generatedIssues.push({
              id: 'sv-mvt',
              severity: 'warning',
              entity_type: 'sub_verticals',
              entity_id: 'aggregate',
              entity_name: 'Sub-Verticals',
              message: `${total - mvtValid} sub-verticals have invalid or missing MVT`,
              suggestion: 'Create or update MVT versions with complete configuration',
            });
          }
        }

        if (data.health?.personas) {
          const { total, withActivePolicy } = data.health.personas;
          if (total - withActivePolicy > 0) {
            generatedIssues.push({
              id: 'persona-policy',
              severity: 'warning',
              entity_type: 'personas',
              entity_id: 'aggregate',
              entity_name: 'Personas',
              message: `${total - withActivePolicy} personas lack active policies`,
              suggestion: 'Stage and activate policies for all active personas',
            });
          }
        }

        if (data.health?.policies) {
          const { staged, draft } = data.health.policies;
          if (staged > 0) {
            generatedIssues.push({
              id: 'policy-staged',
              severity: 'info',
              entity_type: 'policies',
              entity_id: 'aggregate',
              entity_name: 'Policies',
              message: `${staged} policies are staged and ready for activation`,
              suggestion: 'Review and activate staged policies to apply changes',
            });
          }
          if (draft > 0) {
            generatedIssues.push({
              id: 'policy-draft',
              severity: 'info',
              entity_type: 'policies',
              entity_id: 'aggregate',
              entity_name: 'Policies',
              message: `${draft} policies are in draft status`,
            });
          }
        }

        setIssues(generatedIssues);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch validation status');
    } finally {
      setLoading(false);
    }
  };

  const filtered = issues.filter(issue => {
    if (filter === 'error') return issue.severity === 'error';
    if (filter === 'warning') return issue.severity === 'warning';
    return true;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  if (loading && issues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-900">Validation Status</h3>
          {errorCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {errorCount} errors
            </span>
          )}
          {warningCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {warningCount} warnings
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'error' | 'warning')}
            className="text-sm border border-gray-300 rounded-md px-3 py-1"
          >
            <option value="all">All ({issues.length})</option>
            <option value="error">Errors ({errorCount})</option>
            <option value="warning">Warnings ({warningCount})</option>
          </select>
          <button
            onClick={fetchValidation}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {filtered.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">All validations passed</p>
          </div>
        ) : (
          filtered.map(issue => (
            <div key={issue.id} className="px-6 py-4">
              <div className="flex items-start space-x-3">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                    <span className="text-xs text-gray-400">{issue.entity_name}</span>
                  </div>
                  {issue.suggestion && (
                    <p className="mt-1 text-sm text-gray-500">{issue.suggestion}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
