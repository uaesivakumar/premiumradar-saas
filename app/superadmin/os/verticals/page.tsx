'use client';

/**
 * Super Admin Vertical Packs Management
 *
 * Manages UPR OS Vertical Packs (S52):
 * - Verticals (Banking, Insurance, etc.)
 * - Signal Types
 * - Scoring Templates
 * - Journey Templates
 * - Personas
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Signal,
  Users,
  Route,
  Target,
  ChevronDown,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';

interface Vertical {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  signal_types_count?: number;
  scoring_templates_count?: number;
  persona_templates_count?: number;
  journey_templates_count?: number;
  sub_verticals?: Vertical[];
}

interface DashboardSummary {
  total: number;
  active: number;
  with_journeys: number;
}

export default function VerticalsPage() {
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVertical, setExpandedVertical] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [verticalDetails, setVerticalDetails] = useState<Record<string, {
    signals: unknown[];
    journeys: unknown[];
    personas: unknown[];
  }>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/superadmin/os/verticals?action=dashboard');
      const data = await response.json();

      if (data.success && data.data) {
        setVerticals(data.data.verticals || []);
        setSummary(data.data.summary || null);
      } else {
        setError(data.error || 'Failed to fetch verticals');
      }
    } catch (err) {
      console.error('Failed to fetch verticals:', err);
      setError('Failed to connect to UPR OS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadDetails = async (slug: string) => {
    if (verticalDetails[slug]) {
      setExpandedVertical(expandedVertical === slug ? null : slug);
      return;
    }

    try {
      setLoadingDetails(slug);
      setExpandedVertical(slug);

      const [signalsRes, journeysRes, personasRes] = await Promise.allSettled([
        fetch(`/api/superadmin/os/verticals?action=signals&slug=${slug}`),
        fetch(`/api/superadmin/os/verticals?action=journeys&slug=${slug}`),
        fetch(`/api/superadmin/os/verticals?action=personas&slug=${slug}`),
      ]);

      const details: { signals: unknown[]; journeys: unknown[]; personas: unknown[] } = {
        signals: [],
        journeys: [],
        personas: [],
      };

      if (signalsRes.status === 'fulfilled' && signalsRes.value.ok) {
        const data = await signalsRes.value.json();
        if (data.success) details.signals = data.data?.signals || [];
      }

      if (journeysRes.status === 'fulfilled' && journeysRes.value.ok) {
        const data = await journeysRes.value.json();
        if (data.success) details.journeys = data.data?.journeys || [];
      }

      if (personasRes.status === 'fulfilled' && personasRes.value.ok) {
        const data = await personasRes.value.json();
        if (data.success) details.personas = data.data?.personas || [];
      }

      setVerticalDetails((prev) => ({ ...prev, [slug]: details }));
    } catch (err) {
      console.error('Failed to load details:', err);
    } finally {
      setLoadingDetails(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading verticals...</p>
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
              <Building2 className="w-7 h-7 text-blue-400" />
              Vertical Packs
            </h1>
            <p className="text-gray-400 mt-1">Sprint 52: Banking, Insurance signals and personas</p>
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
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <p className="text-gray-500 text-sm">Total Verticals</p>
            </div>
            <p className="text-2xl font-bold text-white">{summary.total}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-gray-500 text-sm">Active</p>
            </div>
            <p className="text-2xl font-bold text-white">{summary.active}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Route className="w-5 h-5 text-purple-400" />
              <p className="text-gray-500 text-sm">With Journeys</p>
            </div>
            <p className="text-2xl font-bold text-white">{summary.with_journeys}</p>
          </div>
        </div>
      )}

      {/* Verticals List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Configured Verticals</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {verticals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No verticals configured. Check UPR OS connection.
            </div>
          ) : (
            verticals.map((vertical) => (
              <div key={vertical.id || vertical.slug} className="p-4">
                <button
                  onClick={() => loadDetails(vertical.slug)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    {loadingDetails === vertical.slug ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : expandedVertical === vertical.slug ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <span className="text-white font-medium">{vertical.name}</span>
                      <span className="text-gray-500 text-sm ml-2">({vertical.slug})</span>
                      {vertical.description && (
                        <p className="text-gray-500 text-sm mt-1">{vertical.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      vertical.is_active
                        ? 'text-green-400 bg-green-500/10'
                        : 'text-gray-400 bg-gray-500/10'
                    }`}>
                      {vertical.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </button>

                {expandedVertical === vertical.slug && (
                  <div className="mt-4 ml-8 space-y-4">
                    {/* Sub-verticals */}
                    {vertical.sub_verticals && vertical.sub_verticals.length > 0 && (
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Sub-Verticals ({vertical.sub_verticals.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {vertical.sub_verticals.map((sub) => (
                            <span
                              key={sub.slug}
                              className="text-xs px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Signals */}
                    {verticalDetails[vertical.slug] && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <Signal className="w-4 h-4 text-orange-400" />
                            Signal Types ({verticalDetails[vertical.slug].signals.length})
                          </h4>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {verticalDetails[vertical.slug].signals.length === 0 ? (
                              <p className="text-gray-500 text-xs">No signals configured</p>
                            ) : (
                              verticalDetails[vertical.slug].signals.map((signal: unknown, idx: number) => (
                                <div key={idx} className="text-xs text-gray-300">
                                  {(signal as { name?: string; slug?: string }).name || (signal as { slug?: string }).slug}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <Route className="w-4 h-4 text-purple-400" />
                            Journey Templates ({verticalDetails[vertical.slug].journeys.length})
                          </h4>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {verticalDetails[vertical.slug].journeys.length === 0 ? (
                              <p className="text-gray-500 text-xs">No journeys configured</p>
                            ) : (
                              verticalDetails[vertical.slug].journeys.map((journey: unknown, idx: number) => (
                                <div key={idx} className="text-xs text-gray-300">
                                  {(journey as { name?: string; slug?: string }).name || (journey as { slug?: string }).slug}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-cyan-400" />
                            Persona Templates ({verticalDetails[vertical.slug].personas.length})
                          </h4>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {verticalDetails[vertical.slug].personas.length === 0 ? (
                              <p className="text-gray-500 text-xs">No personas configured</p>
                            ) : (
                              verticalDetails[vertical.slug].personas.map((persona: unknown, idx: number) => (
                                <div key={idx} className="text-xs text-gray-300">
                                  {(persona as { name?: string; slug?: string }).name || (persona as { slug?: string }).slug}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Note about Banking */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-400 font-medium">Banking Only (For Now)</p>
            <p className="text-blue-400/70 text-sm mt-1">
              Per CLAUDE.md, only Banking vertical is currently active with intelligence.
              Other verticals (Insurance, Real Estate, Recruitment) are UI placeholders that show &quot;Coming Soon&quot;.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
