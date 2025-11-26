/**
 * Persona Engine - S47
 *
 * Applies personality and tone to content.
 * Transforms raw text into personalized, tone-appropriate messaging.
 */

import type {
  PersonaConfig,
  TonePack,
  ToneAdjustment,
  ToneModifier,
  PersonaApplicationResult,
  ToneMetrics,
  ToneType,
  OutreachToneType,
  PersonaTrait,
} from './types';
import { getTonePack, TONE_PACKS } from './TonePackRegistry';

// =============================================================================
// Default Persona Configuration
// =============================================================================

/**
 * Create default persona configuration
 */
export function createDefaultPersona(): PersonaConfig {
  return {
    id: 'persona-default',
    name: 'SIVA Default',
    description: 'Professional, helpful AI assistant for sales intelligence',
    baseTone: 'professional',
    outreachTone: 'consultative',
    traits: [
      {
        id: 'trait-helpful',
        name: 'Helpful',
        description: 'Always aims to provide useful information',
        intensity: 0.8,
        examples: ['Let me help you with that.', 'Here\'s what I found.'],
      },
      {
        id: 'trait-precise',
        name: 'Precise',
        description: 'Provides accurate, data-backed insights',
        intensity: 0.9,
        examples: ['Based on the data...', 'The analysis shows...'],
      },
      {
        id: 'trait-proactive',
        name: 'Proactive',
        description: 'Anticipates needs and suggests next steps',
        intensity: 0.7,
        examples: ['You might also want to...', 'I noticed that...'],
      },
    ],
    modifiers: [],
    contextRules: [],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// =============================================================================
// Tone Application
// =============================================================================

/**
 * Apply persona and tone to content
 */
export function applyPersona(
  content: string,
  persona: PersonaConfig,
  context?: {
    isOutreach?: boolean;
    agentType?: string;
    intentType?: string;
  }
): PersonaApplicationResult {
  // Select appropriate tone pack
  const toneType = context?.isOutreach ? persona.outreachTone : persona.baseTone;
  const tonePack = getTonePack(toneType) || TONE_PACKS.professional;

  // Calculate adjustments from modifiers
  const adjustment = calculateAdjustments(persona.modifiers, context);

  // Apply transformations
  let modified = content;
  const appliedRules: string[] = [];

  // Apply vocabulary replacements
  modified = applyVocabulary(modified, tonePack, appliedRules);

  // Apply tone adjustments
  modified = applyToneAdjustments(modified, adjustment, appliedRules);

  // Apply trait-based modifications
  modified = applyTraits(modified, persona.traits, appliedRules);

  // Calculate tone metrics
  const toneMetrics = calculateToneMetrics(modified);

  return {
    original: content,
    modified,
    appliedRules,
    toneMetrics,
  };
}

/**
 * Apply vocabulary replacements from tone pack
 */
function applyVocabulary(
  content: string,
  tonePack: TonePack,
  appliedRules: string[]
): string {
  let result = content;

  // Apply word replacements
  for (const [original, replacement] of Object.entries(tonePack.vocabulary.replacements)) {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, replacement);
      appliedRules.push(`Replaced "${original}" with "${replacement}"`);
    }
  }

  return result;
}

/**
 * Apply tone adjustments
 */
