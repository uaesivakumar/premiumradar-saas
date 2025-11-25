/**
 * Global OS Settings
 *
 * System-wide configuration for the OS layer including
 * API settings, AI configuration, caching, and security.
 */

import { create } from 'zustand';
import type { OSSettings, OSSettingsUpdate, OSSettingsHistory } from './types';

// ============================================================
// DEFAULT OS SETTINGS
// ============================================================

export const DEFAULT_OS_SETTINGS: OSSettings = {
  // API Configuration
  apiTimeout: 30000, // 30 seconds
  maxRetries: 3,
  rateLimitWindow: 60, // 1 minute
  rateLimitMax: 100,

  // AI Configuration
  aiProvider: 'openai',
  aiModel: 'gpt-4-turbo-preview',
  aiTemperature: 0.7,
  aiMaxTokens: 4096,

  // Cache Configuration
  cacheEnabled: true,
  cacheTtl: 3600, // 1 hour
  cacheMaxSize: 1024, // 1GB

  // Security Configuration
  maxQueryLength: 1000,
  blockedPatterns: [
    'system prompt',
    'ignore previous',
    'disregard instructions',
    'override',
    'jailbreak',
  ],
  auditLogRetention: 90, // 90 days

  // Feature Limits
  maxBatchSize: 100,
  maxConcurrentRequests: 10,
  maxResultsPerQuery: 50,
};

// ============================================================
// OS SETTINGS STORE
// ============================================================

interface OSSettingsStore {
  settings: OSSettings;
  history: OSSettingsHistory[];
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;

  loadSettings: () => Promise<void>;
  updateSetting: (update: OSSettingsUpdate) => Promise<void>;
  updateMultipleSettings: (updates: OSSettingsUpdate[]) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  getSettingHistory: (key: keyof OSSettings) => OSSettingsHistory[];
  validateSetting: (key: keyof OSSettings, value: unknown) => ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const useOSSettingsStore = create<OSSettingsStore>((set, get) => ({
  settings: DEFAULT_OS_SETTINGS,
  history: [],
  isLoading: false,
  error: null,
  isDirty: false,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      // In production, this would fetch from API
      await new Promise((resolve) => setTimeout(resolve, 100));
      set({ settings: DEFAULT_OS_SETTINGS, isLoading: false, isDirty: false });
    } catch (error) {
      set({ error: 'Failed to load settings', isLoading: false });
    }
  },

  updateSetting: async (update) => {
    const { settings, history } = get();
    const validation = get().validateSetting(update.key, update.value);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const previousValue = settings[update.key];

    // Create history entry
    const historyEntry: OSSettingsHistory = {
      id: `hist_${Date.now()}`,
      key: update.key,
      previousValue,
      newValue: update.value,
      changedBy: 'admin', // Would come from auth context
      changedAt: new Date(),
      reason: update.reason,
    };

    set({
      settings: { ...settings, [update.key]: update.value },
      history: [historyEntry, ...history],
      isDirty: true,
    });

    // In production, this would persist to API
    console.log('[OS SETTINGS UPDATE]', update);
  },

  updateMultipleSettings: async (updates) => {
    for (const update of updates) {
      await get().updateSetting(update);
    }
  },

  resetToDefaults: async () => {
    const { settings, history } = get();

    const historyEntry: OSSettingsHistory = {
      id: `hist_${Date.now()}`,
      key: 'all' as keyof OSSettings,
      previousValue: settings,
      newValue: DEFAULT_OS_SETTINGS,
      changedBy: 'admin',
      changedAt: new Date(),
      reason: 'Reset to defaults',
    };

    set({
      settings: DEFAULT_OS_SETTINGS,
      history: [historyEntry, ...history],
      isDirty: true,
    });
  },

  getSettingHistory: (key) => {
    return get().history.filter((h) => h.key === key);
  },

  validateSetting: (key, value) => {
    const validators: Partial<Record<keyof OSSettings, (v: unknown) => ValidationResult>> = {
      apiTimeout: (v) => {
        const num = Number(v);
        if (isNaN(num) || num < 1000 || num > 300000) {
          return { valid: false, error: 'API timeout must be between 1000ms and 300000ms' };
        }
        return { valid: true };
      },

      maxRetries: (v) => {
        const num = Number(v);
        if (isNaN(num) || num < 0 || num > 10) {
          return { valid: false, error: 'Max retries must be between 0 and 10' };
        }
        return { valid: true };
      },

      aiTemperature: (v) => {
        const num = Number(v);
        if (isNaN(num) || num < 0 || num > 2) {
          return { valid: false, error: 'AI temperature must be between 0 and 2' };
        }
        return { valid: true };
      },

      aiMaxTokens: (v) => {
        const num = Number(v);
        if (isNaN(num) || num < 100 || num > 128000) {
          return { valid: false, error: 'AI max tokens must be between 100 and 128000' };
        }
        return { valid: true };
      },

      cacheTtl: (v) => {
        const num = Number(v);
        if (isNaN(num) || num < 60 || num > 86400) {
          return { valid: false, error: 'Cache TTL must be between 60s and 86400s (1 day)' };
        }
        return { valid: true };
      },

      maxQueryLength: (v) => {
        const num = Number(v);
        if (isNaN(num) || num < 100 || num > 10000) {
          return { valid: false, error: 'Max query length must be between 100 and 10000' };
        }
        return { valid: true };
      },

      maxBatchSize: (v) => {
        const num = Number(v);
        if (isNaN(num) || num < 1 || num > 1000) {
          return { valid: false, error: 'Max batch size must be between 1 and 1000' };
        }
        return { valid: true };
      },
    };

    const validator = validators[key];
    if (validator) {
      return validator(value);
    }

    return { valid: true };
  },
}));

