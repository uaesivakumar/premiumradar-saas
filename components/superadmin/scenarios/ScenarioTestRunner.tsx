'use client';

/**
 * Scenario Test Runner (S259-F3)
 *
 * Run seed scenarios against SIVA and show results.
 */

import { useState } from 'react';

interface SeedScenario {
  id: string;
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
}

interface TestResult {
  scenario_id: string;
  scenario_name: string;
  scenario_type: 'golden' | 'kill';
  passed: boolean;
  actual_score?: number;
  actual_verdict?: string;
  expected_verdict?: string;
  expected_min_score?: number;
  expected_max_score?: number;
  execution_time_ms: number;
  error?: string;
  trace_id?: string;
}

interface ScenarioTestRunnerProps {
  subVerticalId: string;
  scenarios: SeedScenario[];
  onRunComplete?: (results: TestResult[]) => void;
}

export function ScenarioTestRunner({
  subVerticalId,
  scenarios,
  onRunComplete,
}: ScenarioTestRunnerProps) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runScenarios = async () => {
    if (scenarios.length === 0) {
      setError('No scenarios to run');
      return;
    }

    setRunning(true);
    setResults([]);
    setError(null);

    const testResults: TestResult[] = [];

    for (const scenario of scenarios) {
      setCurrentScenario(scenario.id);

      try {
        const startTime = Date.now();

        const response = await fetch(
          `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/test-scenario`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario_id: scenario.id,
              input_data: scenario.input_data,
            }),
          }
        );

        const data = await response.json();
        const executionTime = Date.now() - startTime;

        if (data.success) {
          const result: TestResult = {
            scenario_id: scenario.id,
            scenario_name: scenario.name,
            scenario_type: scenario.scenario_type,
            passed: data.passed,
            actual_score: data.actual_score,
            actual_verdict: data.actual_verdict,
            expected_verdict: scenario.expected_outcome.expected_verdict,
            expected_min_score: scenario.expected_outcome.min_score,
            expected_max_score: scenario.expected_outcome.max_score,
            execution_time_ms: executionTime,
            trace_id: data.trace_id,
          };
          testResults.push(result);
        } else {
          testResults.push({
            scenario_id: scenario.id,
            scenario_name: scenario.name,
            scenario_type: scenario.scenario_type,
            passed: false,
            execution_time_ms: Date.now() - startTime,
            error: data.error || 'Test execution failed',
          });
        }

        setResults([...testResults]);
      } catch (err) {
        testResults.push({
          scenario_id: scenario.id,
          scenario_name: scenario.name,
          scenario_type: scenario.scenario_type,
          passed: false,
          execution_time_ms: 0,
          error: 'Network error',
        });
        setResults([...testResults]);
      }
    }

    setCurrentScenario(null);
    setRunning(false);
    onRunComplete?.(testResults);
  };

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Test Runner</h3>
          <p className="text-sm text-gray-500">
            {scenarios.length} scenarios ready
          </p>
        </div>
        <button
          onClick={runScenarios}
          disabled={running || scenarios.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {running ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running...
            </span>
          ) : (
            'Run All Tests'
          )}
        </button>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Progress */}
      {running && (
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-200">
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-indigo-700">
              Running: {scenarios.find(s => s.id === currentScenario)?.name || '...'}
            </span>
            <span className="ml-auto text-sm text-indigo-600">
              {results.length}/{scenarios.length}
            </span>
          </div>
          <div className="mt-2 w-full bg-indigo-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${(results.length / scenarios.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Summary */}
      {results.length > 0 && !running && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{passedCount}</div>
              <div className="text-xs text-gray-500">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round((passedCount / results.length) * 100)}%
              </div>
              <div className="text-xs text-gray-500">Pass Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {results.length === 0 && !running ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Click &quot;Run All Tests&quot; to execute scenarios
          </div>
        ) : (
          results.map(result => (
            <div key={result.scenario_id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {result.passed ? (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="ml-3">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        result.scenario_type === 'golden'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.scenario_type.toUpperCase()}
                      </span>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {result.scenario_name}
                      </span>
                    </div>
                    {result.error && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {result.actual_score !== undefined && (
                    <div>Score: {result.actual_score}</div>
                  )}
                  {result.actual_verdict && (
                    <div>Verdict: {result.actual_verdict}</div>
                  )}
                  <div>{result.execution_time_ms}ms</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
