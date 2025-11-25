/**
 * Config Module
 *
 * Exports all configuration functionality including version control,
 * feature flags, OS settings, scoring parameters, and vertical registry.
 */

// Types
export type {
  AppVersion,
  VersionHistory,
  VersionComparison,
  FeatureFlag,
  FeatureFlagValue,
  FeatureFlagType,
  FeatureFlagStatus,
  FeatureFlagEvaluation,
  FeatureFlagAudit,
  FeatureFlagEnvironment,
  OSSettings,
  OSSettingsUpdate,
  OSSettingsHistory,
  ScoringParameters,
  ScoringParametersUpdate,
  Vertical,
  VerticalStatus,
  VerticalCategory,
  VerticalStats,
  ConfigChange,
  ConfigSnapshot,
} from './types';

// Version Control
export {
  CURRENT_VERSION,
  useVersionStore,
  parseVersion,
  compareVersionStrings,
  isNewerVersion,
  isCompatibleVersion,
  formatVersion,
  getVersionBadgeColor,
  generateChangelog,
  getReleaseNotesSummary,
} from './version-control';

// Feature Flags
export {
  useFeatureFlagStore,
  useFeatureFlag,
  getFlagTypeLabel,
  getFlagStatusColor,
  formatFlagValue,
} from './feature-flags';

// OS Settings
export {
  DEFAULT_OS_SETTINGS,
  useOSSettingsStore,
  SETTINGS_SECTIONS,
  getSettingDefinition,
  formatSettingValue,
  getSectionForSetting,
} from './os-settings';

// Scoring Parameters
export {
  DEFAULT_SCORING_PARAMS,
  useScoringParamsStore,
  PARAM_CATEGORIES,
  getParamDefinition,
  calculateCompositeScore,
  getScoreCategory,
  getScoreCategoryColor,
} from './scoring-params';

// Vertical Registry
export {
  DEFAULT_VERTICALS,
  DEFAULT_CATEGORIES,
  useVerticalRegistryStore,
  getVerticalStatusColor,
  getVerticalStatusLabel,
  matchesVertical,
  findBestVertical,
  getVerticalsByCategory,
  generateMockVerticalStats,
} from './vertical-registry';
