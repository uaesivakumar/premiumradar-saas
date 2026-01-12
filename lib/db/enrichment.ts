/**
 * S396: Enrichment Database Service
 *
 * Persists enrichment sessions and contacts to PostgreSQL.
 * Pay Apollo once, use contacts forever.
 *
 * TABLES:
 * - enrichment_sessions: Tracks each enrichment operation
 * - enriched_contacts: Contacts found, scored by QTLE
 * - enrichment_evidence: Raw provider data (audit only)
 */

import { query, queryOne, insert, getPool } from './client';

// =============================================================================
// TYPES
// =============================================================================

export type EnrichmentStage =
  | 'CONTACT_DISCOVERY_STARTED'
  | 'CONTACT_DISCOVERY_COMPLETE'
  | 'SCORING_STARTED'
  | 'SCORING_COMPLETE'
  | 'FAILED';

export interface EnrichmentSessionDB {
  id: string;
  entity_id: string;
  entity_name: string;
  user_id: string;
  tenant_id: string;
  workspace_id: string | null;
  stage: EnrichmentStage;
  started_at: Date;
  completed_at: Date | null;
  error: string | null;
  contacts_found: number;
  contacts_scored: number;
  provider_calls: number;
  total_cost_cents: number;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface EnrichedContactDB {
  id: string;
  session_id: string;
  entity_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string;
  email: string | null;
  linkedin_url: string | null;
  phone: string | null;
  role: string;
  seniority: string;
  department: string;
  qtle_score: number;
  score_breakdown: {
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
  };
  priority: string;
  priority_rank: number;
  why_recommended: string;
  confidence: string;
  source_provider: string;
  source_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EnrichmentEvidenceDB {
  id: string;
  session_id: string;
  source: string;
  entity_type: string;
  raw_payload: unknown;
  normalized_data: unknown;
  created_at: Date;
}

// =============================================================================
// SESSION OPERATIONS
// =============================================================================

/**
 * Create a new enrichment session
 */
export async function createEnrichmentSession(params: {
  id: string;
  entityId: string;
  entityName: string;
  userId: string;
  tenantId: string;
  workspaceId?: string;
}): Promise<EnrichmentSessionDB> {
  const result = await insert<EnrichmentSessionDB>(
    `INSERT INTO enrichment_sessions (
      id, entity_id, entity_name, user_id, tenant_id, workspace_id, stage
    ) VALUES ($1, $2, $3, $4, $5, $6, 'CONTACT_DISCOVERY_STARTED')
    RETURNING *`,
    [
      params.id,
      params.entityId,
      params.entityName,
      params.userId,
      params.tenantId,
      params.workspaceId || null,
    ]
  );

  console.log('[EnrichmentDB] Session created:', params.id);
  return result;
}

/**
 * Get session by ID
 */
export async function getEnrichmentSession(
  sessionId: string
): Promise<EnrichmentSessionDB | null> {
  return queryOne<EnrichmentSessionDB>(
    'SELECT * FROM enrichment_sessions WHERE id = $1',
    [sessionId]
  );
}

/**
 * Get session by entity ID (most recent successful one)
 */
export async function getEnrichmentSessionByEntity(
  entityId: string
): Promise<EnrichmentSessionDB | null> {
  return queryOne<EnrichmentSessionDB>(
    `SELECT * FROM enrichment_sessions
     WHERE entity_id = $1 AND stage != 'FAILED'
     ORDER BY created_at DESC
     LIMIT 1`,
    [entityId]
  );
}

/**
 * Update session stage
 */
export async function updateEnrichmentSessionStage(
  sessionId: string,
  stage: EnrichmentStage,
  updates?: {
    contactsFound?: number;
    contactsScored?: number;
    providerCalls?: number;
    totalCostCents?: number;
    error?: string;
  }
): Promise<EnrichmentSessionDB | null> {
  const fields = ['stage = $2'];
  const values: unknown[] = [sessionId, stage];
  let paramIndex = 3;

  if (stage === 'SCORING_COMPLETE' || stage === 'FAILED') {
    fields.push(`completed_at = NOW()`);
  }

  if (updates?.contactsFound !== undefined) {
    fields.push(`contacts_found = $${paramIndex++}`);
    values.push(updates.contactsFound);
  }

  if (updates?.contactsScored !== undefined) {
    fields.push(`contacts_scored = $${paramIndex++}`);
    values.push(updates.contactsScored);
  }

  if (updates?.providerCalls !== undefined) {
    fields.push(`provider_calls = $${paramIndex++}`);
    values.push(updates.providerCalls);
  }

  if (updates?.totalCostCents !== undefined) {
    fields.push(`total_cost_cents = $${paramIndex++}`);
    values.push(updates.totalCostCents);
  }

  if (updates?.error !== undefined) {
    fields.push(`error = $${paramIndex++}`);
    values.push(updates.error);
  }

  return queryOne<EnrichmentSessionDB>(
    `UPDATE enrichment_sessions SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );
}

// =============================================================================
// CONTACT OPERATIONS
// =============================================================================

/**
 * Save enriched contacts (batch insert)
 */
export async function saveEnrichedContacts(
  sessionId: string,
  entityId: string,
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    title: string;
    email?: string;
    linkedinUrl?: string;
    phone?: string;
    role: string;
    seniority: string;
    department: string;
    qtleScore: number;
    scoreBreakdown: {
      quality: number;
      timing: number;
      likelihood: number;
      engagement: number;
    };
    priority: string;
    priorityRank: number;
    whyRecommended: string;
    confidence: string;
    sourceProvider: string;
    sourceId?: string;
  }>
): Promise<number> {
  if (contacts.length === 0) return 0;

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete existing contacts for this session (in case of re-enrichment)
    await client.query(
      'DELETE FROM enriched_contacts WHERE session_id = $1',
      [sessionId]
    );

    // Insert all contacts
    for (const contact of contacts) {
      await client.query(
        `INSERT INTO enriched_contacts (
          id, session_id, entity_id,
          first_name, last_name, full_name, title,
          email, linkedin_url, phone,
          role, seniority, department,
          qtle_score, score_breakdown,
          priority, priority_rank,
          why_recommended, confidence,
          source_provider, source_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )`,
        [
          contact.id,
          sessionId,
          entityId,
          contact.firstName,
          contact.lastName,
          contact.fullName,
          contact.title,
          contact.email || null,
          contact.linkedinUrl || null,
          contact.phone || null,
          contact.role,
          contact.seniority,
          contact.department,
          contact.qtleScore,
          JSON.stringify(contact.scoreBreakdown),
          contact.priority,
          contact.priorityRank,
          contact.whyRecommended,
          contact.confidence,
          contact.sourceProvider,
          contact.sourceId || null,
        ]
      );
    }

    await client.query('COMMIT');

    console.log('[EnrichmentDB] Saved', contacts.length, 'contacts for session:', sessionId);
    return contacts.length;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[EnrichmentDB] Failed to save contacts:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get contacts by session ID
 */
export async function getContactsBySession(
  sessionId: string
): Promise<EnrichedContactDB[]> {
  return query<EnrichedContactDB>(
    `SELECT * FROM enriched_contacts
     WHERE session_id = $1
     ORDER BY priority_rank ASC`,
    [sessionId]
  );
}

/**
 * Get contacts by entity ID (from most recent successful session)
 */
export async function getContactsByEntity(
  entityId: string
): Promise<EnrichedContactDB[]> {
  // First get the most recent successful session
  const session = await getEnrichmentSessionByEntity(entityId);
  if (!session) return [];

  return getContactsBySession(session.id);
}

/**
 * Check if entity has been enriched (has contacts)
 */
export async function hasEnrichedContacts(entityId: string): Promise<boolean> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM enriched_contacts WHERE entity_id = $1`,
    [entityId]
  );
  return (parseInt(result?.count || '0', 10) > 0);
}

// =============================================================================
// EVIDENCE OPERATIONS
// =============================================================================

/**
 * Store evidence from provider (for audit)
 */
export async function storeEnrichmentEvidence(params: {
  id: string;
  sessionId: string;
  source: string;
  entityType: string;
  rawPayload: unknown;
  normalizedData: unknown;
}): Promise<EnrichmentEvidenceDB> {
  const result = await insert<EnrichmentEvidenceDB>(
    `INSERT INTO enrichment_evidence (
      id, session_id, source, entity_type, raw_payload, normalized_data
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      params.id,
      params.sessionId,
      params.source,
      params.entityType,
      JSON.stringify(params.rawPayload),
      JSON.stringify(params.normalizedData),
    ]
  );

  console.log('[EnrichmentDB] Evidence stored:', params.id);
  return result;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert DB contact to API format
 */
export function dbContactToApiFormat(contact: EnrichedContactDB) {
  return {
    id: contact.id,
    fullName: contact.full_name,
    firstName: contact.first_name,
    lastName: contact.last_name,
    title: contact.title,
    email: contact.email || undefined,
    linkedinUrl: contact.linkedin_url || undefined,
    phone: contact.phone || undefined,
    role: contact.role as 'decision_maker' | 'influencer' | 'champion' | 'end_user',
    seniority: contact.seniority as 'c_suite' | 'vp' | 'director' | 'manager' | 'individual',
    department: contact.department,
    priority: contact.priority as 'primary' | 'secondary' | 'tertiary',
    priorityRank: contact.priority_rank,
    score: contact.qtle_score,
    scoreBreakdown: contact.score_breakdown,
    whyRecommended: contact.why_recommended,
    confidence: contact.confidence as 'high' | 'medium' | 'low',
  };
}

/**
 * Convert DB session to API format
 */
export function dbSessionToApiFormat(session: EnrichmentSessionDB) {
  return {
    id: session.id,
    entityId: session.entity_id,
    entityName: session.entity_name,
    userId: session.user_id,
    tenantId: session.tenant_id,
    workspaceId: session.workspace_id || undefined,
    stage: session.stage,
    startedAt: session.started_at,
    completedAt: session.completed_at || undefined,
    error: session.error || undefined,
    contactsFound: session.contacts_found,
    contactsScored: session.contacts_scored,
    providerCalls: session.provider_calls,
    totalCostCents: session.total_cost_cents,
  };
}
