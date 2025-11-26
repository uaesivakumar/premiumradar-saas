/**
 * Score Justifier - S44
 *
 * Generates Q/T/L/E score justifications with evidence.
 * Q = Qualification (fit), T = Timing (urgency), L = Likelihood (probability), E = Engagement (readiness)
 */

import type {
  Evidence,
  EvidenceCollection,
  ReasoningChain,
  ScoreFactor,
  ScoreJustification,
  QTLEJustification,
  ScoreComponent,
} from './types';
import { buildReasoningChain } from './SignalReasoner';

// =============================================================================
// Score Factor Definitions
// =============================================================================

/**
 * Q (Qualification) factors - Does the company fit our ICP?
 */
const Q_FACTORS: Omit<ScoreFactor, 'evidence'>[] = [
  {
    id: 'q-size',
    name: 'Company Size',
    description: 'Organization size matches target segment',
    contribution: 0,
    weight: 0.25,
  },
  {
    id: 'q-industry',
    name: 'Industry Fit',
    description: 'Industry aligns with target verticals',
    contribution: 0,
    weight: 0.3,
  },
  {
    id: 'q-tech',
    name: 'Technology Stack',
    description: 'Current technology indicates compatibility',
    contribution: 0,
    weight: 0.25,
  },
  {
    id: 'q-budget',
    name: 'Budget Indicators',
    description: 'Financial capacity for solution investment',
    contribution: 0,
    weight: 0.2,
  },
];

/**
 * T (Timing) factors - Is now the right time?
 */
const T_FACTORS: Omit<ScoreFactor, 'evidence'>[] = [
  {
    id: 't-signals',
    name: 'Active Signals',
    description: 'Recent buying signals detected',
    contribution: 0,
    weight: 0.35,
  },
  {
    id: 't-initiative',
    name: 'Current Initiatives',
    description: 'Active transformation or growth projects',
    contribution: 0,
    weight: 0.3,
  },
  {
    id: 't-urgency',
    name: 'Urgency Indicators',
    description: 'Time-sensitive needs or deadlines',
    contribution: 0,
    weight: 0.2,
  },
  {
    id: 't-cycle',
    name: 'Budget Cycle',
    description: 'Alignment with planning/budget cycles',
    contribution: 0,
    weight: 0.15,
  },
];

/**
 * L (Likelihood) factors - How likely to convert?
 */
const L_FACTORS: Omit<ScoreFactor, 'evidence'>[] = [
  {
    id: 'l-engagement',
    name: 'Prior Engagement',
    description: 'Previous interactions or touchpoints',
    contribution: 0,
    weight: 0.25,
  },
  {
    id: 'l-intent',
    name: 'Buyer Intent',
    description: 'Demonstrated interest or research activity',
    contribution: 0,
    weight: 0.3,
  },
  {
    id: 'l-competition',
    name: 'Competitive Position',
    description: 'Absence of strong competitor relationships',
    contribution: 0,
    weight: 0.25,
  },
  {
    id: 'l-champion',
    name: 'Champion Presence',
    description: 'Potential internal champion identified',
    contribution: 0,
    weight: 0.2,
  },
];

/**
 * E (Engagement) factors - How ready to engage?
 */
const E_FACTORS: Omit<ScoreFactor, 'evidence'>[] = [
  {
    id: 'e-contact',
    name: 'Contact Access',
    description: 'Availability of decision maker contacts',
    contribution: 0,
    weight: 0.3,
  },
  {
    id: 'e-channel',
    name: 'Channel Preference',
    description: 'Known preferred communication channels',
    contribution: 0,
    weight: 0.2,
  },
  {
    id: 'e-relationship',
    name: 'Relationship Status',
    description: 'Existing relationships or warm introductions',
    contribution: 0,
    weight: 0.3,
  },
  {
    id: 'e-receptivity',
    name: 'Market Receptivity',
    description: 'General openness to vendor outreach',
    contribution: 0,
    weight: 0.2,
  },
];

