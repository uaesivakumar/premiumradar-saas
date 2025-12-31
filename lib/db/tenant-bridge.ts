/**
 * S340: Tenant Bridge (Admin Plane v1.1)
 *
 * Legacy compatibility layer for tenant_id.
 * Enterprise is the source of truth - tenant is derived and read-only.
 *
 * MANDATORY RULE: No new code should use tenant_id directly.
 * Use this bridge only when legacy systems require tenant_id.
 *
 * Flow:
 * API → enterprise_id → DB
 *         ↓
 *    (if legacy needs tenant)
 *         ↓
 *    tenantBridge.getOrCreateFromEnterprise(enterprise_id)
 */

import { queryOne, insert } from './client';

// ============================================================
// TYPES
// ============================================================

interface TenantRecord {
  id: string;
  name: string;
  domain: string | null;
  created_at: Date;
}

interface EnterpriseRecord {
  enterprise_id: string;
  name: string;
  domain: string | null;
  region: string;
}

// ============================================================
// TENANT BRIDGE (Read-Only Operations)
// ============================================================

/**
 * Get tenant ID for an enterprise.
 * If no tenant exists, creates one derived from enterprise (1:1 mapping).
 *
 * @param enterpriseId - The enterprise UUID
 * @returns The tenant UUID (derived from enterprise)
 */
export async function getOrCreateTenantFromEnterprise(enterpriseId: string): Promise<string> {
  // First, try to get existing tenant linked to this enterprise
  const existing = await queryOne<{ tenant_id: string }>(
    `SELECT t.id as tenant_id
     FROM tenants t
     JOIN enterprises e ON LOWER(e.domain) = LOWER(t.domain)
     WHERE e.enterprise_id = $1
     LIMIT 1`,
    [enterpriseId]
  );

  if (existing) {
    return existing.tenant_id;
  }

  // Get enterprise details
  const enterprise = await queryOne<EnterpriseRecord>(
    'SELECT enterprise_id, name, domain, region FROM enterprises WHERE enterprise_id = $1',
    [enterpriseId]
  );

  if (!enterprise) {
    throw new Error(`Enterprise not found: ${enterpriseId}`);
  }

  // Create tenant derived from enterprise (1:1 mapping)
  const slug = enterprise.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const tenant = await insert<TenantRecord>(
    `INSERT INTO tenants (name, slug, domain, plan)
     VALUES ($1, $2, $3, 'enterprise')
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name, domain, created_at`,
    [enterprise.name, slug, enterprise.domain]
  );

  return tenant.id;
}

/**
 * Get enterprise ID from a tenant ID.
 * Used when migrating legacy code that only has tenant_id.
 *
 * @param tenantId - The tenant UUID
 * @returns The enterprise UUID or null if not found
 */
export async function getEnterpriseFromTenant(tenantId: string): Promise<string | null> {
  const result = await queryOne<{ enterprise_id: string }>(
    `SELECT e.enterprise_id
     FROM enterprises e
     JOIN tenants t ON LOWER(e.domain) = LOWER(t.domain)
     WHERE t.id = $1
     LIMIT 1`,
    [tenantId]
  );

  return result?.enterprise_id || null;
}

/**
 * Check if an enterprise has a linked tenant.
 */
export async function hasLinkedTenant(enterpriseId: string): Promise<boolean> {
  const result = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1
       FROM tenants t
       JOIN enterprises e ON LOWER(e.domain) = LOWER(t.domain)
       WHERE e.enterprise_id = $1
     ) as exists`,
    [enterpriseId]
  );

  return result?.exists || false;
}

/**
 * Map enterprise_id to tenant_id for legacy systems.
 * Returns null if no mapping exists (and doesn't create one).
 */
export async function mapEnterpriseToTenant(enterpriseId: string): Promise<string | null> {
  const result = await queryOne<{ tenant_id: string }>(
    `SELECT t.id as tenant_id
     FROM tenants t
     JOIN enterprises e ON LOWER(e.domain) = LOWER(t.domain)
     WHERE e.enterprise_id = $1
     LIMIT 1`,
    [enterpriseId]
  );

  return result?.tenant_id || null;
}

// ============================================================
// DEPRECATION WARNINGS
// ============================================================

/**
 * Log a deprecation warning when tenant_id is used in new code.
 * Call this in legacy code paths to track migration progress.
 */
export function warnTenantIdUsage(location: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[DEPRECATION] tenant_id used at ${location}. ` +
      `Migrate to enterprise_id per Admin Plane v1.1 contracts.`
    );
  }
}

export default {
  getOrCreateTenantFromEnterprise,
  getEnterpriseFromTenant,
  hasLinkedTenant,
  mapEnterpriseToTenant,
  warnTenantIdUsage,
};
