/**
 * Enrichment Module
 *
 * Domain data enrichment from multiple sources.
 */

import { create } from 'zustand';
import type {
  EnrichmentSource,
  EnrichmentStatus,
  EnrichmentRequest,
  EnrichmentResult,
  EnrichmentSourceResult,
  EnrichmentJob,
} from './types';

// ============================================================
// ENRICHMENT SOURCE CONFIG
// ============================================================

export const ENRICHMENT_SOURCE_CONFIG: Record<
  EnrichmentSource,
  { label: string; icon: string; avgDuration: number; priority: number }
> = {
  whois: { label: 'WHOIS Data', icon: '📋', avgDuration: 2000, priority: 1 },
  dns: { label: 'DNS Records', icon: '🌐', avgDuration: 1500, priority: 1 },
  ssl: { label: 'SSL Certificate', icon: '🔒', avgDuration: 1000, priority: 2 },
  traffic: { label: 'Traffic Analytics', icon: '📊', avgDuration: 5000, priority: 3 },
  seo: { label: 'SEO Metrics', icon: '🔍', avgDuration: 4000, priority: 3 },
  social: { label: 'Social Signals', icon: '📱', avgDuration: 3000, priority: 4 },
  company: { label: 'Company Data', icon: '🏢', avgDuration: 4000, priority: 4 },
  market: { label: 'Market Data', icon: '💹', avgDuration: 6000, priority: 5 },
};

// ============================================================
// ENRICHMENT STORE
// ============================================================

interface EnrichmentStore {
  jobs: Map<string, EnrichmentJob>;
  results: Map<string, EnrichmentResult>;
  isProcessing: boolean;
  error: string | null;

  createJob: (requests: EnrichmentRequest[]) => Promise<EnrichmentJob>;
  getJob: (jobId: string) => EnrichmentJob | undefined;
  getResult: (domainId: string) => EnrichmentResult | undefined;
  cancelJob: (jobId: string) => void;
  clearResults: () => void;
}

export const useEnrichmentStore = create<EnrichmentStore>((set, get) => ({
  jobs: new Map(),
  results: new Map(),
  isProcessing: false,
  error: null,

  createJob: async (requests) => {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const job: EnrichmentJob = {
      id: jobId,
      requests,
      status: 'pending',
      progress: 0,
      completedCount: 0,
      totalCount: requests.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      jobs: new Map(state.jobs).set(jobId, job),
      isProcessing: true,
    }));

    // Process job in background
    processEnrichmentJob(jobId, requests, (update) => {
      set((state) => {
        const jobs = new Map(state.jobs);
        const currentJob = jobs.get(jobId);
        if (currentJob) {
          jobs.set(jobId, { ...currentJob, ...update, updatedAt: new Date() });
        }
        return { jobs };
      });
    }).then((results) => {
      set((state) => {
        const resultMap = new Map(state.results);
        for (const result of results) {
          resultMap.set(result.domainId, result);
        }
        return { results: resultMap, isProcessing: false };
      });
    });

    return job;
  },

  getJob: (jobId) => {
    return get().jobs.get(jobId);
  },

  getResult: (domainId) => {
    return get().results.get(domainId);
  },

  cancelJob: (jobId) => {
    set((state) => {
      const jobs = new Map(state.jobs);
      const job = jobs.get(jobId);
      if (job && job.status !== 'completed') {
        jobs.set(jobId, { ...job, status: 'failed', updatedAt: new Date() });
      }
      return { jobs, isProcessing: false };
    });
  },

  clearResults: () => {
    set({ results: new Map() });
  },
}));

// ============================================================
// ENRICHMENT PROCESSING
// ============================================================

async function processEnrichmentJob(
  jobId: string,
  requests: EnrichmentRequest[],
  onProgress: (update: Partial<EnrichmentJob>) => void
): Promise<EnrichmentResult[]> {
  onProgress({ status: 'processing' });

  const results: EnrichmentResult[] = [];
  let completedCount = 0;

  for (const request of requests) {
    const result = await enrichDomain(request);
    results.push(result);

    completedCount++;
    const progress = Math.round((completedCount / requests.length) * 100);

    onProgress({
      progress,
      completedCount,
      status: completedCount === requests.length ? 'completed' : 'processing',
    });
  }

  return results;
}

/**
 * Enrich a single domain
 */
export async function enrichDomain(request: EnrichmentRequest): Promise<EnrichmentResult> {
  const startTime = Date.now();
  const sourceResults: EnrichmentSourceResult[] = [];

  // Sort sources by priority
  const sortedSources = [...request.sources].sort(
    (a, b) => ENRICHMENT_SOURCE_CONFIG[a].priority - ENRICHMENT_SOURCE_CONFIG[b].priority
  );

  for (const source of sortedSources) {
    const sourceResult = await enrichFromSource(request.domain, source);
    sourceResults.push(sourceResult);
  }

  const hasFailures = sourceResults.some((r) => r.status === 'failed');
  const allFailed = sourceResults.every((r) => r.status === 'failed');

  return {
    domainId: request.domainId,
    domain: request.domain,
    status: allFailed ? 'failed' : hasFailures ? 'partial' : 'completed',
    sources: sourceResults,
    startedAt: new Date(startTime),
    completedAt: new Date(),
    duration: Date.now() - startTime,
  };
}

/**
 * Enrich from a specific source
 */
