/**
 * Deep Vertical Persona Packs - Sprint P3
 * Deep Vertical Intelligence Packs
 *
 * BANKING ONLY - Other verticals are UI placeholders.
 * Extended persona definitions with industry knowledge,
 * objection handling, and sub-vertical specializations.
 */

import type { Vertical } from '../../intelligence/context/types';
import { getPersonaForVertical, type VerticalPersona } from '../../intelligence/persona/vertical-personas';

// =============================================================================
// EXTENDED PERSONA TYPES
// =============================================================================

export interface DeepPersona extends VerticalPersona {
  // Industry expertise
  industryKnowledge: IndustryKnowledge;

  // Conversation patterns
  conversationPatterns: ConversationPatterns;

  // Objection handling
  objectionHandling: ObjectionHandling[];

  // Success stories templates
  successStoryTemplates: string[];

  // Value propositions
  valuePropositions: ValueProposition[];

  // Sub-vertical variations
  subVerticalVariations?: Record<string, Partial<DeepPersona>>;
}

export interface IndustryKnowledge {
  keyTerms: string[];
  regulations: string[];
  competitors: string[];
  painPoints: string[];
  successMetrics: string[];
  decisionMakers: string[];
  buyingCycle: string;
  seasonality: string[];
}

export interface ConversationPatterns {
  openers: string[];
  discoveryQuestions: string[];
  transitionPhrases: string[];
  closingStatements: string[];
  followUpTemplates: string[];
}

export interface ObjectionHandling {
  objection: string;
  category: 'price' | 'timing' | 'authority' | 'need' | 'competitor' | 'trust';
  response: string;
  followUp: string;
}

export interface ValueProposition {
  headline: string;
  painPoint: string;
  solution: string;
  proof: string;
  callToAction: string;
}

// =============================================================================
// BANKING DEEP PERSONA
// =============================================================================

export const BANKING_DEEP_PERSONA: DeepPersona = {
  ...getPersonaForVertical('banking'),

  industryKnowledge: {
    keyTerms: [
      'AML/KYC', 'Basel III/IV', 'SWIFT', 'IBAN', 'treasury management',
      'correspondent banking', 'trade finance', 'letter of credit',
      'working capital', 'cash pooling', 'FX hedging', 'escrow', 'WPS',
    ],
    regulations: [
      'Central Bank regulations', 'WPS (UAE)', 'Anti-Money Laundering',
      'Know Your Customer', 'FATCA', 'CRS', 'PCI-DSS',
    ],
    competitors: [
      'Emirates NBD', 'ADCB', 'FAB', 'Mashreq', 'RAKBANK', 'CBD',
    ],
    painPoints: [
      'Slow onboarding for corporate accounts',
      'Complex documentation requirements',
      'Limited digital banking features',
      'Poor API integration capabilities',
      'Manual payroll processing',
      'High transaction fees for cross-border',
    ],
    successMetrics: [
      'Account opening time', 'Transaction volume', 'Fee reduction',
      'Employee satisfaction', 'Compliance audit scores',
    ],
    decisionMakers: [
      'CFO', 'Treasurer', 'Finance Director', 'HR Director',
      'CEO (for SME)', 'Procurement Head',
    ],
    buyingCycle: '3-6 months for corporate banking, 1-3 months for employee banking',
    seasonality: ['Q1 budget allocation', 'Q4 contract renewals', 'Ramadan considerations'],
  },

  conversationPatterns: {
    openers: [
      'I noticed your company recently expanded operations in the region...',
      'Congratulations on the recent funding round. Many companies at your stage are evaluating their banking relationships...',
      'I understand managing payroll for a growing team can be complex...',
    ],
    discoveryQuestions: [
      'How are you currently managing payroll for your employees across different locations?',
      'What challenges do you face with your current banking relationship?',
      'How important is digital banking integration with your existing systems?',
      'What are your expansion plans for the next 12-18 months?',
    ],
    transitionPhrases: [
      'Based on what you\'ve shared, our clients in similar situations have benefited from...',
      'That challenge is exactly why we developed our...',
      'I understand. Many finance leaders express the same concern initially...',
    ],
    closingStatements: [
      'Would it be valuable to see how we\'ve helped similar companies reduce onboarding time by 60%?',
      'I\'d like to introduce you to our corporate banking specialist who can walk through the specifics...',
      'Can we schedule a 30-minute call next week to discuss your specific requirements?',
    ],
    followUpTemplates: [
      'Thank you for your time today. As discussed, I\'m attaching the case study of [Company] who reduced their payroll processing time by...',
      'Following up on our conversation about treasury management solutions...',
    ],
  },

  objectionHandling: [
    {
      objection: 'We\'re happy with our current bank',
      category: 'competitor',
      response: 'I understand, and it sounds like they\'re meeting your basic needs. Many of our clients felt the same way until they saw how our digital capabilities could save their finance team 20+ hours per month. Would you be open to a brief comparison?',
      followUp: 'What specific aspects of your current banking relationship do you value most?',
    },
    {
      objection: 'The switching cost is too high',
      category: 'price',
      response: 'That\'s a valid concern. We\'ve developed a white-glove migration service specifically to minimize disruption. Our last 10 corporate clients were fully transitioned within 4 weeks with zero business interruption.',
      followUp: 'Would it help to speak with a reference client who recently went through the transition?',
    },
    {
      objection: 'We need to focus on other priorities right now',
      category: 'timing',
      response: 'I completely understand. Many finance leaders we work with are managing competing priorities. The reason I reached out now is that companies at your growth stage often benefit from addressing banking infrastructure before scaling further. Would it make sense to have a brief call to at least understand your options?',
      followUp: 'When would be a better time to revisit this conversation?',
    },
  ],

  successStoryTemplates: [
    'A [INDUSTRY] company with [EMPLOYEE_COUNT] employees reduced their payroll processing time from 5 days to 2 hours after switching to our employee banking solution.',
    'After implementing our corporate treasury solution, [COMPANY_TYPE] saved [AMOUNT] annually in transaction fees while gaining real-time visibility into cash positions.',
  ],

  valuePropositions: [
    {
      headline: 'Streamline Employee Banking',
      painPoint: 'Manual payroll processing consuming HR resources',
      solution: 'Automated WPS-compliant payroll with same-day processing',
      proof: '95% of clients report 50%+ reduction in payroll admin time',
      callToAction: 'See a demo of our automated payroll solution',
    },
    {
      headline: 'Simplify Corporate Treasury',
      painPoint: 'Fragmented banking relationships and poor visibility',
      solution: 'Unified treasury dashboard with real-time cash positioning',
      proof: 'Clients average 30% improvement in working capital efficiency',
      callToAction: 'Review our treasury management capabilities',
    },
  ],

  subVerticalVariations: {
    'employee-banking': {
      industryKnowledge: {
        keyTerms: ['WPS', 'salary disbursement', 'payroll cycle', 'EOS calculation'],
        painPoints: ['Manual salary processing', 'WPS compliance burden', 'Limited employee self-service'],
        decisionMakers: ['HR Director', 'Finance Manager', 'CEO'],
        buyingCycle: '1-2 months',
      } as IndustryKnowledge,
    },
    'corporate-banking': {
      industryKnowledge: {
        keyTerms: ['treasury', 'cash management', 'trade finance', 'FX'],
        painPoints: ['Multiple banking relationships', 'Poor API access', 'Manual reconciliation'],
        decisionMakers: ['CFO', 'Treasurer', 'Finance Director'],
        buyingCycle: '3-6 months',
      } as IndustryKnowledge,
    },
    'sme-banking': {
      industryKnowledge: {
        keyTerms: ['working capital', 'overdraft', 'business loan', 'POS'],
        painPoints: ['Limited credit access', 'Slow loan approval', 'High fees'],
        decisionMakers: ['Owner', 'CEO', 'Finance Manager'],
        buyingCycle: '1-2 months',
      } as IndustryKnowledge,
    },
  },
};

