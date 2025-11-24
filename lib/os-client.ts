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

interface ScoreRequest {
  tenant_id: string;
  entity_ids: string[];
  region_code: string;
  vertical_id?: string;
}

interface RankRequest {
  tenant_id: string;
  entity_ids: string[];
  ranking_algorithm?: string;
}

interface OutreachRequest {
  tenant_id: string;
  entity_ids: string[];
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
   */
  async score(request: ScoreRequest): Promise<OSResponse> {
    const response = await this.client.post('/score', request);
    return response.data;
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
   */
  async outreach(request: OutreachRequest): Promise<OSResponse> {
    const response = await this.client.post('/outreach', request);
    return response.data;
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
