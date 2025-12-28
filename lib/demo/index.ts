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

// S316-S320: Enterprise Demo System

// Demo Provisioning (S316-S317)
export {
  getDemoPolicy,
  provisionDemoEnterprise,
  addDemoUser,
  isDemoExpired,
  getDemoStatus,
  demoProvisioner,
} from './demo-provisioner';

export type {
  DemoEnterpriseConfig,
  DemoProvisionResult,
} from './demo-provisioner';

// Demo Seeding (S318)
export {
  seedDemoWorkspace,
  clearDemoSeedData,
  demoSeeder,
} from './demo-seeder';

export type {
  DemoSeedConfig,
  DemoSeedResult,
} from './demo-seeder';

// Demo Lifecycle (S319-S320)
export {
  handleExpiredDemos,
  convertDemoToPaid,
  extendDemo,
  demoLifecycle,
} from './demo-lifecycle';
