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

/**
 * Discovery Region - granular geography from Control Plane
 * State is optional; when present, it MUST be enforced
 */
export interface DiscoveryRegion {
  country: string;
  state?: string;
  city?: string;
}

/**
 * Lead Location - extracted from Apollo contact response
 */
export interface LeadLocation {
  city?: string;
  state?: string;
  country?: string;
}

/**
 * Lead Context - decision artifact for geographic relevance
 * This is the architectural contract between Discovery and Enrichment
 */
export interface LeadContext {
  discovery_region: DiscoveryRegion;
  lead_location: LeadLocation;
  relevance: {
    in_region: boolean;
    match_level: 'state' | 'country' | 'none';
    reason: string;
  };
  actionable: boolean;
  query_granularity: 'state' | 'country'; // What was actually sent to Apollo
}

/**
 * Apollo contact enriched with Lead Context
 */
export interface ApolloContactWithContext {
  contact: ApolloContact;
  lead_context: LeadContext;
}

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
 *
 * LEAD CONTEXT (S396): discoveryRegion is MANDATORY to prevent credit waste.
 * Discovery finds UAE companies, but Apollo returns GLOBAL contacts by default.
 * We filter at query time using person_locations to avoid fetching irrelevant leads.
 */
export async function searchContacts(params: {
  organizationId?: string;
  organizationName?: string;
  discoveryRegion: string; // MANDATORY: e.g., 'United Arab Emirates', 'UAE', 'India'
  titles?: string[];
  seniorities?: string[];
  page?: number;
  perPage?: number;
}): Promise<ApolloContact[]> {
  // Normalize region to Apollo format
  const normalizedRegion = normalizeRegionForApollo(params.discoveryRegion);

  // Build the request body with proper company AND geography filtering
  const requestBody: Record<string, unknown> = {
    person_titles: params.titles || ['HR Director', 'Chief People Officer', 'VP Human Resources', 'Head of HR', 'HR Manager', 'Finance Director', 'CFO'],
    person_seniorities: params.seniorities || ['director', 'vp', 'c_suite', 'owner', 'partner'],
    // LEAD CONTEXT: Filter contacts by discovery region at query time (zero credit waste)
    person_locations: [normalizedRegion],
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
    discoveryRegion: params.discoveryRegion,
    normalizedRegion,
    titles: requestBody.person_titles,
  });

  const response = await apolloRequest<{
    people?: ApolloContact[];
    pagination?: { total_entries: number };
  }>('/people/search', 'POST', requestBody, 'people_search');

  console.log('[Apollo] searchContacts found:', response.people?.length || 0, 'contacts in', normalizedRegion);

  return response.people || [];
}

/**
 * Normalize region names to Apollo's expected format
 * Apollo uses full country names, not abbreviations
 */
function normalizeCountryForApollo(country: string): string {
  const countryMap: Record<string, string> = {
    // Common abbreviations
    'uae': 'United Arab Emirates',
    'UAE': 'United Arab Emirates',
    'usa': 'United States',
    'USA': 'United States',
    'us': 'United States',
    'US': 'United States',
    'uk': 'United Kingdom',
    'UK': 'United Kingdom',
    // Full names pass through
    'United Arab Emirates': 'United Arab Emirates',
    'United States': 'United States',
    'United Kingdom': 'United Kingdom',
    'India': 'India',
    'Singapore': 'Singapore',
    'Saudi Arabia': 'Saudi Arabia',
    'Qatar': 'Qatar',
    'Bahrain': 'Bahrain',
    'Kuwait': 'Kuwait',
    'Oman': 'Oman',
  };

  return countryMap[country] || country; // Pass through if not found
}

/**
 * Build Apollo person_locations filter with maximum granularity
 *
 * ARCHITECTURAL RULE: If state exists in discovery region, it MUST be enforced.
 * Apollo supports "State, Country" format (e.g., "Maharashtra, India")
 *
 * @returns { locationFilter: string, granularity: 'state' | 'country' }
 */