// ============================================================
// SETTINGS SECTIONS
// ============================================================

export interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  settings: SettingDefinition[];
}

export interface SettingDefinition {
  key: keyof OSSettings;
  label: string;
  description: string;
  type: 'number' | 'text' | 'boolean' | 'select' | 'list';
  options?: { value: string; label: string }[];
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'api',
    title: 'API Configuration',
    description: 'Configure API behavior and limits',
    icon: '🔌',
    settings: [
      {
        key: 'apiTimeout',
        label: 'API Timeout',
        description: 'Maximum time to wait for API response',
        type: 'number',
        unit: 'ms',
        min: 1000,
        max: 300000,
        step: 1000,
      },
      {
        key: 'maxRetries',
        label: 'Max Retries',
        description: 'Number of retry attempts for failed requests',
        type: 'number',
        min: 0,
        max: 10,
      },
      {
        key: 'rateLimitWindow',
        label: 'Rate Limit Window',
        description: 'Time window for rate limiting',
        type: 'number',
        unit: 'seconds',
        min: 1,
        max: 3600,
      },
      {
        key: 'rateLimitMax',
        label: 'Rate Limit Max',
        description: 'Maximum requests per window',
        type: 'number',
        min: 1,
        max: 10000,
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI Configuration',
    description: 'Configure AI provider and model settings',
    icon: '🤖',
    settings: [
      {
        key: 'aiProvider',
        label: 'AI Provider',
        description: 'Select the AI service provider',
        type: 'select',
        options: [
          { value: 'openai', label: 'OpenAI' },
          { value: 'anthropic', label: 'Anthropic' },
          { value: 'custom', label: 'Custom Provider' },
        ],
      },
      {
        key: 'aiModel',
        label: 'AI Model',
        description: 'Model identifier to use',
        type: 'text',
      },
      {
        key: 'aiTemperature',
        label: 'Temperature',
        description: 'Controls randomness in responses',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.1,
      },
      {
        key: 'aiMaxTokens',
        label: 'Max Tokens',
        description: 'Maximum tokens in response',
        type: 'number',
        min: 100,
        max: 128000,
        step: 100,
      },
    ],
  },
  {
    id: 'cache',
    title: 'Cache Configuration',
    description: 'Configure caching behavior',
    icon: '💾',
    settings: [
      {
        key: 'cacheEnabled',
        label: 'Enable Cache',
        description: 'Enable or disable caching',
        type: 'boolean',
      },
      {
        key: 'cacheTtl',
        label: 'Cache TTL',
        description: 'Time to live for cached items',
        type: 'number',
        unit: 'seconds',
        min: 60,
        max: 86400,
      },
      {
        key: 'cacheMaxSize',
        label: 'Cache Max Size',
        description: 'Maximum cache size',
        type: 'number',
        unit: 'MB',
        min: 100,
        max: 10240,
      },
    ],
  },
  {
    id: 'security',
    title: 'Security Configuration',
    description: 'Configure security settings',
    icon: '🔒',
    settings: [
      {
        key: 'maxQueryLength',
        label: 'Max Query Length',
        description: 'Maximum characters in a query',
        type: 'number',
        min: 100,
        max: 10000,
      },
      {
        key: 'blockedPatterns',
        label: 'Blocked Patterns',
        description: 'Patterns to block in queries',
        type: 'list',
      },
      {
        key: 'auditLogRetention',
        label: 'Audit Log Retention',
        description: 'Days to keep audit logs',
        type: 'number',
        unit: 'days',
        min: 7,
        max: 365,
      },
    ],
  },
  {
    id: 'limits',
    title: 'Feature Limits',
    description: 'Configure processing limits',
    icon: '📊',
    settings: [
      {
        key: 'maxBatchSize',
        label: 'Max Batch Size',
        description: 'Maximum items in a batch operation',
        type: 'number',
        min: 1,
        max: 1000,
      },
      {
        key: 'maxConcurrentRequests',
        label: 'Max Concurrent Requests',
        description: 'Maximum parallel requests',
        type: 'number',
        min: 1,
        max: 50,
      },
      {
        key: 'maxResultsPerQuery',
        label: 'Max Results Per Query',
        description: 'Maximum results returned per query',
        type: 'number',
        min: 1,
        max: 500,
      },
    ],
  },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Get setting definition by key
 */
export function getSettingDefinition(key: keyof OSSettings): SettingDefinition | undefined {
  for (const section of SETTINGS_SECTIONS) {
    const setting = section.settings.find((s) => s.key === key);
    if (setting) return setting;
  }
  return undefined;
}

/**
 * Format setting value for display
 */
export function formatSettingValue(key: keyof OSSettings, value: unknown): string {
  const definition = getSettingDefinition(key);

  if (typeof value === 'boolean') {
    return value ? 'Enabled' : 'Disabled';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (definition?.unit) {
    return `${value} ${definition.unit}`;
  }

  return String(value);
}

/**
 * Get section by setting key
 */
export function getSectionForSetting(key: keyof OSSettings): SettingsSection | undefined {
  return SETTINGS_SECTIONS.find((s) => s.settings.some((setting) => setting.key === key));
}
