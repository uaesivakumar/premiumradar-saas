/**
 * Feature Flags
 *
 * Dynamic feature toggle system for gradual rollouts,
 * A/B testing, and environment-specific features.
 */

import { create } from 'zustand';
import type {
  FeatureFlag,
  FeatureFlagValue,
  FeatureFlagType,
  FeatureFlagStatus,
  FeatureFlagEvaluation,
  FeatureFlagAudit,
} from './types';

// ============================================================
// DEFAULT FEATURE FLAGS
// ============================================================

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    id: 'ff_ai_analysis_v2',
    key: 'ai_analysis_v2',
    name: 'AI Analysis V2',
    description: 'New AI analysis engine with improved accuracy',
    type: 'percentage',
    status: 'gradual',
    value: { type: 'percentage', rolloutPercent: 50 },
    defaultValue: false,
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date('2025-11-25'),
    createdBy: 'system',
    tags: ['ai', 'core'],
    environments: [
      { environment: 'development', enabled: true },
      { environment: 'staging', enabled: true },
      { environment: 'production', enabled: true, overrideValue: { type: 'percentage', rolloutPercent: 25 } },
    ],
  },
  {
    id: 'ff_bulk_analysis',
    key: 'bulk_analysis',
    name: 'Bulk Analysis',
    description: 'Enable bulk domain analysis feature',
    type: 'plan_based',
    status: 'enabled',
    value: { type: 'plan_based', enabledPlans: ['professional', 'enterprise'] },
    defaultValue: false,
    createdAt: new Date('2025-11-15'),
    updatedAt: new Date('2025-11-20'),
    createdBy: 'system',
    tags: ['analysis', 'premium'],
    environments: [
      { environment: 'development', enabled: true },
      { environment: 'staging', enabled: true },
      { environment: 'production', enabled: true },
    ],
  },
  {
    id: 'ff_dark_mode',
    key: 'dark_mode',
    name: 'Dark Mode',
    description: 'Enable dark mode UI theme',
    type: 'boolean',
    status: 'enabled',
    value: { type: 'boolean', enabled: true },
    defaultValue: false,
    createdAt: new Date('2025-11-10'),
    updatedAt: new Date('2025-11-22'),
    createdBy: 'system',
    tags: ['ui', 'theme'],
    environments: [
      { environment: 'development', enabled: true },
      { environment: 'staging', enabled: true },
      { environment: 'production', enabled: true },
    ],
  },
  {
    id: 'ff_beta_features',
    key: 'beta_features',
    name: 'Beta Features',
    description: 'Access to beta features for selected users',
    type: 'user_list',
    status: 'beta',
    value: { type: 'user_list', allowedUsers: [], blockedUsers: [] },
    defaultValue: false,
    createdAt: new Date('2025-11-05'),
    updatedAt: new Date('2025-11-25'),
    createdBy: 'system',
    tags: ['beta', 'experimental'],
    environments: [
      { environment: 'development', enabled: true },
      { environment: 'staging', enabled: true },
      { environment: 'production', enabled: false },
    ],
  },
  {
    id: 'ff_outreach_templates',
    key: 'outreach_templates',
    name: 'Outreach Templates',
    description: 'Pre-built outreach email templates',
    type: 'boolean',
    status: 'enabled',
    value: { type: 'boolean', enabled: true },
    defaultValue: false,
    createdAt: new Date('2025-11-18'),
    updatedAt: new Date('2025-11-24'),
    createdBy: 'system',
    tags: ['outreach', 'templates'],
    environments: [
      { environment: 'development', enabled: true },
      { environment: 'staging', enabled: true },
      { environment: 'production', enabled: true },
    ],
  },
];

// ============================================================
// FEATURE FLAG STORE
// ============================================================

interface FeatureFlagStore {
  flags: FeatureFlag[];
  auditLog: FeatureFlagAudit[];
  isLoading: boolean;
  error: string | null;