function buildApolloLocationFilter(region: DiscoveryRegion): {
  locationFilter: string;
  granularity: 'state' | 'country';
} {
  const normalizedCountry = normalizeCountryForApollo(region.country);

  if (region.state) {
    // STATE-LEVEL ENFORCEMENT: Use "State, Country" format
    const locationFilter = `${region.state}, ${normalizedCountry}`;
    console.log('[LeadContext] Using STATE-level filter:', locationFilter);
    return { locationFilter, granularity: 'state' };
  }

  // COUNTRY-LEVEL FALLBACK: Only when state is not specified
  console.log('[LeadContext] Using COUNTRY-level filter (no state specified):', normalizedCountry);
  return { locationFilter: normalizedCountry, granularity: 'country' };
}

/**
 * Evaluate Lead Context - determine if a lead is geographically relevant
 *
 * This is the DECISION ARTIFACT that proves whether a lead matches the discovery region.
 * Without this, geographic relevance is coincidental, not enforced.
 *
 * @param discoveryRegion - The region from the sub-vertical/discovery
 * @param leadLocation - The location from Apollo contact response
 * @param queryGranularity - What granularity was used in the Apollo query
 */
export function evaluateLeadContext(
  discoveryRegion: DiscoveryRegion,
  leadLocation: LeadLocation,
  queryGranularity: 'state' | 'country'
): LeadContext {
  const normalizedDiscoveryCountry = normalizeCountryForApollo(discoveryRegion.country).toLowerCase();
  const leadCountry = (leadLocation.country || '').toLowerCase();
  const leadState = (leadLocation.state || '').toLowerCase();
  const discoveryState = (discoveryRegion.state || '').toLowerCase();

  // Check country match
  const countryMatches = leadCountry.includes(normalizedDiscoveryCountry.toLowerCase()) ||
                         normalizedDiscoveryCountry.toLowerCase().includes(leadCountry);

  // Check state match (only if discovery has state specified)
  const stateMatches = discoveryState
    ? leadState.includes(discoveryState) || discoveryState.includes(leadState)
    : true; // If no state in discovery, don't check

  // Determine match level and in_region status
  let in_region = false;
  let match_level: 'state' | 'country' | 'none' = 'none';
  let reason = '';

  if (!countryMatches) {
    in_region = false;
    match_level = 'none';
    reason = `Lead in ${leadLocation.country || 'unknown'}, discovery region is ${discoveryRegion.country}`;
  } else if (discoveryRegion.state && !stateMatches) {
    // Country matches but state doesn't - this is a FAILURE when state is specified
    in_region = false;
    match_level = 'country';
    reason = `Lead in ${leadLocation.state || leadLocation.country}, discovery region requires ${discoveryRegion.state}`;
  } else if (discoveryRegion.state && stateMatches) {
    // State matches - full compliance
    in_region = true;
    match_level = 'state';
    reason = `Lead in ${discoveryRegion.state}, ${discoveryRegion.country} - matches discovery region`;
  } else {
    // No state in discovery, country matches - acceptable
    in_region = true;
    match_level = 'country';
    reason = `Lead in ${discoveryRegion.country} - matches discovery country (no state constraint)`;
  }

  const leadContext: LeadContext = {
    discovery_region: discoveryRegion,
    lead_location: leadLocation,
    relevance: {
      in_region,
      match_level,
      reason,
    },
    actionable: in_region,
    query_granularity: queryGranularity,
  };

  // Log the decision artifact
  console.log('[LeadContext] Evaluation:', JSON.stringify(leadContext, null, 2));

  return leadContext;
}

// Legacy function for backward compatibility
function normalizeRegionForApollo(region: string): string {
  return normalizeCountryForApollo(region);
}

/**
 * Search for HR decision makers at employers
 *
 * LEAD CONTEXT (S396): discoveryRegion is MANDATORY.
 * Filters contacts to the same region where the company was discovered.
 * This prevents credit waste from fetching geographically irrelevant contacts.
 *
 * @param companyName - Company name to search contacts for
 * @param discoveryRegion - Region where company was discovered (e.g., 'UAE', 'India')
 */
