'use client';

/**
 * Super Admin - Blueprints (Read-Only View)
 *
 * ⛔ AUTHORITY LOCK (Control Plane v3.0):
 * This page is READ-ONLY. All mutations are blocked.
 *
 * - Editing is managed via Control Plane Wizard
 * - This page consumes the canonical stack_readiness API
 * - No local status computation allowed
 *
 * For creating/editing verticals, use: /superadmin/controlplane/wizard/new
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe,
  Plus,
  Edit2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ExternalLink,
  XCircle,
} from 'lucide-react';

interface Persona {
  slug?: string;
  persona_name: string;
  persona_role?: string;
  persona_organization?: string;
  mission_statement?: string;
  entity_type: 'company' | 'individual' | 'deal';
  contact_priority_rules?: {
    tiers: Array<{
      size_min?: number;
      size_max?: number | null;
      age_min?: number;
      age_max?: number | null;
      titles: string[];
      priority: number;
    }>;
  };
  edge_cases?: {
    blockers: Array<{
      type: string;
      values: string[];
      multiplier: number;
      reason?: string;
    }>;
    boosters: Array<{
      type: string;
      values: string[];
      multiplier: number;
      reason?: string;
    }>;
  };
  timing_rules?: {
    calendar: Array<{
      period: string;
      months: number[];
      multiplier: number;
    }>;
    signal_freshness: Array<{
      days_max: number;
      multiplier: number;
      label: string;
    }>;
  };
  outreach_doctrine?: {
    always: string[];
    never: string[];
    tone: string;
    formality: string;
    channels: string[];
  };
  scoring_config?: {
    weights: {
      q_score: number;
      t_score: number;
      l_score: number;
      e_score: number;
    };
    thresholds: {
      hot: number;
      warm: number;
      cold: number;
    };
  };
  quality_standards?: {
    minimum_data_fields: string[];
    preferred_data_sources: string[];
    data_freshness_days: number;
  };
  anti_patterns?: Array<{
    pattern: string;
    reason: string;
    severity: string;
  }>;
  confidence_gates?: {
    minimum_confidence: number;
    require_verification_below: number;
    auto_approve_above: number;
  };
  success_patterns?: Array<{
    pattern: string;
    indicator: string;
    action: string;
  }>;
  failure_patterns?: Array<{
    pattern: string;
    indicator: string;
    recovery: string;
  }>;
}

interface SubVertical {
  id: string;
  slug: string;
  name: string;
  description: string;
  persona: Persona;
  isActive: boolean;
  config?: {
    default_agent?: string;
    [key: string]: unknown;
  };
}

interface Vertical {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  subVerticals: SubVertical[];
  isActive: boolean;
}

// Default empty state - data loaded from API
const emptyVerticals: Vertical[] = [];

// Helper to get icon for vertical
function getVerticalIcon(slug: string): string {
  const icons: Record<string, string> = {
    'banking': '🏦',
    'insurance': '🛡️',
    'real-estate': '🏠',
    'recruitment': '👥',
    'saas-sales': '💼',
  };
  return icons[slug] || '📊';
}

// ============================================================================
// StackReadinessDisplay - Consumes canonical stack_readiness API
// NO LOCAL STATUS COMPUTATION - 100% derived from API
// ============================================================================
function StackReadinessDisplay({ subVerticalId }: { subVerticalId: string }) {
  const [readiness, setReadiness] = useState<{
    status: 'READY' | 'BLOCKED' | 'INCOMPLETE' | 'NOT_FOUND';
    checks: Record<string, boolean>;
    blockers: string[];
    metadata: Record<string, unknown>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReadiness() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/superadmin/controlplane/stack-readiness?sub_vertical_id=${subVerticalId}`);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch readiness');
        }

        // Aggregate status from all personas under this sub-vertical
        const stacks = data.stacks || [];
        if (stacks.length === 0) {
          setReadiness({
            status: 'INCOMPLETE',
            checks: {},
            blockers: ['No personas configured'],
            metadata: {},
          });
        } else {
          // Show worst status across all personas
          const worstStatus = stacks.reduce((worst: string, s: { status: string }) => {
            if (worst === 'NOT_FOUND' || s.status === 'NOT_FOUND') return 'NOT_FOUND';
            if (worst === 'BLOCKED' || s.status === 'BLOCKED') return 'BLOCKED';
            if (worst === 'INCOMPLETE' || s.status === 'INCOMPLETE') return 'INCOMPLETE';
            return 'READY';
          }, 'READY');

          const allBlockers: string[] = stacks.flatMap((s: { blockers: string[] }) => s.blockers || []);
          const uniqueBlockers: string[] = [...new Set(allBlockers)];

          setReadiness({
            status: worstStatus as 'READY' | 'BLOCKED' | 'INCOMPLETE' | 'NOT_FOUND',
            checks: stacks[0]?.checks || {},
            blockers: uniqueBlockers,
            metadata: { persona_count: stacks.length },
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchReadiness();
  }, [subVerticalId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-neutral-500 text-xs">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading readiness...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400 text-xs">
        <AlertCircle className="w-3 h-3" />
        {error}
      </div>
    );
  }

  if (!readiness) return null;

  const statusConfig = {
    READY: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle },
    BLOCKED: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: XCircle },
    INCOMPLETE: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: AlertTriangle },
    NOT_FOUND: { bg: 'bg-neutral-800', border: 'border-neutral-700', text: 'text-neutral-500', icon: AlertCircle },
  };

  const config = statusConfig[readiness.status];
  const StatusIcon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon className={`w-4 h-4 ${config.text}`} />
        <span className={`text-sm font-medium ${config.text}`}>
          Stack Status: {readiness.status}
        </span>
      </div>

      {readiness.blockers.length > 0 && (
        <div className="space-y-1 mt-2">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Blockers</p>
          {readiness.blockers.map((blocker, i) => (
            <p key={i} className="text-xs text-red-300">• {blocker}</p>
          ))}
        </div>
      )}

      <p className="text-[10px] text-neutral-600 mt-2">
        Status derived from stack_readiness API — no local computation
      </p>
    </div>
  );
}

export default function VerticalsPage() {
  const [verticals, setVerticals] = useState<Vertical[]>(emptyVerticals);
  const [expandedVertical, setExpandedVertical] = useState<string | null>(null);
  const [selectedSubVertical, setSelectedSubVertical] = useState<SubVertical | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // v3.0: activeTab, isEditing, isSaving removed — this is read-only view

  // Load verticals from API
  useEffect(() => {
    async function loadVerticals() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all verticals
        const verticalsRes = await fetch('/api/admin/vertical-config?all=true');
        const verticalsData = await verticalsRes.json();

        if (!verticalsData.success) {
          throw new Error(verticalsData.error || 'Failed to load verticals');
        }

        // Transform flat config data into UI structure
        const configsArray = verticalsData.data || [];
        const verticalMap = new Map<string, Vertical>();

        for (const config of configsArray) {
          const verticalSlug = config.vertical;

          if (!verticalMap.has(verticalSlug)) {
            verticalMap.set(verticalSlug, {
              id: verticalSlug,
              slug: verticalSlug,
              name: verticalSlug.charAt(0).toUpperCase() + verticalSlug.slice(1).replace(/-/g, ' '),
              description: '',
              icon: getVerticalIcon(verticalSlug),
              isActive: config.isActive ?? true,
              subVerticals: [],
            });
          }

          const vertical = verticalMap.get(verticalSlug)!;

          // Build sub-vertical with persona from config
          const subVertical: SubVertical = {
            id: config.id,
            slug: config.subVertical,
            name: config.subVertical.charAt(0).toUpperCase() + config.subVertical.slice(1).replace(/-/g, ' '),
            description: config.persona?.mission_statement || '',
            isActive: config.isActive ?? true,
            config: config.config,
            persona: config.persona || {
              persona_name: '',
              entity_type: 'company',
            },
          };

          vertical.subVerticals.push(subVertical);
        }

        const verticalsArray = Array.from(verticalMap.values());
        setVerticals(verticalsArray);

        // Expand first vertical if exists
        if (verticalsArray.length > 0) {
          setExpandedVertical(verticalsArray[0].id);
        }
      } catch (err) {
        console.error('Failed to load verticals:', err);
        setError(err instanceof Error ? err.message : 'Failed to load verticals');
      } finally {
        setIsLoading(false);
      }
    }

    loadVerticals();
  }, []);

  // v3.0: handleSave removed — all mutations via Control Plane

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
        <span className="ml-3 text-neutral-500 text-sm">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-red-400 mb-1">Failed to Load</h3>
        <p className="text-neutral-500 text-xs mb-3">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AUTHORITY LOCK BANNER - v3.0 */}
      <div className="bg-amber-900/30 border border-amber-500/40 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-300 mb-1">
              Read-Only View — Editing Locked
            </h3>
            <p className="text-xs text-amber-200/80 mb-3">
              This page shows configuration blueprints. All editing is managed via the Control Plane Wizard
              to preserve runtime integrity. No mutations are allowed from this UI.
            </p>
            <Link
              href="/superadmin/controlplane/wizard/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Open Control Plane Wizard
            </Link>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Link href="/superadmin/controlplane" className="hover:text-white hover:underline">
          Runtime Control Plane
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white">Blueprints</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white flex items-center gap-2">
            Blueprints
            <span className="px-2 py-0.5 bg-neutral-700 text-neutral-400 text-[10px] font-medium rounded">
              READ-ONLY
            </span>
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            View configuration blueprints — all editing via Control Plane
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/superadmin/controlplane"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Go to Control Plane
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Verticals List */}
        <div className="col-span-4">
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-800">
            <div className="p-3 border-b border-neutral-800">
              <h2 className="text-sm font-medium text-neutral-300">Verticals</h2>
            </div>
            <div className="divide-y divide-neutral-800">
              {verticals.map((vertical) => (
                <div key={vertical.id}>
                  <button
                    onClick={() => setExpandedVertical(expandedVertical === vertical.id ? null : vertical.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{vertical.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">{vertical.name}</p>
                        <p className="text-[10px] text-neutral-600">{vertical.subVerticals.length} sub-verticals</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                        vertical.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                      }`}>
                        {vertical.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {expandedVertical === vertical.id ? (
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                    </div>
                  </button>

                  {expandedVertical === vertical.id && (
                    <div className="bg-neutral-800/30 px-3 pb-3">
                      {vertical.subVerticals.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubVertical(sub);
                          }}
                          className={`w-full flex items-center justify-between p-2 mt-1.5 rounded transition-colors ${
                            selectedSubVertical?.id === sub.id
                              ? 'bg-blue-500/10 border border-blue-500/30'
                              : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent'
                          }`}
                        >
                          <div className="text-left">
                            <p className="text-xs font-medium text-white">{sub.name}</p>
                            <p className="text-[10px] text-neutral-600">{sub.persona.persona_name || 'No persona'}</p>
                          </div>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            sub.isActive ? 'bg-emerald-500' : 'bg-neutral-700'
                          }`} />
                        </button>
                      ))}
                      {/* v3.0: Add Sub-Vertical removed - use Control Plane Wizard */}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Persona Editor */}
        <div className="col-span-8">
          {selectedSubVertical ? (
            <div className="bg-neutral-900/50 rounded-lg border border-neutral-800">
              {/* Header */}
              <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-white">{selectedSubVertical.name}</h2>
                  <p className="text-xs text-neutral-500">{selectedSubVertical.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* v3.0: Edit button removed - all editing via Control Plane */}
                  <Link
                    href="/superadmin/controlplane"
                    className="flex items-center gap-1.5 px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit in Control Plane
                  </Link>
                </div>
              </div>

              {/* v3.0: Read-only persona view - NO TABS, NO PLACEHOLDERS */}
              <div className="p-4 space-y-4">
                {/* Persona Identity (Read-Only) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Persona Identity</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-neutral-600 mb-0.5">Name</p>
                      <p className="text-sm text-white">{selectedSubVertical.persona.persona_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-600 mb-0.5">Entity Type</p>
                      <p className="text-sm text-white capitalize">{selectedSubVertical.persona.entity_type || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-600 mb-0.5">Role</p>
                      <p className="text-sm text-white">{selectedSubVertical.persona.persona_role || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-600 mb-0.5">Default Agent</p>
                      <p className="text-sm text-white">{selectedSubVertical.config?.default_agent || 'discovery'}</p>
                    </div>
                  </div>
                  {selectedSubVertical.persona.mission_statement && (
                    <div>
                      <p className="text-[10px] text-neutral-600 mb-0.5">Mission</p>
                      <p className="text-sm text-neutral-300">{selectedSubVertical.persona.mission_statement}</p>
                    </div>
                  )}
                </div>

                {/* Authority Status - FROM stack_readiness API */}
                <StackReadinessDisplay subVerticalId={selectedSubVertical.id} />

                {/* Single CTA */}
                <div className="pt-4 border-t border-neutral-800">
                  <p className="text-[10px] text-neutral-600 mb-2">
                    Policy, targeting, timing, and scoring are managed in Control Plane.
                  </p>
                  <Link
                    href="/superadmin/controlplane"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit in Control Plane
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-8 text-center">
              <Globe className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-neutral-400 mb-1">Select a Sub-Vertical</h3>
              <p className="text-xs text-neutral-600">Choose from the left to edit persona config</p>
            </div>
          )}
        </div>
      </div>

      {/* Vertical creation via wizard: /superadmin/controlplane/wizard/new */}
    </div>
  );
}

// v3.0 Control Plane: All tab components removed.
// Blueprints is READ-ONLY. All editing via /superadmin/controlplane/wizard/new
