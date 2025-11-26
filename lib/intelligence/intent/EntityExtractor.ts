/**
 * Entity Extractor - S43
 *
 * Extracts structured entities from natural language queries.
 * Identifies companies, sectors, regions, signals, metrics, etc.
 */

import type {
  EntityType,
  ExtractedEntity,
  EntityExtractionResult,
} from './types';

// =============================================================================
// Entity Dictionaries
// =============================================================================

/**
 * Known company names (UAE banking focus)
 */
const KNOWN_COMPANIES: string[] = [
  // UAE Banks
  'Emirates NBD', 'ENBD', 'First Abu Dhabi Bank', 'FAB', 'ADCB',
  'Abu Dhabi Commercial Bank', 'Mashreq', 'Mashreq Bank', 'Dubai Islamic Bank',
  'DIB', 'Emirates Islamic', 'RAK Bank', 'RAKBANK', 'CBD', 'Commercial Bank of Dubai',
  'Sharjah Islamic Bank', 'SIB', 'National Bank of Fujairah', 'NBF',
  'United Arab Bank', 'UAB', 'Ajman Bank', 'Bank of Sharjah',
  // International banks in UAE
  'HSBC', 'Citibank', 'Standard Chartered', 'Barclays', 'BNP Paribas',
  // Fintech
  'Careem', 'Souqalmal', 'Beehive', 'Tabby', 'Tamara', 'Postpay', 'Sarwa',
  'YAP', 'Liv', 'Mashreq Neo', 'CBD Now', 'wio bank', 'Wio',
  // Insurance
  'ADNIC', 'Oman Insurance', 'Dubai Insurance', 'Sukoon', 'Orient Insurance',
];

/**
 * Industry sectors
 */
const SECTORS: Record<string, string[]> = {
  banking: ['bank', 'banking', 'financial services', 'retail banking', 'corporate banking', 'investment banking'],
  fintech: ['fintech', 'financial technology', 'neobank', 'digital bank', 'payment', 'payments'],
  insurance: ['insurance', 'insurer', 'reinsurance', 'insurtech'],
  'real estate': ['real estate', 'property', 'properties', 'realty', 'proptech'],
  consulting: ['consulting', 'consultancy', 'advisory', 'professional services'],
  technology: ['technology', 'tech', 'software', 'saas', 'it services'],
  healthcare: ['healthcare', 'health', 'medical', 'pharma', 'pharmaceutical'],
  retail: ['retail', 'e-commerce', 'ecommerce', 'consumer goods'],
  energy: ['energy', 'oil', 'gas', 'renewable', 'utilities'],
  telecom: ['telecom', 'telecommunications', 'mobile', 'carrier'],
};

/**
 * Geographic regions
 */
const REGIONS: Record<string, string[]> = {
  UAE: ['uae', 'united arab emirates', 'emirates'],
  Dubai: ['dubai'],
  'Abu Dhabi': ['abu dhabi', 'abudhabi', 'ad'],
  Sharjah: ['sharjah'],
  GCC: ['gcc', 'gulf', 'gulf states'],
  'Saudi Arabia': ['saudi', 'saudi arabia', 'ksa'],
  Qatar: ['qatar', 'doha'],
  Kuwait: ['kuwait'],
  Bahrain: ['bahrain'],
  Oman: ['oman', 'muscat'],
  MENA: ['mena', 'middle east', 'north africa'],
  Global: ['global', 'worldwide', 'international'],
};

/**
 * Business signals
 */
const SIGNALS: string[] = [
  'digital transformation', 'cloud migration', 'ai adoption', 'automation',
  'expansion', 'growth', 'hiring', 'new office', 'funding', 'acquisition',
  'partnership', 'product launch', 'leadership change', 'ipo', 'merger',
  'restructuring', 'cost cutting', 'layoffs', 'innovation', 'sustainability',
  'esg', 'regulatory', 'compliance', 'modernization', 'upgrade',
];

/**
 * Comparison operators
 */
const COMPARISONS: Record<string, string> = {
  'more than': 'gt',
  'greater than': 'gt',
  'over': 'gt',
  'above': 'gt',
  'less than': 'lt',
  'under': 'lt',
  'below': 'lt',
  'at least': 'gte',
  'minimum': 'gte',
  'at most': 'lte',
  'maximum': 'lte',
  'equal to': 'eq',
  'exactly': 'eq',
  'between': 'between',
};