async function enrichFromSource(
  domain: string,
  source: EnrichmentSource
): Promise<EnrichmentSourceResult> {
  const startTime = Date.now();
  const config = ENRICHMENT_SOURCE_CONFIG[source];

  // Simulate API call with variable delay
  const delay = config.avgDuration * (0.5 + Math.random());
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Simulate occasional failures (5% chance)
  if (Math.random() < 0.05) {
    return {
      source,
      status: 'failed',
      data: {},
      error: `Failed to fetch ${config.label}`,
      duration: Date.now() - startTime,
    };
  }

  return {
    source,
    status: 'completed',
    data: generateMockSourceData(domain, source),
    duration: Date.now() - startTime,
  };
}

// ============================================================
// ENRICHMENT HELPERS
// ============================================================

/**
 * Get recommended sources for a domain
 */
export function getRecommendedSources(domain: string): EnrichmentSource[] {
  // Basic sources always recommended
  const sources: EnrichmentSource[] = ['whois', 'dns', 'ssl'];

  // Add traffic/SEO for established domains
  if (!domain.includes('-') && domain.length <= 15) {
    sources.push('traffic', 'seo');
  }

  // Add company data for .com domains
  if (domain.endsWith('.com')) {
    sources.push('company');
  }

  return sources;
}

/**
 * Estimate enrichment time
 */
export function estimateEnrichmentTime(sources: EnrichmentSource[]): number {
  return sources.reduce((total, source) => {
    return total + ENRICHMENT_SOURCE_CONFIG[source].avgDuration;
  }, 0);
}

/**
 * Get source status color
 */
export function getSourceStatusColor(status: EnrichmentStatus): string {
  const colors: Record<EnrichmentStatus, string> = {
    pending: 'gray',
    processing: 'blue',
    completed: 'green',
    failed: 'red',
    partial: 'yellow',
  };
  return colors[status];
}

/**
 * Calculate enrichment completeness
 */
export function calculateEnrichmentCompleteness(result: EnrichmentResult): number {
  if (result.sources.length === 0) return 0;

  const completedCount = result.sources.filter((s) => s.status === 'completed').length;
  return Math.round((completedCount / result.sources.length) * 100);
}

/**
 * Merge enrichment results
 */
export function mergeEnrichmentData(
  existing: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...existing,
    ...newData,
    _enrichedAt: new Date().toISOString(),
    _sources: [
      ...((existing._sources as string[]) || []),
      ...((newData._sources as string[]) || []),
    ],
  };
}

// ============================================================
// MOCK DATA GENERATORS
// ============================================================

function generateMockSourceData(
  domain: string,
  source: EnrichmentSource
): Record<string, unknown> {
  switch (source) {
    case 'whois':
      return {
        registrar: 'GoDaddy.com, LLC',
        createdDate: '2015-03-15',
        expiresDate: '2025-03-15',
        updatedDate: '2024-01-20',
        nameServers: ['ns1.example.com', 'ns2.example.com'],
        registrantCountry: 'US',
        status: ['clientTransferProhibited'],
      };

    case 'dns':
      return {
        a: ['192.0.2.1'],
        aaaa: ['2001:db8::1'],
        mx: [{ priority: 10, host: 'mail.example.com' }],
        txt: ['v=spf1 include:_spf.google.com ~all'],
        ns: ['ns1.example.com', 'ns2.example.com'],
        cname: null,
      };

    case 'ssl':
      return {
        valid: true,
        issuer: "Let's Encrypt",
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        subject: domain,
        keySize: 2048,
        protocol: 'TLS 1.3',
      };

    case 'traffic':
      return {
        monthlyVisits: Math.floor(Math.random() * 500000) + 10000,
        bounceRate: 0.3 + Math.random() * 0.4,
        avgVisitDuration: 60 + Math.floor(Math.random() * 240),
        pagesPerVisit: 2 + Math.random() * 4,
        trafficSources: {
          direct: 0.3,
          search: 0.4,
          referral: 0.2,
          social: 0.1,
        },
      };

    case 'seo':
      return {
        domainAuthority: 30 + Math.floor(Math.random() * 50),
        pageAuthority: 25 + Math.floor(Math.random() * 50),
        backlinks: Math.floor(Math.random() * 50000),
        referringDomains: Math.floor(Math.random() * 1000),
        organicKeywords: Math.floor(Math.random() * 5000),
        spamScore: Math.floor(Math.random() * 20),
      };

    case 'social':
      return {
        twitter: {
          followers: Math.floor(Math.random() * 10000),
          mentions: Math.floor(Math.random() * 500),
        },
        linkedin: {
          followers: Math.floor(Math.random() * 5000),
          employees: Math.floor(Math.random() * 200),
        },
        facebook: {
          likes: Math.floor(Math.random() * 20000),
        },
      };

    case 'company':
      return {
        name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
        industry: 'Technology',
        employees: '51-200',
        founded: 2015 + Math.floor(Math.random() * 8),
        funding: '$' + (Math.floor(Math.random() * 50) + 1) + 'M',
        headquarters: 'San Francisco, CA',
      };

    case 'market':
      return {
        estimatedValue: Math.floor(Math.random() * 100000) + 5000,
        comparableSales: [
          { domain: 'similar1.com', price: 25000, date: '2024-01-15' },
          { domain: 'similar2.com', price: 35000, date: '2023-11-20' },
        ],
        marketTrend: Math.random() > 0.5 ? 'up' : 'stable',
        liquidityScore: 50 + Math.floor(Math.random() * 40),
      };

    default:
      return {};
  }
}
