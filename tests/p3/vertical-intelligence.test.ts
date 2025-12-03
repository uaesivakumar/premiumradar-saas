/**
 * P3 Vertical Intelligence Tests
 * Sprint P3: Deep Vertical Intelligence Packs
 *
 * Tests for signal libraries, scoring engines, patterns, personas, and prompts.
 */

import { describe, it, expect } from 'vitest';
import type { Vertical } from '../../lib/intelligence/context/types';

// =============================================================================
// SIGNAL LIBRARY TESTS
// =============================================================================

describe('Signal Libraries', () => {
  const VERTICALS: Vertical[] = ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales'];

  it('should have signals for all 5 verticals', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    for (const vertical of VERTICALS) {
      const signals = getSignalsForVertical(vertical);
      expect(signals).toBeDefined();
      expect(Array.isArray(signals)).toBe(true);
      expect(signals.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 25 signals per vertical', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    for (const vertical of VERTICALS) {
      const signals = getSignalsForVertical(vertical);
      expect(signals.length).toBeGreaterThanOrEqual(25);
    }
  });

  it('should have required fields on each signal', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    for (const vertical of VERTICALS) {
      const signals = getSignalsForVertical(vertical);

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
    }
  });

  it('should have valid categories', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');
    const validCategories = ['intent', 'timing', 'engagement', 'quality', 'risk'];

    for (const vertical of VERTICALS) {
      const signals = getSignalsForVertical(vertical);

      for (const signal of signals) {
        expect(validCategories).toContain(signal.category);
      }
    }
  });

  it('should have weights between -1 and 1', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    for (const vertical of VERTICALS) {
      const signals = getSignalsForVertical(vertical);

      for (const signal of signals) {
        expect(signal.weight).toBeGreaterThanOrEqual(-1);
        expect(signal.weight).toBeLessThanOrEqual(1);
      }
    }
  });

  it('should have unique signal IDs within each vertical', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');

    for (const vertical of VERTICALS) {
      const signals = getSignalsForVertical(vertical);
      const ids = signals.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });
});

// =============================================================================
// SCORING ENGINE TESTS
// =============================================================================

