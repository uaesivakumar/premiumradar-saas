/**
 * UPR OS API Client
 *
 * Central client for all UPR OS API calls from SaaS.
 * This replaces duplicated config management in SaaS with
 * calls to the actual OS APIs that have full CRUD, versioning,
 * and hot-reload capabilities.
 *
 * SECURITY (VS1):
 * - Uses x-pr-os-token header for authentication
 * - NEVER trusts client-sent tenant_id
 *
 * Authorization Code: VS1-VS9-APPROVED-20251213
 *
 * OS APIs exposed:
 * - /api/os/config - System configuration (S55)
 * - /api/os/llm - LLM routing (S51)
 * - /api/os/providers - API providers (S50)
 * - /api/os/verticals - Vertical packs (S52)
 * - /api/os/territories - Territory management (S53)
 */

const OS_BASE_URL = process.env.UPR_OS_URL || 'https://upr-os-service-191599223867.us-central1.run.app';
// VS1: Use PR_OS_TOKEN for SaaS→OS authentication
const PR_OS_TOKEN = process.env.PR_OS_TOKEN || process.env.UPR_OS_API_KEY || '';

// =============================================================================
// TYPES
// =============================================================================

export interface OSResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  reason?: string;
  confidence?: number;
  endpoint?: string;
  executionTimeMs?: number;
  requestId?: string;
}

export interface OSRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  timeout?: number;
}

// =============================================================================
// LLM Types
// =============================================================================

export interface LLMProvider {
  slug: string;
  name: string;
  type: string;
  models: string[];
}

export interface LLMModel {
  slug: string;
  name: string;
  provider_type: string;
  model_id: string;
  quality_score: number;
  input_cost_per_million: number;
  output_cost_per_million: number;
}

export interface LLMSelectRequest {
  task_type: string;
  vertical?: string;
  prefer_quality?: boolean;
  max_cost_per_1k?: number;
  requires_vision?: boolean;
  requires_functions?: boolean;
  requires_json?: boolean;
}

export interface LLMCompleteRequest {
  messages: Array<{ role: string; content: string }>;
  task_type?: string;
  vertical?: string;
  model?: string;
  options?: {
    temperature?: number;
    max_tokens?: number;
    use_cache?: boolean;
  };
}

export interface LLMCompletionResult {
  content: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
  cached: boolean;
  was_fallback: boolean;
}

// =============================================================================
// Provider Types
// =============================================================================

export interface APIProvider {
  id: string;
  slug: string;
  name: string;
  provider_type: string;
  base_url: string;
  status: string;
  capabilities: string[];
  default_rate_limit_per_minute: number;
  default_rate_limit_per_day: number;
  default_rate_limit_per_month: number;
  health?: {
    status: string;
    last_check: string;
  };
}

export interface ProviderConfig {
  is_enabled: boolean;
  priority: number;
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
  custom_config?: Record<string, unknown>;
}

// =============================================================================
// Vertical Types
// =============================================================================

export interface Vertical {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  features?: string[];
  config?: Record<string, unknown>;
  sub_verticals?: Vertical[];
}

export interface SignalType {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  weight: number;
  is_active: boolean;
}

export interface JourneyTemplate {
  id: string;
  slug: string;
  name: string;
  description?: string;
  journey_type: string;
  stages: unknown[];
  is_active: boolean;
}

// =============================================================================
// Territory Types
// =============================================================================

export interface Territory {
  id: string;
  slug: string;
  name: string;
  level: 'global' | 'region' | 'country' | 'city' | 'zone';
  parent_id?: string;
  country_code?: string;
  status: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Config Types
// =============================================================================

export interface ConfigNamespace {
  namespace: string;
  total: number;
  active: number;
}

export interface ConfigValue {
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

// =============================================================================
// BASE CLIENT
// =============================================================================

async function osRequest<T>(
  endpoint: string,
  options: OSRequestOptions = {}
): Promise<OSResponse<T>> {
  const { method = 'GET', body, params, headers = {}, timeout = 30000 } = options;

  // Build URL with query params
  const url = new URL(endpoint, OS_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        // VS1: Use x-pr-os-token for OS authentication (secure SaaS→OS boundary)
        'x-pr-os-token': PR_OS_TOKEN,
        'X-Request-Source': 'saas-superadmin',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
        code: data.code || 'OS_HTTP_ERROR',
      };
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout',
        code: 'OS_TIMEOUT',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'OS_REQUEST_ERROR',
    };
  }
}

