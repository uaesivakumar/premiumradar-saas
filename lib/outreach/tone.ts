/**
 * AI Tone Adjustment
 *
 * Adjusts message tone for banking communication style.
 */

import type { ToneStyle, BankingPersona } from './types';

interface ToneConfig {
  greetingStyle: 'formal' | 'semi-formal' | 'casual';
  signOffStyle: 'formal' | 'semi-formal' | 'casual';
  sentenceLength: 'long' | 'medium' | 'short';
  useJargon: boolean;
  personalPronouns: 'we/our' | 'I/my' | 'mixed';
  urgencyLevel: 'soft' | 'moderate' | 'direct';
}

const TONE_CONFIGS: Record<ToneStyle, ToneConfig> = {
  formal: {
    greetingStyle: 'formal',
    signOffStyle: 'formal',
    sentenceLength: 'long',
    useJargon: true,
    personalPronouns: 'we/our',
    urgencyLevel: 'soft',
  },
  professional: {
    greetingStyle: 'semi-formal',
    signOffStyle: 'semi-formal',
    sentenceLength: 'medium',
    useJargon: true,
    personalPronouns: 'mixed',
    urgencyLevel: 'moderate',
  },
  conversational: {
    greetingStyle: 'semi-formal',
    signOffStyle: 'casual',
    sentenceLength: 'short',
    useJargon: false,
    personalPronouns: 'I/my',
    urgencyLevel: 'moderate',
  },
  friendly: {
    greetingStyle: 'casual',
    signOffStyle: 'casual',
    sentenceLength: 'short',
    useJargon: false,
    personalPronouns: 'I/my',
    urgencyLevel: 'direct',
  },
};

const PERSONA_PREFERRED_TONES: Record<BankingPersona, ToneStyle[]> = {
  'cto': ['professional', 'formal'],
  'cio': ['formal', 'professional'],
  'cdo': ['professional', 'conversational'],
  'head-of-digital': ['professional', 'conversational'],
  'head-of-innovation': ['conversational', 'friendly'],
  'procurement': ['formal', 'professional'],
  'vp-technology': ['professional', 'formal'],
};

const GREETINGS: Record<ToneConfig['greetingStyle'], string[]> = {
  formal: ['Dear', 'Respected'],
  'semi-formal': ['Dear', 'Hello'],
  casual: ['Hi', 'Hey'],
};

const SIGN_OFFS: Record<ToneConfig['signOffStyle'], string[]> = {
  formal: ['Yours sincerely,', 'With best regards,', 'Respectfully,'],
  'semi-formal': ['Best regards,', 'Kind regards,', 'Best,'],
  casual: ['Thanks,', 'Cheers,', 'Best,'],
};

/**
 * Get recommended tone for a persona
 */
export function getRecommendedTone(persona: BankingPersona): ToneStyle {
  return PERSONA_PREFERRED_TONES[persona]?.[0] || 'professional';
}

/**
 * Get tone configuration
 */
export function getToneConfig(tone: ToneStyle): ToneConfig {
  return TONE_CONFIGS[tone];
}

/**
 * Adjust message greeting based on tone
 */
export function adjustGreeting(name: string, tone: ToneStyle): string {
  const config = TONE_CONFIGS[tone];
  const greetings = GREETINGS[config.greetingStyle];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  return `${greeting} ${name},`;
}

/**
 * Get appropriate sign-off based on tone
 */
export function getSignOff(tone: ToneStyle): string {
  const config = TONE_CONFIGS[tone];
  const signOffs = SIGN_OFFS[config.signOffStyle];
  return signOffs[Math.floor(Math.random() * signOffs.length)];
}

/**
 * Banking-specific tone adjustments
 */
export const BANKING_TONE_RULES = {
  // Words to use in banking context
  preferred: {
    'customer': 'client',
    'buy': 'acquire',
    'sell': 'offer',
    'cheap': 'cost-effective',
    'problem': 'challenge',
    'boss': 'leadership',
    'workers': 'team members',
    'stuff': 'solutions',
  },

  // Phrases to avoid
  avoid: [
    'ASAP',
    'no-brainer',
    'game-changer',
    'synergy',
    'low-hanging fruit',
    'circle back',
    'touch base',
  ],

  // GCC-specific considerations
  gccAdjustments: {
    useHonorificTitles: true,
    acknowledgeRamadan: true,
    avoidFridayOutreach: true,
    respectHierarchy: true,
  },
};

/**
 * Apply banking tone adjustments to text
 */
export function applyBankingToneAdjustments(text: string, tone: ToneStyle): string {
  let adjusted = text;

  // Replace preferred terms (case-insensitive)
  for (const [original, replacement] of Object.entries(BANKING_TONE_RULES.preferred)) {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    adjusted = adjusted.replace(regex, replacement);
  }

  // Flag avoided phrases (for review, not auto-replace)
  // This would be shown in the UI as warnings

  return adjusted;
}

/**
 * Get tone score for a message
 */
export function analyzeTone(text: string): {
  formality: number; // 0-100
  friendliness: number; // 0-100
  urgency: number; // 0-100
  professionalism: number; // 0-100
} {
  // Simple heuristic analysis
  const wordCount = text.split(/\s+/).length;
  const avgWordLength = text.replace(/\s+/g, '').length / wordCount;
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;

  // Longer words = more formal
  const formality = Math.min(100, avgWordLength * 15);

  // More questions, fewer exclamations = friendlier
  const friendliness = Math.min(100, questionCount * 10 + 50 - exclamationCount * 5);

  // More exclamations, shorter sentences = more urgent
  const urgency = Math.min(100, exclamationCount * 20 + (100 - wordCount));

  // Balanced = more professional
  const professionalism = (formality + (100 - urgency)) / 2;

  return {
    formality: Math.round(formality),
    friendliness: Math.round(friendliness),
    urgency: Math.round(urgency),
    professionalism: Math.round(professionalism),
  };
}