// =============================================================================
// Entity Extraction Functions
// =============================================================================

/**
 * Extract all entities from a query
 */
export function extractEntities(query: string): EntityExtractionResult {
  const entities: ExtractedEntity[] = [];
  const lowerQuery = query.toLowerCase();

  // Extract companies
  const companies = extractCompanies(query, lowerQuery);
  entities.push(...companies);

  // Extract sectors
  const sectors = extractSectors(lowerQuery);
  entities.push(...sectors);

  // Extract regions
  const regions = extractRegions(lowerQuery);
  entities.push(...regions);

  // Extract signals
  const signals = extractSignals(lowerQuery);
  entities.push(...signals);

  // Extract metrics
  const metrics = extractMetrics(query);
  entities.push(...metrics);

  // Extract dates/timeframes
  const dates = extractDates(lowerQuery);
  entities.push(...dates);

  // Extract counts
  const counts = extractCounts(lowerQuery);
  entities.push(...counts);

  return {
    entities,
    companies: companies.map((e) => e.normalizedValue),
    sectors: sectors.map((e) => e.normalizedValue),
    regions: regions.map((e) => e.normalizedValue),
    signals: signals.map((e) => e.normalizedValue),
    metrics: aggregateMetrics(metrics),
    timeframe: dates.length > 0 ? dates[0].normalizedValue : undefined,
  };
}

/**
 * Extract company names
 */
function extractCompanies(query: string, lowerQuery: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  for (const company of KNOWN_COMPANIES) {
    const lowerCompany = company.toLowerCase();
    const index = lowerQuery.indexOf(lowerCompany);

    if (index !== -1) {
      entities.push({
        type: 'company',
        value: query.substring(index, index + company.length),
        normalizedValue: normalizeCompanyName(company),
        confidence: 0.95,
        span: [index, index + company.length],
      });
    }
  }

  // Also try to extract capitalized words that might be company names
  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match;
  while ((match = capitalizedPattern.exec(query)) !== null) {
    const potentialCompany = match[1];
    // Skip if already found or if it's a common word
    if (
      !entities.some((e) => e.value.toLowerCase() === potentialCompany.toLowerCase()) &&
      !isCommonWord(potentialCompany)
    ) {
      entities.push({
        type: 'company',
        value: potentialCompany,
        normalizedValue: potentialCompany,
        confidence: 0.6,
        span: [match.index, match.index + potentialCompany.length],
      });
    }
  }

  return entities;
}

/**
 * Extract sectors/industries
 */
function extractSectors(lowerQuery: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  for (const [sector, keywords] of Object.entries(SECTORS)) {
    for (const keyword of keywords) {
      const index = lowerQuery.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          type: 'sector',
          value: keyword,
          normalizedValue: sector,
          confidence: 0.9,
          span: [index, index + keyword.length],
        });
        break; // Only add sector once
      }
    }
  }

  return entities;
}

/**
 * Extract regions
 */
function extractRegions(lowerQuery: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  for (const [region, keywords] of Object.entries(REGIONS)) {
    for (const keyword of keywords) {
      const index = lowerQuery.indexOf(keyword);
      if (index !== -1) {
        entities.push({
          type: 'region',
          value: keyword,
          normalizedValue: region,
          confidence: 0.9,
          span: [index, index + keyword.length],
        });
        break;
      }
    }
  }

  return entities;
}

/**
 * Extract business signals
 */
function extractSignals(lowerQuery: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  for (const signal of SIGNALS) {
    const index = lowerQuery.indexOf(signal);
    if (index !== -1) {
      entities.push({
        type: 'signal',
        value: signal,
        normalizedValue: signal,
        confidence: 0.85,
        span: [index, index + signal.length],
      });
    }
  }

  return entities;
}

/**
 * Extract numeric metrics
 */
