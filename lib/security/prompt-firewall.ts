/**
 * Prompt Injection Firewall v1.0
 *
 * Sprint S1 - Feature 1 & 2: Input Sanitization Layer + Pattern-based jailbreak detector
 *
 * Blocks:
 * - Jailbreak attempts (role switching, instruction override)
 * - Meta-instructions (system prompt extraction)
 * - Prompt leaking attempts
 * - Config/schema discovery
 * - Tool hijacking
 * - Role escalation
 *
 * Target: >99.5% block rate for known attack patterns
 */

export interface SanitizationResult {
  isBlocked: boolean;
  sanitizedInput: string;
  detectedThreats: string[];
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  blockReason?: string;
}

export interface PromptFirewallConfig {
  enableLogging?: boolean;
  strictMode?: boolean; // Block on any threat, not just critical
  allowedPatterns?: RegExp[]; // Whitelist patterns
}

/**
 * Jailbreak patterns - common attack vectors
 */
const JAILBREAK_PATTERNS = [
  // Instruction override attempts
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|commands?)/i,
  /forget\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|commands?)/i,
  /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/i,

  // Role switching / persona override
  /you\s+are\s+now\s+(a|an|in|acting\s+as)/i,
  /act\s+as\s+(a|an)\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /roleplay\s+as/i,
  /simulate\s+(being|a|an)/i,

  // Developer/admin mode attempts
  /(developer|admin|debug|test|sudo)\s+mode/i,
  /enable\s+(developer|admin|debug|god)\s+mode/i,
  /switch\s+to\s+(developer|admin|debug)\s+mode/i,

  // System prompt extraction
  /repeat\s+(your|the)\s+(system\s+)?(prompt|instructions?|rules?|message)/i,
  /show\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions?|rules?|message)/i,
  /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions?|rules?|message)/i,
  /print\s+(your|the)\s+(system\s+)?(prompt|instructions?|message)/i,
  /output\s+(your|the)\s+(system\s+)?(prompt|instructions?|message)/i,
  /tell\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions?|message)/i,
  /reveal\s+(your|the)\s+(system\s+)?(prompt|instructions?|message)/i,

  // Meta-instructions
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /###\s*Instruction:/i,

  // DAN (Do Anything Now) variants
  /do\s+anything\s+now/i,
  /DAN\s+mode/i,
  /jailbreak/i,

  // Prompt leaking via encoding
  /base64\s+(decode|encode)/i,
  /hex\s+(decode|encode)/i,
  /rot13/i,

  // Chain-of-thought extraction
  /show\s+(me\s+)?your\s+(thinking|reasoning|thought\s+process)/i,
  /explain\s+your\s+(thinking|reasoning|thought\s+process)/i,

  // Model fingerprinting
  /what\s+model\s+are\s+you/i,
  /which\s+(version|model)\s+of\s+(GPT|Claude|AI)/i,
  /are\s+you\s+(GPT|Claude|ChatGPT)/i,
];

/**
 * Config/Schema discovery patterns
 */
const CONFIG_DISCOVERY_PATTERNS = [
  // Database queries
  /show\s+(me\s+)?(tables?|schema|database|columns?)/i,
  /describe\s+table/i,
  /select\s+\*\s+from/i,

  // API key/token extraction
  /(API|api)\s*(key|token|secret)/i,
  /access\s*token/i,
  /bearer\s+token/i,
  /authorization\s+(header|token)/i,
  /what\s+(is|are)\s+(your|the)\s+(API|api)\s+(key|token)/i,

  // Environment variable extraction
  /process\.env/i,
  /environment\s+variable/i,
  /\.env\s+file/i,
  /tell\s+(me\s+)?(your|the)\s+environment\s+variables?/i,

  // Config file access
  /config\.(json|yaml|yml|toml)/i,
  /settings?\.(json|yaml|yml)/i,
  /what\s+(are|is)\s+(your|the)\s+config\s+settings?/i,

  // Internal URLs/endpoints
  /localhost:\d+/i,
  /127\.0\.0\.1/i,
  /internal\s+(api|endpoint|url)/i,
];

