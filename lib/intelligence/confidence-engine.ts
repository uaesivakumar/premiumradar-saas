/**
 * Confidence Engine
 *
 * S357: Confidence Engine
 * Behavior Contract B008: Confidence score updated from feedback
 *
 * Updates confidence scores based on user feedback events.
 * Uses Bayesian-style updates with configurable learning rate.
 *
 * Architecture:
 * - Each entity (company, signal, pattern) has a confidence score [0,1]
 * - Positive feedback increases confidence, negative decreases
 * - Confidence decays over time without reinforcement (via S358 Decay Engine)
 * - All changes are logged to confidence_history for audit
 */

import { query, queryOne } from '@/lib/db/client';
import { logger } from '@/lib/logging/structured-logger';
import { WorkspaceEvent, registerHandler } from '@/lib/events/event-consumer';

// ============================================================
// TYPES
// ============================================================

export type ConfidenceEntityType =
  | 'COMPANY'
  | 'SIGNAL'
  | 'ENRICHMENT'
  | 'PATTERN'
  | 'MODEL_PREDICTION';

export interface EntityConfidence {
  id: string;
  tenant_id: string;
  entity_type: ConfidenceEntityType;
  entity_id: string;
  confidence_score: number;
  positive_signals: number;
  negative_signals: number;
  total_interactions: number;
  last_feedback_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ConfidenceUpdate {
  entityType: ConfidenceEntityType;
  entityId: string;
  delta: number;
  reason: string;
  eventId?: string;
}

export interface ConfidenceUpdateResult {
  success: boolean;
  previousScore: number;
  newScore: number;
  delta: number;
  entityId: string;
  entityType: ConfidenceEntityType;
}

// ============================================================
// CONFIGURATION
// ============================================================

/**
 * Learning rate configuration
 * Higher values = faster learning, more volatile
 * Lower values = slower learning, more stable
 */
export const CONFIDENCE_CONFIG = {
  // Base learning rate for updates
  learningRate: 0.1,

  // Minimum confidence floor
  minConfidence: 0.1,

  // Maximum confidence ceiling
  maxConfidence: 0.95,

  // Initial confidence for new entities
  initialConfidence: 0.5,

  // Feedback weights by event type
  feedbackWeights: {
    LEAD_APPROVED: 0.15,
    LEAD_REJECTED: -0.10,
    LEAD_SNOOZED: 0.0,
    NBA_ACCEPTED: 0.10,
    NBA_DISMISSED: -0.05,
    DEAL_WON: 0.25,
    DEAL_LOST: -0.15,
    MEETING_SCHEDULED: 0.08,
    LEAD_CONTACTED: 0.05,
  } as Record<string, number>,

  // Signal type multipliers
  signalMultipliers: {
    hiring_expansion: 1.2,
    funding_round: 1.3,
    office_opening: 1.1,
    headcount_jump: 1.15,
    market_entry: 1.25,
  } as Record<string, number>,
};

// ============================================================
// CORE ENGINE
// ============================================================

class ConfidenceEngine {
  /**
   * Get or create confidence record for an entity
   */
  async getOrCreateConfidence(
    tenantId: string,
    entityType: ConfidenceEntityType,
    entityId: string
  ): Promise<EntityConfidence> {
    // Try to get existing
    const existing = await queryOne<EntityConfidence>(
      `SELECT * FROM entity_confidence
       WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3`,
      [tenantId, entityType, entityId]
    );

    if (existing) {
      return existing;
    }

    // Create new with initial confidence
    const result = await query<EntityConfidence>(
      `INSERT INTO entity_confidence (tenant_id, entity_type, entity_id, confidence_score)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenantId, entityType, entityId, CONFIDENCE_CONFIG.initialConfidence]
    );

    return result[0];
  }

  /**
   * Update confidence based on feedback
   */
  async updateConfidence(
    tenantId: string,
    update: ConfidenceUpdate
  ): Promise<ConfidenceUpdateResult> {
    const { entityType, entityId, delta, reason, eventId } = update;

    // Get current confidence
    const current = await this.getOrCreateConfidence(tenantId, entityType, entityId);
    const previousScore = Number(current.confidence_score);

    // Calculate new score with bounds
    let newScore = previousScore + delta * CONFIDENCE_CONFIG.learningRate;
    newScore = Math.max(CONFIDENCE_CONFIG.minConfidence, newScore);
    newScore = Math.min(CONFIDENCE_CONFIG.maxConfidence, newScore);

    const actualDelta = newScore - previousScore;

    // Update confidence
    const isPositive = delta > 0;
    await query(
      `UPDATE entity_confidence
       SET confidence_score = $1,
           positive_signals = positive_signals + $2,
           negative_signals = negative_signals + $3,
           total_interactions = total_interactions + 1,
           last_feedback_at = NOW()
       WHERE id = $4`,
      [
        newScore,
        isPositive ? 1 : 0,
        isPositive ? 0 : 1,
        current.id,
      ]
    );

    // Log to history
    await query(
      `INSERT INTO confidence_history
         (entity_confidence_id, previous_score, new_score, delta, trigger_event_id, trigger_reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [current.id, previousScore, newScore, actualDelta, eventId || null, reason]
    );

    logger.info('Confidence updated', {
      tenantId,
      entityType,
      entityId,
      previousScore,
      newScore,
      delta: actualDelta,
      reason,
    });

    return {
      success: true,
      previousScore,
      newScore,
      delta: actualDelta,
      entityId,
      entityType,
    };
  }

  /**
   * Get confidence score for an entity
   */
  async getConfidence(
    tenantId: string,
    entityType: ConfidenceEntityType,
    entityId: string
  ): Promise<number> {
    const record = await queryOne<{ confidence_score: number }>(
      `SELECT confidence_score FROM entity_confidence
       WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3`,
      [tenantId, entityType, entityId]
    );

    return record?.confidence_score ?? CONFIDENCE_CONFIG.initialConfidence;
  }

  /**
   * Get confidence history for an entity
   */
  async getConfidenceHistory(
    tenantId: string,
    entityType: ConfidenceEntityType,
    entityId: string,
    limit: number = 50
  ): Promise<Array<{
    previousScore: number;
    newScore: number;
    delta: number;
    reason: string;
    createdAt: Date;
  }>> {
    const record = await queryOne<{ id: string }>(
      `SELECT id FROM entity_confidence
       WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3`,
      [tenantId, entityType, entityId]
    );

    if (!record) {
      return [];
    }

    const history = await query<{
      previous_score: number;
      new_score: number;
      delta: number;
      trigger_reason: string;
      created_at: Date;
    }>(
      `SELECT previous_score, new_score, delta, trigger_reason, created_at
       FROM confidence_history
       WHERE entity_confidence_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [record.id, limit]
    );

    return history.map(h => ({
      previousScore: Number(h.previous_score),
      newScore: Number(h.new_score),
      delta: Number(h.delta),
      reason: h.trigger_reason || 'Unknown',
      createdAt: h.created_at,
    }));
  }

  /**
   * Get entities below confidence threshold (candidates for decay)
   */
  async getLowConfidenceEntities(
    tenantId: string,
    threshold: number = 0.3
  ): Promise<EntityConfidence[]> {
    return query<EntityConfidence>(
      `SELECT * FROM entity_confidence
       WHERE tenant_id = $1 AND confidence_score < $2
       ORDER BY confidence_score ASC`,
      [tenantId, threshold]
    );
  }

  /**
   * Get top confidence entities by type
   */
  async getTopEntities(
    tenantId: string,
    entityType: ConfidenceEntityType,
    limit: number = 10
  ): Promise<EntityConfidence[]> {
    return query<EntityConfidence>(
      `SELECT * FROM entity_confidence
       WHERE tenant_id = $1 AND entity_type = $2
       ORDER BY confidence_score DESC
       LIMIT $3`,
      [tenantId, entityType, limit]
    );
  }

  /**
   * Process feedback event and update relevant confidences
   */
  async processEvent(event: WorkspaceEvent): Promise<ConfidenceUpdateResult[]> {
    const results: ConfidenceUpdateResult[] = [];
    const feedbackWeight = CONFIDENCE_CONFIG.feedbackWeights[event.event_type] ?? 0;

    if (feedbackWeight === 0) {
      return results;
    }

    // Update company confidence if company ID is in metadata
    const companyId = event.metadata.companyId as string;
    if (companyId) {
      const result = await this.updateConfidence(event.tenant_id, {
        entityType: 'COMPANY',
        entityId: companyId,
        delta: feedbackWeight,
        reason: `${event.event_type} on lead ${event.entity_id}`,
        eventId: event.id,
      });
      results.push(result);
    }

    // Update signal confidence if signal type is in metadata
    const signalType = event.metadata.signalType as string;
    if (signalType) {
      const multiplier = CONFIDENCE_CONFIG.signalMultipliers[signalType] ?? 1.0;
      const result = await this.updateConfidence(event.tenant_id, {
        entityType: 'SIGNAL',
        entityId: signalType,
        delta: feedbackWeight * multiplier,
        reason: `${event.event_type} on lead with signal ${signalType}`,
        eventId: event.id,
      });
      results.push(result);
    }

    return results;
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const confidenceEngine = new ConfidenceEngine();

// ============================================================
// EVENT HANDLERS (Register with Event Consumer)
// ============================================================

/**
 * Register confidence update handlers for feedback events
 */
export function registerConfidenceHandlers(): void {
  const feedbackEvents = [
    'LEAD_APPROVED',
    'LEAD_REJECTED',
    'LEAD_SNOOZED',
    'NBA_ACCEPTED',
    'NBA_DISMISSED',
    'DEAL_WON',
    'DEAL_LOST',
    'MEETING_SCHEDULED',
    'LEAD_CONTACTED',
  ] as const;

  for (const eventType of feedbackEvents) {
    registerHandler(eventType as WorkspaceEvent['event_type'], async (event) => {
      try {
        const results = await confidenceEngine.processEvent(event);
        return {
          success: true,
          processed: true,
          confidenceUpdate: results.length > 0
            ? {
                entityId: results[0].entityId,
                delta: results[0].delta,
                reason: `${event.event_type} feedback`,
              }
            : undefined,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Confidence handler failed', {
          eventType: event.event_type,
          entityId: event.entity_id,
          error: errorMessage,
        });
        return {
          success: false,
          processed: false,
          error: errorMessage,
        };
      }
    });
  }
}

export default confidenceEngine;