function extractMetrics(query: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  // Pattern: "more than 500 employees"
  const metricPatterns = [
    /(?:more than|over|above|greater than|at least|minimum)\s+(\d+(?:,\d{3})*(?:\.\d+)?)\s*(employees?|people|staff|revenue|million|billion|m|b|k)?/gi,
    /(?:less than|under|below|at most|maximum)\s+(\d+(?:,\d{3})*(?:\.\d+)?)\s*(employees?|people|staff|revenue|million|billion|m|b|k)?/gi,
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*\+?\s*(employees?|people|staff)?/gi,
    /(?:top|best)\s+(\d+)/gi,
  ];

  for (const pattern of metricPatterns) {
    let match;
    while ((match = pattern.exec(query)) !== null) {
      const value = match[1].replace(/,/g, '');
      const unit = match[2] || 'count';

      entities.push({
        type: 'metric',
        value: match[0],
        normalizedValue: value,
        confidence: 0.9,
        span: [match.index, match.index + match[0].length],
        metadata: { unit, numericValue: parseFloat(value) },
      });
    }
  }

  return entities;
}

/**
 * Extract dates/timeframes
 */
function extractDates(lowerQuery: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  const datePatterns: Record<string, RegExp> = {
    'this year': /this\s+year/i,
    'last year': /last\s+year/i,
    'this month': /this\s+month/i,
    'last month': /last\s+month/i,
    'this quarter': /this\s+quarter/i,
    'last quarter': /last\s+quarter/i,
    'recent': /recent(?:ly)?/i,
    'past week': /(?:past|last)\s+week/i,
    'past month': /past\s+(?:\d+\s+)?months?/i,
    '2024': /202[0-9]/i,
    '2025': /202[0-9]/i,
  };

  for (const [timeframe, pattern] of Object.entries(datePatterns)) {
    const match = pattern.exec(lowerQuery);
    if (match) {
      entities.push({
        type: 'date',
        value: match[0],
        normalizedValue: timeframe,
        confidence: 0.85,
        span: [match.index, match.index + match[0].length],
      });
    }
  }

  return entities;
}

/**
 * Extract counts (top N, first N, etc.)
 */
function extractCounts(lowerQuery: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];

  const countPatterns = [
    /(?:top|first|best)\s+(\d+)/i,
    /(\d+)\s+(?:companies|prospects|results)/i,
  ];

  for (const pattern of countPatterns) {
    const match = pattern.exec(lowerQuery);
    if (match) {
      entities.push({
        type: 'count',
        value: match[0],
        normalizedValue: match[1],
        confidence: 0.9,
        span: [match.index, match.index + match[0].length],
      });
    }
  }

  return entities;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize company name to canonical form
 */
function normalizeCompanyName(name: string): string {
  const mappings: Record<string, string> = {
    'enbd': 'Emirates NBD',
    'fab': 'First Abu Dhabi Bank',
    'adcb': 'Abu Dhabi Commercial Bank',
    'dib': 'Dubai Islamic Bank',
    'rakbank': 'RAK Bank',
    'sib': 'Sharjah Islamic Bank',
    'nbf': 'National Bank of Fujairah',
    'uab': 'United Arab Bank',
    'cbd': 'Commercial Bank of Dubai',
    'wio': 'wio bank',
  };

  const lower = name.toLowerCase();
  return mappings[lower] || name;
}

/**
 * Check if a word is a common English word (not a company name)
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'The', 'Find', 'Search', 'Show', 'Get', 'List', 'Companies', 'Company',
    'Bank', 'Banks', 'About', 'With', 'From', 'That', 'This', 'What', 'Which',
    'Email', 'Message', 'Draft', 'Write', 'Score', 'Rank', 'Top', 'Best',
    'More', 'Than', 'Less', 'Over', 'Under', 'Above', 'Below',
  ]);
  return commonWords.has(word);
}

/**
 * Aggregate metrics into a key-value map
 */
function aggregateMetrics(metrics: ExtractedEntity[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const metric of metrics) {
    if (metric.metadata?.numericValue !== undefined) {
      const key = (metric.metadata.unit as string) || 'count';
      result[key] = metric.metadata.numericValue as number;
    }
  }

  return result;
}

/**
 * Get the primary company from entities
 */
export function getPrimaryCompany(entities: EntityExtractionResult): string | undefined {
  return entities.companies[0];
}

/**
 * Get the primary sector from entities
 */
export function getPrimarySector(entities: EntityExtractionResult): string | undefined {
  return entities.sectors[0];
}

/**
 * Get the primary region from entities
 */
export function getPrimaryRegion(entities: EntityExtractionResult): string | undefined {
  return entities.regions[0];
}