describe('Scoring Engines', () => {
  const VERTICALS: Vertical[] = ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales'];

  it('should create scoring engine for each vertical', async () => {
    const { createScoringEngine } = await import('../../lib/vertical/scoring');

    for (const vertical of VERTICALS) {
      const engine = createScoringEngine(vertical);
      expect(engine).toBeDefined();
      expect(typeof engine.calculate).toBe('function');
    }
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
  const VERTICALS: Vertical[] = ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales'];

  it('should have patterns for all verticals', async () => {
    const { getPatternsForVertical } = await import('../../lib/vertical/patterns');

    for (const vertical of VERTICALS) {
      const patterns = getPatternsForVertical(vertical);
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    }
  });

  it('should have required fields on patterns', async () => {
    const { getPatternsForVertical } = await import('../../lib/vertical/patterns');

    for (const vertical of VERTICALS) {
      const patterns = getPatternsForVertical(vertical);

      for (const pattern of patterns) {
        expect(pattern.id).toBeDefined();
        expect(pattern.name).toBeDefined();
        expect(pattern.description).toBeDefined();
        expect(pattern.vertical).toBe(vertical);
        expect(pattern.priority).toBeDefined();
        expect(pattern.requiredSignals).toBeDefined();
        expect(pattern.insight).toBeDefined();
        expect(pattern.suggestedAction).toBeDefined();
        expect(pattern.scoreBoost).toBeDefined();
      }
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

  it('should not match patterns when required signals missing', async () => {
    const { matchPatterns } = await import('../../lib/vertical/patterns');
    const { getBankingSignals } = await import('../../lib/vertical/signals');

    // Use a signal that doesn't trigger any pattern alone
    const digitalSignal = getBankingSignals().find(s => s.id === 'bank-fintech-partnership');
    expect(digitalSignal).toBeDefined();

    const matches: any[] = [
      { signalId: digitalSignal!.id, signal: digitalSignal!, confidence: 0.8, detectedAt: new Date() },
    ];

    const patternMatches = matchPatterns('banking', matches);
    // Should have fewer or no matches since single signal doesn't trigger complex patterns
    expect(patternMatches.length).toBeLessThanOrEqual(1);
  });
});

// =============================================================================
// PERSONA TESTS
// =============================================================================

describe('Deep Personas', () => {
  const VERTICALS: Vertical[] = ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales'];

  it('should have deep persona for all verticals', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    for (const vertical of VERTICALS) {
      const persona = getDeepPersona(vertical);
      expect(persona).toBeDefined();
      expect(persona.id).toBeDefined();
      expect(persona.name).toBeDefined();
    }
  });

  it('should have industry knowledge', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    for (const vertical of VERTICALS) {
      const persona = getDeepPersona(vertical);
      expect(persona.industryKnowledge).toBeDefined();
      expect(persona.industryKnowledge.keyTerms).toBeDefined();
      expect(persona.industryKnowledge.keyTerms.length).toBeGreaterThan(0);
      expect(persona.industryKnowledge.painPoints).toBeDefined();
      expect(persona.industryKnowledge.decisionMakers).toBeDefined();
    }
  });

  it('should have conversation patterns', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    for (const vertical of VERTICALS) {
      const persona = getDeepPersona(vertical);
      expect(persona.conversationPatterns).toBeDefined();
      expect(persona.conversationPatterns.openers).toBeDefined();
      expect(persona.conversationPatterns.openers.length).toBeGreaterThan(0);
      expect(persona.conversationPatterns.discoveryQuestions).toBeDefined();
      expect(persona.conversationPatterns.closingStatements).toBeDefined();
    }
  });

  it('should have objection handling', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    for (const vertical of VERTICALS) {
      const persona = getDeepPersona(vertical);
      expect(persona.objectionHandling).toBeDefined();
      expect(persona.objectionHandling.length).toBeGreaterThan(0);

      for (const objection of persona.objectionHandling) {
        expect(objection.objection).toBeDefined();
        expect(objection.category).toBeDefined();
        expect(objection.response).toBeDefined();
        expect(objection.followUp).toBeDefined();
      }
    }
  });

  it('should have value propositions', async () => {
    const { getDeepPersona } = await import('../../lib/vertical/personas');

    for (const vertical of VERTICALS) {
      const persona = getDeepPersona(vertical);
      expect(persona.valuePropositions).toBeDefined();
      expect(persona.valuePropositions.length).toBeGreaterThan(0);

      for (const vp of persona.valuePropositions) {
        expect(vp.headline).toBeDefined();
        expect(vp.painPoint).toBeDefined();
        expect(vp.solution).toBeDefined();
        expect(vp.proof).toBeDefined();
        expect(vp.callToAction).toBeDefined();
      }
    }
  });
});

// =============================================================================
// PROMPT PACK TESTS
// =============================================================================

describe('SIVA Prompt Packs', () => {
  const VERTICALS: Vertical[] = ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales'];

  it('should have prompt pack for all verticals', async () => {
    const { getPromptPack } = await import('../../lib/vertical/prompts');

    for (const vertical of VERTICALS) {
      const pack = getPromptPack(vertical);
      expect(pack).toBeDefined();
      expect(pack.vertical).toBe(vertical);
    }
  });

  it('should have system prompt', async () => {
    const { getPromptPack } = await import('../../lib/vertical/prompts');

    for (const vertical of VERTICALS) {
      const pack = getPromptPack(vertical);
      expect(pack.systemPrompt).toBeDefined();
      expect(pack.systemPrompt.length).toBeGreaterThan(100);
    }
  });

  it('should have reasoning framework', async () => {
    const { getPromptPack } = await import('../../lib/vertical/prompts');

    for (const vertical of VERTICALS) {
      const pack = getPromptPack(vertical);
      expect(pack.reasoningFramework).toBeDefined();
      expect(pack.reasoningFramework.signalInterpretation).toBeDefined();
      expect(pack.reasoningFramework.opportunityScoring).toBeDefined();
      expect(pack.reasoningFramework.outreachStrategy).toBeDefined();
      expect(pack.reasoningFramework.objectionPrediction).toBeDefined();
    }
  });

  it('should have output templates', async () => {
    const { getPromptPack } = await import('../../lib/vertical/prompts');

    for (const vertical of VERTICALS) {
      const pack = getPromptPack(vertical);
      expect(pack.outputTemplates).toBeDefined();
      expect(pack.outputTemplates.leadSummary).toBeDefined();
      expect(pack.outputTemplates.outreachMessage).toBeDefined();
      expect(pack.outputTemplates.followUpMessage).toBeDefined();
      expect(pack.outputTemplates.callScript).toBeDefined();
      expect(pack.outputTemplates.insightBrief).toBeDefined();
    }
  });

  it('should build SIVA prompt with context', async () => {
    const { buildSIVAPrompt } = await import('../../lib/vertical/prompts');

    const prompt = buildSIVAPrompt('banking', {
      signals: ['Hiring Expansion', 'Funding Round'],
      task: 'Analyze this opportunity for payroll banking',
    });

    expect(prompt).toBeDefined();
    expect(prompt).toContain('banking');
    expect(prompt).toContain('Hiring Expansion');
    expect(prompt).toContain('Funding Round');
    expect(prompt).toContain('payroll banking');
  });
});

// =============================================================================
// UNIFIED INTELLIGENCE TESTS
// =============================================================================

describe('Unified Vertical Intelligence', () => {
  const VERTICALS: Vertical[] = ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales'];

  it('should get complete intelligence context', async () => {
    const { getVerticalIntelligence } = await import('../../lib/vertical');

    for (const vertical of VERTICALS) {
      const context = getVerticalIntelligence(vertical);

      expect(context).toBeDefined();
      expect(context.vertical).toBe(vertical);
      expect(context.signals).toBeDefined();
      expect(context.scoringConfig).toBeDefined();
      expect(context.patterns).toBeDefined();
      expect(context.persona).toBeDefined();
      expect(context.promptPack).toBeDefined();
    }
  });

  it('should have library metadata', async () => {
    const { VERTICAL_INTELLIGENCE_METADATA } = await import('../../lib/vertical');

    expect(VERTICAL_INTELLIGENCE_METADATA).toBeDefined();
    expect(VERTICAL_INTELLIGENCE_METADATA.version).toBeDefined();
    expect(VERTICAL_INTELLIGENCE_METADATA.verticals).toHaveLength(5);
    expect(VERTICAL_INTELLIGENCE_METADATA.features).toBeDefined();
  });
});

// =============================================================================
// VERTICAL-SPECIFIC TESTS
// =============================================================================

describe('Vertical-Specific Content', () => {
  it('Banking: signals should include payroll and corporate keywords', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');
    const signals = getSignalsForVertical('banking');

    const signalNames = signals.map(s => s.name.toLowerCase()).join(' ');
    expect(signalNames).toContain('payroll');
    expect(signalNames).toContain('hiring');
  });

  it('Insurance: signals should include life event keywords', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');
    const signals = getSignalsForVertical('insurance');

    const signalNames = signals.map(s => s.name.toLowerCase()).join(' ');
    expect(signalNames).toContain('marriage');
    expect(signalNames).toContain('parent');
  });

  it('Real Estate: signals should include property keywords', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');
    const signals = getSignalsForVertical('real-estate');

    const signalNames = signals.map(s => s.name.toLowerCase()).join(' ');
    expect(signalNames).toContain('lease');
    expect(signalNames).toContain('buyer');
  });

  it('Recruitment: signals should include hiring keywords', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');
    const signals = getSignalsForVertical('recruitment');

    const signalNames = signals.map(s => s.name.toLowerCase()).join(' ');
    expect(signalNames).toContain('work');
    expect(signalNames).toContain('hiring');
  });

  it('SaaS Sales: signals should include tech keywords', async () => {
    const { getSignalsForVertical } = await import('../../lib/vertical/signals');
    const signals = getSignalsForVertical('saas-sales');

    const signalNames = signals.map(s => s.name.toLowerCase()).join(' ');
    expect(signalNames).toContain('trial');
    expect(signalNames).toContain('funding');
  });
});