function applyToneAdjustments(
  content: string,
  adjustment: ToneAdjustment,
  appliedRules: string[]
): string {
  let result = content;

  // Apply formality adjustments
  if (adjustment.formality > 0.3) {
    // More formal: expand contractions
    const contractions: Record<string, string> = {
      "don't": 'do not',
      "won't": 'will not',
      "can't": 'cannot',
      "isn't": 'is not',
      "aren't": 'are not',
      "I'm": 'I am',
      "you're": 'you are',
      "we're": 'we are',
      "it's": 'it is',
      "that's": 'that is',
    };

    for (const [contraction, expansion] of Object.entries(contractions)) {
      const regex = new RegExp(contraction, 'gi');
      if (regex.test(result)) {
        result = result.replace(regex, expansion);
        appliedRules.push(`Expanded contraction: ${contraction}`);
      }
    }
  } else if (adjustment.formality < -0.3) {
    // Less formal: use contractions
    const expansions: Record<string, string> = {
      'do not': "don't",
      'will not': "won't",
      'cannot': "can't",
      'is not': "isn't",
      'are not': "aren't",
    };

    for (const [expansion, contraction] of Object.entries(expansions)) {
      const regex = new RegExp(expansion, 'gi');
      if (regex.test(result)) {
        result = result.replace(regex, contraction);
        appliedRules.push(`Used contraction: ${contraction}`);
      }
    }
  }

  // Apply brevity adjustments
  if (adjustment.brevity > 0.3) {
    // Shorter: remove filler phrases
    const fillers = [
      /\bbasically\b/gi,
      /\bactually\b/gi,
      /\bjust\b/gi,
      /\breally\b/gi,
      /\bI think that\b/gi,
      /\bIn my opinion,\b/gi,
    ];

    for (const filler of fillers) {
      if (filler.test(result)) {
        result = result.replace(filler, '');
        appliedRules.push('Removed filler word');
      }
    }

    // Clean up extra spaces
    result = result.replace(/\s+/g, ' ').trim();
  }

  return result;
}

/**
 * Apply trait-based modifications
 */
function applyTraits(
  content: string,
  traits: PersonaTrait[],
  appliedRules: string[]
): string {
  let result = content;

  // Check for proactive trait
  const proactiveTrait = traits.find(t => t.name.toLowerCase() === 'proactive');
  if (proactiveTrait && proactiveTrait.intensity > 0.5) {
    // Add proactive suggestion if content ends with a period (statement)
    if (result.endsWith('.') && !result.includes('?')) {
      // Don't add if already has suggestions
      if (!result.toLowerCase().includes('you might') &&
          !result.toLowerCase().includes('you could') &&
          !result.toLowerCase().includes('consider')) {
        appliedRules.push('Applied proactive trait');
      }
    }
  }

  return result;
}

/**
 * Calculate combined adjustments from modifiers
 */
function calculateAdjustments(
  modifiers: ToneModifier[],
  context?: {
    isOutreach?: boolean;
    agentType?: string;
    intentType?: string;
  }
): ToneAdjustment {
  const base: ToneAdjustment = {
    formality: 0,
    brevity: 0,
    warmth: 0,
    technicality: 0,
  };

  if (!modifiers.length) return base;

  // Filter applicable modifiers
  const applicable = modifiers.filter(m => {
    if (m.trigger.type === 'agent' && context?.agentType) {
      const match = Array.isArray(m.trigger.match) ? m.trigger.match : [m.trigger.match];
      return match.includes(context.agentType);
    }
    if (m.trigger.type === 'intent' && context?.intentType) {
      const match = Array.isArray(m.trigger.match) ? m.trigger.match : [m.trigger.match];
      return match.includes(context.intentType);
    }
    if (m.trigger.type === 'context' && context?.isOutreach) {
      return m.trigger.match === 'outreach';
    }
    return false;
  });

  // Sort by priority and apply
  applicable.sort((a, b) => b.priority - a.priority);

  for (const modifier of applicable) {
    base.formality += modifier.adjustment.formality;
    base.brevity += modifier.adjustment.brevity;
    base.warmth += modifier.adjustment.warmth;
    base.technicality += modifier.adjustment.technicality;
  }

  // Clamp values to -1 to 1
  return {
    formality: Math.max(-1, Math.min(1, base.formality)),
    brevity: Math.max(-1, Math.min(1, base.brevity)),
    warmth: Math.max(-1, Math.min(1, base.warmth)),
    technicality: Math.max(-1, Math.min(1, base.technicality)),
  };
}

