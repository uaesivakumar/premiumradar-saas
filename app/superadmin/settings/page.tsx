'use client';

/**
 * Super Admin System Settings Page
 *
 * CRUD interface for all system configurations:
 * - Pricing (plan prices, API costs)
 * - Limits (plan quotas, rate limits)
 * - Integrations (API URLs, timeouts)
 * - Thresholds (scoring weights, freshness)
 * - Features (feature flags)
 * - LLM (model configs)
 * - Security (session settings)
 * - General (defaults)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  DollarSign,
  Gauge,
  Plug,
  Target,
  Flag,
  Brain,
  Shield,
  Globe,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Pencil,
  X,
  Plus,
  Trash2,
  History,
  Loader2,
  Download,
} from 'lucide-react';

interface SystemConfig {
  id: string;
  category: string;
  key: string;
  value: unknown;
  description?: string;
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'encrypted';
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConfigHistory {
  id: string;
  category: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string;
  changedAt: string;
}

type ConfigCategory = 'pricing' | 'limits' | 'integrations' | 'thresholds' | 'features' | 'llm' | 'security' | 'general';

const CATEGORY_INFO: Record<ConfigCategory, { icon: typeof Settings; label: string; description: string; color: string }> = {
  pricing: { icon: DollarSign, label: 'Pricing', description: 'Plan prices and API costs', color: 'text-green-400' },
  limits: { icon: Gauge, label: 'Limits', description: 'Plan quotas and rate limits', color: 'text-blue-400' },
  integrations: { icon: Plug, label: 'Integrations', description: 'API endpoints and timeouts', color: 'text-purple-400' },
  thresholds: { icon: Target, label: 'Thresholds', description: 'Scoring weights and freshness', color: 'text-orange-400' },
  features: { icon: Flag, label: 'Features', description: 'Feature flags and toggles', color: 'text-cyan-400' },
  llm: { icon: Brain, label: 'LLM', description: 'AI model configurations', color: 'text-pink-400' },
  security: { icon: Shield, label: 'Security', description: 'Session and auth settings', color: 'text-red-400' },
  general: { icon: Globe, label: 'General', description: 'Default settings', color: 'text-gray-400' },
};

export default function SystemSettingsPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [grouped, setGrouped] = useState<Record<string, SystemConfig[]>>({});
  const [history, setHistory] = useState<ConfigHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ConfigCategory>('pricing');
  const [showHistory, setShowHistory] = useState(false);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConfig, setNewConfig] = useState({
    category: 'general' as ConfigCategory,
    key: '',
    value: '',
    description: '',
    valueType: 'string' as 'string' | 'number' | 'boolean' | 'json',
  });

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superadmin/config');
      const data = await response.json();

      if (data.success) {
        setConfigs(data.data.configs || []);
        setGrouped(data.data.grouped || {});
      } else {
        setError(data.error || 'Failed to load configurations');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/superadmin/config?history=true&limit=50');
      const data = await response.json();

      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, fetchHistory]);

  const handleSave = async (config: SystemConfig, newValue: unknown) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/superadmin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: config.category,
          key: config.key,
          value: newValue,
          valueType: config.valueType,
          description: config.description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Saved ${config.category}.${config.key}`);
        setEditingConfig(null);
        fetchConfigs();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (config: SystemConfig) => {
    if (!confirm(`Delete ${config.category}.${config.key}?`)) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/superadmin/config?category=${config.category}&key=${config.key}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(`Deleted ${config.category}.${config.key}`);
        fetchConfigs();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to delete');
      }
    } catch (err) {
      setError('Failed to delete configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleAddConfig = async () => {
    try {
      setSaving(true);
      setError(null);

      let parsedValue: unknown = newConfig.value;
      if (newConfig.valueType === 'number') {
        parsedValue = parseFloat(newConfig.value);
      } else if (newConfig.valueType === 'boolean') {
        parsedValue = newConfig.value === 'true';
      } else if (newConfig.valueType === 'json') {
        parsedValue = JSON.parse(newConfig.value);
      }

      const response = await fetch('/api/superadmin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newConfig.category,
          key: newConfig.key,
          value: parsedValue,
          valueType: newConfig.valueType,
          description: newConfig.description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Added ${newConfig.category}.${newConfig.key}`);
        setShowAddModal(false);
        setNewConfig({ category: 'general', key: '', value: '', description: '', valueType: 'string' });
        fetchConfigs();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to add configuration');
      }
    } catch (err) {
      setError('Failed to add configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Seed default configurations? This will add missing defaults but not overwrite existing values.')) return;

    try {
      setSaving(true);
      const response = await fetch('/api/superadmin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        fetchConfigs();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to seed defaults');
      }
    } catch (err) {
      setError('Failed to seed defaults');
    } finally {
      setSaving(false);
    }
  };

  const parseValue = (config: SystemConfig): string => {
    if (config.isSecret) return '[REDACTED]';
    if (typeof config.value === 'object') return JSON.stringify(config.value, null, 2);
    return String(config.value);
  };

  const formatValue = (value: unknown, type: string): string => {
    if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
    if (typeof value === 'number') {
      if (type.includes('price') || type.includes('cost')) return `$${value.toFixed(2)}`;
      if (type.includes('percent') || type.includes('weight')) return `${(value * 100).toFixed(0)}%`;
      return value.toLocaleString();
    }
    return String(value);
  };

  const startEdit = (config: SystemConfig) => {
    setEditingConfig(config.id);
    setEditValue(parseValue(config));
  };

  const cancelEdit = () => {
    setEditingConfig(null);
    setEditValue('');
  };

  const saveEdit = (config: SystemConfig) => {
    let parsedValue: unknown = editValue;

    try {
      if (config.valueType === 'number') {
        parsedValue = parseFloat(editValue);
      } else if (config.valueType === 'boolean') {
        parsedValue = editValue === 'true' || editValue === 'Enabled';
      } else if (config.valueType === 'json') {
        parsedValue = JSON.parse(editValue);
      }
    } catch (err) {
      setError('Invalid value format');
      return;
    }

    handleSave(config, parsedValue);
  };

  const categoryConfigs = grouped[activeCategory] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-500 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white">System Settings</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Configure system parameters</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors ${
              showHistory
                ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
          <button
            onClick={handleSeedDefaults}
            disabled={saving}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Seed
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
          <button
            onClick={fetchConfigs}
            disabled={loading}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm">{success}</span>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
          <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-1.5">
            <History className="w-4 h-4 text-violet-400" />
            Change History
          </h2>
          {history.length === 0 ? (
            <p className="text-neutral-600 text-xs text-center py-6">No changes recorded</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-3 p-2 bg-neutral-800/50 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-medium">{h.category}.{h.key}</span>
                      <span className="text-[10px] text-neutral-600">by {h.changedBy}</span>
                    </div>
                    <div className="mt-0.5 text-xs">
                      <span className="text-red-400 line-through mr-1.5">
                        {JSON.stringify(h.oldValue)}
                      </span>
                      <span className="text-emerald-400">
                        {JSON.stringify(h.newValue)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-600 whitespace-nowrap">
                    {new Date(h.changedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {(Object.keys(CATEGORY_INFO) as ConfigCategory[]).map((cat) => {
          const info = CATEGORY_INFO[cat];
          const Icon = info.icon;
          const count = (grouped[cat] || []).length;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? `bg-neutral-800 ${info.color} border border-neutral-700`
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{info.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1 py-0.5 rounded ${
                  activeCategory === cat ? 'bg-neutral-700' : 'bg-neutral-800'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category Description */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = CATEGORY_INFO[activeCategory].icon;
            return <Icon className={`w-4 h-4 ${CATEGORY_INFO[activeCategory].color}`} />;
          })()}
          <div>
            <h3 className="text-sm text-white font-medium">{CATEGORY_INFO[activeCategory].label}</h3>
            <p className="text-neutral-600 text-xs">{CATEGORY_INFO[activeCategory].description}</p>
          </div>
        </div>
      </div>

      {/* Config Table */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg overflow-hidden">
        {categoryConfigs.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-600 text-sm">No configurations</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-blue-400 hover:text-blue-300 text-xs"
            >
              Add first configuration
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left text-[10px] font-medium text-neutral-500 uppercase tracking-wider px-4 py-2">
                  Key
                </th>
                <th className="text-left text-[10px] font-medium text-neutral-500 uppercase tracking-wider px-4 py-2">
                  Value
                </th>
                <th className="text-left text-[10px] font-medium text-neutral-500 uppercase tracking-wider px-4 py-2">
                  Type
                </th>
                <th className="text-left text-[10px] font-medium text-neutral-500 uppercase tracking-wider px-4 py-2">
                  Description
                </th>
                <th className="text-right text-[10px] font-medium text-neutral-500 uppercase tracking-wider px-4 py-2">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {categoryConfigs.map((config) => (
                <tr key={config.id} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="text-white font-mono text-xs">{config.key}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {editingConfig === config.id ? (
                      <div className="flex items-center gap-1.5">
                        {config.valueType === 'boolean' ? (
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-xs"
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        ) : (
                          <input
                            type={config.valueType === 'number' ? 'number' : 'text'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-xs w-full max-w-[150px]"
                            step={config.valueType === 'number' ? 'any' : undefined}
                          />
                        )}
                        <button
                          onClick={() => saveEdit(config)}
                          disabled={saving}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-neutral-500 hover:text-neutral-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className={`font-mono text-xs ${
                        config.valueType === 'boolean'
                          ? config.value ? 'text-emerald-400' : 'text-red-400'
                          : 'text-blue-400'
                      }`}>
                        {formatValue(config.value, config.key)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">
                      {config.valueType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-neutral-600 text-xs">{config.description || '-'}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!config.isSecret && editingConfig !== config.id && (
                        <button
                          onClick={() => startEdit(config)}
                          className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-700 rounded"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(config)}
                        className="p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-700 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
          <p className="text-neutral-500 text-xs">Total Configs</p>
          <p className="text-xl font-semibold text-white">{configs.length}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
          <p className="text-neutral-500 text-xs">Categories</p>
          <p className="text-xl font-semibold text-white">{Object.keys(grouped).length}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
          <p className="text-neutral-500 text-xs">Feature Flags</p>
          <p className="text-xl font-semibold text-white">{(grouped.features || []).length}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-3">
          <p className="text-neutral-500 text-xs">Pricing Items</p>
          <p className="text-xl font-semibold text-white">{(grouped.pricing || []).length}</p>
        </div>
      </div>

      {/* Add Config Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-sm font-medium text-white mb-3">Add Configuration</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Category</label>
                <select
                  value={newConfig.category}
                  onChange={(e) => setNewConfig({ ...newConfig, category: e.target.value as ConfigCategory })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white"
                >
                  {Object.keys(CATEGORY_INFO).map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_INFO[cat as ConfigCategory].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Key</label>
                <input
                  type="text"
                  value={newConfig.key}
                  onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                  placeholder="e.g., max_retries"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Type</label>
                <select
                  value={newConfig.valueType}
                  onChange={(e) => setNewConfig({ ...newConfig, valueType: e.target.value as 'string' | 'number' | 'boolean' | 'json' })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Value</label>
                {newConfig.valueType === 'boolean' ? (
                  <select
                    value={newConfig.value}
                    onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    type={newConfig.valueType === 'number' ? 'number' : 'text'}
                    value={newConfig.value}
                    onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
                    placeholder={newConfig.valueType === 'json' ? '{"key": "value"}' : 'Value'}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Description</label>
                <input
                  type="text"
                  value={newConfig.description}
                  onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                  placeholder="Optional"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-neutral-500 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConfig}
                disabled={saving || !newConfig.key || !newConfig.value}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