  loadFlags: () => Promise<void>;
  getFlag: (key: string) => FeatureFlag | undefined;
  updateFlag: (id: string, updates: Partial<FeatureFlag>) => Promise<void>;
  createFlag: (flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FeatureFlag>;
  deleteFlag: (id: string) => Promise<void>;
  toggleFlag: (id: string, enabled: boolean) => Promise<void>;
  evaluateFlag: (key: string, context: EvaluationContext) => FeatureFlagEvaluation;
}

interface EvaluationContext {
  userId?: string;
  userPlan?: string;
  environment: 'development' | 'staging' | 'production';
  attributes?: Record<string, unknown>;
}

export const useFeatureFlagStore = create<FeatureFlagStore>((set, get) => ({
  flags: DEFAULT_FLAGS,
  auditLog: [],
  isLoading: false,
  error: null,

  loadFlags: async () => {
    set({ isLoading: true, error: null });
    try {
      // In production, this would fetch from API
      await new Promise((resolve) => setTimeout(resolve, 100));
      set({ flags: DEFAULT_FLAGS, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load feature flags', isLoading: false });
    }
  },

  getFlag: (key) => {
    return get().flags.find((f) => f.key === key);
  },

  updateFlag: async (id, updates) => {
    const { flags, auditLog } = get();
    const flag = flags.find((f) => f.id === id);
    if (!flag) throw new Error(`Flag ${id} not found`);

    const updatedFlag: FeatureFlag = {
      ...flag,
      ...updates,
      updatedAt: new Date(),
    };

    // Create audit entry
    const audit: FeatureFlagAudit = {
      id: `audit_${Date.now()}`,
      flagId: id,
      action: 'updated',
      previousValue: flag.value,
      newValue: updates.value || flag.value,
      userId: 'admin', // Would come from auth context
      timestamp: new Date(),
    };

    set({
      flags: flags.map((f) => (f.id === id ? updatedFlag : f)),
      auditLog: [audit, ...auditLog],
    });
  },

  createFlag: async (flagData) => {
    const { flags, auditLog } = get();

    const newFlag: FeatureFlag = {
      ...flagData,
      id: `ff_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const audit: FeatureFlagAudit = {
      id: `audit_${Date.now()}`,
      flagId: newFlag.id,
      action: 'created',
      previousValue: null,
      newValue: newFlag.value,
      userId: 'admin',
      timestamp: new Date(),
    };

    set({
      flags: [...flags, newFlag],
      auditLog: [audit, ...auditLog],
    });

    return newFlag;
  },

  deleteFlag: async (id) => {
    const { flags, auditLog } = get();
    const flag = flags.find((f) => f.id === id);
    if (!flag) throw new Error(`Flag ${id} not found`);

    const audit: FeatureFlagAudit = {
      id: `audit_${Date.now()}`,
      flagId: id,
      action: 'deleted',
      previousValue: flag.value,
      newValue: null,
      userId: 'admin',
      timestamp: new Date(),
    };

    set({
      flags: flags.filter((f) => f.id !== id),
      auditLog: [audit, ...auditLog],
    });
  },

  toggleFlag: async (id, enabled) => {
    const { flags, auditLog } = get();
    const flag = flags.find((f) => f.id === id);
    if (!flag) throw new Error(`Flag ${id} not found`);

    const newStatus: FeatureFlagStatus = enabled ? 'enabled' : 'disabled';
    const updatedFlag: FeatureFlag = {
      ...flag,
      status: newStatus,
      updatedAt: new Date(),
    };

    const audit: FeatureFlagAudit = {
      id: `audit_${Date.now()}`,
      flagId: id,
      action: 'toggled',
      previousValue: flag.value,
      newValue: updatedFlag.value,
      userId: 'admin',
      timestamp: new Date(),
    };

    set({
      flags: flags.map((f) => (f.id === id ? updatedFlag : f)),
      auditLog: [audit, ...auditLog],
    });
  },

  evaluateFlag: (key, context) => {
    const flag = get().getFlag(key);

    if (!flag) {
      return {
        flagKey: key,
        enabled: false,
        reason: 'flag_not_found',
      };
    }

    // Check environment override
    const envConfig = flag.environments.find((e) => e.environment === context.environment);
    if (envConfig && !envConfig.enabled) {
      return {
        flagKey: key,
        enabled: false,
        reason: 'disabled_in_environment',
      };
    }

    // Check flag status
    if (flag.status === 'disabled') {
      return {
        flagKey: key,
        enabled: false,
        reason: 'flag_disabled',
      };
    }

    // Evaluate based on type
    const valueToEvaluate = envConfig?.overrideValue || flag.value;

    switch (valueToEvaluate.type) {
      case 'boolean':
        return {
          flagKey: key,
          enabled: valueToEvaluate.enabled,
          reason: 'boolean_evaluation',
        };

      case 'percentage':
        const hash = hashString(context.userId || 'anonymous');
        const bucket = hash % 100;
        const enabled = bucket < valueToEvaluate.rolloutPercent;
        return {
          flagKey: key,
          enabled,
          reason: `percentage_rollout_${valueToEvaluate.rolloutPercent}%`,
        };

      case 'user_list':
        if (context.userId) {
          if (valueToEvaluate.blockedUsers.includes(context.userId)) {
            return { flagKey: key, enabled: false, reason: 'user_blocked' };
          }
          if (valueToEvaluate.allowedUsers.includes(context.userId)) {
            return { flagKey: key, enabled: true, reason: 'user_allowed' };
          }
        }
        return { flagKey: key, enabled: false, reason: 'user_not_in_list' };

      case 'plan_based':
        const planEnabled = context.userPlan
          ? valueToEvaluate.enabledPlans.includes(context.userPlan)
          : false;
        return {
          flagKey: key,
          enabled: planEnabled,
          reason: planEnabled ? 'plan_enabled' : 'plan_not_enabled',
        };

      default:
        return {
          flagKey: key,
          enabled: flag.defaultValue,
          reason: 'default_value',
        };
    }
  },
}));

// ============================================================
// HELPERS
// ============================================================

/**
 * Simple hash function for consistent bucketing
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Hook to check if feature is enabled
 */
export function useFeatureFlag(
  key: string,
  context: Omit<EvaluationContext, 'environment'>
): boolean {
  const store = useFeatureFlagStore();
  const environment = getEnvironment();

  const evaluation = store.evaluateFlag(key, {
    ...context,
    environment,
  });

  return evaluation.enabled;
}

/**
 * Get current environment
 */
function getEnvironment(): 'development' | 'staging' | 'production' {
  if (typeof window === 'undefined') return 'production';

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
  if (hostname.includes('staging') || hostname.includes('upr.sivakumar.ai')) return 'staging';
  return 'production';
}

/**
 * Get flag type display label
 */
export function getFlagTypeLabel(type: FeatureFlagType): string {
  const labels: Record<FeatureFlagType, string> = {
    boolean: 'On/Off Toggle',
    percentage: 'Percentage Rollout',
    user_list: 'User Whitelist',
    plan_based: 'Plan Based',
  };
  return labels[type];
}

/**
 * Get flag status color
 */
export function getFlagStatusColor(status: FeatureFlagStatus): string {
  const colors: Record<FeatureFlagStatus, string> = {
    enabled: 'green',
    disabled: 'gray',
    gradual: 'blue',
    beta: 'yellow',
  };
  return colors[status];
}

/**
 * Format flag value for display
 */
export function formatFlagValue(value: FeatureFlagValue): string {
  switch (value.type) {
    case 'boolean':
      return value.enabled ? 'Enabled' : 'Disabled';
    case 'percentage':
      return `${value.rolloutPercent}% rollout`;
    case 'user_list':
      return `${value.allowedUsers.length} allowed, ${value.blockedUsers.length} blocked`;
    case 'plan_based':
      return value.enabledPlans.join(', ');
    default:
      return 'Unknown';
  }
}
