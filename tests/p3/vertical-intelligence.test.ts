/**
 * P3 Vertical Intelligence Tests
 * Sprint P3: Deep Vertical Intelligence Packs
 *
 * BANKING ONLY - Other verticals are UI placeholders.
 * Tests for signal libraries, scoring engines, patterns, personas, and prompts.
 */

import { describe, it, expect } from 'vitest';
import type { Vertical } from '../../lib/intelligence/context/types';

const ACTIVE_VERTICAL: Vertical = 'banking';
const PLACEHOLDER_VERTICALS: Vertical[] = ['insurance', 'real-estate', 'recruitment', 'saas-sales'];

// =============================================================================
// SIGNAL LIBRARY TESTS
// =============================================================================

describe('Signal Libraries', () => {
  it('should have signals for banking vertical', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    const signals = getSignalsForVertical('banking');
    expect(signals).toBeDefined();
    expect(Array.isArray(signals)).toBe(true);
    expect(signals.length).toBeGreaterThan(0);
  });

  it('should have at least 25 signals for banking', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    const signals = getSignalsForVertical('banking');
    expect(signals.length).toBeGreaterThanOrEqual(25);
  });

  it('should return empty array for placeholder verticals', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    for (const vertical of PLACEHOLDER_VERTICALS) {
      const signals = getSignalsForVertical(vertical);
      expect(signals).toEqual([]);
    }
  });

  it('should have required fields on each banking signal', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    const signals = getSignalsForVertical('banking');

    for (const signal of signals) {
      expect(signal.id).toBeDefined();
      expect(signal.name).toBeDefined();
      expect(signal.description).toBeDefined();
      expect(signal.category).toBeDefined();
      expect(signal.subcategory).toBeDefined();
      expect(signal.weight).toBeDefined();
      expect(signal.relevanceFactors).toBeDefined();
      expect(signal.dataSources).toBeDefined();
      expect(signal.decayDays).toBeDefined();
      expect(signal.confidenceThreshold).toBeDefined();
    }
  });

  it('should have valid categories on banking signals', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');
    const validCategories = ['intent', 'timing', 'engagement', 'quality', 'risk'];

    const signals = getSignalsForVertical('banking');

    for (const signal of signals) {
      expect(validCategories).toContain(signal.category);
    }
  });

  it('should have weights between -1 and 1', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    const signals = getSignalsForVertical('banking');

    for (const signal of signals) {
      expect(signal.weight).toBeGreaterThanOrEqual(-1);
      expect(signal.weight).toBeLessThanOrEqual(1);
    }
  });

  it('should have unique signal IDs', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    const signals = getSignalsForVertical('banking');
    const ids = signals.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// =============================================================================
// SCORING ENGINE TESTS
// =============================================================================

describe('Scoring Engines', () => {
  it('should create scoring engine for banking', async () => {
    const { createScoringEngine } = await import('../../lib/vertical/scoring');

    const engine = createScoringEngine('banking');
    expect(engine).toBeDefined();
    expect(typeof engine.calculate).toBe('function');
  });

  it('should return valid scoring result', async () => {
    const { createScoringEngine } = await import('../../lib/vertical/scoring');
    const { getBankingSignals } = await import('../../lib/vertical/signals');

    const signals = getBankingSignals().slice(0, 3);
    const matches: any[] = signals.map(s => ({
      signalId: s.id,
      signal: s,
      confidence: 0.8,
      detectedAt: new Date(),
    }));

    const engine = createScoringEngine('banking');
    const result = engine.calculate({
      vertical: 'banking',
      signals: matches,
    });

    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(['hot', 'warm', 'cold']).toContain(result.grade);
    expect(result.categoryScores).toBeDefined();
    expect(result.appliedBoosts).toBeDefined();
    expect(result.signalContributions).toBeDefined();
    expect(result.confidence).toBeDefined();
  });

  it('should apply boosts for multiple signals', async () => {
    const { createScoringEngine } = await import('../../lib/vertical/scoring');
    const { getBankingSignals } = await import('../../lib/vertical/signals');

    const signals = getBankingSignals().slice(0, 5);
    const matches: any[] = signals.map(s => ({
      signalId: s.id,
      signal: s,
      confidence: 0.85,
      detectedAt: new Date(),
    }));

    const engine = createScoringEngine('banking');
    const result = engine.calculate({
      vertical: 'banking',
      signals: matches,
    });

    expect(result.appliedBoosts).toContain('multiSignal');
  });

  it('should return cold grade for no signals', async () => {
    const { createScoringEngine } = await import('../../lib/vertical/scoring');

    const engine = createScoringEngine('banking');
    const result = engine.calculate({
      vertical: 'banking',
      signals: [],
    });

    expect(result.overallScore).toBe(0);
    expect(result.grade).toBe('cold');
  });
});

// =============================================================================
// PATTERN MATCHING TESTS
// =============================================================================

describe('Pattern Matching', () => {
  it('should have patterns for banking vertical', async () => {
    const { getPatternsForVertical } = await import('../../lib/vertical/patterns');

    const patterns = getPatternsForVertical('banking');
    expect(patterns).toBeDefined();
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should return empty array for placeholder verticals', async () => {
    const { getPatternsForVertical } = await import('../../lib/vertical/patterns');

    for (const vertical of PLACEHOLDER_VERTICALS) {
      const patterns = getPatternsForVertical(vertical);
      expect(patterns).toEqual([]);
    }
  });

  it('should have required fields on banking patterns', async () => {
    const { getPatternsForVertical } = await import('../../lib/vertical/patterns');

    const patterns = getPatternsForVertical('banking');

    for (const pattern of patterns) {
      expect(pattern.id).toBeDefined();
      expect(pattern.name).toBeDefined();
      expect(pattern.description).toBeDefined();
      expect(pattern.vertical).toBe('banking');
      expect(pattern.priority).toBeDefined();
      expect(pattern.requiredSignals).toBeDefined();
      expect(pattern.insight).toBeDefined();
      expect(pattern.suggestedAction).toBeDefined();
      expect(pattern.scoreBoost).toBeDefined();
    }
  });

  it('should match patterns when required signals present', async () => {
    const { matchPatterns } = await import('../../lib/vertical/patterns');
    const { getBankingSignals } = await import('../../lib/vertical/signals');

    // Get signals needed for 'bank-expansion-payroll' pattern
    const allSignals = getBankingSignals();
    const hiringSignal = allSignals.find(s => s.id === 'bank-hiring-expansion');
    const headcountSignal = allSignals.find(s => s.id === 'bank-headcount-jump');

    expect(hiringSignal).toBeDefined();
    expect(headcountSignal).toBeDefined();

    const matches: any[] = [
      { signalId: hiringSignal!.id, signal: hiringSignal!, confidence: 0.8, detectedAt: new Date() },
      { signalId: headcountSignal!.id, signal: headcountSignal!, confidence: 0.8, detectedAt: new Date() },
    ];

    const patternMatches = matchPatterns('banking', matches);
    expect(patternMatches.length).toBeGreaterThan(0);

    // Should match 'bank-expansion-payroll' pattern
    const expansionPattern = patternMatches.find(m => m.pattern.id === 'bank-expansion-payroll');
    expect(expansionPattern).toBeDefined();
  });
});

// =============================================================================
// PERSONA TESTS
// =============================================================================

describe('Deep Personas', () => {
  it('should have deep persona for banking', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    const persona = getDeepPersona('banking');
    expect(persona).toBeDefined();
    expect(persona).not.toBeNull();
    expect(persona!.id).toBeDefined();
    expect(persona!.name).toBeDefined();
  });

  it('should return null for placeholder verticals', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    for (const vertical of PLACEHOLDER_VERTICALS) {
      const persona = getDeepPersona(vertical);
      expect(persona).toBeNull();
    }
  });

  it('should have industry knowledge for banking', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    const persona = getDeepPersona('banking');
    expect(persona).not.toBeNull();
    expect(persona!.industryKnowledge).toBeDefined();
    expect(persona!.industryKnowledge.keyTerms).toBeDefined();
    expect(persona!.industryKnowledge.keyTerms.length).toBeGreaterThan(0);
    expect(persona!.industryKnowledge.painPoints).toBeDefined();
    expect(persona!.industryKnowledge.decisionMakers).toBeDefined();
  });

  it('should have conversation patterns for banking', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    const persona = getDeepPersona('banking');
    expect(persona).not.toBeNull();
    expect(persona!.conversationPatterns).toBeDefined();
    expect(persona!.conversationPatterns.openers).toBeDefined();
    expect(persona!.conversationPatterns.openers.length).toBeGreaterThan(0);
    expect(persona!.conversationPatterns.discoveryQuestions).toBeDefined();
    expect(persona!.conversationPatterns.closingStatements).toBeDefined();
  });

  it('should have objection handling for banking', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    const persona = getDeepPersona('banking');
    expect(persona).not.toBeNull();
    expect(persona!.objectionHandling).toBeDefined();
    expect(persona!.objectionHandling.length).toBeGreaterThan(0);

    for (const objection of persona!.objectionHandling) {
      expect(objection.objection).toBeDefined();
      expect(objection.category).toBeDefined();
      expect(objection.response).toBeDefined();
      expect(objection.followUp).toBeDefined();
    }
  });

  it('should have value propositions for banking', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    const persona = getDeepPersona('banking');
    expect(persona).not.toBeNull();
    expect(persona!.valuePropositions).toBeDefined();
    expect(persona!.valuePropositions.length).toBeGreaterThan(0);

    for (const vp of persona!.valuePropositions) {
      expect(vp.headline).toBeDefined();
      expect(vp.painPoint).toBeDefined();
      expect(vp.solution).toBeDefined();
      expect(vp.proof).toBeDefined();
      expect(vp.callToAction).toBeDefined();
    }
  });
});