// =============================================================================
// CONFIG API (S55)
// =============================================================================

export const config = {
  /**
   * Get config summary by namespace
   */
  async getSummary(): Promise<OSResponse<{ namespaces: ConfigNamespace[] }>> {
    return osRequest('/api/os/config');
  },

  /**
   * Get all configs for a namespace
   */
  async getNamespace(namespace: string): Promise<OSResponse<{ configs: ConfigValue[] }>> {
    return osRequest(`/api/os/config/${namespace}`);
  },

  /**
   * Get single config value
   */
  async get(namespace: string, key: string): Promise<OSResponse<ConfigValue>> {
    return osRequest(`/api/os/config/${namespace}/${key}`);
  },

  /**
   * Set config value
   */
  async set(
    namespace: string,
    key: string,
    value: unknown,
    options?: { description?: string; value_type?: string; updated_by?: string }
  ): Promise<OSResponse<ConfigValue>> {
    return osRequest(`/api/os/config/${namespace}/${key}`, {
      method: 'PUT',
      body: { value, ...options },
    });
  },

  /**
   * Delete config
   */
  async delete(namespace: string, key: string): Promise<OSResponse<{ deleted: boolean }>> {
    return osRequest(`/api/os/config/${namespace}/${key}`, { method: 'DELETE' });
  },

  /**
   * Get version history
   */
  async getVersions(namespace: string, key: string): Promise<OSResponse<{ versions: ConfigValue[] }>> {
    return osRequest(`/api/os/config/${namespace}/${key}/versions`);
  },

  /**
   * Rollback to version
   */
  async rollback(
    namespace: string,
    key: string,
    version: number
  ): Promise<OSResponse<ConfigValue>> {
    return osRequest(`/api/os/config/${namespace}/${key}/rollback`, {
      method: 'POST',
      body: { version },
    });
  },

  /**
   * Get presets
   */
  async getPresets(): Promise<OSResponse<{ presets: unknown[] }>> {
    return osRequest('/api/os/config/presets');
  },

  /**
   * Apply preset
   */
  async applyPreset(slug: string): Promise<OSResponse<{ applied: number }>> {
    return osRequest(`/api/os/config/presets/${slug}/apply`, { method: 'POST' });
  },

  /**
   * Hot reload configs
   */
  async reload(): Promise<OSResponse<{ reloaded: boolean }>> {
    return osRequest('/api/os/config/reload', { method: 'POST' });
  },
};

// =============================================================================
// LLM API (S51)
// =============================================================================

