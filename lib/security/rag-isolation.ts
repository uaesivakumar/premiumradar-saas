/**
 * RAG Isolation Layer
 *
 * Sprint S1 - Feature 3: RAG isolation (no direct OS access)
 *
 * Ensures:
 * - User queries cannot access internal system prompts
 * - No direct OS logic exposure
 * - Query context is strictly bounded
 * - System instructions are isolated from user context
 *
 * Implementation Strategy:
 * - Query filtering and rewriting
 * - Context boundary enforcement
 * - Metadata stripping
 * - Safe query construction
 */

export interface RAGIsolationConfig {
  maxContextSize?: number;
  allowedNamespaces?: string[];
  blockSystemQueries?: boolean;
}

export interface IsolationResult {
  isAllowed: boolean;
  rewrittenQuery: string;
  blockedReason?: string;
  appliedFilters: string[];
}

/**
 * Patterns that indicate system prompt leakage attempts
 */
const SYSTEM_PROMPT_PATTERNS = [
  /system\s+(prompt|instruction|message)/i,
  /system:\s*/i,
  /\[SYSTEM\]/i,
  /\{\{system\}\}/i,
  /<\|system\|>/i,
];

/**
 * Patterns targeting internal OS logic
 */
const OS_LOGIC_PATTERNS = [
  /upr[\s_-]?os[\s_-]?(logic|algorithm|weight|score|formula)/i,
  /scoring[\s_-]?(algorithm|formula|logic)/i,
  /ranking[\s_-]?(algorithm|formula|logic)/i,
  /internal[\s_-]?(logic|algorithm|calculation)/i,
  /proprietary[\s_-]?(logic|algorithm)/i,
];

/**
 * Metadata access patterns
 */
const METADATA_PATTERNS = [
  /__metadata/i,
  /_internal/i,
  /.config/i,
  /.env/i,
];

/**
 * Context namespace patterns (blocks access to restricted contexts)
 */
const RESTRICTED_NAMESPACES = [
  'system',
  'internal',
  'admin',
  'os-core',
  'scoring-engine',
  'ranking-engine',
];

class RAGIsolation {
  private config: RAGIsolationConfig;

  constructor(config: RAGIsolationConfig = {}) {
    this.config = {
      maxContextSize: config.maxContextSize ?? 5000,
      allowedNamespaces: config.allowedNamespaces ?? ['public', 'user-docs', 'help'],
      blockSystemQueries: config.blockSystemQueries ?? true,
    };
  }

  /**
   * Isolate and sanitize RAG query
   */
  isolateQuery(query: string, namespace?: string): IsolationResult {
    const appliedFilters: string[] = [];
    let rewrittenQuery = query;
    let isAllowed = true;
    let blockedReason: string | undefined;

    // 1. Check if namespace is allowed
    if (namespace && !this.isNamespaceAllowed(namespace)) {
      isAllowed = false;
      blockedReason = `Namespace '${namespace}' is not allowed`;
      appliedFilters.push('namespace_block');
      return { isAllowed, rewrittenQuery: '', blockedReason, appliedFilters };
    }

    // 2. Check for system prompt leakage attempts
    if (this.config.blockSystemQueries && this.detectPattern(query, SYSTEM_PROMPT_PATTERNS)) {
      isAllowed = false;
      blockedReason = 'System prompt access attempt detected';
      appliedFilters.push('system_prompt_block');
      return { isAllowed, rewrittenQuery: '', blockedReason, appliedFilters };
    }

    // 3. Check for OS logic extraction attempts
    if (this.detectPattern(query, OS_LOGIC_PATTERNS)) {
      isAllowed = false;
      blockedReason = 'OS logic access attempt detected';
      appliedFilters.push('os_logic_block');
      return { isAllowed, rewrittenQuery: '', blockedReason, appliedFilters };
    }

    // 4. Check for metadata access patterns
    if (this.detectPattern(query, METADATA_PATTERNS)) {
      isAllowed = false;
      blockedReason = 'Metadata access attempt detected';
      appliedFilters.push('metadata_block');
      return { isAllowed, rewrittenQuery: '', blockedReason, appliedFilters };
    }

    // 5. Strip restricted namespace references
    rewrittenQuery = this.stripRestrictedNamespaces(rewrittenQuery);
    if (rewrittenQuery !== query) {
      appliedFilters.push('namespace_strip');
    }

    // 6. Enforce context size limit
    if (rewrittenQuery.length > this.config.maxContextSize!) {
      rewrittenQuery = rewrittenQuery.substring(0, this.config.maxContextSize);
      appliedFilters.push('context_truncation');
    }

    // 7. Remove any metadata-like syntax
    rewrittenQuery = this.removeMetadataSyntax(rewrittenQuery);
    if (rewrittenQuery !== query && !appliedFilters.includes('namespace_strip')) {
      appliedFilters.push('metadata_cleanup');
    }

    return {
      isAllowed,
      rewrittenQuery,
      blockedReason,
      appliedFilters,
    };
  }

