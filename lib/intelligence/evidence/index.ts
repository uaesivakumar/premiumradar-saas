/**
 * Evidence & Signals Reasoning - S44
 *
 * Evidence collection, reasoning chains, and score justification.
 * Provides the WHY behind every score and recommendation.
 */

// Types
export type {
  Evidence,
  EvidenceSourceType,
  EvidenceCollection,
  ReasoningChain,
  ReasoningStep,
  ReasoningStage,
  ScoreComponent,
  ScoreFactor,
  ScoreJustification,
  QTLEJustification,
  RankingEvidencePack,
  OutreachEvidencePack,
  DiscoveryEvidencePack,
  EvidenceStoreState,
} from './types';

// Evidence Collection
export {
  collectEvidence,
  collectBulkEvidence,
  filterByConfidence,
  filterByType,
  getTopEvidence,
} from './EvidenceCollector';

// Signal Reasoning
export {
  buildReasoningChain,
  getStageByName,
  getChainSummary,
  streamReasoningChain,
} from './SignalReasoner';

// Score Justification
export {
  generateQTLEJustification,
  justifyScore,
} from './ScoreJustifier';
