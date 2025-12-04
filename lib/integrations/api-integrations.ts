/**
 * API Integrations Service
 *
 * Manages API keys for external data sources.
 * Keys are stored in PostgreSQL, NOT hardcoded.
 *
 * Supported providers:
 * - apollo: Company data, headcount, hiring signals
 * - serp: News, hiring events, expansion signals
 * - linkedin: Profile enrichment (future)
 * - crunchbase: Funding, growth signals (future)
 */

import { query, queryOne, insert } from '@/lib/db';

// =============================================================================
// TYPES
// =============================================================================

export type IntegrationProvider = 'apollo' | 'serp' | 'linkedin' | 'crunchbase' | 'openai';

export interface ApiIntegration {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  provider: IntegrationProvider;
  name: string;
  description?: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
  config: Record<string, unknown>;
  tenantId?: string;
  vertical?: string;
  isActive: boolean;
  isDefault: boolean;
  lastUsedAt?: Date;
  usageCount: number;
  errorCount: number;
  lastError?: string;
  lastErrorAt?: Date;
}

export interface CreateIntegrationInput {
  provider: IntegrationProvider;
  name: string;
  description?: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
  config?: Record<string, unknown>;
  tenantId?: string;
  vertical?: string;
  isDefault?: boolean;
}

export interface UpdateIntegrationInput {
  name?: string;
  description?: string;
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
  isDefault?: boolean;
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Get all integrations
 */
export async function getIntegrations(options?: {
  provider?: IntegrationProvider;
  tenantId?: string;
  activeOnly?: boolean;
}): Promise<ApiIntegration[]> {
  let sql = `
    SELECT
      id, created_at as "createdAt", updated_at as "updatedAt",
      provider, name, description, api_key as "apiKey", api_secret as "apiSecret",
      base_url as "baseUrl", config, tenant_id as "tenantId", vertical,
      is_active as "isActive", is_default as "isDefault",
      last_used_at as "lastUsedAt", usage_count as "usageCount",
      error_count as "errorCount", last_error as "lastError", last_error_at as "lastErrorAt"
    FROM api_integrations
    WHERE 1=1
  `;

  const params: unknown[] = [];
  let paramIndex = 1;

  if (options?.provider) {
    sql += ` AND provider = $${paramIndex++}`;
    params.push(options.provider);
  }

  if (options?.tenantId) {
    sql += ` AND (tenant_id = $${paramIndex++} OR tenant_id IS NULL)`;
    params.push(options.tenantId);
  }

  if (options?.activeOnly) {
    sql += ` AND is_active = true`;
  }

  sql += ` ORDER BY is_default DESC, created_at DESC`;

  return query<ApiIntegration>(sql, params);
}

/**
 * Get a single integration by ID
 */
export async function getIntegration(id: string): Promise<ApiIntegration | null> {
  return queryOne<ApiIntegration>(`
    SELECT
      id, created_at as "createdAt", updated_at as "updatedAt",
      provider, name, description, api_key as "apiKey", api_secret as "apiSecret",
      base_url as "baseUrl", config, tenant_id as "tenantId", vertical,
      is_active as "isActive", is_default as "isDefault",
      last_used_at as "lastUsedAt", usage_count as "usageCount",
      error_count as "errorCount", last_error as "lastError", last_error_at as "lastErrorAt"
    FROM api_integrations
    WHERE id = $1
  `, [id]);
}

/**
 * Get the default integration for a provider
 */
export async function getDefaultIntegration(
  provider: IntegrationProvider,
  tenantId?: string
): Promise<ApiIntegration | null> {
  // First try tenant-specific default
  if (tenantId) {
    const tenantIntegration = await queryOne<ApiIntegration>(`
      SELECT
        id, created_at as "createdAt", updated_at as "updatedAt",
        provider, name, description, api_key as "apiKey", api_secret as "apiSecret",
        base_url as "baseUrl", config, tenant_id as "tenantId", vertical,
        is_active as "isActive", is_default as "isDefault",
        last_used_at as "lastUsedAt", usage_count as "usageCount",
        error_count as "errorCount", last_error as "lastError", last_error_at as "lastErrorAt"
      FROM api_integrations
      WHERE provider = $1 AND tenant_id = $2 AND is_active = true AND is_default = true
    `, [provider, tenantId]);

    if (tenantIntegration) return tenantIntegration;
  }

  // Fall back to global default
  return queryOne<ApiIntegration>(`
    SELECT
      id, created_at as "createdAt", updated_at as "updatedAt",
      provider, name, description, api_key as "apiKey", api_secret as "apiSecret",
      base_url as "baseUrl", config, tenant_id as "tenantId", vertical,
      is_active as "isActive", is_default as "isDefault",
      last_used_at as "lastUsedAt", usage_count as "usageCount",
      error_count as "errorCount", last_error as "lastError", last_error_at as "lastErrorAt"
    FROM api_integrations
    WHERE provider = $1 AND tenant_id IS NULL AND is_active = true AND is_default = true
  `, [provider]);
}

/**
 * Create a new integration
 */
export async function createIntegration(input: CreateIntegrationInput): Promise<ApiIntegration> {
  return insert<ApiIntegration>(`
    INSERT INTO api_integrations (
      provider, name, description, api_key, api_secret,
      base_url, config, tenant_id, vertical, is_default
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING
      id, created_at as "createdAt", updated_at as "updatedAt",
      provider, name, description, api_key as "apiKey", api_secret as "apiSecret",
      base_url as "baseUrl", config, tenant_id as "tenantId", vertical,
      is_active as "isActive", is_default as "isDefault",
      last_used_at as "lastUsedAt", usage_count as "usageCount",
      error_count as "errorCount", last_error as "lastError", last_error_at as "lastErrorAt"
  `, [
    input.provider,
    input.name,
    input.description || null,
    input.apiKey,
    input.apiSecret || null,
    input.baseUrl || null,
    JSON.stringify(input.config || {}),
    input.tenantId || null,
    input.vertical || null,
    input.isDefault || false,
  ]);
}

/**
 * Update an integration
 */
export async function updateIntegration(
  id: string,
  input: UpdateIntegrationInput
): Promise<ApiIntegration | null> {
  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    params.push(input.name);
  }
  if (input.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(input.description);
  }
  if (input.apiKey !== undefined) {
    updates.push(`api_key = $${paramIndex++}`);
    params.push(input.apiKey);
  }
  if (input.apiSecret !== undefined) {
    updates.push(`api_secret = $${paramIndex++}`);
    params.push(input.apiSecret);
  }
  if (input.baseUrl !== undefined) {
    updates.push(`base_url = $${paramIndex++}`);
    params.push(input.baseUrl);
  }
  if (input.config !== undefined) {
    updates.push(`config = $${paramIndex++}`);
    params.push(JSON.stringify(input.config));
  }
  if (input.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    params.push(input.isActive);
  }
  if (input.isDefault !== undefined) {
    updates.push(`is_default = $${paramIndex++}`);
    params.push(input.isDefault);
  }

