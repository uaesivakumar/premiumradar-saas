'use client';

/**
 * OS Control Plane - Authoritative Configuration
 *
 * STEP 5 Rules (LOCKED):
 * - Rule 1: No dual data sources - only /api/superadmin/controlplane/* APIs
 * - Rule 2: Create → Re-fetch → Render (no optimistic UI)
 * - Rule 3: IDs flow downward, never keys
 * - Rule 4: Policy editor = single atomic save
 * - Rule 5: Runtime truth visible via resolve-config
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  Eye,
  CheckCircle,
  Shield,
  Server,
  Users,
  FileText,
  RefreshCw,
  Clock,
  Lock,
  ExternalLink,
  Plus,
  History,
} from 'lucide-react';
// S274: Removed Edit2, Save - no mutation affordances in read-only view
// Phase1A: Added Plus, History for policy versioning

// =============================================================================
// TYPES (Match DB schema exactly)
// =============================================================================

interface OSVertical {
  id: string;
  key: string;
  name: string;
  // v2.0: entity_type and region_scope are DEPRECATED at vertical level
  // They now live at sub_vertical level (primary_entity_type)
  entity_type?: 'deal' | 'company' | 'individual';  // DEPRECATED
  region_scope?: string[];  // DEPRECATED
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OSSubVertical {
  id: string;
  vertical_id: string;
  key: string;
  name: string;
  default_agent: string;
  primary_entity_type?: string;  // v2.0: Entity type now at sub-vertical level
  related_entity_types?: string[];  // v2.0
  is_active: boolean;
  created_at: string;
  updated_at: string;
  vertical_key?: string;
}

interface OSPersona {
  id: string;
  sub_vertical_id: string;
  key: string;
  name: string;
  mission: string | null;
  decision_lens: string | null;
  scope?: string;  // v2.0: GLOBAL | REGIONAL | LOCAL
  region_code?: string | null;  // v2.0
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sub_vertical_key?: string;
  vertical_key?: string;
}

interface OSPersonaPolicy {
  id: string;
  persona_id: string;
  policy_version: number;
  status?: string;  // Phase1A: DRAFT | STAGED | ACTIVE | DEPRECATED
  allowed_intents: string[];
  forbidden_outputs: string[];
  allowed_tools: string[];
  evidence_scope: Record<string, unknown>;
  memory_scope: Record<string, unknown>;
  cost_budget: Record<string, unknown>;
  latency_budget: Record<string, unknown>;
  escalation_rules: Record<string, unknown>;
  disclaimer_rules: Record<string, unknown>;
  staged_at?: string | null;  // Phase1A
  activated_at?: string | null;  // Phase1A
  deprecated_at?: string | null;  // Phase1A
  created_at: string;
  updated_at: string;
  persona_key?: string;
}

// Phase1A: Policy versions response
interface PolicyVersionsResponse {
  persona_id: string;
  persona_key: string;
  persona_name: string;
  versions: OSPersonaPolicy[];
  total_versions: number;
  active_version: number | null;
  draft_version: number | null;
}

interface ResolvedConfig {
  binding: { id: string; tenant_id: string; workspace_id: string };
  vertical: { id: string; key: string; name: string; entity_type: string };
  sub_vertical: { id: string; key: string; name: string; default_agent: string };
  persona: { id: string; key: string; name: string; mission: string };
  policy: { id: string; version: number; allowed_intents: string[]; forbidden_outputs: string[] };
}

interface StackStatus {
  vertical: {
    id: string;
    key: string;
    name: string;
    is_active: boolean;
  };
  sub_verticals: {
    id: string;
    key: string;
    name: string;
    is_active: boolean;
    persona_count: number;
    personas: {
      id: string;
      key: string;
      name: string;
      is_active: boolean;
      policy_status: string | null;
      has_binding: boolean;
      status: 'READY' | 'NOT_READY';
      not_ready_reason: string | null;
    }[];
    status: 'READY' | 'NOT_READY';
    not_ready_reason: string | null;
  }[];
  stack_status: 'READY' | 'NOT_READY';
  not_ready_reason: string | null;
}

// =============================================================================
// API FUNCTIONS (Rule 1: Only controlplane APIs)
// =============================================================================

async function fetchVerticals(): Promise<OSVertical[]> {
  const res = await fetch('/api/superadmin/controlplane/verticals');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch verticals');
  return data.data;
}

async function fetchSubVerticals(verticalId: string): Promise<OSSubVertical[]> {
  const res = await fetch(`/api/superadmin/controlplane/verticals/${verticalId}/sub-verticals`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch sub-verticals');
  return data.data;
}

async function fetchPersonas(): Promise<OSPersona[]> {
  const res = await fetch('/api/superadmin/controlplane/personas');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch personas');
  return data.data;
}

async function fetchPersonaPolicy(personaId: string): Promise<OSPersonaPolicy> {
  const res = await fetch(`/api/superadmin/controlplane/personas/${personaId}/policy`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch policy');
  return data.data;
}

// Phase1A: Fetch all policy versions for a persona
async function fetchPolicyVersions(personaId: string): Promise<PolicyVersionsResponse> {
  const res = await fetch(`/api/superadmin/controlplane/personas/${personaId}/policy/version`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch policy versions');
  return data.data;
}

// Phase1A: Create a new policy version (DRAFT)
async function createPolicyVersion(personaId: string): Promise<{
  id: string;
  policy_version: number;
  status: string;
  source_version: number;
}> {
  const res = await fetch(`/api/superadmin/controlplane/personas/${personaId}/policy/version`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to create policy version');
  return data.data;
}

async function createVertical(payload: {
  key: string;
  name: string;
  entity_type: string;
  region_scope: string[];
}): Promise<OSVertical> {
  const res = await fetch('/api/superadmin/controlplane/verticals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to create vertical');
  return data.data;
}

async function createSubVertical(payload: {
  vertical_id: string;
  key: string;
  name: string;
  default_agent: string;
}): Promise<OSSubVertical> {
  const res = await fetch('/api/superadmin/controlplane/sub-verticals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to create sub-vertical');
  return data.data;
}

async function createPersona(payload: {
  sub_vertical_id: string;
  key: string;
  name: string;
  mission?: string;
  decision_lens?: string;
}): Promise<OSPersona> {
  const res = await fetch('/api/superadmin/controlplane/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to create persona');
  return data.data;
}

async function updatePersonaPolicy(
  personaId: string,
  policy: Partial<OSPersonaPolicy>
): Promise<OSPersonaPolicy> {
  const res = await fetch(`/api/superadmin/controlplane/personas/${personaId}/policy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policy),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to update policy');
  return data.data;
}

async function fetchStacks(): Promise<StackStatus[]> {
  const res = await fetch('/api/superadmin/controlplane/stacks?include_status=1');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch stacks');
  return data.stacks;
}

// v3.0: Fetch stack readiness from canonical resolver
async function fetchStackReadiness(personaId: string): Promise<{
  status: 'READY' | 'BLOCKED' | 'INCOMPLETE' | 'NOT_FOUND';
  checks: Record<string, boolean>;
  blockers: string[];
  metadata: { binding_count: number; active_policy_version: number | null };
}> {
  const res = await fetch(`/api/superadmin/controlplane/stack-readiness?persona_id=${personaId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch readiness');
  return data.data;
}

// v3.0: Fetch bindings for a persona (VIEW ONLY - no edit from here)
async function fetchPersonaBindings(personaId: string): Promise<{
  id: string;
  workspace_id: string;
  tenant_id: string;
  is_active: boolean;
}[]> {
  const res = await fetch(`/api/superadmin/controlplane/bindings?persona_id=${personaId}`);
  const data = await res.json();
  if (!data.success) return [];
  return data.data || [];
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ControlPlanePage() {
  // Data state
  const [verticals, setVerticals] = useState<OSVertical[]>([]);
  const [subVerticals, setSubVerticals] = useState<Map<string, OSSubVertical[]>>(new Map());
  const [personas, setPersonas] = useState<OSPersona[]>([]);
  const [stacks, setStacks] = useState<StackStatus[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVertical, setExpandedVertical] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<OSPersona | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<OSPersonaPolicy | null>(null);

  // Modal state - S274: All mutation modals removed, read-only viewers only
  const [showRuntimeConfig, setShowRuntimeConfig] = useState(false);
  const [showAuditViewer, setShowAuditViewer] = useState(false);
  const [showBindingsViewer, setShowBindingsViewer] = useState(false);

  // S275-F3: Pre-fill values for Runtime Config modal (set by binding row click)
  const [runtimeConfigPreFill, setRuntimeConfigPreFill] = useState<{
    tenantId: string;
    workspaceId: string;
  } | null>(null);

  // S275-F4: Handler for binding row click -> open Runtime Config with pre-fill
  const handleViewBindingConfig = (tenantId: string, workspaceId: string) => {
    setShowBindingsViewer(false);
    setRuntimeConfigPreFill({ tenantId, workspaceId });
    setShowRuntimeConfig(true);
  };

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [verticalsData, personasData, stacksData] = await Promise.all([
        fetchVerticals(),
        fetchPersonas(),
        fetchStacks(),
      ]);

      setVerticals(verticalsData);
      setPersonas(personasData);
      setStacks(stacksData);

      // Load sub-verticals for each vertical
      const subVerticalsMap = new Map<string, OSSubVertical[]>();
      for (const v of verticalsData) {
        const subs = await fetchSubVerticals(v.id);
        subVerticalsMap.set(v.id, subs);
      }
      setSubVerticals(subVerticalsMap);

      // Expand first vertical if exists
      if (verticalsData.length > 0) {
        setExpandedVertical(verticalsData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle persona selection - load policy
  const handleSelectPersona = useCallback(async (persona: OSPersona) => {
    setSelectedPersona(persona);
    setSelectedPolicy(null);

    try {
      const policy = await fetchPersonaPolicy(persona.id);
      setSelectedPolicy(policy);
    } catch (err) {
      console.error('Failed to load policy:', err);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
        <span className="ml-3 text-neutral-500 text-sm">Loading Control Plane...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-red-400 mb-1">Failed to Load</h3>
        <p className="text-neutral-500 text-xs mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-neutral-500">
        <span className="text-white">Control Plane</span>
      </nav>

      {/* Control Plane v3.0 Status Strip - READ-ONLY MONITORING */}
      <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-violet-600 text-white text-xs font-medium rounded">
            Control Plane v3.0
          </span>
          <span className="text-violet-300 text-xs">
            READY = Vertical ✓ + Sub-Vertical ✓ + Persona ✓ + ACTIVE Policy ✓ + Binding ✓ + Runtime Resolves ✓
          </span>
        </div>
        {/* S274: Create button removed - use wizard directly at /superadmin/controlplane/wizard/new */}
        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
          <Lock className="w-3 h-3" />
          <span>Read-Only Monitoring</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-violet-400" />
            Runtime Control Plane
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Single source of truth for system readiness and runtime configuration
          </p>
        </div>
        {/* S276-F1: Blueprints link removed - available in nav bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBindingsViewer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            View Bindings
          </button>
          <button
            onClick={() => setShowAuditViewer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Audit Log
          </button>
          <button
            onClick={() => setShowRuntimeConfig(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Runtime Config
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Hierarchy Panel */}
        <div className="col-span-4 space-y-3">
          {/* Verticals List */}
          <div className="bg-neutral-900/50 rounded-lg border border-neutral-800">
            <div className="p-3 border-b border-neutral-800">
              <h2 className="text-sm font-medium text-neutral-300">Configuration Hierarchy</h2>
            </div>
            <div className="divide-y divide-neutral-800">
              {verticals.length === 0 ? (
                <div className="p-4 text-center text-neutral-600 text-xs">
                  No verticals configured
                </div>
              ) : (
                verticals.map((vertical) => {
                  const stackStatus = stacks.find(s => s.vertical.id === vertical.id);
                  return (
                    <VerticalItem
                      key={vertical.id}
                      vertical={vertical}
                      subVerticals={subVerticals.get(vertical.id) || []}
                      personas={personas.filter(
                        (p) =>
                          subVerticals
                            .get(vertical.id)
                            ?.some((sv) => sv.id === p.sub_vertical_id)
                      )}
                      stackStatus={stackStatus}
                      isExpanded={expandedVertical === vertical.id}
                      selectedPersonaId={selectedPersona?.id}
                      onToggle={() =>
                        setExpandedVertical(
                          expandedVertical === vertical.id ? null : vertical.id
                        )
                      }
                      onSelectPersona={handleSelectPersona}
                      // S274: All mutation callbacks removed - read-only view
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Design Persona Panel - v3.0: Design-only, no runtime concerns */}
        <div className="col-span-8 space-y-4">
          {selectedPersona && selectedPolicy ? (
            <PolicyEditor
              persona={selectedPersona}
              policy={selectedPolicy}
              onSave={async (updatedPolicy) => {
                // Rule 4: Single atomic save
                const result = await updatePersonaPolicy(selectedPersona.id, updatedPolicy);
                // Rule 2: Re-fetch after save
                setSelectedPolicy(result);
                return result;
              }}
            />
          ) : selectedPersona ? (
            <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-8 text-center">
              <Loader2 className="w-6 h-6 text-neutral-600 mx-auto mb-3 animate-spin" />
              <p className="text-neutral-500 text-sm">Loading policy...</p>
            </div>
          ) : (
            <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-8 text-center">
              <Shield className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-neutral-400 mb-1">
                Select a Persona
              </h3>
              <p className="text-xs text-neutral-600">
                Choose from the hierarchy to view policy details
              </p>
            </div>
          )}

          {/* v3.1: Runtime Status (Read-Only) */}
          {selectedPersona && (
            <RuntimeStatusPanel personaId={selectedPersona.id} />
          )}
        </div>
      </div>

      {/* S274: All creation modals removed - mutations are wizard-only */}
      {/* Wizard route: /superadmin/controlplane/wizard/new */}

      {/* Runtime Config Modal (Rule 5) - S275-F3: Now supports pre-fill */}
      {showRuntimeConfig && (
        <RuntimeConfigModal
          onClose={() => {
            setShowRuntimeConfig(false);
            setRuntimeConfigPreFill(null);
          }}
          initialTenantId={runtimeConfigPreFill?.tenantId}
          initialWorkspaceId={runtimeConfigPreFill?.workspaceId}
        />
      )}

      {/* Audit Viewer Modal (Ops/Compliance) */}
      {showAuditViewer && (
        <AuditViewer onClose={() => setShowAuditViewer(false)} />
      )}

      {/* S274: EditVerticalModal removed - no mutations from Control Plane */}

      {/* Workspace Bindings Viewer (Read-only) - S275-F4: Now supports row click -> config */}
      {showBindingsViewer && (
        <WorkspaceBindingsViewer
          onClose={() => setShowBindingsViewer(false)}
          onViewConfig={handleViewBindingConfig}
        />
      )}
    </div>
  );
}

// =============================================================================
// VERTICAL ITEM COMPONENT
// =============================================================================

function VerticalItem({
  vertical,
  subVerticals,
  personas,
  stackStatus,
  isExpanded,
  selectedPersonaId,
  onToggle,
  onSelectPersona,
}: {
  vertical: OSVertical;
  subVerticals: OSSubVertical[];
  personas: OSPersona[];
  stackStatus?: StackStatus;
  isExpanded: boolean;
  selectedPersonaId?: string;
  onToggle: () => void;
  onSelectPersona: (persona: OSPersona) => void;
  // S274: All mutation callbacks removed - read-only view
}) {
  const isReady = stackStatus?.stack_status === 'READY';
  const notReadyReason = stackStatus?.not_ready_reason;

  return (
    <div>
      <div className="flex items-center justify-between p-3 hover:bg-neutral-800/50 transition-colors group">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 text-left"
        >
          <span className="text-lg">
            {vertical.key === 'saas_sales' ? '💼' : '🏦'}
          </span>
          <div>
            <p className="text-sm font-medium text-white">{vertical.name}</p>
            <p className="text-[10px] text-neutral-600">
              {subVerticals.length} sub-verticals
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {/* Stack Readiness Badge */}
          {stackStatus && (
            <span
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded flex items-center gap-1 ${
                isReady
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
              title={notReadyReason || 'Stack is ready'}
            >
              {isReady ? (
                <>
                  <CheckCircle className="w-2.5 h-2.5" />
                  READY
                </>
              ) : (
                <>
                  <AlertTriangle className="w-2.5 h-2.5" />
                  NOT READY
                </>
              )}
            </span>
          )}
          {/* S274: Edit pencil removed - no mutation affordances in read-only view */}
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded ${
              vertical.is_active
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {vertical.is_active ? 'Active' : 'Inactive'}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
          )}
        </div>
      </div>

      {/* Show not ready reason when expanded */}
      {isExpanded && notReadyReason && (
        <div className="mx-3 mb-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          {notReadyReason}
        </div>
      )}

      {isExpanded && (
        <div className="bg-neutral-800/30 px-3 pb-3">
          {subVerticals.map((sv) => {
            const subPersonas = personas.filter((p) => p.sub_vertical_id === sv.id);
            const svStatus = stackStatus?.sub_verticals.find(s => s.id === sv.id);
            return (
              <div key={sv.id} className="mt-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1 px-2">
                  <div className="flex items-center gap-2">
                    <span>{sv.name}</span>
                    {svStatus && (
                      <span
                        className={`text-[9px] px-1 py-0.5 rounded ${
                          svStatus.status === 'READY'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {svStatus.status}
                      </span>
                    )}
                  </div>
                  {/* S276-F3: SIVA tooltip for clarity */}
                  <span
                    className="text-[10px] text-neutral-600 cursor-help"
                    title={sv.default_agent === 'SIVA' ? 'SIVA = Sales Intelligence Virtual Assistant' : undefined}
                  >
                    {sv.default_agent}
                  </span>
                </div>
                {subPersonas.map((persona) => {
                  const personaStatus = svStatus?.personas.find(p => p.id === persona.id);
                  return (
                    <div key={persona.id} className="space-y-1">
                      <button
                        onClick={() => onSelectPersona(persona)}
                        className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
                          selectedPersonaId === persona.id
                            ? 'bg-violet-500/10 border border-violet-500/30'
                            : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent'
                        }`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-medium text-white flex items-center gap-1.5">
                            {persona.name}
                            {personaStatus && (
                              <span
                                className={`text-[8px] px-1 py-0.5 rounded ${
                                  personaStatus.status === 'READY'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                                title={personaStatus.not_ready_reason || 'Ready'}
                              >
                                {personaStatus.policy_status || 'NO POLICY'}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-neutral-600">{persona.key}</p>
                        </div>
                        <Users className="w-3 h-3 text-neutral-600" />
                      </button>
                      {/* S276-F4: Removed redundant "Bindings: Active" - reduces visual noise */}
                    </div>
                  );
                })}
                {/* Phase 1A: Add Persona link per sub-vertical */}
                <Link
                  href={`/superadmin/controlplane/wizard?extend=persona&vertical_id=${vertical.id}&vertical_name=${encodeURIComponent(vertical.name)}&sub_vertical_id=${sv.id}&sub_vertical_name=${encodeURIComponent(sv.name)}`}
                  className="mt-2 flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded border border-dashed border-violet-500/30 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  Add Persona
                </Link>
              </div>
            );
          })}
          {/* Phase 1A: Extend link - navigates to wizard hub */}
          <Link
            href={`/superadmin/controlplane/wizard?extend=sub-vertical&vertical_id=${vertical.id}&vertical_name=${encodeURIComponent(vertical.name)}`}
            className="mt-3 flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded border border-dashed border-violet-500/30 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Add Sub-Vertical
          </Link>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// POLICY EDITOR COMPONENT (Rule 4: Single atomic save)
// =============================================================================

// S274: PolicyEditor renamed to PolicyViewer - read-only, no mutations
function PolicyEditor({
  persona,
  policy,
}: {
  persona: OSPersona;
  policy: OSPersonaPolicy;
  onSave?: (policy: Partial<OSPersonaPolicy>) => Promise<OSPersonaPolicy>; // Kept for compatibility
}) {
  // S274: All editing state removed - this is now a read-only viewer
  const currentAllowedIntents = policy.allowed_intents;
  const currentForbiddenOutputs = policy.forbidden_outputs;
  const currentAllowedTools = policy.allowed_tools;

  // S274: PolicyEditor converted to read-only PolicyViewer
  // No editing functionality - mutations via wizard only
  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800">
      {/* S274: Read-only status header */}
      <div className="px-3 py-2 border-b border-neutral-700 bg-neutral-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Policy Inspector</span>
            <span className="text-[10px] text-neutral-500">(Read-Only)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            <span>Activation: Auto-managed</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            {persona.name}
            <span className="text-[10px] text-neutral-600 font-mono">({persona.key})</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Policy v{policy.policy_version}
          </p>
        </div>
        {/* Phase 1A: Policy versioning link */}
        <Link
          href={`/superadmin/controlplane/wizard?extend=policy&persona_id=${persona.id}&persona_name=${encodeURIComponent(persona.name)}`}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded transition-colors"
        >
          <FileText className="w-3 h-3" />
          Create v{(policy.policy_version || 0) + 1}
        </Link>
      </div>

      {/* Persona Info */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-800/30">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-neutral-500">Mission:</span>
            <p className="text-white mt-0.5">{persona.mission || 'Not set'}</p>
          </div>
          <div>
            <span className="text-neutral-500">Decision Lens:</span>
            <p className="text-white mt-0.5">{persona.decision_lens || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Policy Fields */}
      <div className="p-4 space-y-4">
        {/* Allowed Intents - S274: Read-only */}
        <PolicyArrayField
          label="Allowed Intents"
          description="What the agent can do"
          items={currentAllowedIntents}
          isEditing={false}
          color="emerald"
          onChange={() => {}}
        />

        {/* Forbidden Outputs - S274: Read-only */}
        <PolicyArrayField
          label="Forbidden Outputs"
          description="What the agent must never output"
          items={currentForbiddenOutputs}
          isEditing={false}
          color="red"
          onChange={() => {}}
        />

        {/* Allowed Tools - S274: Read-only */}
        <PolicyArrayField
          label="Allowed Tools"
          description="Tools the agent can invoke"
          items={currentAllowedTools}
          isEditing={false}
          color="blue"
          onChange={() => {}}
        />
      </div>

      {/* Metadata */}
      <div className="px-4 pb-4">
        <div className="text-[10px] text-neutral-600 flex items-center gap-3">
          <span>Updated: {new Date(policy.updated_at).toLocaleString()}</span>
          <span>•</span>
          <span>Persona ID: {persona.id.substring(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// POLICY ARRAY FIELD COMPONENT
// =============================================================================

// S274: PolicyArrayField converted to read-only (no editing)
function PolicyArrayField({
  label,
  description,
  items,
  color,
}: {
  label: string;
  description: string;
  items: string[];
  isEditing?: boolean; // Kept for compatibility but always false
  color: 'emerald' | 'red' | 'blue';
  onChange?: (items: string[]) => void; // Kept for compatibility but never called
}) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      tag: 'bg-emerald-500/20 text-emerald-300',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      tag: 'bg-red-500/20 text-red-300',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      tag: 'bg-blue-500/20 text-blue-300',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`p-3 ${colors.bg} border ${colors.border} rounded`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className={`text-xs font-medium ${colors.text}`}>{label}</h4>
          <p className="text-[10px] text-neutral-600">{description}</p>
        </div>
        <span className="text-[10px] text-neutral-600">{items.length} items</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={`px-2 py-0.5 ${colors.tag} text-[10px] rounded`}
          >
            {item}
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-[10px] text-neutral-600">None configured</span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// RUNTIME STATUS PANEL (v3.1: Read-Only, Auto-Managed)
// =============================================================================

function RuntimeStatusPanel({ personaId }: { personaId: string }) {
  const [readiness, setReadiness] = useState<{
    status: 'READY' | 'BLOCKED' | 'INCOMPLETE' | 'NOT_FOUND';
    checks: Record<string, boolean>;
    blockers: string[];
    metadata: { binding_count: number; active_policy_version: number | null };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReadiness() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchStackReadiness(personaId);
        setReadiness(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    }
    loadReadiness();
  }, [personaId]);

  if (isLoading) {
    return (
      <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading runtime status...</span>
        </div>
      </div>
    );
  }

  if (error || !readiness) {
    return (
      <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs">{error || 'Failed to load runtime status'}</span>
        </div>
      </div>
    );
  }

  const statusColors = {
    READY: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    BLOCKED: 'bg-red-500/10 border-red-500/30 text-red-400',
    INCOMPLETE: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    NOT_FOUND: 'bg-neutral-700/50 border-neutral-600 text-neutral-400',
  };

  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800">
      {/* v3.1: Runtime Status Header */}
      <div className="px-3 py-2 border-b border-neutral-700 bg-neutral-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Runtime Status</span>
            <span className="text-[10px] text-neutral-500">(Auto-Managed)</span>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${statusColors[readiness.status]}`}>
            {readiness.status}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Status Checks */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(readiness.checks).map(([key, passed]) => (
            <div
              key={key}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] ${
                passed
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-neutral-800 text-neutral-500'
              }`}
            >
              {passed ? (
                <CheckCircle className="w-2.5 h-2.5" />
              ) : (
                <X className="w-2.5 h-2.5" />
              )}
              <span className="truncate">{key.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>

        {/* Blockers */}
        {readiness.blockers.length > 0 && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded">
            <p className="text-[10px] font-medium text-amber-400 mb-1">Blockers:</p>
            <ul className="text-[10px] text-amber-300 space-y-0.5">
              {readiness.blockers.map((blocker, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>•</span>
                  <span>{blocker}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-2 border-t border-neutral-800">
          <span>Active bindings: {readiness.metadata.binding_count}</span>
          <span>Policy version: v{readiness.metadata.active_policy_version || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// RUNTIME CONFIG MODAL (Rule 5)
// =============================================================================

// S275-F3: Accept initial values for pre-fill from binding row clicks
function RuntimeConfigModal({
  onClose,
  initialTenantId,
  initialWorkspaceId,
}: {
  onClose: () => void;
  initialTenantId?: string;
  initialWorkspaceId?: string;
}) {
  const [tenantId, setTenantId] = useState(initialTenantId || '');
  const [workspaceId, setWorkspaceId] = useState(initialWorkspaceId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ResolvedConfig | null>(null);

  // S275-F3: Auto-resolve if initial values provided
  useEffect(() => {
    if (initialTenantId && initialWorkspaceId) {
      handleResolve();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResolve = async () => {
    if (!tenantId || !workspaceId) return;

    setIsLoading(true);
    setError(null);
    setConfig(null);

    try {
      // Call OS resolve-config (via proxy or direct)
      const res = await fetch(
        `/api/os/resolve-config?tenant_id=${tenantId}&workspace_id=${workspaceId}`
      );
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || data.error || 'Failed to resolve config');
      }

      setConfig(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-xl">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-medium text-white">View Runtime Config</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Tenant ID</label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="UUID of tenant..."
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Workspace ID</label>
            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="Workspace identifier..."
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={handleResolve}
            disabled={!tenantId || !workspaceId || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Resolve Config
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Result */}
        {config && (
          <div className="mx-4 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                Config Resolved
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500">Vertical:</span>
                <p className="text-white">{config.vertical.key}</p>
              </div>
              <div>
                <span className="text-neutral-500">Sub-Vertical:</span>
                <p className="text-white">{config.sub_vertical.key}</p>
              </div>
              <div>
                <span className="text-neutral-500">Default Agent:</span>
                <p className="text-white">{config.sub_vertical.default_agent}</p>
              </div>
              <div>
                <span className="text-neutral-500">Persona:</span>
                <p className="text-white">{config.persona.key}</p>
              </div>
              <div>
                <span className="text-neutral-500">Policy Version:</span>
                <p className="text-white">v{config.policy.version}</p>
              </div>
              <div>
                <span className="text-neutral-500">Forbidden Outputs:</span>
                <p className="text-white">{config.policy.forbidden_outputs.length} rules</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// S274: CREATE MODALS REMOVED
// All creation flows are now wizard-only: /superadmin/controlplane/wizard/new
// This enforces read-only monitoring on the Control Plane main view
// =============================================================================

// =============================================================================
// AUDIT VIEWER (Read-only for ops/compliance)
// =============================================================================

interface AuditEntry {
  id: string;
  actor_user: string;
  action: string;
  target_type: string;
  target_id: string | null;
  request_json: Record<string, unknown> | null;
  result_json: Record<string, unknown> | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

function AuditViewer({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // S275-F6: Filter state
  const [actionFilter, setActionFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
  const [successFilter, setSuccessFilter] = useState<string>(''); // '' = all, 'true' = OK, 'false' = failed
  const [sinceHoursFilter, setSinceHoursFilter] = useState<string>(''); // '' = all, '1' = 1h, '24' = 24h
  const [filterOptions, setFilterOptions] = useState<{ actions: string[]; targetTypes: string[] }>({
    actions: [],
    targetTypes: [],
  });

  const loadAuditLog = useCallback(async (
    newOffset: number = 0,
    filters?: { action?: string; target_type?: string; success?: string; since_hours?: string }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: newOffset.toString(),
      });

      // S275-F6: Apply filters
      if (filters?.action) params.set('action', filters.action);
      if (filters?.target_type) params.set('target_type', filters.target_type);
      if (filters?.success) params.set('success', filters.success);
      if (filters?.since_hours) params.set('since_hours', filters.since_hours);

      const res = await fetch(`/api/superadmin/controlplane/audit?${params}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load audit log');
      }

      setEntries(data.data.entries);
      setTotal(data.data.total);
      setOffset(newOffset);

      // S275-F6: Store filter options for dropdowns
      if (data.data.filters) {
        setFilterOptions(data.data.filters);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // S275-F6: Load with current filters
  const currentFilters = { action: actionFilter, target_type: targetTypeFilter, success: successFilter, since_hours: sinceHoursFilter };

  useEffect(() => {
    loadAuditLog(0, currentFilters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAuditLog, actionFilter, targetTypeFilter, successFilter, sinceHoursFilter]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-medium text-white">Audit Log</h2>
              <span className="text-xs text-neutral-500">({total} entries)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAuditLog(offset, currentFilters)}
                className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* S275-F6: Filter controls */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Action Type Dropdown */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">All Actions</option>
              {filterOptions.actions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            {/* Target Type Dropdown */}
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">All Targets</option>
              {filterOptions.targetTypes.map((targetType) => (
                <option key={targetType} value={targetType}>{targetType}</option>
              ))}
            </select>

            {/* Status Toggle */}
            <div className="flex items-center gap-1 bg-neutral-800 border border-neutral-700 rounded p-0.5">
              <button
                onClick={() => setSuccessFilter('')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  successFilter === '' ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSuccessFilter('true')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  successFilter === 'true' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                OK
              </button>
              <button
                onClick={() => setSuccessFilter('false')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  successFilter === 'false' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Failed
              </button>
            </div>

            {/* Time Preset */}
            <select
              value={sinceHoursFilter}
              onChange={(e) => setSinceHoursFilter(e.target.value)}
              className="px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">All Time</option>
              <option value="1">Last 1 hour</option>
              <option value="24">Last 24 hours</option>
            </select>

            {/* Clear filters */}
            {(actionFilter || targetTypeFilter || successFilter || sinceHoursFilter) && (
              <button
                onClick={() => {
                  setActionFilter('');
                  setTargetTypeFilter('');
                  setSuccessFilter('');
                  setSinceHoursFilter('');
                }}
                className="px-2 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-red-400 text-sm">{error}</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">No audit entries yet</p>
              <p className="text-neutral-600 text-xs mt-1">
                Entries appear when control plane APIs are used
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded border ${
                    entry.success
                      ? 'bg-neutral-800/50 border-neutral-700'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                            entry.success
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {entry.success ? 'OK' : 'FAIL'}
                        </span>
                        <span className="text-xs font-medium text-white">
                          {entry.action}
                        </span>
                        <span className="text-xs text-neutral-500">
                          on {entry.target_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(entry.created_at)}
                        </span>
                        <span>by {entry.actor_user}</span>
                        {entry.target_id && (
                          <span className="font-mono">
                            {entry.target_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      {entry.error_message && (
                        <p className="mt-1 text-xs text-red-400">
                          {entry.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="p-3 border-t border-neutral-800 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-neutral-500">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
              {(actionFilter || targetTypeFilter || successFilter || sinceHoursFilter) && (
                <span className="ml-2 text-violet-400">(filtered)</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAuditLog(Math.max(0, offset - limit), currentFilters)}
                disabled={offset === 0}
                className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => loadAuditLog(offset + limit, currentFilters)}
                disabled={offset + limit >= total}
                className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// S274: EDIT VERTICAL MODAL REMOVED
// All editing is now wizard-only: /superadmin/controlplane/wizard/new
// =============================================================================

// =============================================================================
// WORKSPACE BINDINGS VIEWER (Read-only)
// =============================================================================

interface WorkspaceBindingRow {
  id: string;
  tenant_id: string;
  workspace_id: string;
  vertical_key: string;
  vertical_name: string;
  vertical_is_active: boolean;
  sub_vertical_key: string;
  sub_vertical_name: string;
  persona_key: string;
  persona_name: string;
  is_active: boolean;
  has_warnings: boolean;
  warnings: string[];
  updated_at: string;
}

// S275-F4: Accept onViewConfig callback for row hover action
function WorkspaceBindingsViewer({
  onClose,
  onViewConfig,
}: {
  onClose: () => void;
  onViewConfig?: (tenantId: string, workspaceId: string) => void;
}) {
  const [bindings, setBindings] = useState<WorkspaceBindingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [summary, setSummary] = useState<{
    total_bindings: number;
    active_bindings: number;
    bindings_with_warnings: number;
  } | null>(null);
  // S275-F5: Unified search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 20;

  // S275-F5: Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadBindings = useCallback(async (newOffset: number = 0, search: string = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: newOffset.toString(),
      });
      if (search.trim()) {
        params.set('search', search.trim());
      }

      const res = await fetch(`/api/superadmin/controlplane/bindings?${params}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load bindings');
      }

      setBindings(data.data.bindings);
      setTotal(data.data.pagination.total);
      setOffset(newOffset);
      setSummary(data.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // S275-F5: Reload when search changes
  useEffect(() => {
    loadBindings(0, debouncedSearch);
  }, [loadBindings, debouncedSearch]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-5xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-medium text-white">Workspace Bindings</h2>
                <span className="text-xs text-neutral-500">({total} total)</span>
              </div>
              <p className="text-[10px] text-neutral-600 mt-0.5">
                Read-only view of tenant/workspace configurations
              </p>
            </div>
            <div className="flex items-center gap-3">
              {summary && (
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-emerald-400">
                    {summary.active_bindings} active
                  </span>
                  {summary.bindings_with_warnings > 0 && (
                    <span className="text-amber-400">
                      {summary.bindings_with_warnings} with warnings
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => loadBindings(offset, debouncedSearch)}
                className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* S275-F5: Unified search input */}
          <div className="mt-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tenant, workspace, vertical, sub-vertical, or persona..."
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-red-400 text-sm p-8">{error}</div>
          ) : bindings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">No workspace bindings</p>
              <p className="text-neutral-600 text-xs mt-1">
                Bindings are created via the wizard
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-neutral-800/50 sticky top-0">
                <tr className="text-left text-neutral-500">
                  <th className="px-4 py-2 font-medium">Tenant</th>
                  <th className="px-4 py-2 font-medium">Workspace</th>
                  <th className="px-4 py-2 font-medium">Vertical</th>
                  <th className="px-4 py-2 font-medium">Sub-Vertical</th>
                  <th className="px-4 py-2 font-medium">Persona</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Updated</th>
                  {/* S275-F4: Action column */}
                  <th className="px-4 py-2 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {bindings.map((binding) => (
                  <tr
                    key={binding.id}
                    className={`group hover:bg-neutral-800/30 ${
                      binding.has_warnings ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-neutral-300">
                        {binding.tenant_id.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-neutral-300">
                        {binding.workspace_id.substring(0, 12)}...
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div>
                        <span className="text-white">{binding.vertical_name}</span>
                        <span className="text-neutral-600 ml-1">({binding.vertical_key})</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-neutral-300">{binding.sub_vertical_name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-neutral-300">{binding.persona_name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 text-[10px] rounded ${
                            binding.is_active
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-neutral-700 text-neutral-400'
                          }`}
                        >
                          {binding.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {binding.has_warnings && (
                          <span title={binding.warnings.join(', ')}>
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">
                      {new Date(binding.updated_at).toLocaleDateString()}
                    </td>
                    {/* S275-F4: Hover action - View Runtime Config */}
                    <td className="px-4 py-2.5">
                      {onViewConfig && (
                        <button
                          onClick={() => onViewConfig(binding.tenant_id, binding.workspace_id)}
                          className="p-1.5 text-neutral-600 hover:text-violet-400 hover:bg-violet-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="View Runtime Config"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="p-3 border-t border-neutral-800 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-neutral-500">
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
              {debouncedSearch && <span className="ml-2 text-violet-400">(filtered)</span>}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadBindings(Math.max(0, offset - limit), debouncedSearch)}
                disabled={offset === 0}
                className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => loadBindings(offset + limit, debouncedSearch)}
                disabled={offset + limit >= total}
                className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