// =============================================================================
// PROMPT PACK TESTS
// =============================================================================

describe('SIVA Prompt Packs', () => {
  it('should have prompt pack for banking', async () => {
    const { getPromptPack } = await import('../../lib/vertical/prompts');

    const pack = getPromptPack('banking');
    expect(pack).toBeDefined();
    expect(pack).not.toBeNull();
    expect(pack!.vertical).toBe('banking');
  });

  it('should return null for placeholder verticals', async () => {
    const { getPromptPack } = await import('../../lib/vertical/prompts');

    for (const vertical of PLACEHOLDER_VERTICALS) {
      const pack = getPromptPack(vertical);
      expect(pack).toBeNull();
    }
  });

  it('should have system prompt for banking', async () => {
    const { getPromptPack } = await import('../../lib/vertical/prompts');

    const pack = getPromptPack('banking');
    expect(pack).not.toBeNull();
    expect(pack!.systemPrompt).toBeDefined();
    expect(pack!.systemPrompt.length).toBeGreaterThan(100);
  });

  it('should have reasoning framework for banking', async () => {
    const { getPromptPack } = await import('../../lib/vertical/prompts');

    const pack = getPromptPack('banking');
    expect(pack).not.toBeNull();
    expect(pack!.reasoningFramework).toBeDefined();
    expect(pack!.reasoningFramework.signalInterpretation).toBeDefined();
    expect(pack!.reasoningFramework.opportunityScoring).toBeDefined();
    expect(pack!.reasoningFramework.outreachStrategy).toBeDefined();
    expect(pack!.reasoningFramework.objectionPrediction).toBeDefined();
  });

  it('should have output templates for banking', async () => {
    const { getPromptPack } = await import('../../lib/vertical/prompts');

    const pack = getPromptPack('banking');
    expect(pack).not.toBeNull();
    expect(pack!.outputTemplates).toBeDefined();
    expect(pack!.outputTemplates.leadSummary).toBeDefined();
    expect(pack!.outputTemplates.outreachMessage).toBeDefined();
    expect(pack!.outputTemplates.followUpMessage).toBeDefined();
    expect(pack!.outputTemplates.callScript).toBeDefined();
    expect(pack!.outputTemplates.insightBrief).toBeDefined();
  });

  it('should build SIVA prompt with context for banking', async () => {
    const { buildSIVAPrompt } = await import('../../lib/vertical/prompts');

    const prompt = buildSIVAPrompt('banking', {
      signals: ['Hiring Expansion', 'Funding Round'],
      task: 'Analyze this opportunity for payroll banking',
    });

    expect(prompt).toBeDefined();
    expect(prompt).not.toBeNull();
    expect(prompt).toContain('banking');
    expect(prompt).toContain('Hiring Expansion');
    expect(prompt).toContain('Funding Round');
    expect(prompt).toContain('payroll banking');
  });

  it('should return null for buildSIVAPrompt on placeholder verticals', async () => {
    const { buildSIVAPrompt } = await import('../../lib/vertical/prompts');

    for (const vertical of PLACEHOLDER_VERTICALS) {
      const prompt = buildSIVAPrompt(vertical, {
        signals: ['Test Signal'],
        task: 'Test task',
      });
      expect(prompt).toBeNull();
    }
  });
});