// =============================================================================
// Score Justification Generator
// =============================================================================

/**
 * Generate full Q/T/L/E justification for a company
 */
export function generateQTLEJustification(
  company: string,
  collection: EvidenceCollection,
  existingScores?: { Q?: number; T?: number; L?: number; E?: number }
): QTLEJustification {
  // Build reasoning chain from evidence
  const reasoning = buildReasoningChain(collection);

  // Generate individual component justifications
  const qJustification = generateComponentJustification(
    'Q',
    collection,
    reasoning,
    Q_FACTORS,
    existingScores?.Q
  );

  const tJustification = generateComponentJustification(
    'T',
    collection,
    reasoning,
    T_FACTORS,
    existingScores?.T
  );

  const lJustification = generateComponentJustification(
    'L',
    collection,
    reasoning,
    L_FACTORS,
    existingScores?.L
  );

  const eJustification = generateComponentJustification(
    'E',
    collection,
    reasoning,
    E_FACTORS,
    existingScores?.E
  );

  // Calculate overall score
  const overallScore =
    qJustification.score * 0.25 +
    tJustification.score * 0.3 +
    lJustification.score * 0.25 +
    eJustification.score * 0.2;

  const overallJustification = generateOverallJustification(
    company,
    overallScore,
    { Q: qJustification, T: tJustification, L: lJustification, E: eJustification },
    reasoning
  );

  // Generate summary
  const summary = generateSummary(company, overallScore, {
    Q: qJustification.score,
    T: tJustification.score,
    L: lJustification.score,
    E: eJustification.score,
  });

  return {
    company,
    overall: overallJustification,
    Q: qJustification,
    T: tJustification,
    L: lJustification,
    E: eJustification,
    summary,
    generatedAt: new Date(),
  };
}

/**
 * Generate justification for a single score component
 */
function generateComponentJustification(
  component: ScoreComponent,
  collection: EvidenceCollection,
  reasoning: ReasoningChain,
  factorTemplates: Omit<ScoreFactor, 'evidence'>[],
  existingScore?: number
): ScoreJustification {
  // Map evidence to factors
  const factors = factorTemplates.map(template => {
    const relevantEvidence = findRelevantEvidence(collection.evidence, template, component);
    const contribution = calculateContribution(relevantEvidence, template);

    return {
      ...template,
      contribution,
      evidence: relevantEvidence,
    };
  });

  // Calculate component score
  const score = existingScore ?? calculateComponentScore(factors);

  // Generate justification text
  const justification = generateJustificationText(component, factors, score);

  // Calculate confidence based on evidence availability
  const confidence = calculateJustificationConfidence(factors);

  return {
    component,
    score,
    justification,
    factors,
    confidence,
    generatedAt: new Date(),
  };
}

/**
 * Find evidence relevant to a factor
 */
function findRelevantEvidence(
  evidence: Evidence[],
  factor: Omit<ScoreFactor, 'evidence'>,
  component: ScoreComponent
): Evidence[] {
  const factorKeywords = getFactorKeywords(factor.id);

  return evidence.filter(e => {
    const text = `${e.title} ${e.content}`.toLowerCase();
    return factorKeywords.some(keyword => text.includes(keyword));
  });
}

/**
 * Get keywords for factor matching
 */
