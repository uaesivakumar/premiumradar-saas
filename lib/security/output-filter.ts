/**
 * Output Leakage Filter
 *
 * Sprint S1 - Feature 4: Output leakage filter
 *
 * Prevents:
 * - Internal configuration leakage
 * - Secret/API key exposure
 * - System architecture disclosure
 * - Database schema leakage
 * - Internal URL/endpoint exposure
 * - Model/version fingerprinting
 *
 * Applied to all LLM responses before sending to users
 */

export interface FilterResult {
  isClean: boolean;
  filteredOutput: string;
  leaksDetected: string[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  redactions: number;
}

export interface OutputFilterConfig {
  enableRedaction?: boolean; // Replace detected leaks with [REDACTED]
  blockOnLeak?: boolean; // Block entire response if leak detected
  logLeaks?: boolean;
}

/**
 * Secret patterns - API keys, tokens, passwords
 */
const SECRET_PATTERNS = [
  // Generic API keys
  /\b[a-zA-Z0-9_-]{32,}\b/g, // Long alphanumeric strings (potential keys)
  /sk-[a-zA-Z0-9]{32,}/g, // OpenAI-style keys
  /pk-[a-zA-Z0-9]{32,}/g, // Public keys
  /ntn_[a-zA-Z0-9]{30,}/g, // Notion tokens

  // AWS-style keys
  /AKIA[0-9A-Z]{16}/g,
  /aws_secret_access_key\s*[:=]\s*[a-zA-Z0-9/+=]{40}/gi,

  // JWT tokens
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,

  // Bearer tokens
  /Bearer\s+[a-zA-Z0-9_-]{20,}/gi,

  // Database connection strings
  /postgres:\/\/[^\s]+/gi,
  /mysql:\/\/[^\s]+/gi,
  /mongodb:\/\/[^\s]+/gi,
  /redis:\/\/[^\s]+/gi,

  // Environment variable values
  /process\.env\.[A-Z_]+\s*=\s*["'][^"']+["']/gi,
];

/**
 * Internal URL patterns
 */
const INTERNAL_URL_PATTERNS = [
  /https?:\/\/localhost:\d+/gi,
  /https?:\/\/127\.0\.0\.1:\d+/gi,
  /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/gi,
  /https?:\/\/[a-z0-9-]+\.internal/gi,
  /https?:\/\/[a-z0-9-]+\.local/gi,
];

/**
 * Database schema patterns
 */
const SCHEMA_PATTERNS = [
  /CREATE\s+TABLE\s+\w+/gi,
  /ALTER\s+TABLE\s+\w+/gi,
  /DROP\s+TABLE\s+\w+/gi,
  /TABLE\s+`?\w+`?\s+\(/gi,
  /COLUMN\s+`?\w+`?\s+/gi,
];

/**
 * System configuration patterns
 */
const CONFIG_PATTERNS = [
  // File paths
  /\/etc\/[a-z0-9/_.-]+/gi,
  /\/var\/[a-z0-9/_.-]+/gi,
  /\/opt\/[a-z0-9/_.-]+/gi,
  /C:\\[a-zA-Z0-9\\/_.-]+/gi,

  // Config file contents
  /\{\s*["']?config["']?\s*:\s*\{/gi,
  /module\.exports\s*=\s*\{/gi,

  // Environment names
  /NODE_ENV\s*=\s*["']?(development|staging|production)["']?/gi,
];

/**
 * Model/AI fingerprinting patterns
 */
const MODEL_PATTERNS = [
  /gpt-[34]-/gi,
  /claude-[0-9]/gi,
  /text-davinci-/gi,
  /model\s+version\s*[:=]\s*["']?[0-9.]+["']?/gi,
];

/**
 * OS Architecture patterns (internal logic exposure)
 */
const ARCHITECTURE_PATTERNS = [
  /upr[\s_-]?os[\s_-]?(architecture|design|implementation)/gi,
  /scoring\s+(formula|algorithm|weight)\s*[:=]/gi,
  /ranking\s+(formula|algorithm|weight)\s*[:=]/gi,
  /Q\s*=\s*\d+\.\d+/gi, // Quality score formulas
  /T\s*=\s*\d+\.\d+/gi, // Timing score formulas
  /L\s*=\s*\d+\.\d+/gi, // Location score formulas
  /E\s*=\s*\d+\.\d+/gi, // Engagement score formulas
];

/**
 * Stack trace patterns
 */
const STACK_TRACE_PATTERNS = [
  /at\s+\w+\s+\([^)]+:\d+:\d+\)/g,
  /Error:\s+[^\n]+\n\s+at\s+/g,
  /Traceback\s+\(most\s+recent\s+call\s+last\)/gi,
];

class OutputFilter {
  private config: OutputFilterConfig;
  private leakLog: Array<{ timestamp: Date; leak: string; severity: string }> = [];

  constructor(config: OutputFilterConfig = {}) {
    this.config = {
      enableRedaction: config.enableRedaction ?? true,
      blockOnLeak: config.blockOnLeak ?? false,
      logLeaks: config.logLeaks ?? true,
    };
  }

  /**
   * Filter output for leaks
   */
  filter(output: string): FilterResult {
    const leaksDetected: string[] = [];
    let filteredOutput = output;
    let redactions = 0;

    // 1. Check for secrets
    const secretMatches = this.findMatches(output, SECRET_PATTERNS);
    if (secretMatches.length > 0) {
      leaksDetected.push('secret_exposure');
      if (this.config.enableRedaction) {
        filteredOutput = this.redactMatches(filteredOutput, SECRET_PATTERNS);
        redactions += secretMatches.length;
      }
    }

    // 2. Check for internal URLs
    const urlMatches = this.findMatches(output, INTERNAL_URL_PATTERNS);
    if (urlMatches.length > 0) {
      leaksDetected.push('internal_url');
      if (this.config.enableRedaction) {
        filteredOutput = this.redactMatches(filteredOutput, INTERNAL_URL_PATTERNS);
        redactions += urlMatches.length;
      }
    }

    // 3. Check for database schema
    const schemaMatches = this.findMatches(output, SCHEMA_PATTERNS);
    if (schemaMatches.length > 0) {
      leaksDetected.push('schema_exposure');
      if (this.config.enableRedaction) {
        filteredOutput = this.redactMatches(filteredOutput, SCHEMA_PATTERNS);
        redactions += schemaMatches.length;
      }
    }

    // 4. Check for config patterns
    const configMatches = this.findMatches(output, CONFIG_PATTERNS);
    if (configMatches.length > 0) {
      leaksDetected.push('config_exposure');
      if (this.config.enableRedaction) {
        filteredOutput = this.redactMatches(filteredOutput, CONFIG_PATTERNS);
        redactions += configMatches.length;
      }
    }

    // 5. Check for model fingerprinting
    const modelMatches = this.findMatches(output, MODEL_PATTERNS);
    if (modelMatches.length > 0) {
      leaksDetected.push('model_fingerprint');
      if (this.config.enableRedaction) {
        filteredOutput = this.redactMatches(filteredOutput, MODEL_PATTERNS);
        redactions += modelMatches.length;
      }
    }

    // 6. Check for architecture exposure
    const archMatches = this.findMatches(output, ARCHITECTURE_PATTERNS);
    if (archMatches.length > 0) {
      leaksDetected.push('architecture_exposure');
      if (this.config.enableRedaction) {
        filteredOutput = this.redactMatches(filteredOutput, ARCHITECTURE_PATTERNS);
        redactions += archMatches.length;
      }
    }

    // 7. Check for stack traces
    const stackMatches = this.findMatches(output, STACK_TRACE_PATTERNS);
    if (stackMatches.length > 0) {
      leaksDetected.push('stack_trace');
      if (this.config.enableRedaction) {
        filteredOutput = this.redactMatches(filteredOutput, STACK_TRACE_PATTERNS);
        redactions += stackMatches.length;
      }
    }

    // Calculate severity
    const severity = this.calculateSeverity(leaksDetected);

    // Log if enabled
    if (this.config.logLeaks && leaksDetected.length > 0) {
      this.logLeak(leaksDetected, severity);
    }

    // Block if configured and critical leak detected
    const isClean = this.config.blockOnLeak && severity === 'critical'
      ? false
      : leaksDetected.length === 0;

    return {
      isClean,
      filteredOutput: isClean || this.config.enableRedaction ? filteredOutput : '',
      leaksDetected,
      severity,
      redactions,
    };
  }

  /**
   * Find all matches for given patterns
   */
  private findMatches(text: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    for (const pattern of patterns) {
      const found = text.match(pattern);
      if (found) {
        matches.push(...found);
      }
    }
    return matches;
  }

  /**
   * Redact matches in text
   */
  private redactMatches(text: string, patterns: RegExp[]): string {
    let redacted = text;
    for (const pattern of patterns) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    return redacted;
  }

  /**
   * Calculate severity based on leak types
   */
  private calculateSeverity(leaks: string[]): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (leaks.length === 0) return 'none';

    const criticalLeaks = ['secret_exposure', 'schema_exposure', 'architecture_exposure'];
    const highLeaks = ['config_exposure', 'internal_url'];
    const mediumLeaks = ['stack_trace', 'model_fingerprint'];

    if (leaks.some(l => criticalLeaks.includes(l))) return 'critical';
    if (leaks.some(l => highLeaks.includes(l))) return 'high';
    if (leaks.some(l => mediumLeaks.includes(l))) return 'medium';
    return 'low';
  }

  /**
   * Log leak for monitoring
   */
  private logLeak(leaks: string[], severity: string): void {
    this.leakLog.push({
      timestamp: new Date(),
      leak: leaks.join(', '),
      severity,
    });

    // Keep only last 1000 entries
    if (this.leakLog.length > 1000) {
      this.leakLog.shift();
    }

    // In production, send to Cloud Logging
    if (process.env.NODE_ENV === 'production') {
      console.error('[SECURITY] Output leakage detected:', {
        timestamp: new Date().toISOString(),
        leaks,
        severity,
      });
    }
  }

  /**
   * Get leak statistics
   */
  getStatistics(): {
    totalLeaks: number;
    leakBreakdown: Record<string, number>;
    lastLeak?: Date;
  } {
    const leakBreakdown: Record<string, number> = {};

    for (const entry of this.leakLog) {
      const leaks = entry.leak.split(', ');
      for (const leak of leaks) {
        leakBreakdown[leak] = (leakBreakdown[leak] || 0) + 1;
      }
    }

    return {
      totalLeaks: this.leakLog.length,
      leakBreakdown,
      lastLeak: this.leakLog.length > 0 ? this.leakLog[this.leakLog.length - 1].timestamp : undefined,
    };
  }
}

// Singleton instance
export const outputFilter = new OutputFilter({
  enableRedaction: true,
  blockOnLeak: false, // Don't block, just redact
  logLeaks: true,
});

// Factory for custom configurations
export function createOutputFilter(config: OutputFilterConfig): OutputFilter {
  return new OutputFilter(config);
}

/**
 * Convenience function for quick filtering
 */
export function filterOutput(output: string): FilterResult {
  return outputFilter.filter(output);
}

/**
 * Strict filter - blocks on any critical leak
 */
export function strictFilterOutput(output: string): FilterResult {
  const strictFilter = new OutputFilter({
    enableRedaction: true,
    blockOnLeak: true,
    logLeaks: true,
  });
  return strictFilter.filter(output);
}
