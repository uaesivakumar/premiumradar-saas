/**
 * S293A: Evidence Packs Database Service
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * Database persistence for evidence packs.
 */

import { query, queryOne, insert } from './client';
import type {
  RankingEvidencePack,
  OutreachEvidencePack,
  DiscoveryEvidencePack,
} from '@/lib/intelligence/evidence/types';

// ============================================================
// TYPES
// ============================================================

export type EvidencePackType = 'ranking' | 'outreach' | 'discovery';

export interface StoredEvidencePack {
  id: string;
  user_id: string;
  enterprise_id: string | null;
  workspace_id: string | null;
  pack_type: EvidencePackType;
  target_entity: string;
  target_type: 'company' | 'sector' | 'region' | 'query';
  pack_data: RankingEvidencePack | OutreachEvidencePack | DiscoveryEvidencePack;
  overall_score: number | null;
  q_score: number | null;
  t_score: number | null;
  l_score: number | null;
  e_score: number | null;
  confidence: number | null;
  evidence_count: number;
  sources: string[];
  expires_at: Date | null;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEvidencePackInput {
  user_id: string;
  enterprise_id?: string;
  workspace_id?: string;
  pack_type: EvidencePackType;
  target_entity: string;
  target_type?: 'company' | 'sector' | 'region' | 'query';
  pack_data: RankingEvidencePack | OutreachEvidencePack | DiscoveryEvidencePack;
  expires_at?: Date;
}

export interface EvidenceInsight {
  id: string;
  pack_id: string;
  insight_type: string;
  insight_text: string;
  priority: number;
  created_at: Date;
}

// ============================================================
// EVIDENCE PACK CRUD
// ============================================================

/**
 * Store a new evidence pack
 */
export async function storeEvidencePack(input: CreateEvidencePackInput): Promise<StoredEvidencePack> {
  const packData = input.pack_data;

  // Extract scores based on pack type
  let overallScore: number | null = null;
  let qScore: number | null = null;
  let tScore: number | null = null;
  let lScore: number | null = null;
  let eScore: number | null = null;
  let confidence: number | null = null;
  let evidenceCount = 0;
  let sources: string[] = [];

  if (input.pack_type === 'ranking' && 'justification' in packData) {
    const ranking = packData as RankingEvidencePack;
    overallScore = ranking.score;
    qScore = ranking.justification.Q.score;
    tScore = ranking.justification.T.score;
    lScore = ranking.justification.L.score;
    eScore = ranking.justification.E.score;
    confidence = ranking.justification.overall.confidence;
    evidenceCount = ranking.reasoning.steps.reduce((acc, step) => acc + step.evidence.length, 0);
  } else if (input.pack_type === 'discovery' && 'signalsDetected' in packData) {
    const discovery = packData as DiscoveryEvidencePack;
    evidenceCount = discovery.signalsDetected.length;
    confidence = discovery.reasoning.confidence;
  }

  return insert<StoredEvidencePack>(
    `INSERT INTO evidence_packs (
      user_id, enterprise_id, workspace_id,
      pack_type, target_entity, target_type,
      pack_data,
      overall_score, q_score, t_score, l_score, e_score,
      confidence, evidence_count, sources,
      expires_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`,
    [
      input.user_id,
      input.enterprise_id || null,
      input.workspace_id || null,
      input.pack_type,
      input.target_entity,
      input.target_type || 'company',
      JSON.stringify(packData),
      overallScore,
      qScore,
      tScore,
      lScore,
      eScore,
      confidence,
      evidenceCount,
      sources,
      input.expires_at || null,
    ]
  );
}

/**
 * Get evidence pack by ID
 */
export async function getEvidencePackById(packId: string): Promise<StoredEvidencePack | null> {
  return queryOne<StoredEvidencePack>(
    'SELECT * FROM evidence_packs WHERE id = $1',
    [packId]
  );
}

/**
 * Get latest evidence pack for a target
 */
export async function getLatestPackForTarget(
  userId: string,
  targetEntity: string,
  packType: EvidencePackType
): Promise<StoredEvidencePack | null> {
  return queryOne<StoredEvidencePack>(
    `SELECT * FROM evidence_packs
     WHERE user_id = $1 AND target_entity = $2 AND pack_type = $3
       AND is_archived = false
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, targetEntity, packType]
  );
}

/**
 * List evidence packs for a user
 */
export async function listUserEvidencePacks(
  userId: string,
  options?: {
    packType?: EvidencePackType;
    limit?: number;
    offset?: number;
    includeArchived?: boolean;
  }
): Promise<{ packs: StoredEvidencePack[]; total: number }> {
  const conditions: string[] = ['user_id = $1'];
  const values: unknown[] = [userId];
  let paramIndex = 2;

  if (options?.packType) {
    conditions.push(`pack_type = $${paramIndex++}`);
    values.push(options.packType);
  }

  if (!options?.includeArchived) {
    conditions.push('is_archived = false');
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM evidence_packs WHERE ${whereClause}`,
    values
  );
  const total = parseInt(countResult?.count || '0', 10);

  // Get paginated results
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const packs = await query<StoredEvidencePack>(
    `SELECT * FROM evidence_packs
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset]
  );

  return { packs, total };
}

/**
 * List evidence packs for an enterprise
 */
export async function listEnterpriseEvidencePacks(
  enterpriseId: string,
  options?: {
    packType?: EvidencePackType;
    limit?: number;
    offset?: number;
  }
): Promise<{ packs: StoredEvidencePack[]; total: number }> {
  const conditions: string[] = ['enterprise_id = $1', 'is_archived = false'];
  const values: unknown[] = [enterpriseId];
  let paramIndex = 2;

  if (options?.packType) {
    conditions.push(`pack_type = $${paramIndex++}`);
    values.push(options.packType);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM evidence_packs WHERE ${whereClause}`,
    values
  );
  const total = parseInt(countResult?.count || '0', 10);

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const packs = await query<StoredEvidencePack>(
    `SELECT * FROM evidence_packs
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset]
  );

  return { packs, total };
}

/**
 * Archive an evidence pack
 */
export async function archiveEvidencePack(packId: string): Promise<StoredEvidencePack | null> {
  return queryOne<StoredEvidencePack>(
    `UPDATE evidence_packs SET is_archived = true, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [packId]
  );
}

/**
 * Delete an evidence pack
 */
export async function deleteEvidencePack(packId: string): Promise<boolean> {
  await query('DELETE FROM evidence_packs WHERE id = $1', [packId]);
  return true;
}

// ============================================================
// EVIDENCE INSIGHTS
// ============================================================

/**
 * Store insights for an evidence pack
 */
export async function storeInsights(
  packId: string,
  insights: Array<{ type: string; text: string; priority?: number }>
): Promise<EvidenceInsight[]> {
  if (insights.length === 0) return [];

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let paramIndex = 1;

  for (const insight of insights) {
    placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
    values.push(packId, insight.type, insight.text, insight.priority || 0);
  }

  return query<EvidenceInsight>(
    `INSERT INTO evidence_insights (pack_id, insight_type, insight_text, priority)
     VALUES ${placeholders.join(', ')}
     RETURNING *`,
    values
  );
}

/**
 * Get insights for an evidence pack
 */
export async function getPackInsights(packId: string): Promise<EvidenceInsight[]> {
  return query<EvidenceInsight>(
    `SELECT * FROM evidence_insights
     WHERE pack_id = $1
     ORDER BY priority DESC, created_at ASC`,
    [packId]
  );
}

/**
 * Get insights by type
 */
export async function getInsightsByType(
  packId: string,
  insightType: string
): Promise<EvidenceInsight[]> {
  return query<EvidenceInsight>(
    `SELECT * FROM evidence_insights
     WHERE pack_id = $1 AND insight_type = $2
     ORDER BY priority DESC`,
    [packId, insightType]
  );
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Extract and store insights from a ranking pack
 */
export async function extractRankingInsights(
  packId: string,
  pack: RankingEvidencePack
): Promise<void> {
  const insights: Array<{ type: string; text: string; priority?: number }> = [];

  // Key insights
  pack.keyInsights.forEach((insight, i) => {
    insights.push({
      type: 'key_insight',
      text: insight,
      priority: pack.keyInsights.length - i,
    });
  });

  // Differentiators
  pack.differentiators.forEach((diff, i) => {
    insights.push({
      type: 'differentiator',
      text: diff,
      priority: pack.differentiators.length - i,
    });
  });

  // Risks
  pack.risks.forEach((risk, i) => {
    insights.push({
      type: 'risk',
      text: risk,
      priority: pack.risks.length - i,
    });
  });

  await storeInsights(packId, insights);
}

/**
 * Extract and store insights from an outreach pack
 */
export async function extractOutreachInsights(
  packId: string,
  pack: OutreachEvidencePack
): Promise<void> {
  const insights: Array<{ type: string; text: string; priority?: number }> = [];

  pack.whyNow.forEach((item, i) => {
    insights.push({ type: 'why_now', text: item, priority: pack.whyNow.length - i });
  });

  pack.whyThis.forEach((item, i) => {
    insights.push({ type: 'why_this', text: item, priority: pack.whyThis.length - i });
  });

  pack.whyYou.forEach((item, i) => {
    insights.push({ type: 'why_you', text: item, priority: pack.whyYou.length - i });
  });

  pack.talkingPoints.forEach((item, i) => {
    insights.push({ type: 'talking_point', text: item, priority: pack.talkingPoints.length - i });
  });

  pack.avoidTopics.forEach((item, i) => {
    insights.push({ type: 'avoid_topic', text: item, priority: pack.avoidTopics.length - i });
  });

  await storeInsights(packId, insights);
}

/**
 * Extract and store insights from a discovery pack
 */
export async function extractDiscoveryInsights(
  packId: string,
  pack: DiscoveryEvidencePack
): Promise<void> {
  const insights: Array<{ type: string; text: string; priority?: number }> = [];

  pack.matchCriteria.forEach((item, i) => {
    insights.push({ type: 'match_criteria', text: item, priority: pack.matchCriteria.length - i });
  });

  pack.signalsDetected.forEach((item, i) => {
    insights.push({ type: 'signal_detected', text: item, priority: pack.signalsDetected.length - i });
  });

  await storeInsights(packId, insights);
}

/**
 * Store pack with automatic insight extraction
 */
export async function storePackWithInsights(
  input: CreateEvidencePackInput
): Promise<StoredEvidencePack> {
  const pack = await storeEvidencePack(input);

  // Extract insights based on pack type
  if (input.pack_type === 'ranking' && 'keyInsights' in input.pack_data) {
    await extractRankingInsights(pack.id, input.pack_data as RankingEvidencePack);
  } else if (input.pack_type === 'outreach' && 'whyNow' in input.pack_data) {
    await extractOutreachInsights(pack.id, input.pack_data as OutreachEvidencePack);
  } else if (input.pack_type === 'discovery' && 'matchCriteria' in input.pack_data) {
    await extractDiscoveryInsights(pack.id, input.pack_data as DiscoveryEvidencePack);
  }

  return pack;
}

/**
 * Cleanup expired evidence packs
 */
export async function cleanupExpiredPacks(): Promise<number> {
  const result = await query<{ id: string }>(
    `DELETE FROM evidence_packs WHERE expires_at < NOW() RETURNING id`
  );
  return result.length;
}

export default {
  // CRUD
  storeEvidencePack,
  getEvidencePackById,
  getLatestPackForTarget,
  listUserEvidencePacks,
  listEnterpriseEvidencePacks,
  archiveEvidencePack,
  deleteEvidencePack,

  // Insights
  storeInsights,
  getPackInsights,
  getInsightsByType,

  // Extraction
  extractRankingInsights,
  extractOutreachInsights,
  extractDiscoveryInsights,
  storePackWithInsights,

  // Cleanup
  cleanupExpiredPacks,
};
