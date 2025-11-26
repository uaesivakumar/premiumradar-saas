/**
 * Agent Personality & Tone Pack System - S47
 *
 * Persona configuration, tone packs, and content personalization.
 * Gives SIVA consistent voice and adaptable communication style.
 */

// Types
export type {
  ToneType,
  OutreachToneType,
  PersonaConfig,
  PersonaTrait,
  ToneModifier,
  ToneModifierTrigger,
  ToneAdjustment,
  ContextRule,
  RuleCondition,
  TonePack,
  TonePatterns,
  ToneVocabulary,
  ToneExamples,
  PersonalizationEntry,
  LearnedPattern,
  PersonaStoreState,
  PersonaApplicationResult,
  ToneMetrics,
} from './types';

// Tone Pack Registry
export {
  TONE_PACKS,
  getTonePack,
  getAllTonePacks,
  getTonePacksByCategory,
} from './TonePackRegistry';

// Persona Engine
export {
  createDefaultPersona,
  applyPersona,
  calculateToneMetrics,
  getGreeting,
  getClosing,
  getTransition,
  getRecommendationPhrase,
  suggestTone,
} from './PersonaEngine';