/**
 * Tool hijacking patterns
 */
const TOOL_HIJACKING_PATTERNS = [
  /call\s+(internal|admin|system)\s+(function|method|tool)/i,
  /execute\s+(internal|admin|system)\s+(function|command)/i,
  /run\s+(internal|admin|system)\s+(function|command|tool)/i,
  /invoke\s+(internal|admin|system)/i,
];

/**
 * SQL Injection patterns (basic detection)
 */
const SQL_INJECTION_PATTERNS = [
  /'\s*OR\s+'?1'?\s*=\s*'?1/i,
  /'\s*OR\s+'?1'?\s*=\s*'?1/i,
  /--/,
  /;.*DROP\s+TABLE/i,
  /;.*DELETE\s+FROM/i,
  /;.*UPDATE\s+.*SET/i,
  /UNION\s+SELECT/i,
  /'\s*;/,
];

/**
 * Role escalation patterns
 */
const ROLE_ESCALATION_PATTERNS = [
  /grant\s+(me|access)\s+(admin|root|sudo)/i,
  /give\s+(me|access)\s+(admin|root|sudo)/i,
  /elevate\s+(my\s+)?(privileges?|permissions?|access)/i,
  /escalate\s+(my\s+)?(privileges?|permissions?|access)/i,
  /make\s+me\s+(admin|administrator|root)/i,
  /grant\s+(me\s+)?admin\s+(privileges?|access)/i,
  /give\s+(me\s+)?root\s+(permissions?|access)/i,
];

class PromptFirewall {
  private config: PromptFirewallConfig;
  private attackLog: Array<{ timestamp: Date; input: string; threats: string[] }> = [];

  constructor(config: PromptFirewallConfig = {}) {
    this.config = {
      enableLogging: config.enableLogging ?? true,
      strictMode: config.strictMode ?? true, // Default to strict mode for security
      allowedPatterns: config.allowedPatterns ?? [],
    };
  }

  /**
   * Main sanitization method
   * Analyzes input and blocks malicious patterns
   */
  sanitize(input: string): SanitizationResult {
    const detectedThreats: string[] = [];
    let sanitizedInput = input;
    let isBlocked = false;
    let blockReason: string | undefined;

    // 1. Check jailbreak patterns
    const jailbreakMatches = this.detectPattern(input, JAILBREAK_PATTERNS);
    if (jailbreakMatches.length > 0) {
      detectedThreats.push('jailbreak_attempt');
      isBlocked = true;
      blockReason = 'Jailbreak attempt detected';
    }

    // 2. Check config discovery patterns
    const configMatches = this.detectPattern(input, CONFIG_DISCOVERY_PATTERNS);
    if (configMatches.length > 0) {
      detectedThreats.push('config_discovery');
      isBlocked = true;
      blockReason = 'Config discovery attempt detected';
    }

    // 3. Check tool hijacking patterns
    const toolMatches = this.detectPattern(input, TOOL_HIJACKING_PATTERNS);
    if (toolMatches.length > 0) {
      detectedThreats.push('tool_hijacking');
      isBlocked = true;
      blockReason = 'Tool hijacking attempt detected';
    }

    // 4. Check SQL injection patterns
    const sqlMatches = this.detectPattern(input, SQL_INJECTION_PATTERNS);
    if (sqlMatches.length > 0) {
      detectedThreats.push('sql_injection');
      isBlocked = true;
      blockReason = 'SQL injection attempt detected';
    }

    // 5. Check role escalation patterns
    const roleMatches = this.detectPattern(input, ROLE_ESCALATION_PATTERNS);
    if (roleMatches.length > 0) {
      detectedThreats.push('role_escalation');
      isBlocked = true;
      blockReason = 'Role escalation attempt detected';
    }

    // 6. Check for excessive special characters (possible encoding attack)
    const specialCharRatio = this.getSpecialCharRatio(input);
    if (specialCharRatio > 0.3) {
      detectedThreats.push('encoding_attack');
      if (this.config.strictMode) {
        isBlocked = true;
        blockReason = 'Suspicious encoding pattern detected';
      }
    }

    // 7. Check for extremely long inputs (possible DoS)
    if (input.length > 10000) {
      detectedThreats.push('excessive_length');
      isBlocked = true;
      blockReason = 'Input exceeds maximum length';
    }

    // Determine threat level
    const threatLevel = this.calculateThreatLevel(detectedThreats);

    // Log attack if enabled
    if (this.config.enableLogging && detectedThreats.length > 0) {
      this.logThreat(input, detectedThreats);
    }

    // In non-strict mode, only block critical threats
    if (!this.config.strictMode && threatLevel !== 'critical') {
      isBlocked = false;
      blockReason = undefined;
    }

    return {
      isBlocked,
      sanitizedInput: isBlocked ? '' : sanitizedInput,
      detectedThreats,
      threatLevel,
      blockReason,
    };
  }

