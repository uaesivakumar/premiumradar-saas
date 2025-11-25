/**
 * Demo Module
 *
 * Exports all demo mode functionality.
 */

// Types
export type {
  DemoModeState,
  DemoLimits,
  LockedFeature,
  BookingCTA,
  BookingCTATrigger,
  DemoSession,
  DemoMetrics,
  FakeDomain,
  FakeCompany,
  FakeContact,
  FakePipelineDeal,
  PipelineStage,
  DemoScoreResult,
  DemoAnalysisResult,
} from './types';

// Demo mode
export {
  useDemoModeStore,
  DEFAULT_DEMO_LIMITS,
  LOCKED_FEATURES,
  getLockedFeatureInfo,
  formatRemainingTime,
  shouldAutoStartDemo,
} from './demo-mode';

// Fake data generators
export {
  generateFakeDomain,
  generateFakeDomains,
  generateFakeContact,
  generateFakeCompany,
  generateFakeCompanies,
  generateFakePipelineDeal,
  generateFakePipeline,
  generateFakeDiscoveryList,
  generateFakeSearchSuggestions,
} from './fake-data';

// Safe scoring
export {
  DEMO_DISCLAIMER,
  DEMO_ANALYSIS_DISCLAIMER,
  generateDemoScore,
  generateDemoScores,
  generateDemoAnalysis,
  generateDemoComparison,
  formatDemoPrice,
} from './safe-scoring';
