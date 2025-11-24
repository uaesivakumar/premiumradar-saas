/**
 * LLM Response Guardrails + Public-Mode Persona Mask
 *
 * Sprint S1 - Features 5 & 6: LLM Response Guardrail Templates + Public-mode persona mask
 *
 * Ensures:
 * - AI always responds in public-facing mode
 * - Never reveals internal system architecture
 * - Never discloses proprietary algorithms
 * - Maintains consistent persona boundaries
 * - Applies safety guardrails to all responses
 *
 * This is the final layer before responses reach users
 */

export interface GuardrailConfig {
  personaMode: 'public' | 'internal' | 'debug';
  enforcePersonaMask?: boolean;
  blockInternalQueries?: boolean;
  systemName?: string; // Brand name to use in responses
}

export interface GuardrailResult {
  approved: boolean;
  maskedResponse: string;
  violationsDetected: string[];
  appliedMasks: string[];
}

/**
 * Public-facing persona template
 * This is what users should experience
 */
const PUBLIC_PERSONA_MASK = {
  systemName: 'PremiumRadar',
  capabilities: [
    'Lead discovery and qualification',
    'Market intelligence',
    'Contact enrichment',
    'Outreach optimization',
  ],
  boundaries: [
    'Cannot disclose internal algorithms',
    'Cannot reveal system architecture',
    'Cannot share proprietary scoring methods',
    'Cannot expose data sources or partnerships',
  ],
  tone: 'professional, helpful, transparent about limitations',
  disclaimers: {
    algorithms: 'Our scoring system uses proprietary algorithms tailored to your industry.',
    data: 'We aggregate data from multiple verified sources to ensure accuracy.',
    limits: 'Some features require specific subscription tiers.',
  },
};

/**
 * Forbidden response patterns (these should NEVER appear in public responses)
 */
const FORBIDDEN_PATTERNS = [
  // Architecture disclosure
  /(?:our|the)\s+(?:system|platform|architecture)\s+(?:is|uses|implements)/gi,
  /(?:built|implemented|designed)\s+(?:using|with|on)\s+(?:Node\.js|Python|Rust|Go)/gi,
  /(?:database|DB)\s+(?:is|uses)\s+(?:PostgreSQL|MySQL|MongoDB)/gi,

  // Algorithm disclosure
  /(?:algorithm|formula|calculation)\s+(?:is|uses)\s+/gi,
  /(?:score|rank|weight)\s*=\s*\d+/gi,
  /Q\s*\+\s*T\s*\+\s*L\s*\+\s*E/gi, // QTLE formula pattern

  // Internal names/codenames
  /upr[\s_-]?os/gi,
  /(?:internal|private|admin)\s+(?:API|endpoint|service)/gi,

  // Data source disclosure
  /(?:we|PremiumRadar)\s+(?:scrape|pull|fetch)\s+(?:from|data\s+from)/gi,
  /(?:Apollo|ZoomInfo|LinkedIn)\s+API/gi, // Specific vendor names

  // Cost/pricing internals
  /(?:costs|costs\s+us)\s+\$\d+/gi,
  /(?:margin|profit)\s+(?:is|of)\s+\d+%/gi,

  // Development/debugging references
  /console\.log/gi,
  /debug\s+mode/gi,
  /TODO:|FIXME:/gi,
  /\[DEV\]|\[DEBUG\]/gi,
];

/**
 * Safe response templates for common query types
 */
const SAFE_RESPONSE_TEMPLATES = {
  howItWorks: `PremiumRadar uses advanced AI and market intelligence to identify and qualify high-value leads for your business. Our system analyzes multiple signals including company data, market trends, and engagement patterns to provide accurate lead scoring.`,

  algorithm: `Our scoring system uses proprietary algorithms that consider dozens of factors specific to your industry and target market. While we can't share the exact formula, we can show you which factors most influence each lead's score.`,

  dataSource: `We aggregate data from multiple verified sources including business directories, public records, and market intelligence platforms. Our data quality team continuously validates and enriches this information to ensure accuracy.`,

  pricing: `PremiumRadar offers flexible pricing based on your needs. Contact our sales team for a customized quote that matches your lead volume and feature requirements.`,

  accuracy: `Our lead qualification accuracy is continuously monitored and improved through machine learning. We provide confidence scores with each lead so you can prioritize your outreach effectively.`,

  privacy: `We take data privacy seriously and comply with GDPR, CCPA, and other regional regulations. All data is processed securely and we never share your proprietary information with third parties.`,

  limitations: `While PremiumRadar covers many industries and regions, some specialized markets may require custom configuration. Contact us to discuss your specific requirements.`,
};

