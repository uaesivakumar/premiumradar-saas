/**
 * SIVAPromptBuilder - EB Journey Phase 6.3
 *
 * Builds context-aware system prompts for SIVA based on:
 * - Sales Context (vertical, subVertical, regions)
 * - VerticalConfig (signals, journey stages, KPIs)
 * - Current operation (discovery, ranking, outreach)
 *
 * These prompts are injected into SIVA to ensure responses
 * are relevant to the salesperson's role and territory.
 */

import type { SIVAContext } from './SIVAContextLoader';
import type { SignalConfig, JourneyStage } from '../hooks/useVerticalConfig';

// =============================================================================
// TYPES
// =============================================================================

export type OperationType =
  | 'discovery'
  | 'ranking'
  | 'outreach'
  | 'enrichment'
  | 'general';

export interface PromptContext {
  operation: OperationType;
  query?: string;
  companies?: string[];
  currentStage?: string;
}

export interface BuiltPrompt {
  systemPrompt: string;
  contextBlock: string;
  constraints: string;
  examples?: string[];
}

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

const ROLE_TEMPLATES: Record<string, string> = {
  'employee-banking': `You are SIVA, an AI sales intelligence assistant for Employee Banking.
Your user is a salesperson who sells payroll accounts, salary accounts, and employee benefits to COMPANIES.
Focus on identifying companies that are hiring, expanding, or opening new offices - these are your primary sales triggers.`,

  'corporate-banking': `You are SIVA, an AI sales intelligence assistant for Corporate Banking.
Your user is a salesperson who sells treasury services, trade finance, and corporate loans to COMPANIES.
Focus on identifying companies with funding rounds, M&A activity, or international expansion - these indicate banking needs.`,

  'sme-banking': `You are SIVA, an AI sales intelligence assistant for SME Banking.
Your user is a salesperson who sells business accounts and working capital to small and medium enterprises.
Focus on identifying growing SMEs, new startups, and businesses expanding their operations.`,

  default: `You are SIVA, an AI sales intelligence assistant.
Your user is a salesperson seeking opportunities in their territory.
Help them find, score, and engage prospects effectively.`,
};

const OPERATION_TEMPLATES: Record<OperationType, string> = {
  discovery: `
CURRENT TASK: Discovery
Help the user find companies that match their sales context.
- Filter by their territory/regions
- Prioritize companies with relevant signals
- Show signal-based opportunities`,

  ranking: `
CURRENT TASK: Ranking & Scoring
Help the user prioritize companies based on opportunity quality.
- Use Q/T/L/E scoring (Quality, Timing, Liquidity, Engagement)
- Explain score factors clearly
- Highlight high-priority opportunities`,

  outreach: `
CURRENT TASK: Outreach
Help the user craft personalized outreach.
- Reference specific signals detected
- Match tone to the prospect's level
- Include relevant value propositions`,

  enrichment: `
CURRENT TASK: Enrichment
Help the user gather more information about prospects.
- Find decision makers and their contact info
- Research company background
- Identify relevant connections`,

  general: `
CURRENT TASK: General Assistance
Help the user with their sales intelligence needs.
- Answer questions about their territory
- Provide insights on market trends
- Assist with pipeline management`,
};

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

/**
 * Build the role-specific system prompt
 */
function buildRolePrompt(context: SIVAContext): string {
  const template = ROLE_TEMPLATES[context.subVertical] || ROLE_TEMPLATES.default;
  return template;
}

/**
 * Build the context block that describes the user's scope
 */
function buildContextBlock(context: SIVAContext): string {
  return `
## YOUR USER'S CONTEXT
- Role: ${context.subVerticalName}
- Vertical: ${context.vertical}
- Territory: ${context.regionsDisplay}
- Target: ${context.radarTarget.toUpperCase()}
- Context Locked: ${context.isLocked ? 'Yes (cannot change role)' : 'No'}

## RELEVANT SIGNALS
The following signal types indicate sales opportunities for this role:
${context.signalConfigs.map((s: SignalConfig) => `- ${s.name}: ${s.description}`).join('\n')}

## ALLOWED SIGNAL TYPES
Only reference these signals: ${context.allowedSignalTypes.join(', ')}`;
}

/**
 * Build constraints that prevent context drift
 */
