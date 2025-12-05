'use client';

/**
 * Super Admin OS System Config
 *
 * Manages UPR OS System Config (S55):
 * - Config namespaces
 * - Versioned values
 * - Presets
 * - Hot reload
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Settings,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  History,
  RotateCcw,
  Zap,
  Save,
  X,
} from 'lucide-react';

interface ConfigNamespace {
  namespace: string;
  total: number;
  active: number;
}

interface ConfigValue {
  namespace: string;
  key: string;
  value: unknown;
  value_type: string;
  description?: string;
  is_active: boolean;
  version: number;
  updated_by?: string;
  updated_at: string;
}

export default function OSConfigPage() {
  const [namespaces, setNamespaces] = useState<ConfigNamespace[]>([]);
  const [configs, setConfigs] = useState<Record<string, ConfigValue[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedNamespace, setExpandedNamespace] = useState<string | null>(null);
  const [loadingNamespace, setLoadingNamespace] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/superadmin/os/config');
      const data = await response.json();

      if (data.success && data.data?.namespaces) {
        setNamespaces(data.data.namespaces);
      } else {
        setError(data.error || 'Failed to fetch config summary');
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
      setError('Failed to connect to UPR OS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const loadNamespace = async (namespace: string) => {
    if (configs[namespace]) {
      setExpandedNamespace(expandedNamespace === namespace ? null : namespace);
      return;
    }

    try {
      setLoadingNamespace(namespace);
      setExpandedNamespace(namespace);

      const response = await fetch(`/api/superadmin/os/config?action=namespace&namespace=${namespace}`);
      const data = await response.json();

      if (data.success && data.data?.configs) {
        setConfigs((prev) => ({
          ...prev,
          [namespace]: data.data.configs,
        }));
      }
    } catch (err) {
      console.error('Failed to load namespace:', err);
    } finally {
      setLoadingNamespace(null);
    }
  };

  const saveConfig = async (config: ConfigValue) => {
    try {
      setError(null);

      let parsedValue: unknown = editValue;
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        // Keep as string if not valid JSON
      }

      const response = await fetch('/api/superadmin/os/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set',
          namespace: config.namespace,
          key: config.key,
          value: parsedValue,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Saved ${config.namespace}.${config.key}`);
        setEditingConfig(null);
        // Reload namespace
        delete configs[config.namespace];
        setConfigs({ ...configs });
        loadNamespace(config.namespace);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to save config');
      }
    } catch (err) {
      setError('Failed to save config');
    }
  };

  const hotReload = async () => {
    try {
      setError(null);
      const response = await fetch('/api/superadmin/os/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reload' }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Hot reload triggered successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Hot reload failed');
      }
    } catch (err) {
      setError('Hot reload failed');
    }
  };

  const formatValue = (value: unknown): string => {
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading OS config...</p>
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
              <Settings className="w-7 h-7 text-orange-400" />
              OS System Config
            </h1>
            <p className="text-gray-400 mt-1">Sprint 55: Namespaced configuration with versioning</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={hotReload}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4" />
            Hot Reload
          </button>
          <button
            onClick={fetchSummary}
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

      {/* Namespace Cards */}
      <div className="grid grid-cols-4 gap-4">
        {namespaces.map((ns) => (
          <div key={ns.namespace} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-white font-medium capitalize">{ns.namespace}</p>
            <p className="text-2xl font-bold text-white mt-2">{ns.total}</p>
            <p className="text-gray-500 text-sm">{ns.active} active</p>
          </div>
        ))}
      </div>

      {/* Config by Namespace */}
      <div className="space-y-4">
        {namespaces.map((ns) => (
          <div key={ns.namespace} className="bg-gray-900 border border-gray-800 rounded-xl">
            <button
              onClick={() => loadNamespace(ns.namespace)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                {loadingNamespace === ns.namespace ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : expandedNamespace === ns.namespace ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <span className="text-white font-medium capitalize">{ns.namespace}</span>
                  <span className="text-gray-500 text-sm ml-2">({ns.total} configs)</span>
                </div>
              </div>
            </button>

            {expandedNamespace === ns.namespace && configs[ns.namespace] && (
              <div className="border-t border-gray-800">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Key</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Value</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Type</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Version</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {configs[ns.namespace].map((config) => (
                      <tr key={`${config.namespace}.${config.key}`} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <span className="text-white font-mono text-sm">{config.key}</span>
                          {config.description && (
                            <p className="text-gray-500 text-xs mt-1">{config.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingConfig === `${config.namespace}.${config.key}` ? (
                            <div className="flex items-center gap-2">
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white font-mono text-sm w-64 h-20"
                              />
                              <button
                                onClick={() => saveConfig(config)}
                                className="p-1 text-green-400 hover:text-green-300"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingConfig(null)}
                                className="p-1 text-gray-400 hover:text-gray-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <pre className="text-blue-400 font-mono text-sm max-w-xs overflow-hidden truncate">
                              {formatValue(config.value)}
                            </pre>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400">
                            {config.value_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-400 text-sm">v{config.version}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingConfig !== `${config.namespace}.${config.key}` && (
                            <button
                              onClick={() => {
                                setEditingConfig(`${config.namespace}.${config.key}`);
                                setEditValue(formatValue(config.value));
                              }}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {namespaces.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No configuration namespaces found. Check UPR OS connection.</p>
        </div>
      )}
    </div>
  );
}