  /**
   * Check if namespace is in allowed list
   */
  private isNamespaceAllowed(namespace: string): boolean {
    // Check if in allowed list
    if (this.config.allowedNamespaces!.includes(namespace)) {
      return true;
    }

    // Check if in restricted list
    if (RESTRICTED_NAMESPACES.some(ns => namespace.toLowerCase().includes(ns))) {
      return false;
    }

    // Default: allow if not explicitly restricted
    return true;
  }

  /**
   * Detect if query matches any pattern
   */
  private detectPattern(query: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(query));
  }

  /**
   * Strip restricted namespace references from query
   */
  private stripRestrictedNamespaces(query: string): string {
    let cleaned = query;

    for (const namespace of RESTRICTED_NAMESPACES) {
      // Remove namespace prefixes like "system:", "internal:", etc.
      const pattern = new RegExp(`\\b${namespace}:\\s*`, 'gi');
      cleaned = cleaned.replace(pattern, '');

      // Remove namespace references in brackets like [system], [internal]
      const bracketPattern = new RegExp(`\\[${namespace}\\]`, 'gi');
      cleaned = cleaned.replace(bracketPattern, '');
    }

    return cleaned;
  }

  /**
   * Remove metadata-like syntax from query
   */
  private removeMetadataSyntax(query: string): string {
    // Remove key-value metadata syntax: key="value" or key: value
    let cleaned = query.replace(/\b\w+\s*[:=]\s*["'][\w\-]+["']/g, '');

    // Remove JSON-like objects: {"key": "value"}
    cleaned = cleaned.replace(/\{[^}]*\}/g, '');

    // Remove array-like syntax: [item1, item2]
    cleaned = cleaned.replace(/\[[^\]]*\]/g, '');

    return cleaned.trim();
  }

  /**
   * Create safe context wrapper for RAG queries
   * Ensures user queries are isolated from system context
   */
  createSafeContext(userQuery: string, allowedDocs: string[] = []): {
    userQuery: string;
    contextBoundary: string;
    allowedSources: string[];
  } {
    return {
      userQuery,
      contextBoundary: 'user-query',
      allowedSources: allowedDocs.filter(doc =>
        !RESTRICTED_NAMESPACES.some(ns => doc.toLowerCase().includes(ns))
      ),
    };
  }

  /**
   * Validate that response doesn't leak system information
   */
  validateResponse(response: string): {
    isValid: boolean;
    leakageDetected?: string[];
  } {
    const leakageDetected: string[] = [];

    // Check for system prompt leakage
    if (this.detectPattern(response, SYSTEM_PROMPT_PATTERNS)) {
      leakageDetected.push('system_prompt');
    }

    // Check for OS logic exposure
    if (this.detectPattern(response, OS_LOGIC_PATTERNS)) {
      leakageDetected.push('os_logic');
    }

    // Check for metadata exposure
    if (this.detectPattern(response, METADATA_PATTERNS)) {
      leakageDetected.push('metadata');
    }

    // Check for config/env variable exposure
    const configPatterns = [
      /process\.env\./i,
      /config\.(json|yaml|yml)/i,
      /(API|api)[\s_-]?(key|token|secret)\s*[:=]/i,
    ];
    if (this.detectPattern(response, configPatterns)) {
      leakageDetected.push('config');
    }

    return {
      isValid: leakageDetected.length === 0,
      leakageDetected: leakageDetected.length > 0 ? leakageDetected : undefined,
    };
  }
}

// Singleton instance
export const ragIsolation = new RAGIsolation({
  blockSystemQueries: true,
  allowedNamespaces: ['public', 'user-docs', 'help', 'faq'],
});

// Factory for custom configurations
export function createRAGIsolation(config: RAGIsolationConfig): RAGIsolation {
  return new RAGIsolation(config);
}

/**
 * Convenience functions
 */
export function isolateQuery(query: string, namespace?: string): IsolationResult {
  return ragIsolation.isolateQuery(query, namespace);
}

export function validateResponse(response: string): { isValid: boolean; leakageDetected?: string[] } {
  return ragIsolation.validateResponse(response);
}

export function createSafeContext(
  userQuery: string,
  allowedDocs: string[] = []
): {
  userQuery: string;
  contextBoundary: string;
  allowedSources: string[];
} {
  return ragIsolation.createSafeContext(userQuery, allowedDocs);
}
