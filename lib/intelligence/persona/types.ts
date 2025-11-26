/**
 * Persona Types - S47
 *
 * Type definitions for agent personality and tone pack system.
 */

import type { AgentType } from '@/lib/stores/siva-store';

// =============================================================================
// Tone Types
// =============================================================================

/**
 * Base tone types for general communication
 */
export type ToneType =
  | 'professional'    // Formal, business-appropriate
  | 'friendly'        // Warm, approachable
  | 'concise'         // Brief, to-the-point
  | 'detailed'        // Comprehensive, thorough
  | 'technical'       // Technical language, precise
  | 'casual';         // Relaxed, conversational

/**
 * Specialized tones for outreach
 */
export type OutreachToneType =
  | 'executive'       // C-suite appropriate
  | 'consultative'    // Advisory, problem-solving
  | 'challenger'      // Thought-provoking
  | 'relationship'    // Connection-focused
  | 'value-driven';   // ROI and benefits focused

// =============================================================================
// Persona Configuration
// =============================================================================

/**
 * Complete persona configuration
 */
export interface PersonaConfig {
  id: string;
  name: string;
  description: string;
  baseTone: ToneType;
  outreachTone: OutreachToneType;
  traits: PersonaTrait[];
  modifiers: ToneModifier[];
  contextRules: ContextRule[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Personality trait
 */
export interface PersonaTrait {
  id: string;
  name: string;
  description: string;
  intensity: number; // 0-1
  examples: string[];
}

/**
 * Tone modifier for specific contexts
 */
export interface ToneModifier {
  id: string;
  name: string;
  trigger: ToneModifierTrigger;
  adjustment: ToneAdjustment;
  priority: number;
}

/**
 * What triggers a tone modifier
 */
export interface ToneModifierTrigger {
  type: 'agent' | 'intent' | 'context' | 'entity' | 'user_preference';
  match: string | string[];
}

/**
 * How to adjust the tone
 */
export interface ToneAdjustment {
  formality: number;    // -1 to +1 (less to more formal)
  brevity: number;      // -1 to +1 (longer to shorter)
  warmth: number;       // -1 to +1 (cooler to warmer)
  technicality: number; // -1 to +1 (simpler to more technical)
}

/**
 * Context-based rule for tone application
 */
export interface ContextRule {
  id: string;
  name: string;
  condition: RuleCondition;
  applyTone: Partial<ToneAdjustment>;
  priority: number;
}

/**
 * Condition for applying a rule
 */
export interface RuleCondition {
  type: 'always' | 'agent' | 'intent' | 'time' | 'user';
  operator: 'equals' | 'contains' | 'startsWith' | 'regex';
  value: string | string[];
}

// =============================================================================
// Tone Pack Types
// =============================================================================

/**
 * Tone pack - collection of language patterns for a tone
 */
export interface TonePack {
  id: string;
  name: string;
  tone: ToneType | OutreachToneType;
  patterns: TonePatterns;
  vocabulary: ToneVocabulary;
  examples: ToneExamples;
}

/**
 * Language patterns for a tone
 */
export interface TonePatterns {
  greetings: string[];
  closings: string[];
  transitions: string[];
  acknowledgments: string[];
  clarifications: string[];
  recommendations: string[];
}

/**
 * Vocabulary preferences for a tone
 */
export interface ToneVocabulary {
  preferred: string[];
  avoid: string[];
  replacements: Record<string, string>; // word -> preferred alternative
}

/**
 * Example phrases for each tone
 */
export interface ToneExamples {
  shortResponses: string[];
  explanations: string[];
  recommendations: string[];
  outreachOpeners: string[];
  followUps: string[];
}

// =============================================================================
// Personalization Types
// =============================================================================

/**
 * User-specific personalization entry
 */
export interface PersonalizationEntry {
  id: string;
  userId?: string;
  companyId?: string;
  preferredTone: ToneType;
  preferredOutreachTone: OutreachToneType;
  customModifiers: ToneModifier[];
  learnedPatterns: LearnedPattern[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pattern learned from user interactions
 */
export interface LearnedPattern {
  id: string;
  type: 'preference' | 'style' | 'terminology';
  pattern: string;
  frequency: number;
  confidence: number;
  lastSeen: Date;
}

// =============================================================================
// Store Types
// =============================================================================

/**
 * Persona store state
 */
export interface PersonaStoreState {
  // Current configuration
  activePersona: PersonaConfig | null;
  activeTonePack: TonePack | null;

  // Available options
  personas: Map<string, PersonaConfig>;
  tonePacks: Map<string, TonePack>;

  // Personalization
  personalization: PersonalizationEntry | null;

  // Processing state
  isApplying: boolean;
  error: string | null;
}

// =============================================================================
// Output Types
// =============================================================================

/**
 * Result of applying persona to content
 */
export interface PersonaApplicationResult {
  original: string;
  modified: string;
  appliedRules: string[];
  toneMetrics: ToneMetrics;
}

/**
 * Metrics about the tone of content
 */
export interface ToneMetrics {
  formality: number;
  brevity: number;
  warmth: number;
  technicality: number;
  readability: number;
  wordCount: number;
}