class LLMGuardrails {
  private config: GuardrailConfig;

  constructor(config: GuardrailConfig = { personaMode: 'public' }) {
    this.config = {
      personaMode: config.personaMode,
      enforcePersonaMask: config.enforcePersonaMask ?? true,
      blockInternalQueries: config.blockInternalQueries ?? true,
      systemName: config.systemName ?? 'PremiumRadar',
    };
  }

  /**
   * Apply guardrails to LLM response
   */
  applyGuardrails(response: string, queryContext?: string): GuardrailResult {
    const violationsDetected: string[] = [];
    const appliedMasks: string[] = [];
    let maskedResponse = response;

    // 1. Check for forbidden patterns
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(response)) {
        violationsDetected.push(`forbidden_pattern: ${pattern.source}`);
      }
    }

    // 2. If violations detected, apply persona mask
    if (violationsDetected.length > 0 && this.config.enforcePersonaMask) {
      maskedResponse = this.applyPersonaMask(response, queryContext);
      appliedMasks.push('persona_mask');
    }

    // 3. Replace any internal system names
    maskedResponse = this.maskInternalNames(maskedResponse);
    if (maskedResponse !== response && !appliedMasks.includes('persona_mask')) {
      appliedMasks.push('name_masking');
    }

    // 4. Ensure public persona tone
    if (this.config.personaMode === 'public') {
      maskedResponse = this.enforcePublicTone(maskedResponse);
    }

    // Determine if response is approved
    const approved = this.config.personaMode !== 'public'
      ? true // Internal/debug mode allows everything
      : violationsDetected.length === 0 || appliedMasks.length > 0;

    return {
      approved,
      maskedResponse,
      violationsDetected,
      appliedMasks,
    };
  }

  /**
   * Apply public-facing persona mask
   * Replaces technical/internal responses with safe, user-friendly versions
   */
  private applyPersonaMask(response: string, queryContext?: string): string {
    // Detect query type and use appropriate template
    const query = queryContext?.toLowerCase() || '';

    if (query.includes('how') && (query.includes('work') || query.includes('does'))) {
      return SAFE_RESPONSE_TEMPLATES.howItWorks;
    }

    if (query.includes('algorithm') || query.includes('formula') || query.includes('calculate')) {
      return SAFE_RESPONSE_TEMPLATES.algorithm;
    }

    if (query.includes('data') && (query.includes('source') || query.includes('from') || query.includes('get'))) {
      return SAFE_RESPONSE_TEMPLATES.dataSource;
    }

    if (query.includes('price') || query.includes('cost') || query.includes('pricing')) {
      return SAFE_RESPONSE_TEMPLATES.pricing;
    }

    if (query.includes('accurate') || query.includes('accuracy') || query.includes('reliable')) {
      return SAFE_RESPONSE_TEMPLATES.accuracy;
    }

    if (query.includes('privacy') || query.includes('gdpr') || query.includes('data protection')) {
      return SAFE_RESPONSE_TEMPLATES.privacy;
    }

    if (query.includes('limitation') || query.includes('cannot') || query.includes("doesn't")) {
      return SAFE_RESPONSE_TEMPLATES.limitations;
    }

    // Default safe response
    return `I'm ${this.config.systemName}, your AI-powered lead intelligence platform. I can help you discover and qualify high-value leads, but I can't share internal system details. How can I assist you with your lead generation goals?`;
  }

  /**
   * Mask internal system names
   */
  private maskInternalNames(response: string): string {
    let masked = response;

    // Replace internal codenames with public brand name
    masked = masked.replace(/upr[\s_-]?os/gi, this.config.systemName!);
    masked = masked.replace(/\bOS\b/g, 'System');
    masked = masked.replace(/\bSaaS\b/g, this.config.systemName!);

    // Replace technical component names
    masked = masked.replace(/scoring[\s_-]engine/gi, 'scoring system');
    masked = masked.replace(/ranking[\s_-]engine/gi, 'ranking system');
    masked = masked.replace(/enrichment[\s_-]pipeline/gi, 'data enrichment');

    return masked;
  }

  /**
   * Enforce public-facing tone
   */
  private enforcePublicTone(response: string): string {
    let adjusted = response;

    // Remove overly technical jargon
    adjusted = adjusted.replace(/\bmicroservice\b/gi, 'service');
    adjusted = adjusted.replace(/\bAPI\s+endpoint\b/gi, 'service');
    adjusted = adjusted.replace(/\bdatabase\s+table\b/gi, 'data storage');
    adjusted = adjusted.replace(/\bpipeline\b/gi, 'process');

    // Remove debugging language
    adjusted = adjusted.replace(/\[DEBUG\]|\[DEV\]|\[INTERNAL\]/gi, '');
    adjusted = adjusted.replace(/console\.log/gi, '');

    return adjusted.trim();
  }

  /**
   * Generate safe response for blocked query
   */
  generateSafeResponse(query: string): string {
    const templates = [
      `I can help you with lead discovery and qualification, but I can't share internal system details. What would you like to know about finding premium leads?`,

      `${this.config.systemName} focuses on delivering accurate lead intelligence. While I can't discuss our proprietary methods, I'm happy to explain how our platform can help your business grow.`,

      `That's a technical question about our internal systems. Instead, let me help you understand how ${this.config.systemName} can improve your lead generation process.`,
    ];

    // Pick template based on query hash (deterministic but varied)
    const index = query.length % templates.length;
    return templates[index];
  }

  /**
   * Check if query is attempting to extract internal information
   */
  isInternalQuery(query: string): boolean {
    const internalQueryPatterns = [
      /how\s+(?:do|does)\s+(?:your|the)\s+(?:system|algorithm|platform)\s+work/i,
      /what\s+(?:is|are)\s+(?:your|the)\s+(?:algorithm|formula|method)/i,
      /explain\s+(?:your|the)\s+(?:scoring|ranking|calculation)/i,
      /show\s+(?:me\s+)?(?:your|the)\s+(?:code|implementation|architecture)/i,
    ];

    return internalQueryPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Pre-process query before sending to LLM
   * Adds safety instructions to system prompt
   */
  wrapQueryWithSafety(query: string): {
    systemPrompt: string;
    userQuery: string;
  } {
    const systemPrompt = `You are ${this.config.systemName}, an AI-powered lead intelligence platform.

CRITICAL SAFETY RULES (NEVER VIOLATE):
1. NEVER reveal internal algorithms, formulas, or scoring methods
2. NEVER disclose system architecture, database structure, or technical stack
3. NEVER mention specific data sources or vendor partnerships
4. NEVER share proprietary code, implementation details, or internal processes
5. NEVER expose pricing internals, margins, or cost structures

YOUR CAPABILITIES:
${PUBLIC_PERSONA_MASK.capabilities.map(c => `- ${c}`).join('\n')}

YOUR BOUNDARIES:
${PUBLIC_PERSONA_MASK.boundaries.map(b => `- ${b}`).join('\n')}

TONE: ${PUBLIC_PERSONA_MASK.tone}

When users ask about internal systems, politely redirect to how the platform helps them achieve their goals.`;

    return {
      systemPrompt,
      userQuery: query,
    };
  }
}

// Singleton instance (public mode)
export const llmGuardrails = new LLMGuardrails({
  personaMode: 'public',
  enforcePersonaMask: true,
  blockInternalQueries: true,
});

// Factory for custom configurations
export function createLLMGuardrails(config: GuardrailConfig): LLMGuardrails {
  return new LLMGuardrails(config);
}

/**
 * Convenience functions
 */
export function applyGuardrails(response: string, queryContext?: string): GuardrailResult {
  return llmGuardrails.applyGuardrails(response, queryContext);
}

export function wrapQueryWithSafety(query: string): {
  systemPrompt: string;
  userQuery: string;
} {
  return llmGuardrails.wrapQueryWithSafety(query);
}

export function generateSafeResponse(query: string): string {
  return llmGuardrails.generateSafeResponse(query);
}