function getFactorKeywords(factorId: string): string[] {
  const keywordMap: Record<string, string[]> = {
    // Q factors
    'q-size': ['employee', 'staff', 'headcount', 'team size', 'workforce'],
    'q-industry': ['banking', 'financial', 'fintech', 'insurance', 'investment'],
    'q-tech': ['technology', 'digital', 'cloud', 'platform', 'system', 'infrastructure'],
    'q-budget': ['revenue', 'profit', 'investment', 'funding', 'capital', 'budget'],

    // T factors
    't-signals': ['announce', 'launch', 'initiative', 'program', 'transformation'],
    't-initiative': ['digital', 'modernization', 'upgrade', 'expansion', 'growth'],
    't-urgency': ['urgent', 'deadline', 'immediate', 'priority', 'critical'],
    't-cycle': ['budget', 'planning', 'fiscal', 'quarter', 'annual'],

    // L factors
    'l-engagement': ['contact', 'meeting', 'conversation', 'interaction', 'touchpoint'],
    'l-intent': ['research', 'evaluate', 'consider', 'explore', 'assess'],
    'l-competition': ['competitor', 'alternative', 'vendor', 'provider', 'partner'],
    'l-champion': ['executive', 'leader', 'champion', 'sponsor', 'advocate'],

    // E factors
    'e-contact': ['email', 'phone', 'linkedin', 'contact', 'reach'],
    'e-channel': ['prefer', 'channel', 'communication', 'outreach', 'engage'],
    'e-relationship': ['relationship', 'connection', 'network', 'introduction', 'referral'],
    'e-receptivity': ['open', 'receptive', 'interested', 'responsive', 'engaged'],
  };

  return keywordMap[factorId] || [];
}

/**
 * Calculate contribution from evidence
 */
function calculateContribution(
  evidence: Evidence[],
  factor: Omit<ScoreFactor, 'evidence'>
): number {
  if (evidence.length === 0) return 0;

  // Average confidence and relevance of matching evidence
  const avgConfidence = evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length;
  const avgRelevance = evidence.reduce((sum, e) => sum + e.relevance, 0) / evidence.length;

  // Contribution ranges from -1 to +1
  // Positive evidence contributes positively
  const baseContribution = (avgConfidence + avgRelevance) / 2;

  // Scale to -1 to +1 range (assuming positive evidence)
  return Math.min(1, Math.max(-1, (baseContribution - 0.5) * 2));
}

/**
 * Calculate component score from weighted factors
 */
function calculateComponentScore(factors: ScoreFactor[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const factor of factors) {
    // Convert contribution (-1 to +1) to score (0 to 100)
    const factorScore = (factor.contribution + 1) * 50;
    weightedSum += factorScore * factor.weight;
    totalWeight += factor.weight;
  }

  if (totalWeight === 0) return 50; // Default to middle

  return Math.round(weightedSum / totalWeight);
}

/**
 * Generate justification text for a component
 */
function generateJustificationText(
  component: ScoreComponent,
  factors: ScoreFactor[],
  score: number
): string {
  const componentNames: Record<ScoreComponent, string> = {
    Q: 'Qualification',
    T: 'Timing',
    L: 'Likelihood',
    E: 'Engagement',
    overall: 'Overall',
  };

  const parts: string[] = [];

  // Opening statement
  const level = score >= 70 ? 'strong' : score >= 50 ? 'moderate' : 'limited';
  parts.push(
    `${componentNames[component]} Score: ${score}/100 (${level})`
  );

  // Factor breakdown
  const significantFactors = factors
    .filter(f => Math.abs(f.contribution) > 0.2)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  if (significantFactors.length > 0) {
    parts.push('\nKey factors:');
    for (const factor of significantFactors.slice(0, 3)) {
      const impact = factor.contribution > 0 ? '↑' : factor.contribution < 0 ? '↓' : '→';
      const evidenceCount = factor.evidence.length;
      parts.push(
        `• ${factor.name} ${impact} (${evidenceCount} evidence item${evidenceCount !== 1 ? 's' : ''})`
      );
    }
  }

  return parts.join('\n');
}

/**
 * Calculate justification confidence
 */
function calculateJustificationConfidence(factors: ScoreFactor[]): number {
  const totalEvidence = factors.reduce((sum, f) => sum + f.evidence.length, 0);

  // Higher confidence with more evidence (cap at 5+ per factor)
  const evidenceFactor = Math.min(1, totalEvidence / (factors.length * 3));

  // Factor in evidence quality
  const avgEvidenceConfidence =
    totalEvidence > 0
      ? factors.reduce(
          (sum, f) =>
            sum + f.evidence.reduce((eSum, e) => eSum + e.confidence, 0),
          0
        ) / totalEvidence
      : 0.5;

  return evidenceFactor * 0.5 + avgEvidenceConfidence * 0.5;
}