  /**
   * Detect patterns in input
   */
  private detectPattern(input: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        matches.push(pattern.source);
      }
    }
    return matches;
  }

  /**
   * Calculate ratio of special characters to total characters
   */
  private getSpecialCharRatio(input: string): number {
    const specialChars = input.match(/[^a-zA-Z0-9\s]/g) || [];
    return specialChars.length / input.length;
  }

  /**
   * Calculate threat level based on detected threats
   */
  private calculateThreatLevel(threats: string[]): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (threats.length === 0) return 'none';

    const criticalThreats = ['jailbreak_attempt', 'config_discovery', 'sql_injection', 'role_escalation'];
    const hasCritical = threats.some(t => criticalThreats.includes(t));

    if (hasCritical) return 'critical';
    if (threats.length >= 3) return 'high';
    if (threats.length === 2) return 'medium';
    return 'low';
  }

  /**
   * Log threat for monitoring
   */
  private logThreat(input: string, threats: string[]): void {
    this.attackLog.push({
      timestamp: new Date(),
      input: input.substring(0, 200), // Log first 200 chars only
      threats,
    });

    // Keep only last 1000 entries
    if (this.attackLog.length > 1000) {
      this.attackLog.shift();
    }

    // In production, this should send to Cloud Logging
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SECURITY] Prompt injection attempt detected:', {
        timestamp: new Date().toISOString(),
        threats,
        inputPreview: input.substring(0, 100),
      });
    }
  }

  /**
   * Get attack log (for monitoring/dashboard)
   */
  getAttackLog(): Array<{ timestamp: Date; input: string; threats: string[] }> {
    return [...this.attackLog];
  }

  /**
   * Get attack statistics
   */
  getStatistics(): {
    totalAttempts: number;
    threatBreakdown: Record<string, number>;
    lastAttack?: Date;
  } {
    const threatBreakdown: Record<string, number> = {};

    for (const entry of this.attackLog) {
      for (const threat of entry.threats) {
        threatBreakdown[threat] = (threatBreakdown[threat] || 0) + 1;
      }
    }

    return {
      totalAttempts: this.attackLog.length,
      threatBreakdown,
      lastAttack: this.attackLog.length > 0 ? this.attackLog[this.attackLog.length - 1].timestamp : undefined,
    };
  }
}

// Singleton instance (strict mode enabled by default)
export const promptFirewall = new PromptFirewall({
  enableLogging: true,
  strictMode: true, // Always strict for security
});

// Factory for custom configurations (e.g., testing)
export function createPromptFirewall(config: PromptFirewallConfig): PromptFirewall {
  return new PromptFirewall(config);
}

/**
 * Convenience function for quick sanitization
 */
export function sanitizePrompt(input: string): SanitizationResult {
  return promptFirewall.sanitize(input);
}
