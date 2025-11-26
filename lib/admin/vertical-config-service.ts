/**
 * Vertical Config Service
 *
 * Manages vertical/sub-vertical/region configurations in PostgreSQL.
 * This is the SINGLE SOURCE OF TRUTH for all vertical definitions.
 *
 * UPR OS fetches config from this service via API.
 * Super-Admin Panel uses this service for CRUD operations.
 */

import { query, queryOne, insert } from '@/lib/db';
import { z } from 'zod';

// =============================================================================
// Types
// =============================================================================

export type RadarTarget = 'companies' | 'individuals' | 'families' | 'candidates';

export interface SignalConfig {
  type: string;
  name: string;
  description: string;
  relevance: number;  // 0-1, how relevant this signal is for this vertical
  templates?: SignalTemplate[];
}

export interface SignalTemplate {
  title: string;
  content: string;
  confidence: number;
  relevance: number;
}

export interface ScoringFactorConfig {
  id: string;
  name: string;
  weight: number;  // 0-1
  description: string;
}

export interface RegionalWeightConfig {
  region: string;
  qualityBoost: number;
  timingBoost: number;
  marketMaturity: number;
}

export interface TimingSignalConfig {
  id: string;
  name: string;
  description: string;
  deadline?: string;  // ISO date
  months?: number[];  // 0-11 for budget cycles
  urgencyMultiplier: number;
}

export interface EnrichmentSourceConfig {
  id: string;
  name: string;
  type: 'apollo' | 'linkedin' | 'crunchbase' | 'custom';
  enabled: boolean;
  priority: number;
  fields: string[];
}

export interface OutreachChannelConfig {
  id: string;
  channel: 'email' | 'linkedin' | 'phone' | 'whatsapp';
  enabled: boolean;
  priority: number;
  templates?: string[];
}

export interface JourneyStageConfig {
  id: string;
  name: string;
  order: number;
  actions: string[];
  exitCriteria: string[];
}

export interface CompanyProfileConfig {
  name: string;
  description: string;
  signals: SignalTemplate[];
}

export interface VerticalConfigData {
  // Signals
  allowedSignalTypes: string[];
  signalConfigs: SignalConfig[];

  // Scoring
  scoringWeights: {
    quality: number;
    timing: number;
    liquidity: number;
    endUser: number;
  };
  scoringFactors: ScoringFactorConfig[];
  regionalWeights: RegionalWeightConfig[];
  timingSignals: TimingSignalConfig[];

  // B2B Adjustments
  b2bAdjustments?: {
    companySize: Record<string, number>;
    decisionSpeed: Record<string, number>;
    dealCycle: Record<string, number>;
  };

  // Enrichment
  enrichmentSources: EnrichmentSourceConfig[];

  // Outreach
  outreachChannels: OutreachChannelConfig[];

  // Journey
  journeyStages: JourneyStageConfig[];

  // Company profiles (for known entities)
  companyProfiles?: CompanyProfileConfig[];

  // Default KPIs
  defaultKPIs?: {
    product: string;
    target: number;
    unit: string;
    period: 'monthly' | 'quarterly' | 'yearly';
  }[];
}

export interface VerticalConfig {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  vertical: string;
  subVertical: string;
  regionCountry: string;
  regionCity?: string;
  regionTerritory?: string;
  name: string;
  description?: string;
  radarTarget: RadarTarget;
  config: VerticalConfigData;
  isActive: boolean;
  isSeeded: boolean;
}

// =============================================================================
// Validation Schema
// =============================================================================

