/**
 * UPR OS Client
 *
 * This is the ONLY way to interact with the OS from the SaaS layer.
 * All calls go through ${UPR_OS_BASE_URL}/api/os/*
 *
 * NO direct imports from OS repo allowed.
 * NO shared code symlinks.
 * API consumption ONLY.
 *
 * SECURITY (VS1):
 * - Uses x-pr-os-token header for authentication
 * - NEVER trusts client-sent tenant_id - must be injected from session
 * - All calls are audit logged
 *
 * RESILIENCE (VS6):
 * - Circuit breaker pattern for fault tolerance
 * - Retry with exponential backoff
 * - Fallback responses when OS unavailable
 *
 * Authorization Code: VS1-VS9-APPROVED-20251213
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { GoogleAuth } from 'google-auth-library';
import {
  CircuitBreaker,
  CircuitState,
  retryWithBackoff,
  isRetryableError,
} from './circuit-breaker';

const OS_BASE_URL = process.env.UPR_OS_BASE_URL || 'http://localhost:8080';
// VS1: Use PR_OS_TOKEN for SaaS→OS authentication (replaces UPR_OS_API_KEY)
const PR_OS_TOKEN = process.env.PR_OS_TOKEN || process.env.UPR_OS_API_KEY || '';

// Initialize Google Auth for OIDC token generation
const auth = new GoogleAuth();

interface OSClientConfig {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
}

interface DiscoveryRequest {
  tenant_id: string;
  region_code: string;
  vertical_id: string;
  config?: Record<string, unknown>;
}

interface EnrichRequest {
  tenant_id: string;
  entity_ids: string[];
  enrichment_sources?: string[];
}

/**
 * Score Request - aligned with OS /api/os/score contract
 *
 * OS expects: entity_type, entity_id/entity_data, score_types, signals, options
 */
interface ScoreRequest {
  tenant_id: string;
  // Entity identification
  entity_type?: 'company' | 'individual';
  entity_id?: string;
  entity_data?: {
    id?: string;
    name?: string;
    domain?: string;
    industry?: string;
    size_range?: string;
    locations?: string[];
    linkedin_url?: string;
  };
  // Signals for scoring
  signals?: Array<{
    type: string;
    source: string;
    evidence?: string;
    confidence?: number;
  }>;
  // Score configuration
  score_types?: ('q_score' | 't_score' | 'l_score' | 'e_score' | 'composite')[];
  options?: {
    include_breakdown?: boolean;
    include_explanation?: boolean;
    profile?: string;
  };
  // Legacy fields (for backward compatibility - transformed internally)
  entity_ids?: string[];
  region_code?: string;
  vertical_id?: string;
}

interface RankRequest {
  tenant_id: string;
  entity_ids: string[];
  ranking_algorithm?: string;
}

/**
 * Outreach Request - aligned with OS /api/os/outreach contract
 *
 * OS expects: leads array, options object
 */
interface OutreachRequest {
  tenant_id: string;
  // Lead data (primary format)
  leads?: Array<{
    id: string;
    name: string;
    designation?: string;
    company?: string;
    industry?: string;
    email?: string;
    linkedin?: string;
  }>;
  // Outreach options
  options?: {
    channel?: 'email' | 'linkedin' | 'call';
    tone?: 'formal' | 'friendly' | 'direct';
    template_id?: string;
    personalization_level?: 'low' | 'medium' | 'high';
    profile?: string;
    context?: Record<string, unknown>;
  };
  // Score data for personalization
  score?: {
    qtle?: {
      quality?: { score: number; band?: string };
      timing?: { score: number; band?: string };
      likelihood?: { score: number; band?: string };
      effort?: { score: number; band?: string };
    };
    total?: { score: number; band?: string };
    flags?: string[];
  };
  // Legacy fields (for backward compatibility)
  entity_ids?: string[];
  channel_preference?: string[];
}

interface PipelineRequest {
  tenant_id: string;
  region_code: string;
  vertical_id: string;
  config?: Record<string, unknown>;
}

interface OSResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Get OIDC identity token for service-to-service auth
 * Uses GCP metadata server in Cloud Run, falls back to ADC locally
 */
async function getIdToken(targetAudience: string): Promise<string | null> {
  // Skip OIDC in local dev
  if (process.env.NODE_ENV !== 'production') {
    console.log('[OS Client] Skipping OIDC in development mode');
    return null;
  }

  try {
    const client = await auth.getIdTokenClient(targetAudience);
    const headers = await client.getRequestHeaders();
    const token = headers.Authorization?.replace('Bearer ', '');
    return token || null;
  } catch (error) {
    console.error('[OS Client] Failed to get OIDC token:', error);
    return null;
  }
}

