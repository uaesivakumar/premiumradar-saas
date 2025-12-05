'use client';

/**
 * Super Admin API Providers Management
 *
 * Manages UPR OS API Providers (S50):
 * - Provider CRUD (Apollo, SERP, OpenAI, etc.)
 * - Health monitoring
 * - Rate limits
 * - Fallback chains
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plug,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Activity,
  Settings,
  Shield,
  Gauge,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  XCircle,
  Clock,
} from 'lucide-react';

interface APIProvider {
  id: string;
  slug: string;
  name: string;
  provider_type: string;
  base_url: string;
  status: string;
  capabilities?: string[];
  default_rate_limit_per_minute?: number;
  default_rate_limit_per_day?: number;
  default_rate_limit_per_month?: number;
  health?: {
    status: string;
    last_check?: string;
    avg_response_time_ms?: number;
    success_rate?: number;
  };
}

interface DashboardSummary {
  total: number;
  byStatus: Record<string, number>;
  byHealth: Record<string, number>;
  totalRequestsToday: number;
  avgResponseTime: number;
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<APIProvider[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/superadmin/os/providers?action=dashboard');
      const data = await response.json();

      if (data.success && data.data) {
        setProviders(data.data.providers || []);
        setSummary(data.data.summary || null);
      } else {
        setError(data.error || 'Failed to fetch providers');
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setError('Failed to connect to UPR OS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const checkHealth = async (providerId: string) => {
    try {
      setCheckingHealth(providerId);
      const response = await fetch('/api/superadmin/os/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-health', id: providerId }),
      });
      const data = await response.json();

      if (data.success) {
        // Refresh to get updated health
        fetchData();
      } else {
        setError(data.error || 'Health check failed');
      }
    } catch (err) {
      setError('Failed to check health');
    } finally {
      setCheckingHealth(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'healthy':
        return 'text-green-400 bg-green-500/10';
      case 'degraded':
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'inactive':
      case 'unhealthy':
      case 'error':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading providers...</p>
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
              <Plug className="w-7 h-7 text-purple-400" />
              API Providers
            </h1>
            <p className="text-gray-400 mt-1">Sprint 50: Apollo, SERP, OpenAI, and other data APIs</p>
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

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Plug className="w-5 h-5 text-purple-400" />
              <p className="text-gray-500 text-sm">Total Providers</p>
            </div>
            <p className="text-2xl font-bold text-white">{summary.total}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-gray-500 text-sm">Healthy</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {summary.byHealth?.healthy || 0}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <p className="text-gray-500 text-sm">Today's Requests</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {summary.totalRequestsToday?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <p className="text-gray-500 text-sm">Avg Response</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {summary.avgResponseTime || 0}ms
            </p>
          </div>
        </div>
      )}

      {/* Providers List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Configured Providers</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {providers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No providers configured. Check UPR OS connection.
            </div>
          ) : (
            providers.map((provider) => (
              <div key={provider.id || provider.slug} className="p-4">
                <button
                  onClick={() => setExpandedProvider(
                    expandedProvider === provider.slug ? null : provider.slug
                  )}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    {expandedProvider === provider.slug ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex items-center gap-3">
                      {getHealthIcon(provider.health?.status || 'unknown')}
                      <div>
                        <span className="text-white font-medium">{provider.name}</span>
                        <span className="text-gray-500 text-sm ml-2">({provider.slug})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(provider.status)}`}>
                      {provider.status}
                    </span>
                    <span className="text-gray-500 text-sm">{provider.provider_type}</span>
                  </div>
                </button>

                {expandedProvider === provider.slug && (
                  <div className="mt-4 ml-8 p-4 bg-gray-800/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Basic Info */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Configuration</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Base URL</span>
                            <span className="text-gray-300 font-mono text-xs">
                              {provider.base_url || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Type</span>
                            <span className="text-gray-300">{provider.provider_type}</span>
                          </div>
                          {provider.capabilities && provider.capabilities.length > 0 && (
                            <div>
                              <span className="text-gray-500 block mb-1">Capabilities</span>
                              <div className="flex flex-wrap gap-1">
                                {provider.capabilities.map((cap) => (
                                  <span
                                    key={cap}
                                    className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded"
                                  >
                                    {cap}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rate Limits & Health */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Rate Limits</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Per Minute</span>
                            <span className="text-gray-300">
                              {provider.default_rate_limit_per_minute?.toLocaleString() || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Per Day</span>
                            <span className="text-gray-300">
                              {provider.default_rate_limit_per_day?.toLocaleString() || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Per Month</span>
                            <span className="text-gray-300">
                              {provider.default_rate_limit_per_month?.toLocaleString() || '-'}
                            </span>
                          </div>
                        </div>

                        {provider.health && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-3">Health Status</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className={provider.health.status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}>
                                  {provider.health.status}
                                </span>
                              </div>
                              {provider.health.avg_response_time_ms && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Avg Response</span>
                                  <span className="text-gray-300">
                                    {provider.health.avg_response_time_ms}ms
                                  </span>
                                </div>
                              )}
                              {provider.health.success_rate !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Success Rate</span>
                                  <span className="text-gray-300">
                                    {(provider.health.success_rate * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-3">
                      <button
                        onClick={() => checkHealth(provider.id || provider.slug)}
                        disabled={checkingHealth === (provider.id || provider.slug)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                      >
                        {checkingHealth === (provider.id || provider.slug) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Check Health
                      </button>
                      {provider.base_url && (
                        <a
                          href={provider.base_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-gray-300 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open API
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
