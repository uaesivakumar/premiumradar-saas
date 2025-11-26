/**
 * Context Memory - S43
 *
 * Short-term thread memory for conversation context.
 * Enables pronoun resolution and follow-up queries.
 *
 * "Find banks in UAE" → "Score them" (resolves "them" to banks found)
 */

import type {
  ContextEntry,
  ContextMemoryState,
  ContextResponse,
  ResolvedReferences,
  EntityExtractionResult,
  IntentClassification,
} from './types';
import { AgentType } from '@/lib/stores/siva-store';

// =============================================================================
// Context Memory Manager
// =============================================================================

const MAX_ENTRIES = 10; // Keep last 10 conversation turns

/**
 * Create a new context memory state
 */
export function createContextMemory(): ContextMemoryState {
  return {
    entries: [],
    maxEntries: MAX_ENTRIES,
    currentEntities: {
      entities: [],
      companies: [],
      sectors: [],
      regions: [],
      signals: [],
      metrics: {},
    },
    recentCompanies: [],
    recentSectors: [],
    recentRegions: [],
  };
}

/**
 * Add a new entry to context memory
 */
export function addToContext(
  memory: ContextMemoryState,
  query: string,
  intent: IntentClassification,
  entities: EntityExtractionResult
): ContextMemoryState {
  const entry: ContextEntry = {
    id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    query,
    intent,
    entities,
    timestamp: new Date(),
    resolved: { pronouns: {}, references: {} },
  };

  // Keep only the most recent entries
  const entries = [...memory.entries, entry].slice(-MAX_ENTRIES);

  // Update current entities (merge with existing)
  const currentEntities = mergeEntities(memory.currentEntities, entities);

  // Update recent entities
  const recentCompanies = updateRecentList(memory.recentCompanies, entities.companies);
  const recentSectors = updateRecentList(memory.recentSectors, entities.sectors);
  const recentRegions = updateRecentList(memory.recentRegions, entities.regions);

  return {
    ...memory,
    entries,
    currentEntities,
    recentCompanies,
    recentSectors,
    recentRegions,
  };
}

/**
 * Add response context to the last entry
 */
export function addResponseContext(
  memory: ContextMemoryState,
  response: ContextResponse
): ContextMemoryState {
  if (memory.entries.length === 0) return memory;

  const entries = [...memory.entries];
  const lastEntry = { ...entries[entries.length - 1] };
  lastEntry.response = response;
  entries[entries.length - 1] = lastEntry;

  // Update recent companies from response
  const recentCompanies = updateRecentList(
    memory.recentCompanies,
    response.entities.filter(isCompanyEntity)
  );

  return {
    ...memory,
    entries,
    recentCompanies,
  };
}

/**
 * Resolve pronouns and references in a query
 */
export function resolveReferences(
  query: string,
  memory: ContextMemoryState
): { resolvedQuery: string; resolutions: ResolvedReferences } {
  let resolvedQuery = query;
  const resolutions: ResolvedReferences = { pronouns: {}, references: {} };

  // Resolve "it" → last single company
  if (/\bit\b/i.test(query) && memory.recentCompanies.length > 0) {
    const company = memory.recentCompanies[0];
    resolvedQuery = resolvedQuery.replace(/\bit\b/gi, company);
    resolutions.pronouns['it'] = company;
  }

  // Resolve "them"/"they" → last set of companies or results
  if (/\b(them|they)\b/i.test(query)) {
    if (memory.recentCompanies.length > 1) {
      const companies = memory.recentCompanies.slice(0, 5);
      resolvedQuery = resolvedQuery.replace(/\bthem\b/gi, companies.join(', '));
      resolvedQuery = resolvedQuery.replace(/\bthey\b/gi, companies.join(', '));
      resolutions.pronouns['them'] = companies;
      resolutions.pronouns['they'] = companies;
    } else if (memory.recentCompanies.length === 1) {
      resolvedQuery = resolvedQuery.replace(/\b(them|they)\b/gi, memory.recentCompanies[0]);
      resolutions.pronouns['them'] = memory.recentCompanies[0];
      resolutions.pronouns['they'] = memory.recentCompanies[0];
    }
  }

  // Resolve "this"/"that" → last single entity
  if (/\b(this|that)\s+company\b/i.test(query) && memory.recentCompanies.length > 0) {
    const company = memory.recentCompanies[0];
    resolvedQuery = resolvedQuery.replace(/\b(this|that)\s+company\b/gi, company);
    resolutions.references['this company'] = company;
    resolutions.references['that company'] = company;
  }

  // Resolve "these"/"those" → multiple recent entities
  if (/\b(these|those)\s+(companies|prospects|banks)\b/i.test(query)) {
    if (memory.recentCompanies.length > 0) {
      const companies = memory.recentCompanies.slice(0, 5);
      resolvedQuery = resolvedQuery.replace(
        /\b(these|those)\s+(companies|prospects|banks)\b/gi,
        companies.join(', ')
      );
      resolutions.references['these companies'] = companies;
      resolutions.references['those companies'] = companies;
    }
  }

  // Resolve "the same region" → last region
  if (/\bthe same\s+region\b/i.test(query) && memory.recentRegions.length > 0) {
    const region = memory.recentRegions[0];
    resolvedQuery = resolvedQuery.replace(/\bthe same\s+region\b/gi, region);
    resolutions.references['the same region'] = region;
  }

  // Resolve "the same sector"/"industry" → last sector
  if (/\bthe same\s+(sector|industry)\b/i.test(query) && memory.recentSectors.length > 0) {
    const sector = memory.recentSectors[0];
    resolvedQuery = resolvedQuery.replace(/\bthe same\s+(sector|industry)\b/gi, sector);
    resolutions.references['the same sector'] = sector;
  }

  return { resolvedQuery, resolutions };
}