export async function searchHRContacts(
  companyName: string,
  discoveryRegion: string
): Promise<ApolloContact[]> {
  return searchContacts({
    organizationName: companyName,
    discoveryRegion, // MANDATORY: pass discovery region to filter contacts
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

// =============================================================================
// LEAD CONTEXT SEARCH (STATE-LEVEL ENFORCEMENT)
// =============================================================================

/**
 * Search for contacts WITH Lead Context evaluation
 *
 * ARCHITECTURAL REQUIREMENT: This function enforces state-level geography
 * when the discovery region includes a state. It produces decision artifacts
 * for every lead, making geographic relevance auditable.
 *
 * @param params.organizationName - Company name to search
 * @param params.discoveryRegion - Full discovery region with country + optional state
 * @param params.titles - Job titles to search for
 * @param params.seniorities - Seniority levels
 * @param params.perPage - Results per page
 *
 * @returns Object with actionable leads, rejected leads, and query metadata
 */
export async function searchContactsWithContext(params: {
  organizationId?: string;
  organizationName?: string;
  discoveryRegion: DiscoveryRegion; // MANDATORY: structured region with state
  titles?: string[];
  seniorities?: string[];
  page?: number;
  perPage?: number;
}): Promise<{
  actionable: ApolloContactWithContext[];
  rejected: ApolloContactWithContext[];
  query_metadata: {
    location_filter: string;
    granularity: 'state' | 'country';
    total_returned: number;
    actionable_count: number;
    rejected_count: number;
  };
}> {
  // Build location filter with maximum granularity
  const { locationFilter, granularity } = buildApolloLocationFilter(params.discoveryRegion);

  console.log('[LeadContext] === SEARCH WITH CONTEXT ===');
  console.log('[LeadContext] Discovery Region:', JSON.stringify(params.discoveryRegion));
  console.log('[LeadContext] Apollo Filter:', locationFilter);
  console.log('[LeadContext] Granularity:', granularity);

  // Build the request body with state-level filtering
  const requestBody: Record<string, unknown> = {
    person_titles: params.titles || ['Finance Manager', 'HR Director'],
    person_seniorities: params.seniorities || ['manager', 'senior', 'director'],
    // STATE-LEVEL ENFORCEMENT: Use the granular location filter
    person_locations: [locationFilter],
    page: params.page || 1,
    per_page: params.perPage || 15,
  };

  // Add company filter
  if (params.organizationId) {
    requestBody.organization_ids = [params.organizationId];
  } else if (params.organizationName) {
    requestBody.q_organization_name = params.organizationName;
  }

  console.log('[LeadContext] Apollo Request:', JSON.stringify(requestBody, null, 2));

  const response = await apolloRequest<{
    people?: ApolloContact[];
    pagination?: { total_entries: number };
  }>('/people/search', 'POST', requestBody, 'people_search_with_context');

  const contacts = response.people || [];
  console.log('[LeadContext] Apollo returned:', contacts.length, 'contacts');

  // Evaluate Lead Context for EVERY contact
  const actionable: ApolloContactWithContext[] = [];
  const rejected: ApolloContactWithContext[] = [];

  for (const contact of contacts) {
    // Extract lead location from contact's organization
    const leadLocation: LeadLocation = {
      city: contact.organization?.city,
      state: contact.organization?.state,
      country: contact.organization?.country,
    };

    // Evaluate Lead Context (this is the decision artifact)
    const leadContext = evaluateLeadContext(
      params.discoveryRegion,
      leadLocation,
      granularity
    );

    const contactWithContext: ApolloContactWithContext = {
      contact,
      lead_context: leadContext,
    };

    if (leadContext.actionable) {
      actionable.push(contactWithContext);
    } else {
      rejected.push(contactWithContext);
    }
  }

  console.log('[LeadContext] === RESULTS SUMMARY ===');
  console.log('[LeadContext] Total:', contacts.length);
  console.log('[LeadContext] Actionable:', actionable.length);
  console.log('[LeadContext] Rejected:', rejected.length);

  return {
    actionable,
    rejected,
    query_metadata: {
      location_filter: locationFilter,
      granularity,
      total_returned: contacts.length,
      actionable_count: actionable.length,
      rejected_count: rejected.length,
    },
  };
}
