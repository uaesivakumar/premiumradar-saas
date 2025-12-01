/**
 * Auto-Context Provider
 * Sprint S49: AI-Enabled Journey Runtime
 *
 * Automatically injects relevant context into AI prompts:
 * - Journey data (input, outputs, variables)
 * - Entity data (current entity being processed)
 * - OS intelligence (evidence, object data)
 * - Dynamic expressions
 */
import type {
  ExecutionContext,
  ExecutionData,
} from '../journey-engine/types';
import type {
  ContextSource,
  AutoContextConfig,
} from './types';

// =============================================================================
// CONTEXT RESOLVER
// =============================================================================

/**
 * Resolve a single context source to its value
 */
export async function resolveContextSource(
  source: ContextSource,
  context: ExecutionContext,
  data: ExecutionData,
  osClient?: OSClientInterface
): Promise<unknown> {
  let value: unknown;

  switch (source.type) {
    case 'static':
      value = source.staticValue;
      break;

    case 'journey_data':
      value = resolveJourneyDataPath(source.dataPath || '', context, data);
      break;

    case 'os_api':
      if (!osClient) {
        console.warn(`[Context] OS client not provided for source: ${source.id}`);
        return null;
      }
      value = await resolveOSApiCall(source, osClient);
      break;

    case 'expression':
      value = evaluateContextExpression(source.expression || '', context, data);
      break;

    default:
      console.warn(`[Context] Unknown source type: ${source.type}`);
      return null;
  }

  // Apply transform
  return applyTransform(value, source.transform);
}

/**
 * Resolve a JSON path from journey data
 */
function resolveJourneyDataPath(
  path: string,
  context: ExecutionContext,
  data: ExecutionData
): unknown {
  if (!path) return null;

  // Build the full data object
  const fullData = {
    input: data.input,
    stepOutputs: data.stepOutputs,
    variables: data.variables,
    entityId: data.entityId,
    entityType: data.entityType,
    context: {
      instanceId: context.instanceId,
      journeyId: context.journeyId,
      status: context.status,
      metadata: context.metadata,
      tags: context.tags,
    },
  };

  // Navigate the path
  return getNestedValue(fullData, path);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!path) return obj;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    // Handle array access like "items[0]"
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = (current as Record<string, unknown>)[key];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

/**
 * Call OS API and return result
 */
async function resolveOSApiCall(
  source: ContextSource,
  osClient: OSClientInterface
): Promise<unknown> {
  const endpoint = source.osEndpoint;
  if (!endpoint) return null;

  try {
    const response = await osClient.call(endpoint, source.osParams || {});
    return response.data;
  } catch (error) {
    console.error(`[Context] OS API call failed for ${endpoint}:`, error);
    return null;
  }
}

/**
 * Evaluate a template expression
 */
function evaluateContextExpression(
  expression: string,
  context: ExecutionContext,
  data: ExecutionData
): unknown {
  // Simple template replacement: {{path.to.value}}
  const templatePattern = /\{\{([^}]+)\}\}/g;

  const result = expression.replace(templatePattern, (_, path: string) => {
    const value = resolveJourneyDataPath(path.trim(), context, data);
    return value !== undefined ? String(value) : '';
  });

  // If the entire expression was a single template, return the raw value
  const singleTemplateMatch = expression.match(/^\{\{([^}]+)\}\}$/);
  if (singleTemplateMatch) {
    return resolveJourneyDataPath(singleTemplateMatch[1].trim(), context, data);
  }

  return result;
}

// =============================================================================
// CONTEXT BUILDER
// =============================================================================

/**
 * Build complete context from multiple sources
 */
export async function buildContext(
  config: AutoContextConfig,
  context: ExecutionContext,
  data: ExecutionData,
  osClient?: OSClientInterface
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};

  // Resolve all sources in parallel
  const resolvedSources = await Promise.all(
    config.sources.map(async (source) => ({
      id: source.id,
      value: await resolveContextSource(source, context, data, osClient),
      transform: source.transform,
    }))
  );

  // Merge results according to strategy
  for (const { id, value, transform } of resolvedSources) {
    const transformedValue = applyTransform(value, transform);

    if (config.mergeStrategy === 'replace') {
      result[id] = transformedValue;
    } else if (config.mergeStrategy === 'shallow') {
      if (typeof transformedValue === 'object' && transformedValue !== null) {
        Object.assign(result, transformedValue);
      } else {
        result[id] = transformedValue;
      }
    } else {
      // deep merge
      if (typeof transformedValue === 'object' && transformedValue !== null) {
        deepMerge(result, transformedValue as Record<string, unknown>);
      } else {
        result[id] = transformedValue;
      }
    }
  }

  return result;
}

/**
 * Apply transform to value
 */
function applyTransform(
  value: unknown,
  transform: ContextSource['transform']
): unknown {
  if (transform === 'none' || !transform) {
    return value;
  }

  switch (transform) {
    case 'json':
      return typeof value === 'string' ? JSON.parse(value) : value;
    case 'string':
      return String(value);
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    default:
      return value;
  }
}

/**
 * Deep merge objects
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(sourceValue)
    ) {
      target[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else {
      target[key] = sourceValue;
    }
  }

  return target;
}

// =============================================================================
// DEFAULT CONTEXT SOURCES
// =============================================================================

/**
 * Create default context sources for common use cases
 */