export const VerticalConfigSchema = z.object({
  vertical: z.string().min(1),
  subVertical: z.string().min(1),
  regionCountry: z.string().min(1),
  regionCity: z.string().optional(),
  regionTerritory: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  radarTarget: z.enum(['companies', 'individuals', 'families', 'candidates']),
  config: z.object({
    allowedSignalTypes: z.array(z.string()),
    signalConfigs: z.array(z.object({
      type: z.string(),
      name: z.string(),
      description: z.string(),
      relevance: z.number().min(0).max(1),
      templates: z.array(z.object({
        title: z.string(),
        content: z.string(),
        confidence: z.number(),
        relevance: z.number(),
      })).optional(),
    })),
    scoringWeights: z.object({
      quality: z.number(),
      timing: z.number(),
      liquidity: z.number(),
      endUser: z.number(),
    }),
    scoringFactors: z.array(z.any()),
    regionalWeights: z.array(z.any()),
    timingSignals: z.array(z.any()),
    b2bAdjustments: z.any().optional(),
    enrichmentSources: z.array(z.any()),
    outreachChannels: z.array(z.any()),
    journeyStages: z.array(z.any()),
    companyProfiles: z.array(z.any()).optional(),
    defaultKPIs: z.array(z.any()).optional(),
  }),
  isActive: z.boolean().default(true),
});

// =============================================================================
// Database Operations
// =============================================================================

/**
 * Get a vertical config by vertical/sub-vertical/region
 */
export async function getVerticalConfig(
  vertical: string,
  subVertical: string,
  regionCountry: string
): Promise<VerticalConfig | null> {
  const row = await queryOne<VerticalConfigRow>(
    `SELECT * FROM vertical_configs
     WHERE vertical = $1 AND sub_vertical = $2 AND region_country = $3 AND is_active = true`,
    [vertical, subVertical, regionCountry]
  );

  return row ? mapRowToConfig(row) : null;
}

/**
 * Get all vertical configs
 */
export async function getAllVerticalConfigs(): Promise<VerticalConfig[]> {
  const rows = await query<VerticalConfigRow>(
    `SELECT * FROM vertical_configs ORDER BY vertical, sub_vertical, region_country`
  );

  return rows.map(mapRowToConfig);
}

/**
 * Get all active vertical configs
 */
export async function getActiveVerticalConfigs(): Promise<VerticalConfig[]> {
  const rows = await query<VerticalConfigRow>(
    `SELECT * FROM vertical_configs WHERE is_active = true ORDER BY vertical, sub_vertical, region_country`
  );

  return rows.map(mapRowToConfig);
}

/**
 * Get verticals list (unique verticals)
 */
export async function getVerticals(): Promise<string[]> {
  const rows = await query<{ vertical: string }>(
    `SELECT DISTINCT vertical FROM vertical_configs WHERE is_active = true ORDER BY vertical`
  );

  return rows.map(r => r.vertical);
}

/**
 * Get sub-verticals for a vertical
 */
export async function getSubVerticals(vertical: string): Promise<string[]> {
  const rows = await query<{ sub_vertical: string }>(
    `SELECT DISTINCT sub_vertical FROM vertical_configs
     WHERE vertical = $1 AND is_active = true ORDER BY sub_vertical`,
    [vertical]
  );

  return rows.map(r => r.sub_vertical);
}

/**
 * Get regions for a vertical/sub-vertical
 */
export async function getRegions(vertical: string, subVertical: string): Promise<string[]> {
  const rows = await query<{ region_country: string }>(
    `SELECT DISTINCT region_country FROM vertical_configs
     WHERE vertical = $1 AND sub_vertical = $2 AND is_active = true ORDER BY region_country`,
    [vertical, subVertical]
  );

  return rows.map(r => r.region_country);
}

/**
 * Create a new vertical config
 */
export async function createVerticalConfig(
  data: z.infer<typeof VerticalConfigSchema>
): Promise<VerticalConfig> {
  // Validate input
  const validated = VerticalConfigSchema.parse(data);

  const row = await insert<VerticalConfigRow>(
    `INSERT INTO vertical_configs
     (vertical, sub_vertical, region_country, region_city, region_territory,
      name, description, radar_target, config, is_active, is_seeded)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)
     RETURNING *`,
    [
      validated.vertical,
      validated.subVertical,
      validated.regionCountry,
      validated.regionCity || null,
      validated.regionTerritory || null,
      validated.name,
      validated.description || null,
      validated.radarTarget,
      JSON.stringify(validated.config),
      validated.isActive,
    ]
  );

  return mapRowToConfig(row);
}

/**
 * Update a vertical config
 */