function buildConstraints(context: SIVAContext): string {
  const constraints: string[] = [
    `1. ONLY discuss ${context.radarTarget} in ${context.regionsDisplay}`,
    `2. ONLY reference allowed signals: ${context.allowedSignalTypes.slice(0, 5).join(', ')}`,
    `3. If asked about other verticals (insurance, real estate), politely redirect to ${context.subVerticalName} context`,
    `4. Always prioritize opportunities with strong signals`,
  ];

  // Add vertical-specific constraints
  if (context.vertical === 'banking') {
    constraints.push(
      `5. For Banking: Focus on hiring signals, expansion signals, and funding signals`
    );
    constraints.push(
      `6. Do NOT discuss life events, rental expiry, or individual/family signals - those are for Insurance/Real Estate`
    );
  }

  return `
## IMPORTANT CONSTRAINTS
${constraints.join('\n')}`;
}

/**
 * Build journey stage context
 */
function buildJourneyContext(context: SIVAContext, currentStage?: string): string {
  if (context.journeyStages.length === 0) return '';

  const stagesText = context.journeyStages
    .map((s: JourneyStage) => `${s.order}. ${s.name}${currentStage === s.id ? ' ← CURRENT' : ''}`)
    .join('\n');

  return `
## SALES JOURNEY STAGES
${stagesText}`;
}

/**
 * Build operation-specific prompt
 */
function buildOperationPrompt(operation: OperationType): string {
  return OPERATION_TEMPLATES[operation] || OPERATION_TEMPLATES.general;
}

// =============================================================================
// MAIN BUILDER
// =============================================================================

/**
 * Build complete SIVA prompt for a given context and operation
 */
export function buildSIVAPrompt(
  context: SIVAContext,
  promptContext: PromptContext
): BuiltPrompt {
  const rolePrompt = buildRolePrompt(context);
  const contextBlock = buildContextBlock(context);
  const constraints = buildConstraints(context);
  const journeyContext = buildJourneyContext(context, promptContext.currentStage);
  const operationPrompt = buildOperationPrompt(promptContext.operation);

  const systemPrompt = `${rolePrompt}
${operationPrompt}
${contextBlock}
${journeyContext}
${constraints}

---
Always be helpful, accurate, and focused on the user's sales success.`;

  return {
    systemPrompt,
    contextBlock,
    constraints,
    examples: getExamplesForOperation(promptContext.operation, context),
  };
}

/**
 * Build a compact context injection for query enhancement
 */
export function buildQueryContextInjection(context: SIVAContext): string {
  return `[Context: ${context.subVerticalName} | Territory: ${context.regionsDisplay} | Targets: ${context.radarTarget}]`;
}

/**
 * Build context reminder for mid-conversation
 */
export function buildContextReminder(context: SIVAContext): string {
  return `Remember: You are helping a ${context.subVerticalName} salesperson in ${context.regionsDisplay}. Focus on ${context.radarTarget} with signals like: ${context.allowedSignalTypes.slice(0, 3).join(', ')}.`;
}

// =============================================================================
// EXAMPLES
// =============================================================================

function getExamplesForOperation(
  operation: OperationType,
  context: SIVAContext
): string[] {
  const examples: Record<OperationType, string[]> = {
    discovery: [
      `User: "Find companies hiring in ${context.regions[0] || 'my territory'}"
SIVA: Shows companies with hiring-expansion signals in the territory`,
      `User: "Show me expansion opportunities"
SIVA: Lists companies with office-opening, headcount-jump, or market-entry signals`,
    ],
    ranking: [
      `User: "Score these companies"
SIVA: Provides Q/T/L/E breakdown with justification`,
      `User: "Which is the best opportunity?"
SIVA: Ranks by composite score and explains key factors`,
    ],
    outreach: [
      `User: "Write an email to the HR Director"
SIVA: Drafts email referencing hiring signals and payroll value prop`,
      `User: "Help me prepare for a call"
SIVA: Creates talking points based on company signals and context`,
    ],
    enrichment: [
      `User: "Who should I contact?"
SIVA: Identifies decision makers (HR Director, CFO) with contact info`,
      `User: "Tell me more about this company"
SIVA: Provides company profile with relevant signals and opportunities`,
    ],
    general: [],
  };

  return examples[operation] || [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export default buildSIVAPrompt;