// =============================================================================
// UNIFIED INTELLIGENCE TESTS
// =============================================================================

describe('Unified Vertical Intelligence', () => {
  it('should get complete intelligence context for banking', async () => {
    const { getVerticalIntelligence } = await import('../../lib/vertical');

    const context = getVerticalIntelligence('banking');

    expect(context).toBeDefined();
    expect(context.vertical).toBe('banking');
    expect(context.signals.length).toBeGreaterThan(0);
    expect(context.scoringConfig).not.toBeNull();
    expect(context.patterns.length).toBeGreaterThan(0);
    expect(context.persona).not.toBeNull();
    expect(context.promptPack).not.toBeNull();
  });

  it('should return empty/null for placeholder verticals', async () => {
    const { getVerticalIntelligence } = await import('../../lib/vertical');

    for (const vertical of PLACEHOLDER_VERTICALS) {
      const context = getVerticalIntelligence(vertical);

      expect(context).toBeDefined();
      expect(context.vertical).toBe(vertical);
      expect(context.signals).toEqual([]);
      expect(context.scoringConfig).toBeNull();
      expect(context.patterns).toEqual([]);
      expect(context.persona).toBeNull();
      expect(context.promptPack).toBeNull();
    }
  });

  it('should have isVerticalActive helper', async () => {
    const { isVerticalActive } = await import('../../lib/vertical');

    expect(isVerticalActive('banking')).toBe(true);
    for (const vertical of PLACEHOLDER_VERTICALS) {
      expect(isVerticalActive(vertical)).toBe(false);
    }
  });

  it('should have library metadata with active/placeholder verticals', async () => {
    const { VERTICAL_INTELLIGENCE_METADATA } = await import('../../lib/vertical');

    expect(VERTICAL_INTELLIGENCE_METADATA).toBeDefined();
    expect(VERTICAL_INTELLIGENCE_METADATA.version).toBeDefined();
    expect(VERTICAL_INTELLIGENCE_METADATA.activeVerticals).toContain('banking');
    expect(VERTICAL_INTELLIGENCE_METADATA.activeVerticals).toHaveLength(1);
    expect(VERTICAL_INTELLIGENCE_METADATA.placeholderVerticals).toHaveLength(4);
  });
});

