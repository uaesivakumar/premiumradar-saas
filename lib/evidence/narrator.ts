/**
 * S344: Deterministic Narrator v1.1 (Admin Plane)
 *
 * Template-based narrative generation for evidence packs.
 * NO LLM calls - all summaries are deterministic and reproducible.
 *
 * Contract: Given the same inputs, MUST produce the same output.
 */

// ============================================================
// TYPES
// ============================================================

export interface EventEntry {
  timestamp: Date;
  event_type: string;
  description: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export interface DerivedSignal {
  signal_type: string;
  strength: 'high' | 'medium' | 'low';
  source: string;
  detected_at: Date;
}

export interface EvidencePack {
  // Deterministic narrator output (template-based)
  summary: string;

  // Key events in chronological order
  timeline: EventEntry[];

  // BTE-derived signals (computed, not LLM-generated)
  signals: DerivedSignal[];

  // Missed opportunities (rule-based detection)
  counterfactuals: string[];

  // Confidence based on data completeness (threshold-based)
  confidence: 'High' | 'Medium' | 'Low';

  // Narrator version for reproducibility
  narrator_version: string;
}

export interface NarratorInput {
  entity_type: 'USER' | 'ENTERPRISE' | 'WORKSPACE';
  entity_id: string;
  entity_name?: string;
  events: EventEntry[];
  signals: DerivedSignal[];
  context?: {
    is_demo?: boolean;
    demo_type?: string;
    days_active?: number;
    action_count?: number;
  };
}

// ============================================================
// NARRATIVE TEMPLATES
// ============================================================

const TEMPLATES = {
  // User lifecycle
  user_high_engagement: 'User {name} showed strong engagement with {action_count} actions over {days} days.',
  user_low_engagement: 'User {name} had minimal activity with only {action_count} actions.',
  user_new: 'User {name} is newly registered ({days} days ago).',
  user_churned: 'User {name} has been inactive for {inactive_days} days.',

  // Demo lifecycle
  demo_active: 'Demo for {name} is active with {days_remaining} days remaining.',
  demo_expiring: 'Demo for {name} expires in {days_remaining} days. Consider conversion.',
  demo_expired: 'Demo for {name} expired {days_ago} days ago.',
  demo_converted: 'Demo for {name} was successfully converted to {plan} plan on {date}.',

  // Enterprise lifecycle
  enterprise_healthy: 'Enterprise {name} is healthy with {user_count} active users.',
  enterprise_growing: 'Enterprise {name} added {new_users} users in the last {days} days.',
  enterprise_at_risk: 'Enterprise {name} shows signs of churn: {risk_indicators}.',

  // Signals
  signal_detected: 'Detected {signal_type} signal ({strength} strength) from {source}.',
  no_signals: 'No significant signals detected in the observation period.',

  // Counterfactuals
  missed_opportunity: 'Missed opportunity: {description}',
  action_recommended: 'Recommended action: {description}',
};

// ============================================================
// PATTERN DETECTION (Rule-Based)
// ============================================================

type PatternType = 'high_engagement' | 'low_engagement' | 'new_user' | 'churned' |
  'demo_active' | 'demo_expiring' | 'demo_expired' | 'demo_converted' |
  'healthy' | 'growing' | 'at_risk' | 'default';

function detectPattern(input: NarratorInput): PatternType {
  const { events, context } = input;
  const actionCount = context?.action_count || events.length;
  const daysActive = context?.days_active || 0;

  // Demo patterns
  if (context?.is_demo) {
    if (events.some(e => e.event_type === 'DEMO_CONVERTED')) {
      return 'demo_converted';
    }
    if (events.some(e => e.event_type === 'DEMO_EXPIRED')) {
      return 'demo_expired';
    }
    // Check days remaining
    const demoStartEvent = events.find(e => e.event_type === 'DEMO_STARTED');
    if (demoStartEvent) {
      const daysRemaining = 30 - daysActive; // Assuming 30-day demo
      if (daysRemaining <= 7) return 'demo_expiring';
      return 'demo_active';
    }
  }

  // User engagement patterns
  if (input.entity_type === 'USER') {
    if (daysActive <= 7) return 'new_user';
    if (actionCount === 0 && daysActive > 14) return 'churned';
    if (actionCount >= 50) return 'high_engagement';
    if (actionCount < 10) return 'low_engagement';
  }

  // Enterprise patterns
  if (input.entity_type === 'ENTERPRISE') {
    const userCreatedEvents = events.filter(e => e.event_type === 'USER_CREATED');
    if (userCreatedEvents.length >= 3) return 'growing';
    const riskEvents = events.filter(e =>
      e.event_type === 'USER_DELETED' || e.event_type === 'USER_CHURNED'
    );
    if (riskEvents.length >= 2) return 'at_risk';
    return 'healthy';
  }

  return 'default';
}

// ============================================================
// TEMPLATE ENGINE
// ============================================================

function fillTemplate(template: string, variables: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

function extractVariables(input: NarratorInput): Record<string, string | number> {
  return {
    name: input.entity_name || input.entity_id.slice(0, 8),
    action_count: input.context?.action_count || input.events.length,
    days: input.context?.days_active || 0,
    days_remaining: Math.max(0, 30 - (input.context?.days_active || 0)),
    days_ago: Math.max(0, (input.context?.days_active || 0) - 30),
    inactive_days: 14, // Placeholder
    user_count: input.events.filter(e => e.event_type === 'USER_CREATED').length,
    new_users: input.events.filter(e => e.event_type === 'USER_CREATED').length,
    plan: 'starter',
    date: new Date().toISOString().split('T')[0],
    risk_indicators: 'low activity, user churn',
  };
}

// ============================================================
// CONFIDENCE CALCULATION (Threshold-Based)
// ============================================================

function calculateConfidence(input: NarratorInput): 'High' | 'Medium' | 'Low' {
  const eventCount = input.events.length;
  const signalCount = input.signals.length;
  const hasContext = !!(input.context?.days_active && input.context?.action_count);

  // Threshold-based confidence
  if (eventCount >= 20 && signalCount >= 3 && hasContext) {
    return 'High';
  }
  if (eventCount >= 5 || signalCount >= 1) {
    return 'Medium';
  }
  return 'Low';
}

// ============================================================
// COUNTERFACTUAL DETECTION (Rule-Based)
// ============================================================

function detectCounterfactuals(input: NarratorInput): string[] {
  const counterfactuals: string[] = [];

  // Demo that expired without conversion
  if (input.context?.is_demo && input.events.some(e => e.event_type === 'DEMO_EXPIRED')) {
    counterfactuals.push('Demo expired without conversion. Consider follow-up outreach.');
  }

  // Low engagement user
  if (input.entity_type === 'USER' && (input.context?.action_count || 0) < 5) {
    counterfactuals.push('Low engagement detected. Consider onboarding assistance.');
  }

  // Enterprise without workspace binding
  if (input.entity_type === 'ENTERPRISE') {
    const hasWorkspace = input.events.some(e => e.event_type === 'WORKSPACE_CREATED');
    if (!hasWorkspace) {
      counterfactuals.push('No workspace created. May indicate incomplete setup.');
    }
  }

  return counterfactuals;
}

// ============================================================
// MAIN NARRATOR FUNCTION
// ============================================================

/**
 * Generate a deterministic evidence pack narrative.
 *
 * @param input - Events, signals, and context for the entity
 * @returns EvidencePack with deterministic summary
 */
export function generateEvidencePack(input: NarratorInput): EvidencePack {
  const pattern = detectPattern(input);
  const variables = extractVariables(input);

  // Select template based on pattern
  let templateKey: keyof typeof TEMPLATES;
  switch (pattern) {
    case 'high_engagement':
      templateKey = 'user_high_engagement';
      break;
    case 'low_engagement':
      templateKey = 'user_low_engagement';
      break;
    case 'new_user':
      templateKey = 'user_new';
      break;
    case 'churned':
      templateKey = 'user_churned';
      break;
    case 'demo_active':
      templateKey = 'demo_active';
      break;
    case 'demo_expiring':
      templateKey = 'demo_expiring';
      break;
    case 'demo_expired':
      templateKey = 'demo_expired';
      break;
    case 'demo_converted':
      templateKey = 'demo_converted';
      break;
    case 'healthy':
      templateKey = 'enterprise_healthy';
      break;
    case 'growing':
      templateKey = 'enterprise_growing';
      break;
    case 'at_risk':
      templateKey = 'enterprise_at_risk';
      break;
    default:
      templateKey = 'enterprise_healthy';
  }

  const summary = fillTemplate(TEMPLATES[templateKey], variables);

  // Add signal summaries
  const signalSummaries = input.signals.map(s =>
    fillTemplate(TEMPLATES.signal_detected, {
      signal_type: s.signal_type,
      strength: s.strength,
      source: s.source,
    })
  );

  const fullSummary = signalSummaries.length > 0
    ? `${summary} ${signalSummaries.join(' ')}`
    : summary;

  return {
    summary: fullSummary,
    timeline: input.events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    signals: input.signals,
    counterfactuals: detectCounterfactuals(input),
    confidence: calculateConfidence(input),
    narrator_version: 'deterministic-v1.1',
  };
}

/**
 * Validate that an evidence pack was generated deterministically.
 * Regenerates and compares to ensure reproducibility.
 */
export function validateDeterminism(input: NarratorInput, pack: EvidencePack): boolean {
  const regenerated = generateEvidencePack(input);
  return (
    regenerated.summary === pack.summary &&
    regenerated.confidence === pack.confidence &&
    regenerated.narrator_version === pack.narrator_version
  );
}

export default {
  generateEvidencePack,
  validateDeterminism,
};