export function createDefaultContextSources(
  options: {
    includeJourneyInput?: boolean;
    includeStepOutputs?: boolean;
    includeEntity?: boolean;
    includeVariables?: boolean;
    includeOSEvidence?: boolean;
    includeOSObjectIntel?: boolean;
  } = {}
): ContextSource[] {
  const sources: ContextSource[] = [];

  if (options.includeJourneyInput !== false) {
    sources.push({
      id: 'journeyInput',
      type: 'journey_data',
      dataPath: 'input',
      transform: 'none',
    });
  }

  if (options.includeStepOutputs !== false) {
    sources.push({
      id: 'previousSteps',
      type: 'journey_data',
      dataPath: 'stepOutputs',
      transform: 'none',
    });
  }

  if (options.includeEntity) {
    sources.push({
      id: 'entityId',
      type: 'journey_data',
      dataPath: 'entityId',
      transform: 'string',
    });
    sources.push({
      id: 'entityType',
      type: 'journey_data',
      dataPath: 'entityType',
      transform: 'string',
    });
  }

  if (options.includeVariables) {
    sources.push({
      id: 'variables',
      type: 'journey_data',
      dataPath: 'variables',
      transform: 'none',
    });
  }

  if (options.includeOSEvidence) {
    sources.push({
      id: 'evidence',
      type: 'os_api',
      osEndpoint: '/evidence/aggregate',
      osParams: {}, // Will be populated with entityId at runtime
      cacheTtlMs: 60000, // Cache for 1 minute
      transform: 'none',
    });
  }

  if (options.includeOSObjectIntel) {
    sources.push({
      id: 'objectIntel',
      type: 'os_api',
      osEndpoint: '/objects/intelligence',
      osParams: {},
      cacheTtlMs: 60000,
      transform: 'none',
    });
  }

  return sources;
}

// =============================================================================
// PROMPT VARIABLE INJECTION
// =============================================================================

/**
 * Inject context into a prompt template
 */
export function injectContextIntoPrompt(
  template: string,
  context: Record<string, unknown>
): string {
  // Replace {{variable}} patterns with actual values
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path: string) => {
    const value = getNestedValue(context, path.trim());

    if (value === undefined || value === null) {
      return match; // Keep original if not found
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  });
}

/**
 * Build the full prompt with system and user parts
 */
export function buildPrompt(
  systemTemplate: string,
  userTemplate: string,
  context: Record<string, unknown>
): { system: string; user: string } {
  return {
    system: injectContextIntoPrompt(systemTemplate, context),
    user: injectContextIntoPrompt(userTemplate, context),
  };
}

// =============================================================================
// TOKEN ESTIMATION
// =============================================================================

/**
 * Estimate token count (rough approximation)
 * Average: ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate context to fit within token limit
 */
export function truncateContext(
  context: Record<string, unknown>,
  maxTokens: number,
  strategy: AutoContextConfig['truncateStrategy']
): Record<string, unknown> {
  const serialized = JSON.stringify(context, null, 2);
  const currentTokens = estimateTokens(serialized);

  if (currentTokens <= maxTokens) {
    return context;
  }

  // Calculate how much to truncate
  const targetLength = Math.floor((maxTokens / currentTokens) * serialized.length * 0.9);

  let truncated: string;

  switch (strategy) {
    case 'start':
      truncated = serialized.slice(-targetLength);
      break;
    case 'middle':
      const half = Math.floor(targetLength / 2);
      truncated = serialized.slice(0, half) + '\n...[truncated]...\n' + serialized.slice(-half);
      break;
    case 'summarize':
      // For summarize, we'd need LLM - fallback to end truncation
      truncated = serialized.slice(0, targetLength) + '\n...[truncated]';
      break;
    case 'end':
    default:
      truncated = serialized.slice(0, targetLength) + '\n...[truncated]';
      break;
  }

  try {
    // Try to parse back - may fail if JSON is malformed
    return JSON.parse(truncated);
  } catch {
    // Return a simplified context
    return {
      _truncated: true,
      _originalTokens: currentTokens,
      _targetTokens: maxTokens,
      _summary: 'Context was truncated due to token limits',
    };
  }
}

// =============================================================================
// OS CLIENT INTERFACE
// =============================================================================

/**
 * Interface for OS API calls
 */
export interface OSClientInterface {
  call(endpoint: string, params: Record<string, unknown>): Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
  }>;
}

// =============================================================================
// CONTEXT CACHE
// =============================================================================

const contextCache = new Map<string, { value: unknown; expiresAt: number }>();

/**
 * Get cached context value
 */
export function getCachedContext(key: string): unknown | null {
  const cached = contextCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  contextCache.delete(key);
  return null;
}

/**
 * Set cached context value
 */
export function setCachedContext(key: string, value: unknown, ttlMs: number): void {
  contextCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): number {
  let cleared = 0;
  const now = Date.now();

  for (const [key, entry] of contextCache.entries()) {
    if (entry.expiresAt <= now) {
      contextCache.delete(key);
      cleared++;
    }
  }

  return cleared;
}

/**
 * Clear all cache
 */
export function clearContextCache(): void {
  contextCache.clear();
}