// =============================================================================
// BANKING-SPECIFIC CONTENT TESTS
// =============================================================================

describe('Banking-Specific Content', () => {
  it('Banking signals should include sales trigger keywords', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');
    const signals = getSignalsForVertical('banking');

    const signalNames = signals.map(s => s.name.toLowerCase()).join(' ');
    // These are sales trigger signals, not industry intelligence
    expect(signalNames).toContain('hiring');
    expect(signalNames).toContain('expansion');
  });

  it('Banking signals should NOT include life event keywords', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');
    const signals = getSignalsForVertical('banking');

    const signalNames = signals.map(s => s.name.toLowerCase()).join(' ');
    // Banking targets companies, not individuals with life events
    expect(signalNames).not.toContain('marriage');
    expect(signalNames).not.toContain('new parent');
    expect(signalNames).not.toContain('rental expiry');
  });

  it('Banking prompt should reference sales triggers from OS', async () => {
    const { getPromptPack } = await import('../../lib/vertical/prompts');

    const pack = getPromptPack('banking');
    expect(pack).not.toBeNull();

    // Should reference OS-derived sales triggers
    expect(pack!.systemPrompt).toContain('SALES TRIGGER SIGNALS');
    expect(pack!.systemPrompt).toContain('Hiring expansion');
    expect(pack!.systemPrompt).toContain('Office opening');
  });
});
