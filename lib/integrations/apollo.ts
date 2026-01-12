/**
 * Apollo Integration Service
 *
 * Fetches REAL company data from Apollo API:
 * - Company search by location, industry
 * - Headcount and growth metrics
 * - Hiring signals
 * - Contact information
 *
 * NO MOCK DATA - ALL REAL API CALLS
 */

import { getIntegrationConfig, recordUsage, recordError } from './api-integrations';
import { logSivaMetric } from '@/lib/siva/metrics';

// =============================================================================
// TYPES
// =============================================================================

export interface ApolloCompany {
  id: string;
  name: string;
  domain?: string;
  website_url?: string;
  industry?: string;
  estimated_num_employees?: number;
  employee_count?: number;
  annual_revenue?: number;
  founded_year?: number;
  city?: string;
  state?: string;
  country?: string;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  phone?: string;
  logo_url?: string;
  description?: string;
  keywords?: string[];
  // Hiring signals
  num_open_jobs?: number;
  hiring_velocity?: number;
  // Growth metrics
  employee_count_6_months_ago?: number;
  employee_growth_6_months?: number;
}

export interface ApolloContact {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  title?: string;
  email?: string;
  linkedin_url?: string;
  phone_numbers?: { number: string; type: string }[];
  organization?: ApolloCompany;
  seniority?: string;
  departments?: string[];
}

export interface ApolloSearchParams {
  // Location filters
  organization_locations?: string[];  // e.g., ['United Arab Emirates']
  person_locations?: string[];
  // Industry filters
  organization_industry_tag_ids?: string[];
  // Size filters
  organization_num_employees_ranges?: string[];  // e.g., ['1,10', '11,20', '21,50']
  // Other filters
  q_keywords?: string;
  page?: number;
  per_page?: number;
}

export interface ApolloSearchResult {
  companies: ApolloCompany[];
  contacts: ApolloContact[];
  total: number;
  page: number;
  perPage: number;
}

// =============================================================================
// API CLIENT
// =============================================================================

const APOLLO_BASE_URL = 'https://api.apollo.io/v1';

/**
 * Make authenticated request to Apollo API
 */
