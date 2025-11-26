/**
 * Evidence Types - S44
 *
 * Type definitions for evidence collection, signal reasoning, and score justification.
 */

import { AgentType } from '@/lib/stores/siva-store';

// =============================================================================
// Evidence Types
// =============================================================================

/**
 * Evidence source types
 */
export type EvidenceSourceType =
  | 'signal'        // Business signal (hiring, expansion, etc.)
  | 'metric'        // Quantitative metric
  | 'news'          // News article or press release
  | 'profile'       // Company profile data
  | 'comparison'    // Comparison with peers
  | 'trend'         // Historical trend
  | 'social'        // Social media signal
  | 'financial'     // Financial data
  | 'technology'    // Technology adoption signal
  | 'leadership';   // Leadership change

/**
 * Single piece of evidence
 */
export interface Evidence {
  id: string;
  type: EvidenceSourceType;
  source: string;
  title: string;
  content: string;
  confidence: number; // 0-1
  relevance: number;  // 0-1
  timestamp: Date;
  url?: string;
  metadata: Record<string, unknown>;
}

/**
 * Evidence collection result
 */
export interface EvidenceCollection {
  target: string; // Company or entity
  targetType: 'company' | 'sector' | 'region';
  evidence: Evidence[];
  totalCount: number;
  averageConfidence: number;
  collectedAt: Date;
  sources: string[];
}

// =============================================================================
// Reasoning Chain Types
// =============================================================================

/**
 * Reasoning stage names
 */
export type ReasoningStage =
  | 'gather'    // Collect raw evidence
  | 'filter'    // Remove low-quality evidence
  | 'weight'    // Assign importance weights
  | 'combine'   // Synthesize into conclusions
  | 'justify';  // Generate human-readable justification

/**
 * Single step in reasoning chain
 */
export interface ReasoningStep {
  id: string;
  stage: ReasoningStage;
  stepNumber: number;
  name: string;
  description: string;
  inputs: string[];
  output: string;
  evidence: Evidence[];
  duration: number; // ms
  status: 'pending' | 'running' | 'complete' | 'error';
}

/**
 * Complete reasoning chain
 */
export interface ReasoningChain {
  id: string;
  target: string;
  steps: ReasoningStep[];
  conclusion: string;
  confidence: number;
  totalDuration: number;
  createdAt: Date;
}

// =============================================================================
// Score Justification Types
// =============================================================================

/**
 * Q/T/L/E score components
 */
export type ScoreComponent = 'Q' | 'T' | 'L' | 'E' | 'overall';

/**
 * Factor contributing to a score
 */
export interface ScoreFactor {
  id: string;
  name: string;
  description: string;
  contribution: number; // -1 to +1 (negative = reduces score)
  weight: number; // 0-1
  evidence: Evidence[];
}

/**
 * Score justification with evidence
 */
export interface ScoreJustification {
  component: ScoreComponent;
  score: number; // 0-100
  justification: string;
  factors: ScoreFactor[];
  confidence: number;
  generatedAt: Date;
}

/**
 * Full Q/T/L/E justification
 */
export interface QTLEJustification {
  company: string;
  overall: ScoreJustification;
  Q: ScoreJustification; // Qualification
  T: ScoreJustification; // Timing
  L: ScoreJustification; // Likelihood
  E: ScoreJustification; // Engagement
  summary: string;
  generatedAt: Date;
}

// =============================================================================
// Evidence Pack Types (Output-ready bundles)
// =============================================================================

/**
 * Evidence pack for ranking decisions
 */
export interface RankingEvidencePack {
  id: string;
  company: string;
  score: number;
  rank: number;
  reasoning: ReasoningChain;
  justification: QTLEJustification;
  keyInsights: string[];
  differentiators: string[];
  risks: string[];
  generatedAt: Date;
}

/**
 * Evidence pack for outreach recommendations
 */
export interface OutreachEvidencePack {
  id: string;
  company: string;
  contact?: string;
  channel: 'email' | 'linkedin' | 'call';
  reasoning: ReasoningChain;
  whyNow: string[];           // Why reach out now
  whyThis: string[];          // Why this company
  whyYou: string[];           // Why you (personalization hooks)
  talkingPoints: string[];
  avoidTopics: string[];
  suggestedTiming: string;
  generatedAt: Date;
}

/**
 * Evidence pack for discovery results
 */
export interface DiscoveryEvidencePack {
  id: string;
  query: string;
  companies: string[];
  reasoning: ReasoningChain;
  matchCriteria: string[];
  signalsDetected: string[];
  marketContext: string;
  generatedAt: Date;
}

// =============================================================================
// Store Types
// =============================================================================

/**
 * Evidence store state
 */
export interface EvidenceStoreState {
  // Current evidence
  currentEvidence: EvidenceCollection | null;
  currentReasoning: ReasoningChain | null;
  currentJustification: QTLEJustification | null;

  // Evidence packs
  rankingPacks: Map<string, RankingEvidencePack>;
  outreachPacks: Map<string, OutreachEvidencePack>;
  discoveryPacks: Map<string, DiscoveryEvidencePack>;

  // Processing state
  isCollecting: boolean;
  isReasoning: boolean;
  error: string | null;

  // Cache
  evidenceCache: Map<string, EvidenceCollection>;
}
