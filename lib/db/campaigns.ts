/**
 * S296: Campaign Database Service
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * Real PostgreSQL operations for enterprise campaigns.
 */

import { query, queryOne, insert } from './client';

// ============================================================
// TYPES
// ============================================================

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type CampaignType = 'email' | 'linkedin' | 'multi-channel' | 'sms' | 'call';

export interface Campaign {
  id: string;
  enterprise_id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  settings: Record<string, unknown>;
  target_criteria: Record<string, unknown>;
  version: number;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignAsset {
  id: string;
  campaign_id: string;
  name: string;
  type: string;
  mime_type: string | null;
  url: string | null;
  storage_key: string | null;
  metadata: Record<string, unknown>;
  file_size_bytes: number | null;
  created_at: Date;
}

export interface CreateCampaignInput {
  enterprise_id: string;
  name: string;
  description?: string;
  type: CampaignType;
  settings?: Record<string, unknown>;
  target_criteria?: Record<string, unknown>;
  created_by?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  settings?: Record<string, unknown>;
  target_criteria?: Record<string, unknown>;
}

export interface CreateAssetInput {
  campaign_id: string;
  name: string;
  type: string;
  mime_type?: string;
  url?: string;
  storage_key?: string;
  metadata?: Record<string, unknown>;
  file_size_bytes?: number;
}

// ============================================================
// CAMPAIGN CRUD
// ============================================================

/**
 * Create a new campaign
 */
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  return insert<Campaign>(
    `INSERT INTO enterprise_campaigns (
      enterprise_id, name, description, type, settings, target_criteria, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      input.enterprise_id,
      input.name,
      input.description || null,
      input.type,
      JSON.stringify(input.settings || {}),
      JSON.stringify(input.target_criteria || {}),
      input.created_by || null,
    ]
  );
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(campaignId: string): Promise<Campaign | null> {
  return queryOne<Campaign>(
    'SELECT * FROM enterprise_campaigns WHERE id = $1',
    [campaignId]
  );
}

/**
 * List campaigns for an enterprise
 */
export async function listEnterpriseCampaigns(
  enterpriseId: string,
  options?: {
    status?: CampaignStatus;
    type?: CampaignType;
    limit?: number;
    offset?: number;
  }
): Promise<{ campaigns: Campaign[]; total: number }> {
  const conditions: string[] = ['enterprise_id = $1'];
  const values: unknown[] = [enterpriseId];
  let paramIndex = 2;

  if (options?.status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(options.status);
  }

  if (options?.type) {
    conditions.push(`type = $${paramIndex++}`);
    values.push(options.type);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM enterprise_campaigns WHERE ${whereClause}`,
    values
  );
  const total = parseInt(countResult?.count || '0', 10);

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const campaigns = await query<Campaign>(
    `SELECT * FROM enterprise_campaigns
     WHERE ${whereClause}
     ORDER BY updated_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset]
  );

  return { campaigns, total };
}

/**
 * Update campaign
 */
export async function updateCampaign(
  campaignId: string,
  input: UpdateCampaignInput
): Promise<Campaign | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }
  if (input.type !== undefined) {
    fields.push(`type = $${paramIndex++}`);
    values.push(input.type);
  }
  if (input.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(input.status);
  }
  if (input.settings !== undefined) {
    fields.push(`settings = $${paramIndex++}`);
    values.push(JSON.stringify(input.settings));
  }
  if (input.target_criteria !== undefined) {
    fields.push(`target_criteria = $${paramIndex++}`);
    values.push(JSON.stringify(input.target_criteria));
  }

  if (fields.length === 0) {
    return getCampaignById(campaignId);
  }

  // Increment version on update
  fields.push(`version = version + 1`);
  fields.push(`updated_at = NOW()`);
  values.push(campaignId);

  return queryOne<Campaign>(
    `UPDATE enterprise_campaigns SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
}

/**
 * Delete campaign
 */
export async function deleteCampaign(campaignId: string): Promise<boolean> {
  await query('DELETE FROM enterprise_campaigns WHERE id = $1', [campaignId]);
  return true;
}

/**
 * Archive campaign
 */
export async function archiveCampaign(campaignId: string): Promise<Campaign | null> {
  return updateCampaign(campaignId, { status: 'archived' });
}

// ============================================================
// CAMPAIGN ASSETS
// ============================================================

/**
 * Create campaign asset
 */
export async function createCampaignAsset(input: CreateAssetInput): Promise<CampaignAsset> {
  return insert<CampaignAsset>(
    `INSERT INTO campaign_assets (
      campaign_id, name, type, mime_type, url, storage_key, metadata, file_size_bytes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      input.campaign_id,
      input.name,
      input.type,
      input.mime_type || null,
      input.url || null,
      input.storage_key || null,
      JSON.stringify(input.metadata || {}),
      input.file_size_bytes || null,
    ]
  );
}

/**
 * Get assets for a campaign
 */
export async function getCampaignAssets(campaignId: string): Promise<CampaignAsset[]> {
  return query<CampaignAsset>(
    'SELECT * FROM campaign_assets WHERE campaign_id = $1 ORDER BY created_at ASC',
    [campaignId]
  );
}

/**
 * Delete campaign asset
 */
export async function deleteCampaignAsset(assetId: string): Promise<boolean> {
  await query('DELETE FROM campaign_assets WHERE id = $1', [assetId]);
  return true;
}

// ============================================================
// CAMPAIGN STATS
// ============================================================

/**
 * Get campaign statistics
 */
export async function getCampaignStats(enterpriseId: string): Promise<{
  total: number;
  byStatus: Record<CampaignStatus, number>;
  byType: Record<string, number>;
}> {
  const statusResult = await query<{ status: CampaignStatus; count: string }>(
    `SELECT status, COUNT(*) as count FROM enterprise_campaigns
     WHERE enterprise_id = $1
     GROUP BY status`,
    [enterpriseId]
  );

  const typeResult = await query<{ type: string; count: string }>(
    `SELECT type, COUNT(*) as count FROM enterprise_campaigns
     WHERE enterprise_id = $1
     GROUP BY type`,
    [enterpriseId]
  );

  const byStatus = {
    draft: 0,
    active: 0,
    paused: 0,
    completed: 0,
    archived: 0,
  };

  statusResult.forEach((r) => {
    byStatus[r.status] = parseInt(r.count, 10);
  });

  const byType: Record<string, number> = {};
  typeResult.forEach((r) => {
    byType[r.type] = parseInt(r.count, 10);
  });

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return { total, byStatus, byType };
}

export default {
  // CRUD
  createCampaign,
  getCampaignById,
  listEnterpriseCampaigns,
  updateCampaign,
  deleteCampaign,
  archiveCampaign,

  // Assets
  createCampaignAsset,
  getCampaignAssets,
  deleteCampaignAsset,

  // Stats
  getCampaignStats,
};