/**
 * Request context for tenant isolation
 * VS5: Passed to OS for RLS enforcement
 */
interface RequestContext {
  tenantId: string;
  userId?: string;
  requestId?: string;
}

class OSClient {
  private client: AxiosInstance;
  private targetAudience: string;
  private currentContext: RequestContext | null = null;

  // VS6: Circuit breakers for different operation types
  private circuitBreakers: {
    score: CircuitBreaker;
    discovery: CircuitBreaker;
    outreach: CircuitBreaker;
    general: CircuitBreaker;
  };

  /**
   * Set the tenant context for subsequent requests
   * VS5: This context is passed to OS in headers for RLS enforcement
   */
  setContext(context: RequestContext): void {
    this.currentContext = context;
  }

  /**
   * Clear the tenant context
   */
  clearContext(): void {
    this.currentContext = null;
  }

  /**
   * Get headers with tenant context
   * VS5: These headers are used by OS to set RLS context
   */
  private getContextHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.currentContext) {
      headers['x-tenant-id'] = this.currentContext.tenantId;
      if (this.currentContext.userId) {
        headers['x-user-id'] = this.currentContext.userId;
      }
      if (this.currentContext.requestId) {
        headers['x-request-id'] = this.currentContext.requestId;
      }
    }
    return headers;
  }

  /**
   * VS6: Get circuit breaker stats for monitoring
   */
  getCircuitBreakerStats() {
    return {
      score: this.circuitBreakers.score.getStats(),
      discovery: this.circuitBreakers.discovery.getStats(),
      outreach: this.circuitBreakers.outreach.getStats(),
      general: this.circuitBreakers.general.getStats(),
    };
  }

  /**
   * VS6: Reset all circuit breakers (admin operation)
   */
  resetCircuitBreakers(): void {
    Object.values(this.circuitBreakers).forEach((cb) => cb.reset());
  }

  constructor(config: OSClientConfig = {}) {
    const baseURL = config.baseURL || OS_BASE_URL;
    this.targetAudience = baseURL; // Cloud Run expects the service URL as audience

    // VS6: Initialize circuit breakers with different thresholds per operation
    this.circuitBreakers = {
      score: new CircuitBreaker({
        name: 'os-score',
        failureThreshold: 5,
        resetTimeout: 30000,
        successThreshold: 2,
        requestTimeout: 15000, // Score operations can be slow with AI
      }),
      discovery: new CircuitBreaker({
        name: 'os-discovery',
        failureThreshold: 3, // Discovery is critical, trip faster
        resetTimeout: 60000, // Longer reset for external API calls
        successThreshold: 2,
        requestTimeout: 30000, // Discovery may involve external APIs
      }),
      outreach: new CircuitBreaker({
        name: 'os-outreach',
        failureThreshold: 5,
        resetTimeout: 30000,
        successThreshold: 2,
        requestTimeout: 20000, // AI outreach can be slow
      }),
      general: new CircuitBreaker({
        name: 'os-general',
        failureThreshold: 5,
        resetTimeout: 30000,
        successThreshold: 2,
        requestTimeout: 10000,
      }),
    };

    this.client = axios.create({
      baseURL: `${baseURL}/api/os`,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        // VS1: Use x-pr-os-token for OS authentication (secure SaaS→OS boundary)
        'x-pr-os-token': config.apiKey || PR_OS_TOKEN,
        'X-Client': 'premiumradar-saas',
      },
    });

    // Request interceptor to add OIDC token
    this.client.interceptors.request.use(
      async (requestConfig: InternalAxiosRequestConfig) => {
        const token = await getIdToken(this.targetAudience);
        if (token) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }
        return requestConfig;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[OS Client] Error:', error.message);
        if (error.response?.status === 401) {
          console.error('[OS Client] Authentication failed - check OIDC token');
        }
        if (error.response?.status === 403) {
          console.error('[OS Client] Authorization denied - check IAM bindings');
        }
        throw error;
      }
    );
  }

  /**
   * Health check - verify OS is reachable
   */
  async health(): Promise<OSResponse> {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Diagnostics - get OS system info
   */
  async diagnostics(): Promise<OSResponse> {
    const response = await this.client.get('/__diag');
    return response.data;
  }

  /**
   * Discovery - find leads from configured sources
   * VS6: Protected by circuit breaker with retry and fallback
   */
  async discovery(request: DiscoveryRequest): Promise<OSResponse> {
    // VS6: Execute with circuit breaker + retry + fallback
    return this.circuitBreakers.discovery.execute(
      async () => {
        return retryWithBackoff(
          async () => {
            const response = await this.client.post('/discovery', request, {
              headers: this.getContextHeaders(),
            });
            return response.data;
          },
          { maxRetries: 2, shouldRetry: isRetryableError }
        );
      },
      // Fallback: Return empty discovery response
      () => this.getFallbackDiscoveryResponse(request)
    );
  }

  /**
   * VS6: Fallback discovery response when OS is unavailable
   */
  private getFallbackDiscoveryResponse(request: DiscoveryRequest): OSResponse {
    console.warn('[OS Client] Using fallback discovery response - OS unavailable');
    return {
      success: true,
      data: {
        companies: [],
        signals: [],
        total: 0,
        region: request.region_code,
        vertical: request.vertical_id,
        fallback: true,
        message: 'Discovery temporarily unavailable - please try again later',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Enrich - add data to discovered entities
   */
  async enrich(request: EnrichRequest): Promise<OSResponse> {
    const response = await this.client.post('/enrich', request);
    return response.data;
  }

  /**
   * Score - calculate Q/T/L/E scores with region modifiers
   * VS6: Protected by circuit breaker with retry and fallback
   *
   * Transforms SaaS request format to OS contract:
   * - entity_ids[0] → entity_id
   * - region_code + vertical_id → options.profile
   */
  async score(request: ScoreRequest): Promise<OSResponse> {
    // Transform request to OS format
    const osPayload: Record<string, unknown> = {
      entity_type: request.entity_type || 'company',
      score_types: request.score_types || ['composite'],
      signals: request.signals || [],
      options: {
        include_breakdown: true,
        include_explanation: true,
        profile: this.mapToProfile(request.vertical_id, request.region_code),
        ...request.options,
      },
    };

    // Entity identification
    if (request.entity_id) {
      osPayload.entity_id = request.entity_id;
    } else if (request.entity_data) {
      osPayload.entity_data = request.entity_data;
    } else if (request.entity_ids && request.entity_ids.length > 0) {
      // Legacy: use first entity_id
      osPayload.entity_id = request.entity_ids[0];
    }

    // VS6: Execute with circuit breaker + retry + fallback
    return this.circuitBreakers.score.execute(
      async () => {
        return retryWithBackoff(
          async () => {
            const response = await this.client.post('/score', osPayload, {
              headers: this.getContextHeaders(),
            });
            return response.data;
          },
          { maxRetries: 2, shouldRetry: isRetryableError }
        );
      },
      // Fallback: Return minimal score response when OS is unavailable
      () => this.getFallbackScoreResponse(request)
    );
  }

  /**
   * VS6: Fallback score response when OS is unavailable
   */
  private getFallbackScoreResponse(request: ScoreRequest): OSResponse {
    console.warn('[OS Client] Using fallback score response - OS unavailable');
    return {
      success: true,
      data: {
        entity_id: request.entity_id || request.entity_ids?.[0] || null,
        entity_type: request.entity_type || 'company',
        scores: {
          q_score: { value: 50, rating: 'FAIR', breakdown: {} },
          t_score: { value: 50, category: 'FAIR', breakdown: {} },
          l_score: { value: 50, tier: 'COOL', breakdown: {} },
          e_score: { value: 50, strength: 'FAIR', breakdown: {} },
          composite: { value: 50, tier: 'COOL', grade: 'C' },
        },
        explanations: {
          composite: 'Score calculated using fallback values - OS temporarily unavailable',
        },
        scoring_profile: request.options?.profile || 'default',
        fallback: true,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Map vertical/region to OS profile
   */
  private mapToProfile(verticalId?: string, regionCode?: string): string {
    // Map vertical_id to OS profile
    const profileMap: Record<string, string> = {
      'banking': 'banking_employee',
      'employee-banking': 'banking_employee',
      'corporate-banking': 'banking_corporate',
      'insurance': 'insurance_individual',
      'recruitment': 'recruitment_hiring',
      'saas': 'saas_b2b',
    };

    return profileMap[verticalId || ''] || 'default';
  }

  /**
   * Rank - prioritize scored entities
   */
  async rank(request: RankRequest): Promise<OSResponse> {
    const response = await this.client.post('/rank', request);
    return response.data;
  }

  /**
   * Outreach - generate contact sequences
   * VS6: Protected by circuit breaker with retry and fallback
   *
   * Transforms SaaS request format to OS contract:
   * - leads array with full lead data
   * - options with channel, tone, profile
   */
  async outreach(request: OutreachRequest): Promise<OSResponse> {
    // Build OS payload
    const osPayload: Record<string, unknown> = {
      leads: request.leads || [],
      options: {
        channel: request.options?.channel || this.mapChannelPreference(request.channel_preference),
        tone: request.options?.tone || 'friendly',
        personalization_level: request.options?.personalization_level || 'medium',
        profile: request.options?.profile || 'default',
        context: request.options?.context || {},
      },
    };

    // If only entity_ids provided (legacy), create minimal lead objects
    if ((!request.leads || request.leads.length === 0) && request.entity_ids && request.entity_ids.length > 0) {
      osPayload.leads = request.entity_ids.map((id, index) => ({
        id,
        name: `Contact ${index + 1}`, // Placeholder - should be enriched
        company: 'Unknown',
      }));
    }

    // VS6: Execute with circuit breaker + retry + fallback
    return this.circuitBreakers.outreach.execute(
      async () => {
        return retryWithBackoff(
          async () => {
            const response = await this.client.post('/outreach', osPayload, {
              headers: this.getContextHeaders(),
            });
            return response.data;
          },
          { maxRetries: 2, shouldRetry: isRetryableError }
        );
      },
      // Fallback: Return placeholder outreach when OS is unavailable
      () => this.getFallbackOutreachResponse(request)
    );
  }

  /**
   * VS6: Fallback outreach response when OS is unavailable
   */
  private getFallbackOutreachResponse(request: OutreachRequest): OSResponse {
    console.warn('[OS Client] Using fallback outreach response - OS unavailable');
    const leads = request.leads || [];
    return {
      success: true,
      data: {
        outreach_items: leads.map((lead) => ({
          lead_id: lead.id,
          lead_name: lead.name,
          channel: request.options?.channel || 'email',
          status: 'fallback',
          message: {
            subject: `Following up on your business needs`,
            body: `Dear ${lead.name},\n\nI wanted to reach out regarding potential collaboration opportunities.\n\nOur outreach system is temporarily in fallback mode. A personalized message will be generated shortly.\n\nBest regards`,
          },
          fallback: true,
        })),
        total: leads.length,
        fallback: true,
        message: 'Outreach temporarily unavailable - using fallback templates',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Map channel preference array to single channel
   */
  private mapChannelPreference(preferences?: string[]): string {
    if (!preferences || preferences.length === 0) return 'email';
    const pref = preferences[0].toLowerCase();
    if (pref.includes('linkedin')) return 'linkedin';
    if (pref.includes('call') || pref.includes('phone')) return 'call';
    return 'email';
  }

  /**
   * Pipeline - execute full OS pipeline
   * discovery → enrich → score → rank → outreach
   * VS6: Protected by general circuit breaker (orchestrates multiple operations)
   */
  async pipeline(request: PipelineRequest): Promise<OSResponse> {
    // VS6: Execute with circuit breaker + retry + fallback
    return this.circuitBreakers.general.execute(
      async () => {
        return retryWithBackoff(
          async () => {
            const response = await this.client.post('/pipeline', request, {
              headers: this.getContextHeaders(),
            });
            return response.data;
          },
          { maxRetries: 1, shouldRetry: isRetryableError } // Fewer retries for long pipeline
        );
      },
      // Fallback: Return empty pipeline response
      () => this.getFallbackPipelineResponse(request)
    );
  }

  /**
   * VS6: Fallback pipeline response when OS is unavailable
   */
  private getFallbackPipelineResponse(request: PipelineRequest): OSResponse {
    console.warn('[OS Client] Using fallback pipeline response - OS unavailable');
    return {
      success: true,
      data: {
        pipeline_id: `fallback-${Date.now()}`,
        status: 'fallback',
        stages: {
          discovery: { status: 'skipped', companies: [] },
          enrich: { status: 'skipped', enriched: [] },
          score: { status: 'skipped', scores: [] },
          rank: { status: 'skipped', ranked: [] },
          outreach: { status: 'skipped', messages: [] },
        },
        region: request.region_code,
        vertical: request.vertical_id,
        fallback: true,
        message: 'Pipeline temporarily unavailable - please try again later',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const osClient = new OSClient();

// Factory for custom configurations (e.g., testing)
export function createOSClient(config: OSClientConfig): OSClient {
  return new OSClient(config);
}

export type {
  OSClientConfig,
  DiscoveryRequest,
  EnrichRequest,
  ScoreRequest,
  RankRequest,
  OutreachRequest,
  PipelineRequest,
  OSResponse,
};
