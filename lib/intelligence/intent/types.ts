/**
 * Intent Types - S43
 *
 * Type definitions for intent classification and entity extraction.
 */

import { AgentType } from '@/lib/stores/siva-store';

// =============================================================================
// Intent Taxonomy (20+ intents)
// =============================================================================

/**
 * Primary intent categories mapped to agents
 */
export type IntentCategory =
  | 'discovery'
  | 'ranking'
  | 'outreach'
  | 'enrichment'
  | 'compound'
  | 'meta';

/**
 * Full intent type taxonomy
 */
export type IntentType =
  // Discovery intents (find, search, explore)
  | 'discovery.search'           // "Find companies in UAE"
  | 'discovery.filter'           // "Show only banks with >1000 employees"
  | 'discovery.explore'          // "What companies are in fintech?"
  | 'discovery.signal'           // "Find companies with digital transformation signals"
  | 'discovery.similar'          // "Find companies similar to Emirates NBD"
  // Ranking intents (score, prioritize, compare)
  | 'ranking.score'              // "Score this company"
  | 'ranking.compare'            // "Compare Emirates NBD vs ADCB"
  | 'ranking.prioritize'         // "Prioritize my prospects"
  | 'ranking.explain'            // "Why did this company score high?"
  | 'ranking.filter_top'         // "Show top 10 by Q score"
  // Outreach intents (write, draft, compose)
  | 'outreach.email'             // "Write an email to..."
  | 'outreach.linkedin'          // "Draft a LinkedIn message"
  | 'outreach.call_script'       // "Create a call script"
  | 'outreach.followup'          // "Write a follow-up email"
  | 'outreach.personalize'       // "Make this more personal"
  // Enrichment intents (learn, profile, details)
  | 'enrichment.company'         // "Tell me about Emirates NBD"
  | 'enrichment.contact'         // "Find decision makers at..."
  | 'enrichment.tech_stack'      // "What tech does this company use?"
  | 'enrichment.news'            // "Latest news about..."
  // Compound intents (multi-agent workflows)
  | 'compound.discovery_ranking' // "Find and rank banks in UAE"
  | 'compound.ranking_outreach'  // "Rank prospects and draft emails for top 5"
  | 'compound.full_pipeline'     // "Find, rank, and prepare outreach for..."
  // Meta intents (help, settings, demos)
  | 'meta.help'                  // "How do I use this?"
  | 'meta.settings'              // "Change my preferences"
  | 'meta.demo'                  // "Show me a demo"
  | 'meta.status'                // "What's the status?"
  | 'meta.unknown';              // Fallback

/**
 * Intent definition with keywords and patterns
 */
export interface IntentDefinition {
  type: IntentType;
  category: IntentCategory;
  name: string;
  description: string;
  keywords: string[];
  patterns: RegExp[];
  agents: AgentType[];
  priority: number; // Higher = matched first
  examples: string[];
}

/**
 * Classified intent result
 */
export interface ClassifiedIntent {
  type: IntentType;
  category: IntentCategory;
  confidence: number;
  agents: AgentType[];
  matchedKeywords: string[];
  matchedPatterns: string[];
}

/**
 * Multi-intent classification (for compound queries)
 */
export interface IntentClassification {
  primary: ClassifiedIntent;
  secondary: ClassifiedIntent[];
  isCompound: boolean;
  allIntents: ClassifiedIntent[];
  rawQuery: string;
  processedQuery: string;
}

// =============================================================================
// Entity Types
// =============================================================================

/**
 * Entity categories that can be extracted
 */
export type EntityType =
  | 'company'        // Company names
  | 'sector'         // Industry/sector
  | 'region'         // Geographic region
  | 'signal'         // Business signals
  | 'metric'         // Numerical metrics
  | 'person'         // Person names
  | 'date'           // Dates/timeframes
  | 'count'          // Numeric counts
  | 'comparison'     // Comparison operators
  | 'attribute';     // Company attributes

/**
 * Extracted entity
 */
export interface ExtractedEntity {
  type: EntityType;
  value: string;
  normalizedValue: string;
  confidence: number;
  span: [number, number]; // Start/end positions in query
  metadata?: Record<string, unknown>;
}

/**
 * Entity extraction result
 */
export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  companies: string[];
  sectors: string[];
  regions: string[];
  signals: string[];
  metrics: Record<string, number>;
  timeframe?: string;
}

// =============================================================================
// Query Normalization Types
// =============================================================================

/**
 * Normalized query with structured parameters
 */
export interface NormalizedQuery {
  original: string;
  normalized: string;
  intent: IntentType;
  parameters: QueryParameters;
  tokens: string[];
}

/**
 * Structured query parameters
 */
export interface QueryParameters {
  // Target entities
  companies?: string[];
  sectors?: string[];
  regions?: string[];
  // Filters
  filters?: QueryFilter[];
  // Sorting/limits
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  // Comparison
  compareEntities?: string[];
  // Output preferences
  outputFormat?: 'list' | 'table' | 'detailed' | 'summary';
}

/**
 * Query filter
 */
export interface QueryFilter {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: string | number | string[];
}

// =============================================================================
// Context Memory Types
// =============================================================================

/**
 * Context memory entry for conversation history
 */
export interface ContextEntry {
  id: string;
  query: string;
  intent: IntentClassification;
  entities: EntityExtractionResult;
  timestamp: Date;
  resolved: ResolvedReferences;
  response?: ContextResponse;
}

/**
 * Resolved pronoun/reference mappings
 */
export interface ResolvedReferences {
  // "it" -> "Emirates NBD"
  // "them" -> ["ADCB", "FAB"]
  pronouns: Record<string, string | string[]>;
  // "the company" -> "Emirates NBD"
  // "those banks" -> ["ADCB", "FAB", "Emirates NBD"]
  references: Record<string, string | string[]>;
}

/**
 * Stored response context
 */
export interface ContextResponse {
  agents: AgentType[];
  outputTypes: string[];
  entities: string[];
}

/**
 * Full context memory state
 */
export interface ContextMemoryState {
  entries: ContextEntry[];
  maxEntries: number;
  currentEntities: EntityExtractionResult;
  recentCompanies: string[];
  recentSectors: string[];
  recentRegions: string[];
}