// =============================================================================
// ACCESS FUNCTIONS
// =============================================================================

/**
 * Get deep persona for a vertical
 * Currently only Banking is active
 */
export function getDeepPersona(vertical: Vertical): DeepPersona | null {
  switch (vertical) {
    case 'banking':
      return BANKING_DEEP_PERSONA;
    // Other verticals are UI placeholders - no deep persona
    case 'insurance':
    case 'real-estate':
    case 'recruitment':
    case 'saas-sales':
    default:
      return null;
  }
}

/**
 * Get objection handling for a specific objection type (Banking only)
 */
export function getObjectionHandling(
  vertical: Vertical,
  category: ObjectionHandling['category']
): ObjectionHandling | undefined {
  const persona = getDeepPersona(vertical);
  if (!persona) return undefined;
  return persona.objectionHandling.find(o => o.category === category);
}

/**
 * Get conversation opener based on context (Banking only)
 */
export function getConversationOpener(
  vertical: Vertical,
  context?: { trigger?: string }
): string | null {
  const persona = getDeepPersona(vertical);
  if (!persona) return null;

  const openers = persona.conversationPatterns.openers;

  // Return random opener if no context
  if (!context) {
    return openers[Math.floor(Math.random() * openers.length)];
  }

  return openers[0];
}

/**
 * Get value propositions for a vertical (Banking only)
 */
export function getValuePropositions(vertical: Vertical): ValueProposition[] {
  const persona = getDeepPersona(vertical);
  return persona?.valuePropositions ?? [];
}

/**
 * Get industry knowledge for a vertical (Banking only)
 */
export function getIndustryKnowledge(vertical: Vertical): IndustryKnowledge | null {
  const persona = getDeepPersona(vertical);
  return persona?.industryKnowledge ?? null;
}

// =============================================================================
// METADATA
// =============================================================================

export const DEEP_PERSONA_METADATA = {
  version: '1.0.0',
  lastUpdated: '2024-12-03',
  activeVerticals: ['banking'],
  placeholderVerticals: ['insurance', 'real-estate', 'recruitment', 'saas-sales'],
  features: [
    'Industry knowledge',
    'Conversation patterns',
    'Objection handling',
    'Value propositions',
    'Success story templates',
    'Sub-vertical variations',
  ],
} as const;
