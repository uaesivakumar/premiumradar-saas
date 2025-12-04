/**
 * SIVA Expert Prompt Packs - Sprint P3
 * Deep Vertical Intelligence Packs
 *
 * BANKING ONLY - Other verticals are UI placeholders.
 * Specialized prompts for SIVA based on banking context.
 */

import type { Vertical } from '../../intelligence/context/types';
import { getDeepPersona } from '../personas';

// =============================================================================
// TYPES
// =============================================================================

export interface VerticalPromptPack {
  vertical: Vertical;
  systemPrompt: string;
  reasoningFramework: ReasoningFramework;
  outputTemplates: OutputTemplates;
  contextEnrichment: ContextEnrichment;
}

export interface ReasoningFramework {
  signalInterpretation: string;
  opportunityScoring: string;
  outreachStrategy: string;
  objectionPrediction: string;
}

export interface OutputTemplates {
  leadSummary: string;
  outreachMessage: string;
  followUpMessage: string;
  callScript: string;
  insightBrief: string;
}

export interface ContextEnrichment {
  requiredFields: string[];
  optionalFields: string[];
  enrichmentSources: string[];
}

// =============================================================================
// BANKING PROMPT PACK
// =============================================================================

export const BANKING_PROMPT_PACK: VerticalPromptPack = {
  vertical: 'banking',

  systemPrompt: `You are SIVA, an expert banking sales intelligence assistant. You help banking professionals identify, qualify, and engage corporate accounts for banking products including employee banking, corporate banking, treasury management, and trade finance.

VERTICAL CONTEXT: Banking
TARGET: Companies (B2B)
FOCUS: Corporate banking relationships, payroll/employee banking, treasury management

YOUR EXPERTISE:
- Understanding corporate banking needs based on company signals
- Identifying companies needing payroll/employee banking solutions
- Recognizing treasury and working capital opportunities
- Navigating regulatory requirements (WPS, AML/KYC, central bank regulations)
- Crafting executive-level outreach for CFOs, Treasurers, and HR Directors

SALES TRIGGER SIGNALS (from OS):
- Hiring expansion → Payroll banking opportunity
- Headcount jump → Scaling corporate accounts
- Office opening → New corporate account opportunity
- UAE market entry → Local banking relationship needed
- Funding round → Treasury management needs
- Project award → Working capital / trade finance needs
- Subsidiary creation → Multi-entity banking structure

COMMUNICATION STYLE:
- Formal and precise
- Data-backed claims
- Reference compliance and regulations appropriately
- Focus on long-term partnership, not transactions
- Executive-appropriate language`,

  reasoningFramework: {
    signalInterpretation: `When interpreting signals for banking opportunities:
1. EXPANSION SIGNALS (hiring, headcount) indicate need for payroll banking capacity
2. MARKET ENTRY SIGNALS indicate need for local banking relationships
3. FUNDING SIGNALS indicate treasury management and cash management needs
4. PROJECT SIGNALS indicate working capital and trade finance needs
5. LEADERSHIP SIGNALS indicate potential relationship reset opportunity

Weight signals by recency and confidence. Multiple correlated signals significantly increase opportunity quality.`,

    opportunityScoring: `Score banking opportunities considering:
- Company size (employee count for payroll, revenue for corporate)
- Growth trajectory (expansion rate indicates future banking needs)
- Current banking fragmentation (multiple banks = consolidation opportunity)
- Regulatory compliance status (upcoming deadlines create urgency)
- Regional presence (UAE operations = local banking requirement)

Hot Lead: Score 75+, multiple high-intent signals, clear decision-maker access
Warm Lead: Score 50-74, single strong signal, relationship building needed
Cold Lead: Score <50, potential but no active triggers`,

    outreachStrategy: `Banking outreach strategy by signal type:
- HIRING/HEADCOUNT: Lead with employee banking efficiency and WPS compliance
- OFFICE OPENING: Lead with corporate account onboarding speed
- MARKET ENTRY: Lead with regional expertise and regulatory navigation
- FUNDING: Lead with treasury management and growth-stage banking expertise
- PROJECT AWARD: Lead with working capital solutions and trade finance
- LEADERSHIP CHANGE: Request introductory meeting within 30 days of start

Always personalize based on the specific signal detected. Reference the trigger event.`,

    objectionPrediction: `Common banking sales objections:
- "Happy with current bank" → Highlight differentiators, offer comparison
- "Switching cost too high" → Emphasize white-glove migration service
- "Not a priority now" → Connect banking infrastructure to growth challenges
- "Need to involve others" → Offer to present to full stakeholder group

Prepare responses for each predicted objection based on prospect profile.`,
  },

  outputTemplates: {
    leadSummary: `**Lead Summary: {company_name}**

**Opportunity Score:** {score}/100 ({grade})
**Primary Opportunity:** {opportunity_type}
**Decision Makers:** {decision_makers}

**Key Signals Detected:**
{signals_list}

**Why Now:**
{timing_rationale}

**Recommended Approach:**
{approach_recommendation}

**Potential Objections:**
{predicted_objections}`,

    outreachMessage: `Subject: {personalized_subject}

Dear {contact_name},

{personalized_opener_referencing_signal}

At [Bank], we specialize in helping growing companies like {company_name} {value_proposition}.

{specific_benefit_based_on_signal}

Would you be open to a brief call to discuss how we might support {company_name}'s {growth_objective}?

Best regards,
{sender_name}`,

    followUpMessage: `Subject: Following up - {topic}

Dear {contact_name},

I wanted to follow up on my previous note regarding {banking_solution}.

Since I last reached out, I noticed {new_signal_or_development}. This reinforced my belief that {value_connection}.

{specific_ask_or_offer}

I'd welcome the opportunity to discuss further at your convenience.

Best regards,
{sender_name}`,

    callScript: `**Opening:**
"Hi {contact_name}, this is {sender_name} from [Bank]. I noticed {signal_reference} and wanted to reach out. Is this a good time for a brief conversation?"

**Discovery:**
- "How are you currently managing {relevant_banking_function}?"
- "What challenges are you experiencing with your current setup?"
- "What are your growth plans for the next 12-18 months?"

**Positioning:**
"Based on what you've shared, I think our {solution} could help you {benefit}. Companies similar to yours have seen {proof_point}."

**Close:**
"Would it make sense to schedule a more detailed discussion with our corporate banking specialist?"`,

    insightBrief: `**Intelligence Brief: {company_name}**

**Company Overview:**
{company_description}

**Recent Activity:**
{recent_signals_and_news}

**Banking Opportunity Analysis:**
{opportunity_analysis}

**Competitive Intelligence:**
{competitor_banking_relationships}

**Recommended Next Steps:**
{action_items}`,
  },

  contextEnrichment: {
    requiredFields: ['company_name', 'employee_count', 'industry'],
    optionalFields: ['revenue', 'funding_stage', 'headquarters', 'current_banks'],
    enrichmentSources: ['Apollo', 'LinkedIn', 'Crunchbase', 'Company website', 'News'],
  },
};