export const llm = {
  /**
   * Select best model for task (selectModel Runtime API)
   */
  async selectModel(request: LLMSelectRequest): Promise<OSResponse<{ model: LLMModel; selection_reason: string }>> {
    return osRequest('/api/os/llm/select', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * Execute completion with automatic model selection
   */
  async complete(request: LLMCompleteRequest): Promise<OSResponse<LLMCompletionResult>> {
    return osRequest('/api/os/llm/complete', {
      method: 'POST',
      body: request,
    });
  },

  /**
   * List all models grouped by provider
   */
  async listModels(): Promise<OSResponse<{ providers: LLMProvider[]; total_providers: number }>> {
    return osRequest('/api/os/llm/models');
  },

  /**
   * Get model details
   */
  async getModel(slug: string): Promise<OSResponse<LLMModel>> {
    return osRequest(`/api/os/llm/models/${slug}`);
  },

  /**
   * Get fallback chains
   */
  async getFallbackChains(
    taskType?: string,
    vertical?: string
  ): Promise<OSResponse<{ chain: unknown[]; total_steps: number }>> {
    return osRequest('/api/os/llm/fallback-chains', {
      params: { task_type: taskType, vertical },
    });
  },

  /**
   * Get task-to-model mappings
   */
  async getTaskMappings(): Promise<OSResponse<{ mappings: Record<string, unknown>; verticals: string[] }>> {
    return osRequest('/api/os/llm/task-mappings');
  },

  /**
   * Get cost summary
   */
  async getCosts(options?: {
    start_date?: string;
    end_date?: string;
    group_by?: string;
  }): Promise<OSResponse<{ summary: unknown[]; totals: unknown; period: unknown }>> {
    return osRequest('/api/os/llm/costs', { params: options });
  },

  /**
   * Get model benchmarks
   */
  async getBenchmarks(model?: string): Promise<OSResponse<{ benchmarks: unknown[]; total: number }>> {
    return osRequest('/api/os/llm/benchmarks', { params: { model } });
  },

  /**
   * Health check
   */
  async health(checkProviders = false): Promise<OSResponse<{ status: string; providers?: unknown }>> {
    return osRequest('/api/os/llm/health', {
      params: { check_providers: checkProviders },
    });
  },
};

// =============================================================================
// PROVIDERS API (S50)
// =============================================================================

export const providers = {
  /**
   * List all providers
   */
  async list(filters?: {
    type?: string;
    status?: string;
    capability?: string;
    vertical?: string;
    includeHealth?: boolean;
  }): Promise<OSResponse<{ providers: APIProvider[]; total: number }>> {
    return osRequest('/api/os/providers', { params: filters });
  },

  /**
   * Get provider by ID or slug
   */
  async get(idOrSlug: string): Promise<OSResponse<APIProvider>> {
    return osRequest(`/api/os/providers/${idOrSlug}`);
  },

  /**
   * Create provider
   */
  async create(provider: Partial<APIProvider>): Promise<OSResponse<APIProvider>> {
    return osRequest('/api/os/providers', {
      method: 'POST',
      body: provider,
    });
  },

  /**
   * Update provider
   */
  async update(idOrSlug: string, updates: Partial<APIProvider>): Promise<OSResponse<APIProvider>> {
    return osRequest(`/api/os/providers/${idOrSlug}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  /**
   * Delete provider
   */
  async delete(idOrSlug: string): Promise<OSResponse<{ deleted: boolean }>> {
    return osRequest(`/api/os/providers/${idOrSlug}`, { method: 'DELETE' });
  },

  /**
   * Get provider config
   */
  async getConfig(idOrSlug: string): Promise<OSResponse<{ provider: string; config: ProviderConfig }>> {
    return osRequest(`/api/os/providers/${idOrSlug}/config`);
  },

  /**
   * Set provider config
   */
  async setConfig(idOrSlug: string, config: ProviderConfig): Promise<OSResponse<ProviderConfig>> {
    return osRequest(`/api/os/providers/${idOrSlug}/config`, {
      method: 'PUT',
      body: config,
    });
  },

  /**
   * Get rate limits
   */
  async getRateLimits(idOrSlug: string): Promise<OSResponse<{ provider: string; isLimited: boolean; usage: unknown }>> {
    return osRequest(`/api/os/providers/${idOrSlug}/rate-limits`);
  },

  /**
   * Get health status
   */
  async getHealth(idOrSlug: string, includeHistory = false): Promise<OSResponse<{ status: unknown; history?: unknown }>> {
    return osRequest(`/api/os/providers/${idOrSlug}/health`, {
      params: { history: includeHistory },
    });
  },

  /**
   * Trigger health check
   */
  async checkHealth(idOrSlug: string): Promise<OSResponse<{ check: unknown; status: unknown }>> {
    return osRequest(`/api/os/providers/${idOrSlug}/health/check`, { method: 'POST' });
  },

  /**
   * Get fallback chains
   */
  async getChains(): Promise<OSResponse<{ chains: unknown[]; total: number }>> {
    return osRequest('/api/os/providers/chains');
  },

  /**
   * Get specific chain
   */
  async getChain(slugOrCapability: string, vertical?: string): Promise<OSResponse<unknown>> {
    return osRequest(`/api/os/providers/chains/${slugOrCapability}`, {
      params: { vertical },
    });
  },

  /**
   * Select providers for capability
   */
  async select(capability: string, options?: { vertical?: string; limit?: number }): Promise<OSResponse<{ providers: APIProvider[] }>> {
    return osRequest('/api/os/providers/select', {
      method: 'POST',
      body: { capability, ...options },
    });
  },

  /**
   * Get dashboard data
   */
  async dashboard(): Promise<OSResponse<{ summary: unknown; providers: APIProvider[] }>> {
    return osRequest('/api/os/providers/dashboard');
  },
};

// =============================================================================
// VERTICALS API (S52)
// =============================================================================

export const verticals = {
  /**
   * List all verticals
   */
  async list(options?: {
    include_sub?: boolean;
    active_only?: boolean;
  }): Promise<OSResponse<{ verticals: Vertical[]; total: number }>> {
    return osRequest('/api/os/verticals', { params: options });
  },

  /**
   * Get dashboard
   */
  async dashboard(): Promise<OSResponse<{ verticals: Vertical[]; summary: unknown }>> {
    return osRequest('/api/os/verticals/dashboard');
  },

  /**
   * Get vertical by slug
   */
  async get(slug: string): Promise<OSResponse<Vertical>> {
    return osRequest(`/api/os/verticals/${slug}`);
  },

  /**
   * Get complete vertical config
   */
  async getConfig(slug: string): Promise<OSResponse<unknown>> {
    return osRequest(`/api/os/verticals/${slug}/config`);
  },

  /**
   * Create vertical
   */
  async create(vertical: Partial<Vertical>): Promise<OSResponse<Vertical>> {
    return osRequest('/api/os/verticals', {
      method: 'POST',
      body: vertical,
    });
  },

  /**
   * Update vertical
   */
  async update(slug: string, updates: Partial<Vertical>): Promise<OSResponse<Vertical>> {
    return osRequest(`/api/os/verticals/${slug}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  /**
   * Delete vertical
   */
  async delete(slug: string): Promise<OSResponse<{ deleted: boolean }>> {
    return osRequest(`/api/os/verticals/${slug}`, { method: 'DELETE' });
  },

  /**
   * Clone vertical
   */
  async clone(slug: string, newSlug: string, newName: string): Promise<OSResponse<Vertical>> {
    return osRequest(`/api/os/verticals/${slug}/clone`, {
      method: 'POST',
      body: { new_slug: newSlug, new_name: newName },
    });
  },

  /**
   * Get signal types
   */
  async getSignals(slug: string): Promise<OSResponse<{ signals: SignalType[]; total: number }>> {
    return osRequest(`/api/os/verticals/${slug}/signals`);
  },

  /**
   * Create signal type
   */
  async createSignal(slug: string, signal: Partial<SignalType>): Promise<OSResponse<SignalType>> {
    return osRequest(`/api/os/verticals/${slug}/signals`, {
      method: 'POST',
      body: signal,
    });
  },

  /**
   * Get scoring templates
   */
  async getScoring(slug: string): Promise<OSResponse<{ templates: unknown[]; total: number }>> {
    return osRequest(`/api/os/verticals/${slug}/scoring`);
  },

  /**
   * Create scoring template
   */
  async createScoring(slug: string, template: unknown): Promise<OSResponse<unknown>> {
    return osRequest(`/api/os/verticals/${slug}/scoring`, {
      method: 'POST',
      body: template,
    });
  },

  /**
   * Get evidence rules
   */
  async getEvidence(slug: string): Promise<OSResponse<{ rules: unknown[]; total: number }>> {
    return osRequest(`/api/os/verticals/${slug}/evidence`);
  },

  /**
   * Get persona templates
   */
  async getPersonas(slug: string): Promise<OSResponse<{ personas: unknown[]; total: number }>> {
    return osRequest(`/api/os/verticals/${slug}/personas`);
  },

  /**
   * Get journey templates
   */
  async getJourneys(slug: string, type?: string): Promise<OSResponse<{ journeys: JourneyTemplate[]; total: number }>> {
    return osRequest(`/api/os/verticals/${slug}/journeys`, {
      params: { type },
    });
  },

  /**
   * Create journey template
   */
  async createJourney(slug: string, journey: Partial<JourneyTemplate>): Promise<OSResponse<JourneyTemplate>> {
    return osRequest(`/api/os/verticals/${slug}/journeys`, {
      method: 'POST',
      body: journey,
    });
  },

  /**
   * Get radar targets
   */
  async getRadar(slug: string): Promise<OSResponse<{ targets: unknown[]; total: number }>> {
    return osRequest(`/api/os/verticals/${slug}/radar`);
  },

  /**
   * Get version history
   */
  async getVersions(slug: string): Promise<OSResponse<{ versions: unknown[]; total: number }>> {
    return osRequest(`/api/os/verticals/${slug}/versions`);
  },
};

// =============================================================================
// TERRITORIES API (S53)
// =============================================================================

export const territories = {
  /**
   * List all territories
   */
  async list(filters?: {
    level?: string;
    status?: string;
    parentId?: string;
    countryCode?: string;
    includeInactive?: boolean;
  }): Promise<OSResponse<Territory[]>> {
    return osRequest('/api/os/territories', { params: filters });
  },

  /**
   * Get territory
   */
  async get(identifier: string, withConfig = false): Promise<OSResponse<Territory>> {
    return osRequest(`/api/os/territories/${identifier}`, {
      params: { withConfig },
    });
  },

  /**
   * Create territory
   */
  async create(territory: Partial<Territory>): Promise<OSResponse<Territory>> {
    return osRequest('/api/os/territories', {
      method: 'POST',
      body: territory,
    });
  },

  /**
   * Update territory
   */
  async update(identifier: string, updates: Partial<Territory>): Promise<OSResponse<Territory>> {
    return osRequest(`/api/os/territories/${identifier}`, {
      method: 'PATCH',
      body: updates,
    });
  },

  /**
   * Delete territory
   */
  async delete(identifier: string): Promise<OSResponse<Territory>> {
    return osRequest(`/api/os/territories/${identifier}`, { method: 'DELETE' });
  },

  /**
   * Get hierarchy
   */
  async getHierarchy(identifier: string): Promise<OSResponse<unknown>> {
    return osRequest(`/api/os/territories/${identifier}/hierarchy`);
  },

  /**
   * Get ancestors
   */
  async getAncestors(identifier: string): Promise<OSResponse<Territory[]>> {
    return osRequest(`/api/os/territories/${identifier}/ancestors`);
  },

  /**
   * Move territory
   */
  async move(identifier: string, newParentId: string): Promise<OSResponse<Territory>> {
    return osRequest(`/api/os/territories/${identifier}/move`, {
      method: 'POST',
      body: { newParentId },
    });
  },

  /**
   * Get verticals for territory
   */
  async getVerticals(identifier: string): Promise<OSResponse<unknown[]>> {
    return osRequest(`/api/os/territories/${identifier}/verticals`);
  },

  /**
   * Assign vertical to territory
   */
  async assignVertical(
    identifier: string,
    verticalSlug: string,
    options?: { configOverride?: unknown; isPrimary?: boolean; isActive?: boolean }
  ): Promise<OSResponse<unknown>> {
    return osRequest(`/api/os/territories/${identifier}/verticals`, {
      method: 'POST',
      body: { verticalSlug, ...options },
    });
  },

  /**
   * Remove vertical from territory
   */
  async removeVertical(identifier: string, verticalSlug: string): Promise<OSResponse<{ success: boolean }>> {
    return osRequest(`/api/os/territories/${identifier}/verticals/${verticalSlug}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get sub-verticals
   */
  async getSubVerticals(identifier: string, verticalSlug?: string): Promise<OSResponse<unknown[]>> {
    return osRequest(`/api/os/territories/${identifier}/sub-verticals`, {
      params: { verticalSlug },
    });
  },

  /**
   * Get assignment rules
   */
  async getRules(identifier: string): Promise<OSResponse<unknown[]>> {
    return osRequest(`/api/os/territories/${identifier}/rules`);
  },

  /**
   * Get metrics
   */
  async getMetrics(identifier: string, options?: {
    granularity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<OSResponse<unknown>> {
    return osRequest(`/api/os/territories/${identifier}/metrics`, { params: options });
  },

  /**
   * Get dashboard
   */
  async getDashboard(identifier: string): Promise<OSResponse<unknown>> {
    return osRequest(`/api/os/territories/${identifier}/dashboard`);
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(identifier: string, options?: {
    limit?: number;
    offset?: number;
    action?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OSResponse<unknown[]>> {
    return osRequest(`/api/os/territories/${identifier}/audit`, { params: options });
  },
};

// =============================================================================
// SALES-BENCH GOVERNANCE API
// =============================================================================

export interface SalesBenchSuite {
  id: string;
  suite_key: string;
  name: string;
  description?: string;
  vertical: string;
  sub_vertical: string;
  region_code: string;
  stage: 'PRE_ENTRY' | 'POST_ENTRY';
  scenario_count: number;
  is_frozen: boolean;
  frozen_at?: string;
  status?: string;
  system_validated_at?: string;
  human_validated_at?: string;
  ga_approved_at?: string;
  spearman_rho?: number;
}

export interface SalesBenchRun {
  id: string;
  run_number: number;
  run_mode: 'FULL' | 'FOUNDER' | 'QUICK';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  golden_pass_rate?: number;
  kill_containment_rate?: number;
  cohens_d?: number;
  started_at: string;
  ended_at?: string;
}

export interface GovernanceCommand {
  command: string;
  suite_key: string;
  triggered_by?: string;
  [key: string]: unknown;
}

export const salesBench = {
  /**
   * List all suites (with optional filters)
   */
  async listSuites(filters?: {
    vertical?: string;
    sub_vertical?: string;
    region?: string;
    status?: string;
    frozen_only?: boolean;
  }): Promise<OSResponse<SalesBenchSuite[]>> {
    return osRequest('/api/os/sales-bench/suites', { params: filters });
  },

  /**
   * Get suite by key
   */
  async getSuite(suiteKey: string): Promise<OSResponse<SalesBenchSuite>> {
    return osRequest(`/api/os/sales-bench/suites/${suiteKey}`);
  },

  /**
   * Get suite status
   */
  async getSuiteStatus(suiteKey: string): Promise<OSResponse<{
    status: string;
    next_action?: string;
    system_validated_at?: string;
    human_validated_at?: string;
    ga_approved_at?: string;
  }>> {
    return osRequest(`/api/os/sales-bench/suites/${suiteKey}/status`);
  },

  /**
   * Get suite run history
   */
  async getSuiteHistory(suiteKey: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<OSResponse<{ data: SalesBenchRun[]; total: number; trend?: unknown }>> {
    return osRequest(`/api/os/sales-bench/suites/${suiteKey}/history`, { params: options });
  },

  /**
   * Get suite audit trail
   */
  async getSuiteAudit(suiteKey: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<OSResponse<{ data: unknown[]; count: number }>> {
    return osRequest(`/api/os/sales-bench/suites/${suiteKey}/audit`, { params: options });
  },

  /**
   * Get governance dashboard overview
   */
  async getDashboard(): Promise<OSResponse<{
    total_suites: number;
    by_status: Record<string, number>;
    suites: SalesBenchSuite[];
  }>> {
    return osRequest('/api/os/sales-bench/suites/dashboard/overview');
  },

  /**
   * Get available governance commands
   */
  async getCommands(): Promise<OSResponse<{ commands: unknown[] }>> {
    return osRequest('/api/os/sales-bench/governance/commands');
  },

  /**
   * Get governance status
   */
  async getGovernanceStatus(): Promise<OSResponse<{
    status_summary: Record<string, number>;
    recent_runs: SalesBenchRun[];
    recent_events: unknown[];
  }>> {
    return osRequest('/api/os/sales-bench/governance/status');
  },

  /**
   * Execute governance command
   */
  async executeCommand(command: GovernanceCommand): Promise<OSResponse<unknown>> {
    return osRequest(`/api/os/sales-bench/governance/commands/${command.command}`, {
      method: 'POST',
      body: command,
    });
  },

  /**
   * Run system validation
   */
  async runSystemValidation(options: {
    suite_key: string;
    run_mode?: 'FULL' | 'FOUNDER' | 'QUICK';
    triggered_by?: string;
    environment?: string;
  }): Promise<OSResponse<{ run_id: string; run_number: number }>> {
    return osRequest('/api/os/sales-bench/governance/commands/run-system-validation', {
      method: 'POST',
      body: options,
    });
  },

  /**
   * Start human calibration with email-based evaluator invites
   */
  async startHumanCalibration(options: {
    suite_key: string;
    session_name?: string;
    evaluator_count?: number;
    evaluator_emails?: string[];
    deadline_days?: number;
    triggered_by?: string;
  }): Promise<OSResponse<{
    session_id: string;
    evaluator_count: number;
    deadline: string;
    invites: Array<{
      evaluator_id: string;
      email: string;
      token: string;
      scoring_url: string;
      scenarios_to_score: number;
      expires_at: string;
    }>;
  }>> {
    return osRequest('/api/os/sales-bench/governance/commands/start-human-calibration', {
      method: 'POST',
      body: options,
    });
  },

  /**
   * Approve suite for GA
   */
  async approveForGA(options: {
    suite_key: string;
    approved_by: string;
    approval_notes?: string;
  }): Promise<OSResponse<{ status: string }>> {
    return osRequest('/api/os/sales-bench/governance/commands/approve-for-ga', {
      method: 'POST',
      body: options,
    });
  },

  /**
   * Deprecate suite
   */
  async deprecateSuite(options: {
    suite_key: string;
    deprecated_by: string;
    deprecation_reason: string;
  }): Promise<OSResponse<{ status: string }>> {
    return osRequest('/api/os/sales-bench/governance/commands/deprecate-suite', {
      method: 'POST',
      body: options,
    });
  },
};

// =============================================================================
// EXPORT
// =============================================================================

export const osClient = {
  config,
  llm,
  providers,
  verticals,
  territories,
  salesBench,
  // Direct request for custom endpoints
  request: osRequest,
};

export default osClient;