/**
 * Get the last N entries from context
 */
export function getRecentContext(
  memory: ContextMemoryState,
  n: number = 3
): ContextEntry[] {
  return memory.entries.slice(-n);
}

/**
 * Get the last query from context
 */
export function getLastQuery(memory: ContextMemoryState): string | undefined {
  if (memory.entries.length === 0) return undefined;
  return memory.entries[memory.entries.length - 1].query;
}

/**
 * Get the last intent from context
 */
export function getLastIntent(memory: ContextMemoryState): IntentClassification | undefined {
  if (memory.entries.length === 0) return undefined;
  return memory.entries[memory.entries.length - 1].intent;
}

/**
 * Get the last entities from context
 */
export function getLastEntities(memory: ContextMemoryState): EntityExtractionResult | undefined {
  if (memory.entries.length === 0) return undefined;
  return memory.entries[memory.entries.length - 1].entities;
}

/**
 * Check if context has relevant history
 */
export function hasRelevantContext(memory: ContextMemoryState): boolean {
  return (
    memory.recentCompanies.length > 0 ||
    memory.recentSectors.length > 0 ||
    memory.recentRegions.length > 0
  );
}

/**
 * Clear context memory
 */
export function clearContext(): ContextMemoryState {
  return createContextMemory();
}

/**
 * Get context summary for debugging
 */
export function getContextSummary(memory: ContextMemoryState): string {
  const lines: string[] = [];
  lines.push(`Context Memory Summary:`);
  lines.push(`  Entries: ${memory.entries.length}`);
  lines.push(`  Recent Companies: ${memory.recentCompanies.join(', ') || 'none'}`);
  lines.push(`  Recent Sectors: ${memory.recentSectors.join(', ') || 'none'}`);
  lines.push(`  Recent Regions: ${memory.recentRegions.join(', ') || 'none'}`);

  if (memory.entries.length > 0) {
    const last = memory.entries[memory.entries.length - 1];
    lines.push(`  Last Query: "${last.query}"`);
    lines.push(`  Last Intent: ${last.intent.primary.type}`);
  }

  return lines.join('\n');
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Merge entity extraction results
 */
function mergeEntities(
  existing: EntityExtractionResult,
  newEntities: EntityExtractionResult
): EntityExtractionResult {
  return {
    entities: [...existing.entities, ...newEntities.entities].slice(-50),
    companies: dedupeAndLimit([...newEntities.companies, ...existing.companies], 10),
    sectors: dedupeAndLimit([...newEntities.sectors, ...existing.sectors], 5),
    regions: dedupeAndLimit([...newEntities.regions, ...existing.regions], 5),
    signals: dedupeAndLimit([...newEntities.signals, ...existing.signals], 10),
    metrics: { ...existing.metrics, ...newEntities.metrics },
    timeframe: newEntities.timeframe || existing.timeframe,
  };
}

/**
 * Update a recent list with new items (new items first)
 */
function updateRecentList(existing: string[], newItems: string[]): string[] {
  return dedupeAndLimit([...newItems, ...existing], 10);
}

/**
 * Deduplicate and limit array
 */
function dedupeAndLimit(arr: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of arr) {
    const normalized = item.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(item);
      if (result.length >= limit) break;
    }
  }

  return result;
}

/**
 * Check if a string looks like a company name
 */
function isCompanyEntity(value: string): boolean {
  // Simple heuristic: starts with capital letter, not a common word
  const commonWords = new Set(['The', 'Find', 'Search', 'Email', 'Score', 'Bank', 'Company']);
  return /^[A-Z]/.test(value) && !commonWords.has(value);
}
