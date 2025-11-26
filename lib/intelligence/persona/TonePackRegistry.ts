/**
 * Tone Pack Registry - S47
 *
 * Defines tone packs with language patterns and vocabulary.
 */

import type {
  TonePack,
  ToneType,
  OutreachToneType,
  TonePatterns,
  ToneVocabulary,
  ToneExamples,
} from './types';

// =============================================================================
// Base Tone Packs
// =============================================================================

const PROFESSIONAL_PACK: TonePack = {
  id: 'tone-professional',
  name: 'Professional',
  tone: 'professional',
  patterns: {
    greetings: [
      'Thank you for your inquiry.',
      'I appreciate you reaching out.',
      'Good to connect with you.',
    ],
    closings: [
      'Please let me know if you have any questions.',
      'I look forward to your response.',
      'Thank you for your consideration.',
    ],
    transitions: [
      'Furthermore,',
      'Additionally,',
      'In addition to this,',
      'Moreover,',
    ],
    acknowledgments: [
      'I understand.',
      'That makes sense.',
      'I appreciate the clarification.',
    ],
    clarifications: [
      'To clarify,',
      'For context,',
      'To be more specific,',
    ],
    recommendations: [
      'I would recommend',
      'Based on the analysis,',
      'The data suggests',
    ],
  },
  vocabulary: {
    preferred: ['regarding', 'concerning', 'pursuant to', 'accordingly'],
    avoid: ['gonna', 'wanna', 'stuff', 'things'],
    replacements: {
      'thing': 'item',
      'stuff': 'materials',
      'get': 'obtain',
      'like': 'such as',
    },
  },
  examples: {
    shortResponses: [
      'Understood. I will proceed accordingly.',
      'Thank you for the clarification.',
      'I will update you once complete.',
    ],
    explanations: [
      'This analysis reveals several key insights that warrant attention.',
      'The data indicates a clear pattern in the market trends.',
    ],
    recommendations: [
      'Based on the evidence, I recommend focusing on the following areas:',
      'The analysis suggests prioritizing these opportunities:',
    ],
    outreachOpeners: [
      'I hope this message finds you well.',
      'Thank you for taking the time to consider this.',
    ],
    followUps: [
      'Following up on our previous conversation,',
      'As discussed earlier,',
    ],
  },
};

const FRIENDLY_PACK: TonePack = {
  id: 'tone-friendly',
  name: 'Friendly',
  tone: 'friendly',
  patterns: {
    greetings: [
      'Great to hear from you!',
      'Thanks for reaching out!',
      'Hope you\'re having a great day!',
    ],
    closings: [
      'Let me know if you need anything else!',
      'Happy to help anytime!',
      'Looking forward to chatting more!',
    ],
    transitions: [
      'Also,',
      'On top of that,',
      'Here\'s another thing -',
    ],
    acknowledgments: [
      'Got it!',
      'Makes total sense!',
      'Absolutely!',
    ],
    clarifications: [
      'Just to make sure we\'re on the same page,',
      'So what I\'m hearing is,',
      'Let me break that down:',
    ],
    recommendations: [
      'I\'d suggest',
      'Here\'s what I think would work:',
      'My recommendation would be',
    ],
  },
  vocabulary: {
    preferred: ['help', 'great', 'happy', 'excited'],
    avoid: ['pursuant', 'heretofore', 'whereby'],
    replacements: {
      'obtain': 'get',
      'utilize': 'use',
      'regarding': 'about',
    },
  },
  examples: {
    shortResponses: [
      'Got it! I\'ll take care of that.',
      'Sounds good!',
      'On it!',
    ],
    explanations: [
      'So here\'s what I found - pretty interesting stuff!',
      'Let me walk you through this:',
    ],
    recommendations: [
      'Here\'s what I\'d suggest trying:',
      'I think the best approach would be:',
    ],
    outreachOpeners: [
      'Hey! I came across something I think you\'d find interesting.',
      'Hope you\'re doing well!',
    ],
    followUps: [
      'Just wanted to follow up on our chat!',
      'Circling back on this:',
    ],
  },
};

const CONCISE_PACK: TonePack = {
  id: 'tone-concise',
  name: 'Concise',
  tone: 'concise',
  patterns: {
    greetings: ['Hi.', 'Hello.'],
    closings: ['Questions? Let me know.', 'Happy to help.'],
    transitions: ['Also:', 'Next:', 'Then:'],
    acknowledgments: ['Noted.', 'Got it.', 'Understood.'],
    clarifications: ['Meaning:', 'Specifically:', 'Key point:'],
    recommendations: ['Suggest:', 'Recommend:', 'Action:'],
  },
  vocabulary: {
    preferred: ['use', 'get', 'do', 'make'],
    avoid: ['additionally', 'furthermore', 'subsequently'],
    replacements: {
      'in order to': 'to',
      'at this point in time': 'now',
      'due to the fact that': 'because',
      'in the event that': 'if',
    },
  },
  examples: {
    shortResponses: ['Done.', 'Updated.', 'Sent.'],
    explanations: [
      'Key findings:\n1. X\n2. Y\n3. Z',
      'Summary: [brief point]',
    ],
    recommendations: ['Action items:\n- A\n- B\n- C'],
    outreachOpeners: ['Quick note about [topic].'],
    followUps: ['Following up:', 'Update:'],
  },
};

