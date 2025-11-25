/**
 * Config Types
 *
 * Type definitions for system configuration including
 * version control, feature flags, OS settings, scoring params, and verticals.
 */

// ============================================================
// VERSION CONTROL TYPES
// ============================================================

export interface AppVersion {
  version: string;
  releasedAt: Date;
  releaseNotes: string;
  features: string[];
  breaking: boolean;
  minCompatibleVersion?: string;
}

export interface VersionHistory {
  current: AppVersion;
  previous: AppVersion[];
}

export interface VersionComparison {
  from: string;
  to: string;
  changesCount: number;
  features: string[];
  fixes: string[];
  breaking: string[];
}

// ============================================================
// FEATURE FLAGS TYPES
// ============================================================

export type FeatureFlagType = 'boolean' | 'percentage' | 'user_list' | 'plan_based';

export type FeatureFlagStatus = 'enabled' | 'disabled' | 'gradual' | 'beta';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: FeatureFlagType;
  status: FeatureFlagStatus;
  value: FeatureFlagValue;
  defaultValue: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
  environments: FeatureFlagEnvironment[];
}

export type FeatureFlagValue =
  | { type: 'boolean'; enabled: boolean }
  | { type: 'percentage'; rolloutPercent: number }
  | { type: 'user_list'; allowedUsers: string[]; blockedUsers: string[] }
  | { type: 'plan_based'; enabledPlans: string[] };

export interface FeatureFlagEnvironment {
  environment: 'development' | 'staging' | 'production';
  enabled: boolean;
  overrideValue?: FeatureFlagValue;
}

export interface FeatureFlagEvaluation {
  flagKey: string;
  enabled: boolean;
  reason: string;
  variant?: string;
}

export interface FeatureFlagAudit {
  id: string;
  flagId: string;
  action: 'created' | 'updated' | 'deleted' | 'toggled';
  previousValue: FeatureFlagValue | null;
  newValue: FeatureFlagValue | null;
  userId: string;
  timestamp: Date;
}

// ============================================================
// OS SETTINGS TYPES
// ============================================================

export interface OSSettings {
  // API Configuration
  apiTimeout: number; // milliseconds
  maxRetries: number;
  rateLimitWindow: number; // seconds
  rateLimitMax: number;

  // AI Configuration
  aiProvider: 'openai' | 'anthropic' | 'custom';
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;

  // Cache Configuration
  cacheEnabled: boolean;
  cacheTtl: number; // seconds
  cacheMaxSize: number; // MB

  // Security Configuration
  maxQueryLength: number;
  blockedPatterns: string[];
  auditLogRetention: number; // days

  // Feature Limits
  maxBatchSize: number;
  maxConcurrentRequests: number;
  maxResultsPerQuery: number;
}

export interface OSSettingsUpdate {
  key: keyof OSSettings;
  value: OSSettings[keyof OSSettings];
  reason: string;
}

export interface OSSettingsHistory {
  id: string;
  key: keyof OSSettings;
  previousValue: unknown;
  newValue: unknown;
  changedBy: string;
  changedAt: Date;
  reason: string;
}

// ============================================================
// SCORING PARAMETERS TYPES
// ============================================================

export interface ScoringParameters {
  // Quality Score Weights (sum to 1.0)
  qualityWeights: {
    length: number;
    memorability: number;
    pronunciation: number;
    typoResistance: number;
    brandability: number;
  };

  // Traffic Score Weights
  trafficWeights: {
    searchVolume: number;
    clickThroughRate: number;
    competitionLevel: number;
    trendDirection: number;
  };

  // Liquidity Score Weights
  liquidityWeights: {
    recentSales: number;
    marketDepth: number;
    priceStability: number;
    demandIndicators: number;
  };

  // End-User Value Weights
  endUserWeights: {
    industryRelevance: number;
    commercialIntent: number;
    geographicRelevance: number;
    legalClearance: number;
  };

  // Thresholds
  thresholds: {
    highQuality: number;
    mediumQuality: number;
    highTraffic: number;
    mediumTraffic: number;
    highLiquidity: number;
    mediumLiquidity: number;
  };

  // Modifiers
  modifiers: {
    premiumTldBonus: number;
    shortLengthBonus: number;
    keywordMatchBonus: number;
    newTldPenalty: number;
    hyphenPenalty: number;
    numberPenalty: number;
  };
}

export interface ScoringParametersUpdate {
  category: keyof ScoringParameters;
  key: string;
  value: number;
  reason: string;
}

// ============================================================
// VERTICAL REGISTRY TYPES
// ============================================================

export type VerticalStatus = 'active' | 'beta' | 'deprecated' | 'disabled';

export interface Vertical {
  id: string;
  key: string;
  name: string;
  description: string;
  status: VerticalStatus;
  icon: string;
  color: string;

  // Vertical-specific configuration
  keywords: string[];
  excludedKeywords: string[];
  preferredTlds: string[];
  scoringOverrides: Partial<ScoringParameters>;

  // Display
  displayOrder: number;
  isDefault: boolean;
  showInNavigation: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface VerticalCategory {
  id: string;
  name: string;
  description: string;
  verticals: string[]; // Vertical IDs
  displayOrder: number;
}

export interface VerticalStats {
  verticalId: string;
  totalAnalyses: number;
  avgScore: number;
  topKeywords: string[];
  lastUsed: Date;
}

// ============================================================
// CONFIG CHANGE TRACKING
// ============================================================

export interface ConfigChange {
  id: string;
  configType: 'version' | 'feature_flag' | 'os_settings' | 'scoring' | 'vertical';
  action: 'create' | 'update' | 'delete';
  key: string;
  previousValue: unknown;
  newValue: unknown;
  changedBy: string;
  changedAt: Date;
  reason: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ConfigSnapshot {
  id: string;
  createdAt: Date;
  createdBy: string;
  description: string;
  featureFlags: FeatureFlag[];
  osSettings: OSSettings;
  scoringParameters: ScoringParameters;
  verticals: Vertical[];
}