export async function updateVerticalConfig(
  id: string,
  data: Partial<z.infer<typeof VerticalConfigSchema>>
): Promise<VerticalConfig | null> {
  // Build update query dynamically
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.radarTarget !== undefined) {
    updates.push(`radar_target = $${paramIndex++}`);
    values.push(data.radarTarget);
  }
  if (data.config !== undefined) {
    updates.push(`config = $${paramIndex++}`);
    values.push(JSON.stringify(data.config));
  }
  if (data.isActive !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }

  if (updates.length === 0) {
    return getVerticalConfigById(id);
  }

  values.push(id);

  const row = await queryOne<VerticalConfigRow>(
    `UPDATE vertical_configs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return row ? mapRowToConfig(row) : null;
}

/**
 * Delete a vertical config (soft delete by setting is_active = false)
 * Seeded configs cannot be deleted
 */
export async function deleteVerticalConfig(id: string): Promise<boolean> {
  const result = await query(
    `UPDATE vertical_configs SET is_active = false WHERE id = $1 AND is_seeded = false`,
    [id]
  );

  return result.length > 0;
}

/**
 * Get vertical config by ID
 */
export async function getVerticalConfigById(id: string): Promise<VerticalConfig | null> {
  const row = await queryOne<VerticalConfigRow>(
    `SELECT * FROM vertical_configs WHERE id = $1`,
    [id]
  );

  return row ? mapRowToConfig(row) : null;
}

/**
 * Seed a vertical config (marks as is_seeded = true)
 */
export async function seedVerticalConfig(
  data: z.infer<typeof VerticalConfigSchema>
): Promise<VerticalConfig> {
  const validated = VerticalConfigSchema.parse(data);

  // Upsert: insert or update if exists
  const row = await insert<VerticalConfigRow>(
    `INSERT INTO vertical_configs
     (vertical, sub_vertical, region_country, region_city, region_territory,
      name, description, radar_target, config, is_active, is_seeded)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
     ON CONFLICT (vertical, sub_vertical, region_country)
     DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       radar_target = EXCLUDED.radar_target,
       config = EXCLUDED.config,
       is_active = EXCLUDED.is_active,
       is_seeded = true
     RETURNING *`,
    [
      validated.vertical,
      validated.subVertical,
      validated.regionCountry,
      validated.regionCity || null,
      validated.regionTerritory || null,
      validated.name,
      validated.description || null,
      validated.radarTarget,
      JSON.stringify(validated.config),
      validated.isActive,
    ]
  );

  return mapRowToConfig(row);
}

// =============================================================================
// Helpers
// =============================================================================

interface VerticalConfigRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  vertical: string;
  sub_vertical: string;
  region_country: string;
  region_city: string | null;
  region_territory: string | null;
  name: string;
  description: string | null;
  radar_target: RadarTarget;
  config: VerticalConfigData;
  is_active: boolean;
  is_seeded: boolean;
}

function mapRowToConfig(row: VerticalConfigRow): VerticalConfig {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    vertical: row.vertical,
    subVertical: row.sub_vertical,
    regionCountry: row.region_country,
    regionCity: row.region_city || undefined,
    regionTerritory: row.region_territory || undefined,
    name: row.name,
    description: row.description || undefined,
    radarTarget: row.radar_target,
    config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
    isActive: row.is_active,
    isSeeded: row.is_seeded,
  };
}

// =============================================================================
// Cache (5-minute TTL)
// =============================================================================

const configCache = new Map<string, { config: VerticalConfig; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get vertical config with caching
 */
export async function getVerticalConfigCached(
  vertical: string,
  subVertical: string,
  regionCountry: string
): Promise<VerticalConfig | null> {
  const cacheKey = `${vertical}:${subVertical}:${regionCountry}`;
  const cached = configCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.config;
  }

  const config = await getVerticalConfig(vertical, subVertical, regionCountry);

  if (config) {
    configCache.set(cacheKey, {
      config,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  return config;
}

/**
 * Invalidate cache for a specific config
 */
export function invalidateConfigCache(
  vertical: string,
  subVertical: string,
  regionCountry: string
): void {
  const cacheKey = `${vertical}:${subVertical}:${regionCountry}`;
  configCache.delete(cacheKey);
}

/**
 * Clear entire config cache
 */
export function clearConfigCache(): void {
  configCache.clear();
}
