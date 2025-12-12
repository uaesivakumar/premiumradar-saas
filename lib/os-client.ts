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
 * SECURITY: Uses GCP OIDC tokens for authentication (zero-trust model)
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { GoogleAuth } from 'google-auth-library';

const OS_BASE_URL = process.env.UPR_OS_BASE_URL || 'http://localhost:8080';
const OS_API_KEY = process.env.UPR_OS_API_KEY || '';

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

class OSClient {
  private client: AxiosInstance;
  private targetAudience: string;

  constructor(config: OSClientConfig = {}) {
    const baseURL = config.baseURL || OS_BASE_URL;
    this.targetAudience = baseURL; // Cloud Run expects the service URL as audience

    this.client = axios.create({
      baseURL: `${baseURL}/api/os`,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey || OS_API_KEY,
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
   */
  async discovery(request: DiscoveryRequest): Promise<OSResponse> {
    const response = await this.client.post('/discovery', request);
    return response.data;
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

    const response = await this.client.post('/score', osPayload);
    return response.data;
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

    const response = await this.client.post('/outreach', osPayload);
    return response.data;
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
   */
  async pipeline(request: PipelineRequest): Promise<OSResponse> {
    const response = await this.client.post('/pipeline', request);
    return response.data;
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
