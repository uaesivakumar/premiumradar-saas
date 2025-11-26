/**
 * Query Normalizer - S43
 *
 * Transforms natural language queries into structured, normalized requests.
 * "find good companies UAE" → structured parameters
 */

import type {
  IntentType,
  NormalizedQuery,
  QueryParameters,
  QueryFilter,
  EntityExtractionResult,
} from './types';
import type { IntentClassification } from './types';

// =============================================================================
// Query Normalization
// =============================================================================

/**
 * Normalize a query with intent and entity context
 */
export function normalizeQuery(
  query: string,
  intent: IntentClassification,
  entities: EntityExtractionResult
): NormalizedQuery {
  const tokens = tokenize(query);
  const parameters = buildParameters(intent, entities, tokens);
  const normalized = buildNormalizedString(intent, parameters);

  return {
    original: query,
    normalized,
    intent: intent.primary.type,
    parameters,
    tokens,
  };
}

/**
 * Tokenize query into meaningful tokens
 */
function tokenize(query: string): string[] {
  // Remove punctuation, split on whitespace
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Build structured parameters from intent and entities
 */
function buildParameters(
  intent: IntentClassification,
  entities: EntityExtractionResult,
  tokens: string[]
): QueryParameters {
  const params: QueryParameters = {};

  // Add companies if found
  if (entities.companies.length > 0) {
    params.companies = entities.companies;
  }

  // Add sectors if found
  if (entities.sectors.length > 0) {
    params.sectors = entities.sectors;
  }

  // Add regions if found
  if (entities.regions.length > 0) {
    params.regions = entities.regions;
  }

  // Build filters from metrics
  params.filters = buildFilters(entities, tokens);

  // Extract sorting preferences
  const sortInfo = extractSortInfo(tokens);
  if (sortInfo) {
    params.sortBy = sortInfo.field;
    params.sortOrder = sortInfo.order;
  }

  // Extract limit
  const limit = extractLimit(entities, tokens);
  if (limit) {
    params.limit = limit;
  }

  // Extract comparison entities for ranking.compare
  if (intent.primary.type === 'ranking.compare') {
    params.compareEntities = extractComparisonEntities(entities);
  }

  // Determine output format preference
  params.outputFormat = inferOutputFormat(intent, entities);

  return params;
}

/**
 * Build filters from entities and tokens
 */
function buildFilters(
  entities: EntityExtractionResult,
  tokens: string[]
): QueryFilter[] {
  const filters: QueryFilter[] = [];

  // Add sector filters
  for (const sector of entities.sectors) {
    filters.push({
      field: 'sector',
      operator: 'eq',
      value: sector,
    });
  }

  // Add region filters
  for (const region of entities.regions) {
    filters.push({
      field: 'region',
      operator: 'eq',
      value: region,
    });
  }

  // Add signal filters
  for (const signal of entities.signals) {
    filters.push({
      field: 'signals',
      operator: 'contains',
      value: signal,
    });
  }

  // Add metric-based filters
  for (const [key, value] of Object.entries(entities.metrics)) {
    if (key === 'employees' || key === 'people' || key === 'staff') {
      // Determine operator from context
      const operator = inferOperator(tokens, value);
      filters.push({
        field: 'employeeCount',
        operator,
        value,
      });
    } else if (key === 'revenue' || key === 'million' || key === 'billion') {
      const operator = inferOperator(tokens, value);
      filters.push({
        field: 'revenue',
        operator,
        value,
      });
    }
  }

  return filters;
}

/**
 * Infer comparison operator from tokens
 */
function inferOperator(tokens: string[], value: number): 'gt' | 'lt' | 'gte' | 'lte' | 'eq' {
  const joined = tokens.join(' ');

  if (/more than|greater than|over|above/.test(joined)) {
    return 'gt';
  }
  if (/less than|under|below/.test(joined)) {
    return 'lt';
  }
  if (/at least|minimum/.test(joined)) {
    return 'gte';
  }
  if (/at most|maximum/.test(joined)) {
    return 'lte';
  }
  if (/exactly|equal/.test(joined)) {
    return 'eq';
  }

  // Default to gte for positive filters
  return 'gte';
}

/**
 * Extract sorting information
 */
function extractSortInfo(
  tokens: string[]
): { field: string; order: 'asc' | 'desc' } | null {
  const joined = tokens.join(' ');

  // Q/T/L/E score sorting
  if (/(?:by|sort)\s+(?:q\s+)?score/i.test(joined)) {
    return { field: 'qScore', order: 'desc' };
  }
  if (/(?:by|sort)\s+t\s+score/i.test(joined)) {
    return { field: 'tScore', order: 'desc' };
  }
  if (/(?:by|sort)\s+l\s+score/i.test(joined)) {
    return { field: 'lScore', order: 'desc' };
  }
  if (/(?:by|sort)\s+e\s+score/i.test(joined)) {
    return { field: 'eScore', order: 'desc' };
  }

  // Size/revenue sorting
  if (/(?:by|sort)\s+(?:size|employees)/i.test(joined)) {
    return { field: 'employeeCount', order: 'desc' };
  }
  if (/(?:by|sort)\s+revenue/i.test(joined)) {
    return { field: 'revenue', order: 'desc' };
  }

  // Best/top implies descending score
  if (/best|top|highest/i.test(joined)) {
    return { field: 'overallScore', order: 'desc' };
  }

  return null;
}

/**
 * Extract limit from entities or tokens
 */
function extractLimit(
  entities: EntityExtractionResult,
  tokens: string[]
): number | undefined {
  // Check for explicit count entity
  const countEntity = entities.entities.find((e) => e.type === 'count');
  if (countEntity) {
    return parseInt(countEntity.normalizedValue, 10);
  }

  // Check for "top N" pattern in tokens
  const joined = tokens.join(' ');
  const topMatch = joined.match(/top\s+(\d+)/i);
  if (topMatch) {
    return parseInt(topMatch[1], 10);
  }

  return undefined;
}

/**
 * Extract entities for comparison
 */
function extractComparisonEntities(entities: EntityExtractionResult): string[] {
  return entities.companies.slice(0, 2); // First two companies for comparison
}

/**
 * Infer preferred output format
 */
function inferOutputFormat(
  intent: IntentClassification,
  entities: EntityExtractionResult
): 'list' | 'table' | 'detailed' | 'summary' {
  const intentType = intent.primary.type;

  // Single company → detailed view
  if (entities.companies.length === 1 && intentType.startsWith('enrichment')) {
    return 'detailed';
  }

  // Comparison → table
  if (intentType === 'ranking.compare') {
    return 'table';
  }

  // Discovery with filters → list
  if (intentType.startsWith('discovery')) {
    return 'list';
  }

  // Ranking → table
  if (intentType.startsWith('ranking')) {
    return 'table';
  }

  // Default to summary
  return 'summary';
}

/**
 * Build a normalized human-readable string
 */
function buildNormalizedString(
  intent: IntentClassification,
  params: QueryParameters
): string {
  const parts: string[] = [];

  // Action based on intent
  const action = getActionVerb(intent.primary.type);
  parts.push(action);

  // Target entities
  if (params.companies && params.companies.length > 0) {
    parts.push(params.companies.join(', '));
  } else if (params.sectors && params.sectors.length > 0) {
    parts.push(`${params.sectors.join(', ')} companies`);
  } else {
    parts.push('companies');
  }

  // Region
  if (params.regions && params.regions.length > 0) {
    parts.push(`in ${params.regions.join(', ')}`);
  }

  // Filters
  if (params.filters && params.filters.length > 0) {
    const filterDesc = params.filters
      .filter((f) => f.field !== 'sector' && f.field !== 'region')
      .map((f) => `${f.field} ${f.operator} ${f.value}`)
      .join(', ');
    if (filterDesc) {
      parts.push(`with ${filterDesc}`);
    }
  }

  // Limit
  if (params.limit) {
    parts.push(`(top ${params.limit})`);
  }

  // Sorting
  if (params.sortBy) {
    parts.push(`sorted by ${params.sortBy} ${params.sortOrder}`);
  }

  return parts.join(' ');
}

/**
 * Get action verb for intent type
 */
function getActionVerb(intentType: IntentType): string {
  const verbMap: Partial<Record<IntentType, string>> = {
    'discovery.search': 'Find',
    'discovery.filter': 'Filter',
    'discovery.explore': 'Explore',
    'discovery.signal': 'Find (with signals)',
    'discovery.similar': 'Find similar to',
    'ranking.score': 'Score',
    'ranking.compare': 'Compare',
    'ranking.prioritize': 'Prioritize',
    'ranking.explain': 'Explain score for',
    'ranking.filter_top': 'Show top',
    'outreach.email': 'Draft email for',
    'outreach.linkedin': 'Draft LinkedIn message for',
    'outreach.call_script': 'Create call script for',
    'outreach.followup': 'Draft follow-up for',
    'outreach.personalize': 'Personalize message for',
    'enrichment.company': 'Get profile for',
    'enrichment.contact': 'Find contacts at',
    'enrichment.tech_stack': 'Get tech stack for',
    'enrichment.news': 'Get news for',
    'compound.discovery_ranking': 'Find and rank',
    'compound.ranking_outreach': 'Rank and draft for',
    'compound.full_pipeline': 'Full pipeline for',
    'meta.help': 'Help with',
    'meta.demo': 'Demo',
    'meta.settings': 'Configure',
    'meta.status': 'Status of',
    'meta.unknown': 'Process',
  };

  return verbMap[intentType] || 'Process';
}

/**
 * Check if query needs context resolution (has pronouns)
 */
export function needsContextResolution(query: string): boolean {
  const pronounPatterns = [
    /\b(it|them|they|this|that|these|those)\b/i,
    /\bthe company\b/i,
    /\bthe same\b/i,
    /\bprevious\b/i,
  ];

  return pronounPatterns.some((p) => p.test(query));
}

/**
 * Get pronouns that need resolution
 */
export function getPronounsToResolve(query: string): string[] {
  const pronouns: string[] = [];
  const patterns: Record<string, RegExp> = {
    it: /\bit\b/gi,
    them: /\bthem\b/gi,
    they: /\bthey\b/gi,
    this: /\bthis\b/gi,
    that: /\bthat\b/gi,
    these: /\bthese\b/gi,
    those: /\bthose\b/gi,
    'the company': /\bthe company\b/gi,
    'the same': /\bthe same\b/gi,
  };

  for (const [pronoun, pattern] of Object.entries(patterns)) {
    if (pattern.test(query)) {
      pronouns.push(pronoun);
    }
  }

  return pronouns;
}