const DETAILED_PACK: TonePack = {
  id: 'tone-detailed',
  name: 'Detailed',
  tone: 'detailed',
  patterns: {
    greetings: [
      'Thank you for your message. I have thoroughly reviewed the information provided.',
    ],
    closings: [
      'I hope this comprehensive overview addresses all your questions. Please do not hesitate to reach out if you require any additional clarification or have follow-up questions.',
    ],
    transitions: [
      'Building upon the previous point,',
      'To expand on this further,',
      'In a related context,',
    ],
    acknowledgments: [
      'I fully understand the nuances of what you\'re describing.',
      'That provides excellent context for the analysis.',
    ],
    clarifications: [
      'To provide complete context,',
      'For a comprehensive understanding,',
      'To elaborate on this point,',
    ],
    recommendations: [
      'After thorough analysis, I recommend the following multi-faceted approach:',
      'Based on comprehensive evaluation of all factors,',
    ],
  },
  vocabulary: {
    preferred: ['comprehensive', 'thorough', 'detailed', 'extensive'],
    avoid: [],
    replacements: {},
  },
  examples: {
    shortResponses: [
      'I have completed the requested analysis. The key findings are outlined below with supporting details.',
    ],
    explanations: [
      'This analysis encompasses multiple dimensions, each of which contributes to the overall picture:',
    ],
    recommendations: [
      'Based on the comprehensive analysis, I recommend a structured approach that addresses each aspect:',
    ],
    outreachOpeners: [
      'I am reaching out to share some detailed insights that I believe will be valuable for your strategic planning.',
    ],
    followUps: [
      'Following our previous discussion, I wanted to provide a more detailed analysis of the points we covered:',
    ],
  },
};

// =============================================================================
// Outreach Tone Packs
// =============================================================================

const EXECUTIVE_PACK: TonePack = {
  id: 'tone-executive',
  name: 'Executive',
  tone: 'executive',
  patterns: {
    greetings: [
      'I hope this note finds you well.',
      'Thank you for your time.',
    ],
    closings: [
      'I would welcome the opportunity to discuss this further.',
      'Please let me know if a brief call would be helpful.',
    ],
    transitions: [
      'From a strategic perspective,',
      'Regarding business impact,',
    ],
    acknowledgments: [
      'I appreciate your perspective on this.',
    ],
    clarifications: [
      'To put this in business context,',
    ],
    recommendations: [
      'Based on our analysis of market trends,',
      'From a strategic standpoint, I recommend',
    ],
  },
  vocabulary: {
    preferred: ['strategic', 'ROI', 'value', 'growth', 'transformation'],
    avoid: ['cheap', 'problem', 'sell'],
    replacements: {
      'buy': 'invest in',
      'cost': 'investment',
      'problem': 'challenge',
    },
  },
  examples: {
    shortResponses: [
      'Thank you for the insight.',
      'I appreciate you sharing that perspective.',
    ],
    explanations: [
      'The strategic implications are significant:',
    ],
    recommendations: [
      'I recommend a strategic approach that balances immediate wins with long-term value creation:',
    ],
    outreachOpeners: [
      'Given your role in driving [company]\'s digital transformation,',
      'As [company] continues to lead in innovation,',
    ],
    followUps: [
      'Building on our recent conversation,',
      'Per our discussion,',
    ],
  },
};

const CONSULTATIVE_PACK: TonePack = {
  id: 'tone-consultative',
  name: 'Consultative',
  tone: 'consultative',
  patterns: {
    greetings: [
      'I\'ve been thinking about your situation.',
    ],
    closings: [
      'I\'d be happy to explore this together.',
      'What questions do you have?',
    ],
    transitions: [
      'Here\'s what I\'m seeing:',
      'Based on similar situations,',
    ],
    acknowledgments: [
      'That\'s a common challenge we see.',
    ],
    clarifications: [
      'Let me share some context:',
    ],
    recommendations: [
      'Based on what\'s worked for others in similar situations:',
      'Here\'s an approach that\'s proven effective:',
    ],
  },
  vocabulary: {
    preferred: ['explore', 'consider', 'approach', 'solution'],
    avoid: ['sell', 'pitch', 'offer'],
    replacements: {},
  },
  examples: {
    shortResponses: [
      'That\'s a great question to explore.',
    ],
    explanations: [
      'Here\'s how I\'d think about this:',
    ],
    recommendations: [
      'Based on similar engagements, I\'d suggest:',
    ],
    outreachOpeners: [
      'I noticed something that might be relevant to the challenges you\'re facing.',
    ],
    followUps: [
      'I wanted to share some additional thoughts on:',
    ],
  },
};

// =============================================================================
// Registry
// =============================================================================

/**
 * All available tone packs
 */
export const TONE_PACKS: Record<string, TonePack> = {
  professional: PROFESSIONAL_PACK,
  friendly: FRIENDLY_PACK,
  concise: CONCISE_PACK,
  detailed: DETAILED_PACK,
  executive: EXECUTIVE_PACK,
  consultative: CONSULTATIVE_PACK,
};

/**
 * Get tone pack by ID or tone type
 */
export function getTonePack(toneOrId: ToneType | OutreachToneType | string): TonePack | null {
  return TONE_PACKS[toneOrId] || null;
}

/**
 * Get all available tone packs
 */
export function getAllTonePacks(): TonePack[] {
  return Object.values(TONE_PACKS);
}

/**
 * Get tone packs by category
 */
export function getTonePacksByCategory(): {
  base: TonePack[];
  outreach: TonePack[];
} {
  const baseTones: ToneType[] = ['professional', 'friendly', 'concise', 'detailed'];
  const outreachTones: OutreachToneType[] = ['executive', 'consultative'];

  return {
    base: baseTones.map(t => TONE_PACKS[t]).filter(Boolean),
    outreach: outreachTones.map(t => TONE_PACKS[t]).filter(Boolean),
  };
}
