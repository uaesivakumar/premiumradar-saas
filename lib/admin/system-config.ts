/**
 * System Configuration Service
 *
 * CRUD interface for all system-wide configurations.
 * Replaces hardcoded values with database-backed settings.
 *
 * Categories:
 * - pricing: Plan pricing, API costs, GCP rates
 * - limits: Plan limits, rate limits, quotas
 * - integrations: API base URLs, keys (encrypted), timeouts
 * - thresholds: Scoring weights, signal freshness, quality thresholds
 * - features: Feature flags
 * - llm: Model configs, prompts, temperatures
 */

import { query, queryOne, insert } from '@/lib/db/client';

// =============================================================================
// TYPES
// =============================================================================

export type ConfigCategory =
  | 'pricing'
  | 'limits'
  | 'integrations'
  | 'thresholds'
  | 'features'
  | 'llm'
  | 'security'
  | 'general';

export interface SystemConfig {
  id: string;
  category: ConfigCategory;
  key: string;
  value: unknown;
  description?: string;
  valueType: 'string' | 'number' | 'boolean' | 'json' | 'encrypted';
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigUpdate {
  category: ConfigCategory;
  key: string;
  value: unknown;
  description?: string;
  valueType?: 'string' | 'number' | 'boolean' | 'json' | 'encrypted';
  isSecret?: boolean;
}

// =============================================================================
// DATABASE TABLE SQL
// =============================================================================

export const SYSTEM_CONFIG_TABLE_SQL = `
-- System Configuration Table
-- Stores all configurable system settings

CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'encrypted')),
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- Config change history for audit trail
CREATE TABLE IF NOT EXISTS system_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL,
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by VARCHAR(200),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_history_config_id ON system_config_history(config_id);
CREATE INDEX IF NOT EXISTS idx_config_history_changed_at ON system_config_history(changed_at DESC);
`;

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default configurations to seed the system
 * These replace the hardcoded values found in the audit
 */
export const DEFAULT_CONFIGS: ConfigUpdate[] = [
  // Pricing - Plan prices
  { category: 'pricing', key: 'plan_free_price', value: 0, description: 'Free plan monthly price', valueType: 'number' },
  { category: 'pricing', key: 'plan_starter_price', value: 99, description: 'Starter plan monthly price', valueType: 'number' },
  { category: 'pricing', key: 'plan_professional_price', value: 299, description: 'Professional plan monthly price', valueType: 'number' },
  { category: 'pricing', key: 'plan_enterprise_price', value: 999, description: 'Enterprise plan monthly price', valueType: 'number' },

  // Pricing - API costs (for estimation)
  { category: 'pricing', key: 'apollo_cost_per_call', value: 0.01, description: 'Estimated Apollo API cost per call', valueType: 'number' },
  { category: 'pricing', key: 'serp_cost_per_search', value: 0.005, description: 'SERP API cost per search', valueType: 'number' },

  // Pricing - GCP rates
  { category: 'pricing', key: 'gcp_vcpu_per_second', value: 0.00002400, description: 'GCP Cloud Run vCPU cost per second', valueType: 'number' },
  { category: 'pricing', key: 'gcp_memory_gib_per_second', value: 0.0000025, description: 'GCP Cloud Run memory cost per GiB-second', valueType: 'number' },

  // Limits - Plan quotas
  { category: 'limits', key: 'free_radar_limit', value: 10, description: 'Free plan max radar items', valueType: 'number' },
  { category: 'limits', key: 'starter_radar_limit', value: 100, description: 'Starter plan max radar items', valueType: 'number' },
  { category: 'limits', key: 'professional_radar_limit', value: 500, description: 'Professional plan max radar items', valueType: 'number' },
  { category: 'limits', key: 'enterprise_radar_limit', value: -1, description: 'Enterprise plan max radar items (-1 = unlimited)', valueType: 'number' },

  // Limits - Rate limits
  { category: 'limits', key: 'api_rate_limit_requests', value: 100, description: 'API rate limit requests per window', valueType: 'number' },
  { category: 'limits', key: 'api_rate_limit_window_ms', value: 60000, description: 'API rate limit window in milliseconds', valueType: 'number' },

  // Integration URLs
  { category: 'integrations', key: 'serp_api_base_url', value: 'https://serpapi.com/search', description: 'SERP API base URL', valueType: 'string' },
  { category: 'integrations', key: 'apollo_api_base_url', value: 'https://api.apollo.io/v1', description: 'Apollo API base URL', valueType: 'string' },
  { category: 'integrations', key: 'openai_api_base_url', value: 'https://api.openai.com/v1', description: 'OpenAI API base URL', valueType: 'string' },

  // Integration timeouts
  { category: 'integrations', key: 'api_timeout_ms', value: 30000, description: 'Default API timeout in milliseconds', valueType: 'number' },
  { category: 'integrations', key: 'enrichment_timeout_ms', value: 60000, description: 'Enrichment operations timeout', valueType: 'number' },

  // Thresholds - Scoring
  { category: 'thresholds', key: 'signal_quality_weight', value: 0.3, description: 'Signal quality scoring weight', valueType: 'number' },
  { category: 'thresholds', key: 'signal_timing_weight', value: 0.25, description: 'Signal timing scoring weight', valueType: 'number' },
  { category: 'thresholds', key: 'signal_relevance_weight', value: 0.25, description: 'Signal relevance scoring weight', valueType: 'number' },
  { category: 'thresholds', key: 'signal_source_weight', value: 0.2, description: 'Signal source scoring weight', valueType: 'number' },

  // Thresholds - Signal freshness
  { category: 'thresholds', key: 'signal_freshness_days', value: 90, description: 'Signal freshness window in days', valueType: 'number' },
  { category: 'thresholds', key: 'min_signal_score', value: 0.5, description: 'Minimum signal score threshold', valueType: 'number' },

  // Feature flags
  { category: 'features', key: 'enable_apollo_enrichment', value: true, description: 'Enable Apollo data enrichment', valueType: 'boolean' },
  { category: 'features', key: 'enable_serp_news', value: true, description: 'Enable SERP news integration', valueType: 'boolean' },
  { category: 'features', key: 'enable_siva_intelligence', value: true, description: 'Enable SIVA AI features', valueType: 'boolean' },
  { category: 'features', key: 'enable_demo_mode', value: true, description: 'Enable demo/sandbox mode', valueType: 'boolean' },
  { category: 'features', key: 'enable_export', value: true, description: 'Enable data export feature', valueType: 'boolean' },

  // LLM configuration
  { category: 'llm', key: 'default_model', value: 'gpt-4o-mini', description: 'Default OpenAI model', valueType: 'string' },
  { category: 'llm', key: 'default_temperature', value: 0.3, description: 'Default LLM temperature', valueType: 'number' },
  { category: 'llm', key: 'max_tokens', value: 2000, description: 'Default max tokens', valueType: 'number' },

  // Security
  { category: 'security', key: 'session_duration_hours', value: 24, description: 'Super Admin session duration in hours', valueType: 'number' },
  { category: 'security', key: 'max_login_attempts', value: 5, description: 'Max failed login attempts before lockout', valueType: 'number' },

  // General
  { category: 'general', key: 'default_region', value: 'UAE', description: 'Default region for new users', valueType: 'string' },
  { category: 'general', key: 'default_currency', value: 'USD', description: 'Default currency for pricing', valueType: 'string' },
  { category: 'general', key: 'company_cash_balance', value: 50000, description: 'Company cash balance for runway calculation', valueType: 'number' },
];

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Get a single config value
 */
export async function getConfig<T = unknown>(
  category: ConfigCategory,
  key: string,
  defaultValue?: T
): Promise<T> {
  try {
    const result = await queryOne<{ value: T }>(`
      SELECT value
      FROM system_config
      WHERE category = $1 AND key = $2
    `, [category, key]);

    if (result?.value !== undefined) {
      return result.value;
    }

    return defaultValue as T;
  } catch (error) {
    console.log(`[SystemConfig] Failed to get ${category}.${key}:`, error);
    return defaultValue as T;
  }
}

/**
 * Get all configs in a category
 */
export async function getConfigsByCategory(category: ConfigCategory): Promise<SystemConfig[]> {
  try {
    const results = await query<{
      id: string;
      category: string;
      key: string;
      value: unknown;
      description: string | null;
      value_type: string;
      is_secret: boolean;
      created_at: Date;
      updated_at: Date;
    }>(`
      SELECT id, category, key, value, description, value_type, is_secret, created_at, updated_at
      FROM system_config
      WHERE category = $1
      ORDER BY key ASC
    `, [category]);

    return results.map(r => ({
      id: r.id,
      category: r.category as ConfigCategory,
      key: r.key,
      value: r.is_secret ? '[REDACTED]' : r.value,
      description: r.description || undefined,
      valueType: r.value_type as SystemConfig['valueType'],
      isSecret: r.is_secret,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (error) {
    console.error(`[SystemConfig] Failed to get category ${category}:`, error);
    return [];
  }
}

/**
 * Get all configs (for admin panel)
 */
export async function getAllConfigs(): Promise<SystemConfig[]> {
  try {
    const results = await query<{
      id: string;
      category: string;
      key: string;
      value: unknown;
      description: string | null;
      value_type: string;
      is_secret: boolean;
      created_at: Date;
      updated_at: Date;
    }>(`
      SELECT id, category, key, value, description, value_type, is_secret, created_at, updated_at
      FROM system_config
      ORDER BY category ASC, key ASC
    `);

    return results.map(r => ({
      id: r.id,
      category: r.category as ConfigCategory,
      key: r.key,
      value: r.is_secret ? '[REDACTED]' : r.value,
      description: r.description || undefined,
      valueType: r.value_type as SystemConfig['valueType'],
      isSecret: r.is_secret,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (error) {
    console.error('[SystemConfig] Failed to get all configs:', error);
    return [];
  }
}

/**
 * Set a config value (upsert)
 */
export async function setConfig(
  update: ConfigUpdate,
  changedBy?: string
): Promise<boolean> {
  try {
    // Get old value for history
    const oldConfig = await queryOne<{ id: string; value: unknown }>(`
      SELECT id, value FROM system_config WHERE category = $1 AND key = $2
    `, [update.category, update.key]);

    // Upsert the config
    const result = await queryOne<{ id: string }>(`
      INSERT INTO system_config (category, key, value, description, value_type, is_secret, updated_at)
      VALUES ($1, $2, $3::jsonb, $4, $5, $6, NOW())
      ON CONFLICT (category, key) DO UPDATE SET
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, system_config.description),
        value_type = COALESCE(EXCLUDED.value_type, system_config.value_type),
        is_secret = COALESCE(EXCLUDED.is_secret, system_config.is_secret),
        updated_at = NOW()
      RETURNING id
    `, [
      update.category,
      update.key,
      JSON.stringify(update.value),
      update.description || null,
      update.valueType || 'string',
      update.isSecret || false,
    ]);

    // Record change in history
    if (result?.id) {
      await insert(`
        INSERT INTO system_config_history (config_id, category, key, old_value, new_value, changed_by)
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
      `, [
        result.id,
        update.category,
        update.key,
        oldConfig ? JSON.stringify(oldConfig.value) : null,
        JSON.stringify(update.value),
        changedBy || 'system',
      ]);
    }

    return true;
  } catch (error) {
    console.error(`[SystemConfig] Failed to set ${update.category}.${update.key}:`, error);
    return false;
  }
}

/**
 * Delete a config
 */
export async function deleteConfig(
  category: ConfigCategory,
  key: string,
  changedBy?: string
): Promise<boolean> {
  try {
    // Get old value for history
    const oldConfig = await queryOne<{ id: string; value: unknown }>(`
      SELECT id, value FROM system_config WHERE category = $1 AND key = $2
    `, [category, key]);

    if (oldConfig) {
      // Record deletion in history
      await insert(`
        INSERT INTO system_config_history (config_id, category, key, old_value, new_value, changed_by)
        VALUES ($1, $2, $3, $4::jsonb, NULL, $5)
      `, [
        oldConfig.id,
        category,
        key,
        JSON.stringify(oldConfig.value),
        changedBy || 'system',
      ]);

      // Delete the config
      await query(`DELETE FROM system_config WHERE category = $1 AND key = $2`, [category, key]);
    }

    return true;
  } catch (error) {
    console.error(`[SystemConfig] Failed to delete ${category}.${key}:`, error);
    return false;
  }
}

/**
 * Get config change history
 */
export async function getConfigHistory(limit: number = 50): Promise<Array<{
  id: string;
  category: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string;
  changedAt: Date;
}>> {
  try {
    const results = await query<{
      id: string;
      category: string;
      key: string;
      old_value: unknown;
      new_value: unknown;
      changed_by: string;
      changed_at: Date;
    }>(`
      SELECT id, category, key, old_value, new_value, changed_by, changed_at
      FROM system_config_history
      ORDER BY changed_at DESC
      LIMIT $1
    `, [limit]);

    return results.map(r => ({
      id: r.id,
      category: r.category,
      key: r.key,
      oldValue: r.old_value,
      newValue: r.new_value,
      changedBy: r.changed_by,
      changedAt: r.changed_at,
    }));
  } catch (error) {
    console.error('[SystemConfig] Failed to get history:', error);
    return [];
  }
}

// =============================================================================
// SEED DEFAULTS
// =============================================================================

/**
 * Seed default configurations
 */
export async function seedDefaultConfigs(): Promise<number> {
  let seeded = 0;

  for (const config of DEFAULT_CONFIGS) {
    // Check if already exists
    const existing = await queryOne<{ id: string }>(`
      SELECT id FROM system_config WHERE category = $1 AND key = $2
    `, [config.category, config.key]);

    if (!existing) {
      const success = await setConfig(config, 'system-seed');
      if (success) seeded++;
    }
  }

  console.log(`[SystemConfig] Seeded ${seeded} default configurations`);
  return seeded;
}

// =============================================================================
// HELPER: Get Typed Configs
// =============================================================================

/**
 * Helper to get pricing configs
 */
export async function getPricingConfig() {
  return {
    planFreePice: await getConfig<number>('pricing', 'plan_free_price', 0),
    planStarterPrice: await getConfig<number>('pricing', 'plan_starter_price', 99),
    planProfessionalPrice: await getConfig<number>('pricing', 'plan_professional_price', 299),
    planEnterprisePrice: await getConfig<number>('pricing', 'plan_enterprise_price', 999),
    apolloCostPerCall: await getConfig<number>('pricing', 'apollo_cost_per_call', 0.01),
    serpCostPerSearch: await getConfig<number>('pricing', 'serp_cost_per_search', 0.005),
    gcpVcpuPerSecond: await getConfig<number>('pricing', 'gcp_vcpu_per_second', 0.00002400),
    gcpMemoryGibPerSecond: await getConfig<number>('pricing', 'gcp_memory_gib_per_second', 0.0000025),
  };
}

/**
 * Helper to get limits configs
 */
export async function getLimitsConfig() {
  return {
    freeRadarLimit: await getConfig<number>('limits', 'free_radar_limit', 10),
    starterRadarLimit: await getConfig<number>('limits', 'starter_radar_limit', 100),
    professionalRadarLimit: await getConfig<number>('limits', 'professional_radar_limit', 500),
    enterpriseRadarLimit: await getConfig<number>('limits', 'enterprise_radar_limit', -1),
    apiRateLimitRequests: await getConfig<number>('limits', 'api_rate_limit_requests', 100),
    apiRateLimitWindowMs: await getConfig<number>('limits', 'api_rate_limit_window_ms', 60000),
  };
}

/**
 * Helper to get feature flags
 */
export async function getFeatureFlags() {
  return {
    enableApolloEnrichment: await getConfig<boolean>('features', 'enable_apollo_enrichment', true),
    enableSerpNews: await getConfig<boolean>('features', 'enable_serp_news', true),
    enableSivaIntelligence: await getConfig<boolean>('features', 'enable_siva_intelligence', true),
    enableDemoMode: await getConfig<boolean>('features', 'enable_demo_mode', true),
    enableExport: await getConfig<boolean>('features', 'enable_export', true),
  };
}

/**
 * Helper to get LLM configs
 */
export async function getLLMConfig() {
  return {
    defaultModel: await getConfig<string>('llm', 'default_model', 'gpt-4o-mini'),
    defaultTemperature: await getConfig<number>('llm', 'default_temperature', 0.3),
    maxTokens: await getConfig<number>('llm', 'max_tokens', 2000),
  };
}
