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
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-gray-400 mt-1">Configure all system parameters and defaults</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showHistory
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={handleSeedDefaults}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Seed Defaults
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Config
          </button>
          <button
            onClick={fetchConfigs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            Change History
          </h2>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No changes recorded yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-4 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{h.category}.{h.key}</span>
                      <span className="text-xs text-gray-500">by {h.changedBy}</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="text-red-400 line-through mr-2">
                        {JSON.stringify(h.oldValue)}
                      </span>
                      <span className="text-green-400">
                        {JSON.stringify(h.newValue)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(h.changedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(Object.keys(CATEGORY_INFO) as ConfigCategory[]).map((cat) => {
          const info = CATEGORY_INFO[cat];
          const Icon = info.icon;
          const count = (grouped[cat] || []).length;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? `bg-gray-800 ${info.color} border border-gray-700`
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{info.label}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  activeCategory === cat ? 'bg-gray-700' : 'bg-gray-800'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category Description */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          {(() => {
            const Icon = CATEGORY_INFO[activeCategory].icon;
            return <Icon className={`w-5 h-5 ${CATEGORY_INFO[activeCategory].color}`} />;
          })()}
          <div>
            <h3 className="text-white font-medium">{CATEGORY_INFO[activeCategory].label}</h3>
            <p className="text-gray-500 text-sm">{CATEGORY_INFO[activeCategory].description}</p>
          </div>
        </div>
      </div>

      {/* Config Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {categoryConfigs.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No configurations in this category</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Add first configuration
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Key
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Value
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Type
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Description
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {categoryConfigs.map((config) => (
                <tr key={config.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-white font-mono text-sm">{config.key}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingConfig === config.id ? (
                      <div className="flex items-center gap-2">
                        {config.valueType === 'boolean' ? (
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white"
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        ) : (
                          <input
                            type={config.valueType === 'number' ? 'number' : 'text'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white w-full max-w-xs"
                            step={config.valueType === 'number' ? 'any' : undefined}
                          />
                        )}
                        <button
                          onClick={() => saveEdit(config)}
                          disabled={saving}
                          className="p-1 text-green-400 hover:text-green-300"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-gray-400 hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`font-mono text-sm ${
                        config.valueType === 'boolean'
                          ? config.value ? 'text-green-400' : 'text-red-400'
                          : 'text-blue-400'
                      }`}>
                        {formatValue(config.value, config.key)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400">
                      {config.valueType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 text-sm">{config.description || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!config.isSecret && editingConfig !== config.id && (
                        <button
                          onClick={() => startEdit(config)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(config)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
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
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-500 text-sm">Total Configs</p>
          <p className="text-2xl font-bold text-white">{configs.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-500 text-sm">Categories</p>
          <p className="text-2xl font-bold text-white">{Object.keys(grouped).length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-500 text-sm">Feature Flags</p>
          <p className="text-2xl font-bold text-white">{(grouped.features || []).length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-500 text-sm">Pricing Items</p>
          <p className="text-2xl font-bold text-white">{(grouped.pricing || []).length}</p>
        </div>
      </div>

      {/* Add Config Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Add Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={newConfig.category}
                  onChange={(e) => setNewConfig({ ...newConfig, category: e.target.value as ConfigCategory })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  {Object.keys(CATEGORY_INFO).map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_INFO[cat as ConfigCategory].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Key</label>
                <input
                  type="text"
                  value={newConfig.key}
                  onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                  placeholder="e.g., max_retries"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={newConfig.valueType}
                  onChange={(e) => setNewConfig({ ...newConfig, valueType: e.target.value as 'string' | 'number' | 'boolean' | 'json' })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Value</label>
                {newConfig.valueType === 'boolean' ? (
                  <select
                    value={newConfig.value}
                    onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
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
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newConfig.description}
                  onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                  placeholder="What this configuration does"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConfig}
                disabled={saving || !newConfig.key || !newConfig.value}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