async function apolloRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>,
  operation?: string
): Promise<T> {
  const startTime = Date.now();
  const config = await getIntegrationConfig('apollo');

  if (!config) {
    throw new Error('Apollo API not configured. Add API key in Super Admin → Integrations.');
  }

  const url = `${config.baseUrl || APOLLO_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': config.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      if (config.integrationId) {
        await recordError(config.integrationId, `${response.status}: ${errorText}`);
      }

      // Log failed Apollo call to SIVA metrics
      await logSivaMetric({
        provider: 'apollo',
        operation: operation || endpoint.replace(/\//g, '_').slice(1),
        integrationId: config.integrationId,
        requestType: method,
        responseTimeMs,
        success: false,
        errorCode: response.status.toString(),
        errorMessage: errorText.substring(0, 500),
        costCents: 0, // Apollo doesn't charge per call (subscription)
        requestSummary: `${method} ${endpoint}`,
      });

      throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
    }

    if (config.integrationId) {
      await recordUsage(config.integrationId);
    }

    // Log successful Apollo call to SIVA metrics
    await logSivaMetric({
      provider: 'apollo',
      operation: operation || endpoint.replace(/\//g, '_').slice(1),
      integrationId: config.integrationId,
      requestType: method,
      responseTimeMs,
      success: true,
      costCents: 0, // Apollo doesn't charge per call (subscription)
      requestSummary: `${method} ${endpoint}`,
    });

    return response.json();
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;

    // Log network/parsing errors
    if (error instanceof Error && !error.message.includes('Apollo API error')) {
      await logSivaMetric({
        provider: 'apollo',
        operation: operation || endpoint.replace(/\//g, '_').slice(1),
        integrationId: config.integrationId,
        requestType: method,
        responseTimeMs,
        success: false,
        errorMessage: error.message,
        requestSummary: `${method} ${endpoint}`,
      });
    }

    throw error;
  }
}

// =============================================================================
// COMPANY SEARCH
// =============================================================================

/**
 * Search for companies in Apollo
 * Uses /organizations/search endpoint (available on Basic plan)
 */
export async function searchCompanies(params: ApolloSearchParams): Promise<ApolloSearchResult> {
  const response = await apolloRequest<{
    organizations?: ApolloCompany[];
    pagination?: { total_entries: number; page: number; per_page: number; total_pages: number };
  }>('/organizations/search', 'POST', {
    organization_locations: params.organization_locations,
    organization_industry_tag_ids: params.organization_industry_tag_ids,
    organization_num_employees_ranges: params.organization_num_employees_ranges,
    q_organization_keyword_tags: params.q_keywords ? [params.q_keywords] : undefined,
    page: params.page || 1,
    per_page: params.per_page || 25,
  });

  const companies = response.organizations || [];

  return {
    companies,
    contacts: [],
    total: response.pagination?.total_entries || companies.length,
    page: response.pagination?.page || 1,
    perPage: response.pagination?.per_page || 25,
  };
}

/**
 * Search for UAE employers (EB-specific)
 */
export async function searchUAEEmployers(options?: {
  industries?: string[];
  minEmployees?: number;
  maxEmployees?: number;
  keywords?: string;
  page?: number;
  perPage?: number;
}): Promise<ApolloSearchResult> {
  // Build employee range filter
  const employeeRanges: string[] = [];
  if (options?.minEmployees || options?.maxEmployees) {
    const min = options.minEmployees || 1;
    const max = options.maxEmployees || 1000000;
    // Apollo uses specific ranges
    if (min >= 500) employeeRanges.push('501,1000', '1001,5000', '5001,10000', '10001,');
    else if (min >= 200) employeeRanges.push('201,500', '501,1000', '1001,5000', '5001,10000', '10001,');
    else if (min >= 50) employeeRanges.push('51,200', '201,500', '501,1000', '1001,5000', '5001,10000', '10001,');
    else employeeRanges.push('11,20', '21,50', '51,200', '201,500', '501,1000', '1001,5000', '5001,10000', '10001,');
  }

  return searchCompanies({
    organization_locations: ['United Arab Emirates'],
    organization_num_employees_ranges: employeeRanges.length > 0 ? employeeRanges : undefined,
    q_keywords: options?.keywords,
    page: options?.page || 1,
    per_page: options?.perPage || 25,
  });
}

// =============================================================================
// CONTACT SEARCH
// =============================================================================

/**
 * Search for contacts (HR/Finance decision makers for EB)
 * Uses /people/search endpoint (available on Basic plan)
 *
 * CRITICAL: Must pass either organizationId OR organizationName to filter by company.
 * Without these, Apollo returns contacts from ANY company!
 */
export async function searchContacts(params: {
  organizationId?: string;
  organizationName?: string;
  titles?: string[];
  seniorities?: string[];
  page?: number;
  perPage?: number;
}): Promise<ApolloContact[]> {
  // Build the request body with proper company filtering
  const requestBody: Record<string, unknown> = {
    person_titles: params.titles || ['HR Director', 'Chief People Officer', 'VP Human Resources', 'Head of HR', 'HR Manager', 'Finance Director', 'CFO'],
    person_seniorities: params.seniorities || ['director', 'vp', 'c_suite', 'owner', 'partner'],
    page: params.page || 1,
    per_page: params.perPage || 10,
  };

  // CRITICAL FIX: Use organization_ids if we have an ID, otherwise use q_organization_name
  // Without this, Apollo returns contacts from random companies!
  if (params.organizationId) {
    requestBody.organization_ids = [params.organizationId];
  } else if (params.organizationName) {
    // Use q_organization_name for fuzzy company name matching
    requestBody.q_organization_name = params.organizationName;
  }

  console.log('[Apollo] searchContacts request:', {
    organizationId: params.organizationId,
    organizationName: params.organizationName,
    titles: requestBody.person_titles,
  });

  const response = await apolloRequest<{
    people?: ApolloContact[];
    pagination?: { total_entries: number };
  }>('/people/search', 'POST', requestBody, 'people_search');

  console.log('[Apollo] searchContacts found:', response.people?.length || 0, 'contacts');

  return response.people || [];
}

/**
 * Search for HR decision makers at UAE employers
 */
export async function searchHRContacts(companyName: string): Promise<ApolloContact[]> {
  return searchContacts({
    organizationName: companyName,
    titles: [
      'HR Director',
      'Chief People Officer',
      'VP Human Resources',
      'Head of HR',
      'CHRO',
      'Chief Human Resources Officer',
      'Group HR Director',
      'SVP Human Resources',
    ],
    seniorities: ['director', 'vp', 'c_suite'],
  });
}

// =============================================================================
// ENRICHMENT
// =============================================================================

/**
 * Enrich a company with full Apollo data
 */
export async function enrichCompany(domain: string): Promise<ApolloCompany | null> {
  try {
    const response = await apolloRequest<{
      organization?: ApolloCompany;
    }>('/organizations/enrich', 'POST', {
      domain,
    });

    return response.organization || null;
  } catch (error) {
    console.error(`[Apollo] Failed to enrich ${domain}:`, error);
    return null;
  }
}

/**
 * Get hiring signals for a company
 */
export async function getHiringSignals(company: ApolloCompany): Promise<{
  isHiring: boolean;
  openJobs: number;
  hiringVelocity: number;
  employeeGrowth: number;
  growthSignal: 'high' | 'medium' | 'low' | 'none';
}> {
  const openJobs = company.num_open_jobs || 0;
  const growthPercent = company.employee_growth_6_months || 0;

  let growthSignal: 'high' | 'medium' | 'low' | 'none' = 'none';
  if (growthPercent >= 20) growthSignal = 'high';
  else if (growthPercent >= 10) growthSignal = 'medium';
  else if (growthPercent > 0) growthSignal = 'low';

  return {
    isHiring: openJobs > 0 || growthPercent > 5,
    openJobs,
    hiringVelocity: company.hiring_velocity || 0,
    employeeGrowth: growthPercent,
    growthSignal,
  };
}

// =============================================================================
// EB-SPECIFIC FUNCTIONS
// =============================================================================

/**
 * Transform Apollo company to EB employer format
 */
export function toEBEmployer(company: ApolloCompany): {
  id: string;
  name: string;
  industry: string;
  size: 'enterprise' | 'mid-market' | 'smb';
  headcount: number;
  headcountGrowth: number;
  region: string;
  city: string;
  description: string;
  website?: string;
  linkedIn?: string;
} {
  const headcount = company.estimated_num_employees || company.employee_count || 0;

  let size: 'enterprise' | 'mid-market' | 'smb' = 'smb';
  if (headcount >= 1000) size = 'enterprise';
  else if (headcount >= 200) size = 'mid-market';

  return {
    id: company.id,
    name: company.name,
    industry: company.industry || 'Unknown',
    size,
    headcount,
    headcountGrowth: company.employee_growth_6_months || 0,
    region: company.country || 'UAE',
    city: company.city || 'Dubai',
    description: company.description || `${company.name} - ${company.industry || 'Company'} in ${company.city || 'UAE'}`,
    website: company.website_url,
    linkedIn: company.linkedin_url,
  };
}
