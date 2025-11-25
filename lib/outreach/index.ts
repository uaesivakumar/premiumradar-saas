/**
 * Outreach Module
 *
 * AI-powered outreach messaging for banking vertical.
 */

// Types
export type {
  OutreachChannel,
  ToneStyle,
  BankingPersona,
  OutreachMessage,
  OutreachTiming,
  OutreachTemplate,
  ComposerState,
} from './types';

// Templates
export {
  BANKING_TEMPLATES,
  getMatchingTemplates,
  fillTemplate,
} from './templates';

// Tone
export {
  getRecommendedTone,
  getToneConfig,
  adjustGreeting,
  getSignOff,
  applyBankingToneAdjustments,
  analyzeTone,
  BANKING_TONE_RULES,
} from './tone';

// Timing
export {
  calculateTiming,
  getTimingExplanation,
} from './timing';