/**
 * Generate overall justification
 */
function generateOverallJustification(
  company: string,
  score: number,
  components: Record<'Q' | 'T' | 'L' | 'E', ScoreJustification>,
  reasoning: ReasoningChain
): ScoreJustification {
  const level = score >= 70 ? 'High Priority' : score >= 50 ? 'Medium Priority' : 'Lower Priority';

  // Identify strongest and weakest components
  const scores = [
    { component: 'Qualification', score: components.Q.score },
    { component: 'Timing', score: components.T.score },
    { component: 'Likelihood', score: components.L.score },
    { component: 'Engagement', score: components.E.score },
  ].sort((a, b) => b.score - a.score);

  const strongest = scores[0];
  const weakest = scores[scores.length - 1];

  const justification = [
    `${company}: ${level} (${score.toFixed(0)}/100)`,
    '',
    `Strongest: ${strongest.component} (${strongest.score})`,
    `Area for focus: ${weakest.component} (${weakest.score})`,
    '',
    `Based on ${reasoning.steps[0].evidence.length} evidence items across ${reasoning.steps.length} reasoning stages.`,
  ].join('\n');

  // Collect all factors from components
  const allFactors = [
    ...components.Q.factors,
    ...components.T.factors,
    ...components.L.factors,
    ...components.E.factors,
  ];

  // Average confidence across components
  const avgConfidence =
    (components.Q.confidence +
      components.T.confidence +
      components.L.confidence +
      components.E.confidence) /
    4;

  return {
    component: 'overall',
    score,
    justification,
    factors: allFactors,
    confidence: avgConfidence,
    generatedAt: new Date(),
  };
}

/**
 * Generate executive summary
 */
function generateSummary(
  company: string,
  overallScore: number,
  scores: Record<'Q' | 'T' | 'L' | 'E', number>
): string {
  const priority =
    overallScore >= 70 ? 'high-priority' : overallScore >= 50 ? 'medium-priority' : 'lower-priority';

  const strengths: string[] = [];
  const gaps: string[] = [];

  if (scores.Q >= 70) strengths.push('strong ICP fit');
  else if (scores.Q < 50) gaps.push('qualification concerns');

  if (scores.T >= 70) strengths.push('optimal timing');
  else if (scores.T < 50) gaps.push('timing may not be ideal');

  if (scores.L >= 70) strengths.push('high conversion likelihood');
  else if (scores.L < 50) gaps.push('conversion barriers exist');

  if (scores.E >= 70) strengths.push('ready for engagement');
  else if (scores.E < 50) gaps.push('engagement path unclear');

  let summary = `${company} is a ${priority} opportunity`;

  if (strengths.length > 0) {
    summary += ` with ${strengths.join(' and ')}`;
  }

  if (gaps.length > 0) {
    summary += `. Consider: ${gaps.join(', ')}`;
  }

  return summary + '.';
}

/**
 * Quick score justification for single component
 */
export function justifyScore(
  component: ScoreComponent,
  score: number,
  evidence: Evidence[]
): string {
  const componentDescriptions: Record<ScoreComponent, string> = {
    Q: 'Qualification measures how well the company fits your ideal customer profile.',
    T: 'Timing indicates whether now is the right moment for outreach.',
    L: 'Likelihood reflects the probability of successful conversion.',
    E: 'Engagement assesses readiness and accessibility for outreach.',
    overall: 'Overall score combines all factors for prioritization.',
  };

  const level = score >= 70 ? 'strong' : score >= 50 ? 'moderate' : 'limited';
  const evidenceCount = evidence.length;

  return [
    `${component}: ${score}/100 (${level})`,
    componentDescriptions[component],
    `Based on ${evidenceCount} evidence item${evidenceCount !== 1 ? 's' : ''}.`,
  ].join(' ');
}