// =============================================================================
// Tone Metrics
// =============================================================================

/**
 * Calculate tone metrics for content
 */
export function calculateToneMetrics(content: string): ToneMetrics {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const wordCount = words.length;

  // Calculate average word length
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;

  // Calculate average sentence length
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : wordCount;

  // Estimate formality (based on word length and contractions)
  const hasContractions = /\b\w+'\w+\b/.test(content);
  const formality = Math.min(1, (avgWordLength - 4) / 4) - (hasContractions ? 0.2 : 0);

  // Estimate brevity (inverse of average sentence length)
  const brevity = 1 - Math.min(1, avgSentenceLength / 25);

  // Estimate warmth (based on presence of warm words)
  const warmWords = ['thank', 'appreciate', 'happy', 'glad', 'hope', 'excited', 'great', 'wonderful'];
  const warmWordCount = warmWords.reduce(
    (count, word) => count + (content.toLowerCase().match(new RegExp(word, 'g'))?.length || 0),
    0
  );
  const warmth = Math.min(1, warmWordCount / 3);

  // Estimate technicality (based on technical terms)
  const techTerms = ['data', 'analysis', 'metrics', 'ROI', 'algorithm', 'optimization', 'integration'];
  const techTermCount = techTerms.reduce(
    (count, term) => count + (content.toLowerCase().match(new RegExp(term, 'gi'))?.length || 0),
    0
  );
  const technicality = Math.min(1, techTermCount / 3);

  // Calculate readability (simplified Flesch-Kincaid-like)
  // Lower values = harder to read
  const readability = Math.max(0, 1 - (avgWordLength * 0.1 + avgSentenceLength * 0.02));

  return {
    formality: Math.max(0, Math.min(1, formality)),
    brevity,
    warmth,
    technicality,
    readability,
    wordCount,
  };
}

// =============================================================================
// Phrase Selection
// =============================================================================

/**
 * Get a greeting phrase based on tone
 */
export function getGreeting(tonePack: TonePack): string {
  const greetings = tonePack.patterns.greetings;
  return greetings[Math.floor(Math.random() * greetings.length)] || '';
}

/**
 * Get a closing phrase based on tone
 */
export function getClosing(tonePack: TonePack): string {
  const closings = tonePack.patterns.closings;
  return closings[Math.floor(Math.random() * closings.length)] || '';
}

/**
 * Get a transition phrase based on tone
 */
export function getTransition(tonePack: TonePack): string {
  const transitions = tonePack.patterns.transitions;
  return transitions[Math.floor(Math.random() * transitions.length)] || '';
}

/**
 * Get a recommendation phrase based on tone
 */
export function getRecommendationPhrase(tonePack: TonePack): string {
  const recommendations = tonePack.patterns.recommendations;
  return recommendations[Math.floor(Math.random() * recommendations.length)] || '';
}

// =============================================================================
// Persona Matching
// =============================================================================

/**
 * Suggest best tone for a given context
 */
export function suggestTone(context: {
  isOutreach: boolean;
  recipientRole?: string;
  urgency?: 'low' | 'medium' | 'high';
  relationship?: 'new' | 'warm' | 'existing';
}): ToneType | OutreachToneType {
  if (context.isOutreach) {
    // Executive for C-suite
    if (context.recipientRole?.toLowerCase().includes('chief') ||
        context.recipientRole?.toLowerCase().includes('ceo') ||
        context.recipientRole?.toLowerCase().includes('cto') ||
        context.recipientRole?.toLowerCase().includes('cfo')) {
      return 'executive';
    }

    // Consultative for warm relationships
    if (context.relationship === 'warm' || context.relationship === 'existing') {
      return 'consultative';
    }

    // Default to consultative for outreach
    return 'consultative';
  }

  // High urgency = concise
  if (context.urgency === 'high') {
    return 'concise';
  }

  // Default to professional
  return 'professional';
}
