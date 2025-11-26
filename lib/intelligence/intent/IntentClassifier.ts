/**
 * Intent Classifier - S43
 *
 * Semantic intent classification with 20+ intent types.
 * Uses keyword matching + pattern recognition for classification.
 *
 * DOES NOT modify existing agent selection - provides intelligence layer.
 */

import { AgentType } from '@/lib/stores/siva-store';
import type {
  IntentType,
  IntentCategory,
  IntentDefinition,
  ClassifiedIntent,
  IntentClassification,
} from './types';

// =============================================================================
// Intent Definitions (20+ intents)
// =============================================================================

export const INTENT_DEFINITIONS: IntentDefinition[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // DISCOVERY INTENTS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    type: 'discovery.search',
    category: 'discovery',
    name: 'Company Search',
    description: 'Find companies matching criteria',
    keywords: ['find', 'search', 'look for', 'discover', 'get', 'show me', 'list', 'companies', 'prospects'],
    patterns: [
      /find\s+(?:me\s+)?(?:some\s+)?(?:\w+\s+)*compan/i,
      /search\s+for\s+/i,
      /look(?:ing)?\s+for\s+/i,
      /show\s+me\s+(?:\w+\s+)*compan/i,
      /(?:get|list)\s+(?:\w+\s+)*(?:companies|prospects|businesses)/i,
    ],
    agents: ['discovery'],
    priority: 10,
    examples: [
      'Find banking companies in UAE',
      'Search for fintech startups',
      'Show me companies in Dubai',
    ],
  },
  {
    type: 'discovery.filter',
    category: 'discovery',
    name: 'Filter Results',
    description: 'Filter or refine search results',
    keywords: ['filter', 'only', 'with', 'that have', 'where', 'narrow', 'refine'],
    patterns: [
      /filter\s+(?:by|to|for)/i,
      /only\s+(?:show|include|companies)/i,
      /(?:companies|prospects)\s+(?:with|that\s+have)/i,
      /narrow\s+(?:down|to)/i,
    ],
    agents: ['discovery'],
    priority: 9,
    examples: [
      'Filter to only banks',
      'Show only companies with more than 500 employees',
      'Narrow down to UAE region',
    ],
  },
  {
    type: 'discovery.explore',
    category: 'discovery',
    name: 'Market Exploration',
    description: 'Explore market segments or industries',
    keywords: ['explore', 'what', 'which', 'who', 'market', 'industry', 'sector'],
    patterns: [
      /what\s+(?:companies|businesses)\s+(?:are|exist)/i,
      /which\s+(?:companies|businesses)/i,
      /explore\s+(?:the\s+)?(?:\w+\s+)*(?:market|industry|sector)/i,
      /who\s+(?:are|is)\s+(?:in|the)/i,
    ],
    agents: ['discovery'],
    priority: 8,
    examples: [
      'What companies are in the UAE fintech space?',
      'Which banks are adopting AI?',
      'Explore the insurance market in GCC',
    ],
  },
  {
    type: 'discovery.signal',
    category: 'discovery',
    name: 'Signal Detection',
    description: 'Find companies with specific signals',
    keywords: ['signal', 'signals', 'indicator', 'buying signal', 'growth', 'expanding', 'hiring', 'transformation'],
    patterns: [
      /(?:with|showing|have)\s+(?:\w+\s+)*signal/i,
      /(?:digital\s+)?transformation/i,
      /(?:is|are)\s+(?:growing|expanding|hiring)/i,
      /buying\s+signal/i,
    ],
    agents: ['discovery'],
    priority: 9,
    examples: [
      'Find companies with digital transformation signals',
      'Companies showing growth signals in UAE',
      'Who is hiring in banking tech?',
    ],
  },
  {
    type: 'discovery.similar',
    category: 'discovery',
    name: 'Similar Companies',
    description: 'Find companies similar to a reference',
    keywords: ['similar', 'like', 'comparable', 'same as', 'competitors'],
    patterns: [
      /(?:companies|prospects)\s+(?:similar|like)\s+(?:to\s+)?/i,
      /(?:similar|like)\s+(?:\w+\s+)*(?:to\s+)?[\w\s]+/i,
      /competitors\s+(?:of|to)/i,
      /same\s+(?:as|type)/i,
    ],
    agents: ['discovery'],
    priority: 8,
    examples: [
      'Find companies similar to Emirates NBD',
      'Competitors of ADCB',
      'Banks like FAB',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // RANKING INTENTS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    type: 'ranking.score',
    category: 'ranking',
    name: 'Score Company',
    description: 'Calculate Q/T/L/E score for a company',
    keywords: ['score', 'rate', 'evaluate', 'assess', 'qtle', 'q/t/l/e'],
    patterns: [
      /score\s+(?:this|the|a)?\s*(?:company|prospect)?/i,
      /(?:calculate|get|show)\s+(?:the\s+)?(?:qtle|q\/t\/l\/e)\s+score/i,
      /(?:rate|evaluate|assess)\s+(?:this|the)?\s*(?:company|prospect)/i,
    ],
    agents: ['ranking'],
    priority: 10,
    examples: [
      'Score Emirates NBD',
      'Calculate Q/T/L/E for this company',
      'Rate this prospect',
    ],
  },
  {
    type: 'ranking.compare',
    category: 'ranking',
    name: 'Compare Companies',
    description: 'Compare multiple companies',
    keywords: ['compare', 'versus', 'vs', 'against', 'difference', 'between'],
    patterns: [
      /compare\s+[\w\s]+(?:and|vs|versus|with|to)/i,
      /(?:what(?:'s| is)\s+the\s+)?difference\s+between/i,
      /[\w\s]+\s+(?:vs|versus)\s+[\w\s]+/i,
    ],
    agents: ['ranking'],
    priority: 9,
    examples: [
      'Compare Emirates NBD vs ADCB',
      'What is the difference between FAB and Mashreq?',
      'Emirates NBD versus First Abu Dhabi Bank',
    ],
  },
  {
    type: 'ranking.prioritize',
    category: 'ranking',
    name: 'Prioritize Prospects',
    description: 'Prioritize or rank a list of prospects',
    keywords: ['prioritize', 'rank', 'order', 'sort', 'best', 'top'],
    patterns: [
      /prioritize\s+(?:my\s+)?(?:prospects|companies|list)/i,
      /rank\s+(?:my\s+)?(?:prospects|companies|list)/i,
      /(?:show|get|find)\s+(?:the\s+)?(?:best|top)\s+\d*/i,
      /sort\s+(?:by|the)/i,
    ],
    agents: ['ranking'],
    priority: 9,
    examples: [
      'Prioritize my prospects',
      'Rank these companies',
      'Show me the top 10 prospects',
    ],
  },
  {
    type: 'ranking.explain',
    category: 'ranking',
    name: 'Explain Score',
    description: 'Explain why a company scored the way it did',
    keywords: ['why', 'explain', 'reason', 'how', 'breakdown'],
    patterns: [
      /why\s+(?:did|does|is)\s+(?:this|the)?\s*(?:company|prospect)?\s*(?:score|rank)/i,
      /explain\s+(?:the\s+)?(?:score|ranking)/i,
      /(?:score|ranking)\s+breakdown/i,
      /how\s+(?:did|was)\s+(?:this|the)\s+score\s+calculated/i,
    ],
    agents: ['ranking'],
    priority: 8,
    examples: [
      'Why did Emirates NBD score so high?',
      'Explain the Q score breakdown',
      'How was this ranking calculated?',
    ],
  },
  {
    type: 'ranking.filter_top',
    category: 'ranking',
    name: 'Filter by Score',
    description: 'Filter to top-scoring companies',
    keywords: ['top', 'best', 'highest', 'above', 'minimum'],
    patterns: [
      /(?:show|get|filter)\s+(?:the\s+)?top\s+\d+/i,
      /(?:companies|prospects)\s+(?:with\s+)?(?:score|ranking)\s+(?:above|over|greater)/i,
      /highest\s+(?:scoring|ranked)/i,
    ],
    agents: ['ranking'],
    priority: 8,
    examples: [
      'Show top 5 by Q score',
      'Companies with score above 80',
      'Highest ranked prospects',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // OUTREACH INTENTS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    type: 'outreach.email',
    category: 'outreach',
    name: 'Draft Email',
    description: 'Draft an email message',
    keywords: ['email', 'mail', 'write', 'draft', 'compose', 'message'],
    patterns: [
      /(?:write|draft|compose|create)\s+(?:an?\s+)?email/i,
      /email\s+(?:to|for)\s+/i,
      /(?:send|prepare)\s+(?:an?\s+)?(?:email|message)/i,
    ],
    agents: ['outreach'],
    priority: 10,
    examples: [
      'Write an email to Emirates NBD',
      'Draft a cold email for the CFO',
      'Compose an introduction email',
    ],
  },
  {
    type: 'outreach.linkedin',
    category: 'outreach',
    name: 'LinkedIn Message',
    description: 'Draft a LinkedIn message',
    keywords: ['linkedin', 'connection', 'inmail', 'connect'],
    patterns: [
      /(?:write|draft|compose|create)\s+(?:a\s+)?linkedin/i,
      /linkedin\s+(?:message|connection|inmail)/i,
      /connect\s+(?:with|on\s+linkedin)/i,
    ],
    agents: ['outreach'],
    priority: 10,
    examples: [
      'Write a LinkedIn connection request',
      'Draft a LinkedIn InMail',
      'LinkedIn message for the CTO',
    ],
  },
  {
    type: 'outreach.call_script',
    category: 'outreach',
    name: 'Call Script',
    description: 'Create a call script',
    keywords: ['call', 'phone', 'script', 'talking points', 'pitch'],
    patterns: [
      /(?:create|write|draft)\s+(?:a\s+)?(?:call|phone)\s+script/i,
      /talking\s+points\s+for\s+(?:a\s+)?call/i,
      /(?:elevator|sales)\s+pitch/i,
    ],
    agents: ['outreach'],
    priority: 9,
    examples: [
      'Create a call script for Emirates NBD',
      'Write talking points for my meeting',
      'Sales pitch for banking services',
    ],
  },
  {
    type: 'outreach.followup',
    category: 'outreach',
    name: 'Follow-up Message',
    description: 'Draft a follow-up message',
    keywords: ['follow up', 'followup', 'follow-up', 'reminder', 'check in'],
    patterns: [
      /(?:write|draft|send)\s+(?:a\s+)?follow[\s-]?up/i,
      /follow[\s-]?up\s+(?:email|message)/i,
      /(?:check|checking)\s+in\s+(?:with|on)/i,
    ],
    agents: ['outreach'],
    priority: 9,
    examples: [
      'Write a follow-up email',
      'Draft a check-in message',
      'Follow up on my last email',
    ],
  },
  {
    type: 'outreach.personalize',
    category: 'outreach',
    name: 'Personalize Message',
    description: 'Personalize an existing message',
    keywords: ['personalize', 'customize', 'tailor', 'adjust', 'modify'],
    patterns: [
      /(?:make|personalize)\s+(?:this|it)\s+(?:more\s+)?personal/i,
      /(?:customize|tailor)\s+(?:this|the)\s+(?:message|email)/i,
      /add\s+(?:more\s+)?personalization/i,
    ],
    agents: ['outreach'],
    priority: 8,
    examples: [
      'Make this email more personal',
      'Customize this for the CEO',
      'Add personalization based on their recent news',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ENRICHMENT INTENTS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    type: 'enrichment.company',
    category: 'enrichment',
    name: 'Company Profile',
    description: 'Get detailed company information',
    keywords: ['about', 'tell me', 'info', 'information', 'profile', 'details', 'overview'],
    patterns: [
      /(?:tell\s+me\s+)?about\s+[\w\s]+/i,
      /(?:company|prospect)\s+(?:profile|information|details)/i,
      /(?:info|information|overview)\s+(?:on|about|for)/i,
      /what\s+(?:do\s+you\s+know|can\s+you\s+tell\s+me)\s+about/i,
    ],
    agents: ['enrichment'],
    priority: 8,
    examples: [
      'Tell me about Emirates NBD',
      'Company profile for ADCB',
      'What do you know about FAB?',
    ],
  },
  {
    type: 'enrichment.contact',
    category: 'enrichment',
    name: 'Find Contacts',
    description: 'Find decision makers at a company',
    keywords: ['contact', 'decision maker', 'ceo', 'cto', 'cfo', 'executive', 'people', 'who'],
    patterns: [
      /(?:find|get|show)\s+(?:me\s+)?(?:contacts?|decision\s+makers?)/i,
      /who\s+(?:is|are)\s+(?:the\s+)?(?:ceo|cto|cfo|head|leader)/i,
      /(?:key\s+)?(?:people|executives?|leadership)\s+at/i,
    ],
    agents: ['enrichment'],
    priority: 8,
    examples: [
      'Find decision makers at Emirates NBD',
      'Who is the CEO of ADCB?',
      'Key executives at FAB',
    ],
  },
  {
    type: 'enrichment.tech_stack',
    category: 'enrichment',
    name: 'Tech Stack',
    description: 'Get technology information',
    keywords: ['tech', 'technology', 'stack', 'tools', 'software', 'platform'],
    patterns: [
      /(?:what|which)\s+(?:tech|technology|tools|software)/i,
      /tech(?:nology)?\s+stack/i,
      /(?:tools|platforms?|software)\s+(?:do\s+they\s+use|used\s+by)/i,
    ],
    agents: ['enrichment'],
    priority: 7,
    examples: [
      'What tech stack does Emirates NBD use?',
      'Technology used by ADCB',
      'What software platforms do they have?',
    ],
  },
  {
    type: 'enrichment.news',
    category: 'enrichment',
    name: 'Company News',
    description: 'Get latest news about a company',
    keywords: ['news', 'latest', 'recent', 'updates', 'announcements', 'press'],
    patterns: [
      /(?:latest|recent)\s+news\s+(?:about|on|for)/i,
      /news\s+(?:about|on|for)\s+[\w\s]+/i,
      /(?:what(?:'s| is)\s+)?(?:new|happening)\s+(?:at|with)/i,
      /(?:press\s+releases?|announcements?)\s+(?:from|by)/i,
    ],
    agents: ['enrichment'],
    priority: 7,
    examples: [
      'Latest news about Emirates NBD',
      'What is new at ADCB?',
      'Recent announcements from FAB',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPOUND INTENTS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    type: 'compound.discovery_ranking',
    category: 'compound',
    name: 'Find and Rank',
    description: 'Find companies and rank them',
    keywords: ['find and rank', 'search and score', 'discover and prioritize'],
    patterns: [
      /find\s+(?:and\s+)?(?:rank|score|prioritize)/i,
      /search\s+(?:and\s+)?(?:rank|score)/i,
      /discover\s+(?:and\s+)?(?:rank|score|evaluate)/i,
    ],
    agents: ['discovery', 'ranking'],
    priority: 11,
    examples: [
      'Find and rank banks in UAE',
      'Search for fintech companies and score them',
      'Discover prospects and prioritize',
    ],
  },
  {
    type: 'compound.ranking_outreach',
    category: 'compound',
    name: 'Rank and Draft',
    description: 'Rank prospects and draft outreach',
    keywords: ['rank and write', 'prioritize and draft', 'score and email'],
    patterns: [
      /(?:rank|score|prioritize)\s+(?:and\s+)?(?:write|draft|prepare)\s+(?:outreach|emails?)/i,
      /(?:top|best)\s+\d*\s*(?:and\s+)?(?:write|draft|prepare)/i,
    ],
    agents: ['ranking', 'outreach'],
    priority: 11,
    examples: [
      'Rank my prospects and draft emails for top 5',
      'Score and prepare outreach for the best leads',
    ],
  },
  {
    type: 'compound.full_pipeline',
    category: 'compound',
    name: 'Full Pipeline',
    description: 'Complete discovery-to-outreach pipeline',
    keywords: ['full pipeline', 'end to end', 'complete workflow', 'everything'],
    patterns: [
      /(?:find|search)\s+[\w\s]+,?\s*(?:rank|score)[\w\s]+,?\s*(?:and\s+)?(?:draft|write|prepare)/i,
      /(?:full|complete|entire)\s+(?:pipeline|workflow|process)/i,
      /(?:from\s+)?discovery\s+to\s+outreach/i,
    ],
    agents: ['discovery', 'ranking', 'outreach'],
    priority: 12,
    examples: [
      'Find banks in UAE, rank them, and draft emails for top 3',
      'Run the full pipeline for insurance companies',
      'Complete workflow from discovery to outreach',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // META INTENTS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    type: 'meta.help',
    category: 'meta',
    name: 'Help',
    description: 'User needs help',
    keywords: ['help', 'how to', 'how do i', 'what can you', 'guide', 'tutorial'],
    patterns: [
      /(?:help|assist)\s+(?:me)?/i,
      /how\s+(?:do|can)\s+i/i,
      /what\s+can\s+you\s+(?:do|help)/i,
      /(?:show|give)\s+me\s+(?:a\s+)?(?:guide|tutorial)/i,
    ],
    agents: ['demo'],
    priority: 5,
    examples: [
      'Help me get started',
      'How do I use discovery?',
      'What can you do?',
    ],
  },
  {
    type: 'meta.demo',
    category: 'meta',
    name: 'Demo',
    description: 'User wants a demonstration',
    keywords: ['demo', 'demonstrate', 'show me how', 'example', 'walkthrough'],
    patterns: [
      /(?:show|give)\s+(?:me\s+)?(?:a\s+)?demo/i,
      /demonstrate\s+(?:how)?/i,
      /(?:can\s+you\s+)?show\s+me\s+how/i,
      /(?:run|do)\s+(?:an?\s+)?(?:example|walkthrough)/i,
    ],
    agents: ['demo'],
    priority: 5,
    examples: [
      'Show me a demo',
      'Demonstrate the discovery flow',
      'Can you show me how ranking works?',
    ],
  },
  {
    type: 'meta.settings',
    category: 'meta',
    name: 'Settings',
    description: 'User wants to change settings',
    keywords: ['settings', 'preferences', 'configure', 'change', 'update'],
    patterns: [
      /(?:change|update|set)\s+(?:my\s+)?(?:settings|preferences)/i,
      /configure\s+/i,
      /(?:open|show)\s+settings/i,
    ],
    agents: ['demo'],
    priority: 4,
    examples: [
      'Change my settings',
      'Update preferences',
      'Configure my account',
    ],
  },
  {
    type: 'meta.status',
    category: 'meta',
    name: 'Status Check',
    description: 'User wants to check status',
    keywords: ['status', 'progress', 'state', 'where', 'current'],
    patterns: [
      /(?:what(?:'s| is)\s+)?(?:the\s+)?(?:status|progress)/i,
      /where\s+(?:am\s+i|are\s+we)/i,
      /(?:current|my)\s+(?:state|status|progress)/i,
    ],
    agents: ['demo'],
    priority: 4,
    examples: [
      'What is the status?',
      'Where am I in the process?',
      'Show my progress',
    ],
  },
  {
    type: 'meta.unknown',
    category: 'meta',
    name: 'Unknown Intent',
    description: 'Intent could not be classified',
    keywords: [],
    patterns: [],
    agents: ['demo'],
    priority: 0,
    examples: [],
  },
];

// =============================================================================
// Intent Classifier
// =============================================================================

/**
 * Classify a query into one or more intents
 */
export function classifyIntent(query: string): IntentClassification {
  const normalizedQuery = query.toLowerCase().trim();
  const allMatches: ClassifiedIntent[] = [];

  // Score each intent definition
  for (const definition of INTENT_DEFINITIONS) {
    const score = scoreIntent(normalizedQuery, definition);
    if (score > 0) {
      allMatches.push({
        type: definition.type,
        category: definition.category,
        confidence: score,
        agents: definition.agents,
        matchedKeywords: findMatchedKeywords(normalizedQuery, definition.keywords),
        matchedPatterns: findMatchedPatterns(normalizedQuery, definition.patterns),
      });
    }
  }

  // Sort by confidence (descending), then by priority (descending)
  allMatches.sort((a, b) => {
    const aDef = INTENT_DEFINITIONS.find((d) => d.type === a.type)!;
    const bDef = INTENT_DEFINITIONS.find((d) => d.type === b.type)!;

    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return bDef.priority - aDef.priority;
  });

  // Determine if compound
  const isCompound = allMatches.length > 1 && allMatches[0].category === 'compound';

  // Get primary and secondary intents
  const primary = allMatches[0] || createUnknownIntent();
  const secondary = allMatches.slice(1).filter((i) => i.confidence > 0.3);

  return {
    primary,
    secondary,
    isCompound,
    allIntents: allMatches,
    rawQuery: query,
    processedQuery: normalizedQuery,
  };
}

/**
 * Score how well a query matches an intent definition
 */
function scoreIntent(query: string, definition: IntentDefinition): number {
  let score = 0;

  // Keyword matching (0-0.5)
  const keywordMatches = definition.keywords.filter((kw) =>
    query.includes(kw.toLowerCase())
  );
  score += Math.min(keywordMatches.length * 0.15, 0.5);

  // Pattern matching (0-0.5)
  const patternMatches = definition.patterns.filter((p) => p.test(query));
  score += Math.min(patternMatches.length * 0.25, 0.5);

  // Apply priority bonus (0-0.1)
  score += definition.priority * 0.008;

  // Normalize to 0-1
  return Math.min(score, 1);
}

/**
 * Find which keywords matched
 */
function findMatchedKeywords(query: string, keywords: string[]): string[] {
  return keywords.filter((kw) => query.includes(kw.toLowerCase()));
}

/**
 * Find which patterns matched
 */
function findMatchedPatterns(query: string, patterns: RegExp[]): string[] {
  return patterns
    .filter((p) => p.test(query))
    .map((p) => p.source);
}

/**
 * Create an unknown intent fallback
 */
function createUnknownIntent(): ClassifiedIntent {
  return {
    type: 'meta.unknown',
    category: 'meta',
    confidence: 0.1,
    agents: ['demo'],
    matchedKeywords: [],
    matchedPatterns: [],
  };
}

/**
 * Get intent confidence score (0-1)
 */
export function getIntentConfidence(classification: IntentClassification): number {
  return classification.primary.confidence;
}

/**
 * Check if intent is compound (multi-agent)
 */
export function isCompoundIntent(classification: IntentClassification): boolean {
  return classification.isCompound || classification.primary.agents.length > 1;
}

/**
 * Get all agents needed for this intent
 */
export function getRequiredAgents(classification: IntentClassification): AgentType[] {
  const agents = new Set<AgentType>();

  for (const agent of classification.primary.agents) {
    agents.add(agent);
  }

  if (classification.isCompound) {
    for (const secondary of classification.secondary) {
      for (const agent of secondary.agents) {
        agents.add(agent);
      }
    }
  }

  return Array.from(agents);
}
