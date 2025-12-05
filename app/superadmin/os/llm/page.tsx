'use client';

/**
 * Super Admin LLM Engine Management
 *
 * Manages UPR OS LLM Router (S51):
 * - LLM Providers (OpenAI, Anthropic, Google, etc.)
 * - Models with quality scores and costs
 * - Fallback chains
 * - Task-to-model mappings
 * - Cost tracking
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Brain,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
  Zap,
  Activity,
  TrendingUp,
  Play,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Clock,
  Server,
} from 'lucide-react';

interface LLMProvider {
  slug: string;
  name: string;
  type: string;
  models: string[];
}

interface LLMModel {
  slug: string;
  name: string;
  provider_type: string;
  model_id: string;
  quality_score: number;
  input_cost_per_million: number;
  output_cost_per_million: number;
}

interface FallbackStep {
  step_order: number;
  model: string;
  provider: string;
  timeout_ms: number;
  max_retries: number;
}

interface CostSummary {
  summary: Array<{
    period: string;
    total_cost: number;
    total_input_tokens: number;
    total_output_tokens: number;
    request_count: number;
  }>;
  totals: {
    cost: number;
    tokens: number;
    requests: number;
  };
}

export default function LLMConfigPage() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [costs, setCosts] = useState<CostSummary | null>(null);
  const [fallbackChain, setFallbackChain] = useState<FallbackStep[]>([]);
  const [taskMappings, setTaskMappings] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [testingModel, setTestingModel] = useState(false);
  const [testResult, setTestResult] = useState<{
    model: string;
    content: string;
    latency: number;
  } | null>(null);

  // Model selection test form
  const [testTask, setTestTask] = useState('outreach_generation');
  const [testVertical, setTestVertical] = useState('banking');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [modelsRes, costsRes, chainsRes, mappingsRes] = await Promise.allSettled([
        fetch('/api/superadmin/os/llm?action=models'),
        fetch('/api/superadmin/os/llm?action=costs'),
        fetch('/api/superadmin/os/llm?action=fallback-chains'),
        fetch('/api/superadmin/os/llm?action=task-mappings'),
      ]);

      // Process models
      if (modelsRes.status === 'fulfilled' && modelsRes.value.ok) {
        const data = await modelsRes.value.json();
        if (data.success && data.data?.providers) {
          setProviders(data.data.providers);
        }
      }

      // Process costs
      if (costsRes.status === 'fulfilled' && costsRes.value.ok) {
        const data = await costsRes.value.json();
        if (data.success && data.data) {
          setCosts(data.data);
        }
      }

      // Process fallback chains
      if (chainsRes.status === 'fulfilled' && chainsRes.value.ok) {
        const data = await chainsRes.value.json();
        if (data.success && data.data?.chain) {
          setFallbackChain(data.data.chain);
        }
      }

      // Process task mappings
      if (mappingsRes.status === 'fulfilled' && mappingsRes.value.ok) {
        const data = await mappingsRes.value.json();
        if (data.success && data.data?.mappings) {
          setTaskMappings(data.data.mappings);
        }
      }
    } catch (err) {
      console.error('Failed to fetch LLM config:', err);
      setError('Failed to connect to UPR OS LLM service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const testModelSelection = async () => {
    try {
      setTestingModel(true);
      setTestResult(null);

      const response = await fetch('/api/superadmin/os/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select',
          task_type: testTask,
          vertical: testVertical,
          prefer_quality: true,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.model) {
        setTestResult({
          model: data.data.model.slug,
          content: data.data.selection_reason || 'Selected based on task requirements',
          latency: data.executionTimeMs || 0,
        });
      } else {
        setError(data.error || 'Model selection failed');
      }
    } catch (err) {
      setError('Failed to test model selection');
    } finally {
      setTestingModel(false);
    }
  };

  const totalModels = providers.reduce((sum, p) => sum + (p.models?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading LLM configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/superadmin/os"
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Brain className="w-7 h-7 text-pink-400" />
              LLM Engine Configuration
            </h1>
            <p className="text-gray-400 mt-1">Sprint 51: Model routing, fallbacks, and cost tracking</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-5 h-5 text-pink-400" />
            <p className="text-gray-500 text-sm">Providers</p>
          </div>
          <p className="text-2xl font-bold text-white">{providers.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <p className="text-gray-500 text-sm">Models</p>
          </div>
          <p className="text-2xl font-bold text-white">{totalModels}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <p className="text-gray-500 text-sm">30-Day Cost</p>
          </div>
          <p className="text-2xl font-bold text-white">
            ${costs?.totals?.cost?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <p className="text-gray-500 text-sm">Requests</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {costs?.totals?.requests?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Model Selection Tester */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-green-400" />
          Test selectModel() API
        </h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Task Type</label>
            <select
              value={testTask}
              onChange={(e) => setTestTask(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="outreach_generation">Outreach Generation</option>
              <option value="deep_persona">Deep Persona</option>
              <option value="signal_processing">Signal Processing</option>
              <option value="chat_response">Chat Response</option>
              <option value="data_extraction">Data Extraction</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Vertical</label>
            <select
              value={testVertical}
              onChange={(e) => setTestVertical(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="banking">Banking</option>
              <option value="insurance">Insurance</option>
              <option value="real-estate">Real Estate</option>
              <option value="recruitment">Recruitment</option>
            </select>
          </div>
          <button
            onClick={testModelSelection}
            disabled={testingModel}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {testingModel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Test
          </button>
        </div>
        {testResult && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">{testResult.model}</span>
              </div>
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {testResult.latency}ms
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-2">{testResult.content}</p>
          </div>
        )}
      </div>

      {/* Providers & Models */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            LLM Providers & Models
          </h2>
        </div>
        <div className="divide-y divide-gray-800">
          {providers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No providers configured. Check UPR OS connection.
            </div>
          ) : (
            providers.map((provider) => (
              <div key={provider.slug} className="p-4">
                <button
                  onClick={() => setExpandedProvider(
                    expandedProvider === provider.slug ? null : provider.slug
                  )}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    {expandedProvider === provider.slug ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <span className="text-white font-medium">{provider.name}</span>
                      <span className="text-gray-500 text-sm ml-2">({provider.type})</span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {provider.models?.length || 0} models
                  </span>
                </button>
                {expandedProvider === provider.slug && provider.models && (
                  <div className="mt-4 ml-8 space-y-2">
                    {provider.models.map((model) => (
                      <div
                        key={model}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <span className="text-gray-300 font-mono text-sm">{model}</span>
                        <span className="text-xs text-gray-500">{provider.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fallback Chain */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          Default Fallback Chain
        </h2>
        {fallbackChain.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No fallback chain configured</p>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {fallbackChain.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-shrink-0 p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded-full text-xs text-white">
                      {step.step_order}
                    </span>
                    <div>
                      <p className="text-white font-mono text-sm">{step.model}</p>
                      <p className="text-gray-500 text-xs">{step.provider}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{step.timeout_ms}ms</span>
                    <span>•</span>
                    <span>{step.max_retries} retries</span>
                  </div>
                </div>
                {idx < fallbackChain.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Mappings */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Task-to-Model Mappings (VERTICAL_MODEL_PREFERENCES)
        </h2>
        {Object.keys(taskMappings).length === 0 ? (
          <p className="text-gray-500 text-center py-4">No task mappings found</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(taskMappings).map(([vertical, tasks]) => (
              <div key={vertical} className="p-4 bg-gray-800/50 rounded-lg">
                <h3 className="text-white font-medium mb-2 capitalize">{vertical}</h3>
                <div className="space-y-1 text-sm">
                  {typeof tasks === 'object' && tasks !== null ? (
                    Object.entries(tasks as Record<string, unknown>).map(([task, model]) => (
                      <div key={task} className="flex justify-between">
                        <span className="text-gray-400">{task}</span>
                        <span className="text-purple-400 font-mono">{String(model)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500">No tasks configured</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      {costs && costs.summary && costs.summary.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Cost History (Last 30 Days)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Period</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2">Cost</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2">Input Tokens</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2">Output Tokens</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2">Requests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {costs.summary.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/50">
                    <td className="px-4 py-2 text-white">{row.period}</td>
                    <td className="px-4 py-2 text-right text-green-400">${Number(row.total_cost).toFixed(4)}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{Number(row.total_input_tokens).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{Number(row.total_output_tokens).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-gray-400">{Number(row.request_count).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