  if (updates.length === 0) return getIntegration(id);

  params.push(id);

  return queryOne<ApiIntegration>(`
    UPDATE api_integrations
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING
      id, created_at as "createdAt", updated_at as "updatedAt",
      provider, name, description, api_key as "apiKey", api_secret as "apiSecret",
      base_url as "baseUrl", config, tenant_id as "tenantId", vertical,
      is_active as "isActive", is_default as "isDefault",
      last_used_at as "lastUsedAt", usage_count as "usageCount",
      error_count as "errorCount", last_error as "lastError", last_error_at as "lastErrorAt"
  `, params);
}

/**
 * Delete an integration
 */
export async function deleteIntegration(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM api_integrations WHERE id = $1`, [id]);
  return true;
}

/**
 * Record successful API usage
 */
export async function recordUsage(id: string): Promise<void> {
  await query(`
    UPDATE api_integrations
    SET last_used_at = NOW(), usage_count = usage_count + 1
    WHERE id = $1
  `, [id]);
}

/**
 * Record API error
 */
export async function recordError(id: string, error: string): Promise<void> {
  await query(`
    UPDATE api_integrations
    SET last_error = $2, last_error_at = NOW(), error_count = error_count + 1
    WHERE id = $1
  `, [id, error]);
}

// =============================================================================
// API KEY RETRIEVAL (for use by services)
// =============================================================================

/**
 * Get API key for a provider
 * Returns the key from database or falls back to environment variable
 */
export async function getApiKey(provider: IntegrationProvider): Promise<string | null> {
  // Try to get from database first
  const integration = await getDefaultIntegration(provider);
  if (integration?.apiKey) {
    return integration.apiKey;
  }

  // Fall back to environment variable
  const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  return envKey || null;
}

/**
 * Get full integration config for a provider
 */
export async function getIntegrationConfig(provider: IntegrationProvider): Promise<{
  apiKey: string;
  baseUrl?: string;
  config: Record<string, unknown>;
  integrationId?: string;
} | null> {
  const integration = await getDefaultIntegration(provider);

  if (integration) {
    return {
      apiKey: integration.apiKey,
      baseUrl: integration.baseUrl,
      config: integration.config,
      integrationId: integration.id,
    };
  }

  // Fall back to environment variable
  const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (envKey) {
    return {
      apiKey: envKey,
      config: {},
    };
  }

  return null;
}