// =============================================================================
// ACCESS FUNCTIONS
// =============================================================================

/**
 * Get prompt pack for a vertical
 * Currently only Banking is active
 */
export function getPromptPack(vertical: Vertical): VerticalPromptPack | null {
  switch (vertical) {
    case 'banking':
      return BANKING_PROMPT_PACK;
    // Other verticals are UI placeholders
    case 'insurance':
    case 'real-estate':
    case 'recruitment':
    case 'saas-sales':
    default:
      return null;
  }
}

/**
 * Get system prompt for a vertical (Banking only)
 */
export function getSystemPrompt(vertical: Vertical): string | null {
  const pack = getPromptPack(vertical);
  return pack?.systemPrompt ?? null;
}

/**
 * Get reasoning framework for a vertical (Banking only)
 */
export function getReasoningFramework(vertical: Vertical): ReasoningFramework | null {
  const pack = getPromptPack(vertical);
  return pack?.reasoningFramework ?? null;
}

/**
 * Get output template by type (Banking only)
 */
export function getOutputTemplate(
  vertical: Vertical,
  templateType: keyof OutputTemplates
): string | null {
  const pack = getPromptPack(vertical);
  return pack?.outputTemplates[templateType] ?? null;
}

/**
 * Build complete SIVA prompt with context (Banking only)
 */
export function buildSIVAPrompt(
  vertical: Vertical,
  context: {
    signals?: string[];
    companyData?: Record<string, unknown>;
    task: string;
  }
): string | null {
  const pack = getPromptPack(vertical);
  if (!pack) return null;

  const persona = getDeepPersona(vertical);

  let prompt = pack.systemPrompt;

  // Add context
  if (context.signals && context.signals.length > 0) {
    prompt += `\n\nDETECTED SIGNALS:\n${context.signals.map(s => `- ${s}`).join('\n')}`;
  }

  if (context.companyData) {
    prompt += `\n\nCOMPANY CONTEXT:\n${JSON.stringify(context.companyData, null, 2)}`;
  }

  // Add task
  prompt += `\n\nTASK: ${context.task}`;

  // Add reasoning framework
  prompt += `\n\nREASONING APPROACH:\n${pack.reasoningFramework.signalInterpretation}`;

  return prompt;
}

// =============================================================================
// METADATA
// =============================================================================

export const PROMPT_PACK_METADATA = {
  version: '1.0.0',
  lastUpdated: '2024-12-03',
  activeVerticals: ['banking'],
  placeholderVerticals: ['insurance', 'real-estate', 'recruitment', 'saas-sales'],
  templateTypes: ['leadSummary', 'outreachMessage', 'followUpMessage', 'callScript', 'insightBrief'],
} as const;
