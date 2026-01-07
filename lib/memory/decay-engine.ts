/**
 * Decay Engine
 *
 * S358: Decay Engine
 * Behavior Contract B009: Stale data automatically decays
 *
 * Implements time-based decay for cached data and confidence scores.
 * Data that isn't reinforced by user feedback gradually loses confidence.
 *
 * Architecture:
 * - Memory store entries have TTL and decay over time
 * - Confidence scores decay without positive reinforcement
 * - Enrichment data refreshes when confidence drops below threshold
 * - Scheduled job runs decay calculations periodically
 */

import { query, queryOne } from '@/lib/db/client';
import { logger } from '@/lib/logging/structured-logger';
import { memoryStore, MemoryKeys, MemoryTTL } from './persistent-store';
import { confidenceEngine, CONFIDENCE_CONFIG, ConfidenceEntityType } from '@/lib/intelligence/confidence-engine';

// ============================================================
// DECAY CONFIGURATION
// ============================================================

export const DECAY_CONFIG = {
  // Decay rates per day (as percentage)
  decayRates: {
    COMPANY: 0.02,      // 2% per day without interaction
    SIGNAL: 0.03,       // 3% per day
    ENRICHMENT: 0.01,   // 1% per day
    PATTERN: 0.005,     // 0.5% per day
    MODEL_PREDICTION: 0.05, // 5% per day (predictions decay fastest)
  } as Record<ConfidenceEntityType, number>,

  // Minimum days since last feedback before decay applies
  gracePeriodDays: 3,

  // Confidence threshold below which data is considered stale
  staleThreshold: 0.3,

  // Confidence threshold below which data should be refreshed
  refreshThreshold: 0.25,

  // Maximum batch size for decay processing
  batchSize: 500,

  // Memory TTL multipliers based on confidence
  ttlMultipliers: {
    high: 2.0,    // confidence > 0.8
    medium: 1.0,  // confidence 0.5-0.8
    low: 0.5,     // confidence < 0.5
  },
};

// ============================================================
// DECAY TYPES
// ============================================================

export interface DecayResult {
  entityId: string;
  entityType: ConfidenceEntityType;
  previousScore: number;
  newScore: number;
  decayed: boolean;
  daysSinceInteraction: number;
}

export interface DecayJobResult {
  processed: number;
  decayed: number;
  refreshCandidates: number;
  errors: number;
  duration: number;
}

export interface StaleEntity {
  id: string;
  entityType: ConfidenceEntityType;
  entityId: string;
  confidenceScore: number;
  lastFeedbackAt: Date | null;
  daysSinceInteraction: number;
}

// ============================================================
// DECAY ENGINE
// ============================================================

class DecayEngine {
  /**
   * Calculate decay for a single entity
   */
  calculateDecay(
    currentScore: number,
    entityType: ConfidenceEntityType,
    daysSinceInteraction: number
  ): number {
    // No decay within grace period
    if (daysSinceInteraction <= DECAY_CONFIG.gracePeriodDays) {
      return currentScore;
    }

    const decayRate = DECAY_CONFIG.decayRates[entityType] ?? 0.02;
    const effectiveDays = daysSinceInteraction - DECAY_CONFIG.gracePeriodDays;

    // Exponential decay: score * (1 - rate)^days
    const decayFactor = Math.pow(1 - decayRate, effectiveDays);
    const newScore = currentScore * decayFactor;

    // Don't decay below minimum confidence
    return Math.max(newScore, CONFIDENCE_CONFIG.minConfidence);
  }

  /**
   * Apply decay to entities that haven't received feedback
   */
  async applyDecay(tenantId: string): Promise<DecayJobResult> {
    const startTime = Date.now();
    let processed = 0;
    let decayed = 0;
    let refreshCandidates = 0;
    let errors = 0;

    try {
      // Get entities that haven't been updated recently
      const staleEntities = await query<{
        id: string;
        entity_type: ConfidenceEntityType;
        entity_id: string;
        confidence_score: number;
        last_feedback_at: Date | null;
        updated_at: Date;
      }>(
        `SELECT id, entity_type, entity_id, confidence_score, last_feedback_at, updated_at
         FROM entity_confidence
         WHERE tenant_id = $1
           AND (
             last_feedback_at IS NULL
             OR last_feedback_at < NOW() - INTERVAL '${DECAY_CONFIG.gracePeriodDays} days'
           )
           AND updated_at < NOW() - INTERVAL '1 day'
         ORDER BY updated_at ASC
         LIMIT $2`,
        [tenantId, DECAY_CONFIG.batchSize]
      );

      for (const entity of staleEntities) {
        try {
          processed++;

          // Calculate days since last interaction
          const lastInteraction = entity.last_feedback_at || entity.updated_at;
          const daysSinceInteraction = Math.floor(
            (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
          );

          const currentScore = Number(entity.confidence_score);
          const newScore = this.calculateDecay(
            currentScore,
            entity.entity_type,
            daysSinceInteraction
          );

          // Only update if score actually changed
          if (Math.abs(newScore - currentScore) > 0.0001) {
            await query(
              `UPDATE entity_confidence
               SET confidence_score = $1, updated_at = NOW()
               WHERE id = $2`,
              [newScore, entity.id]
            );

            // Log decay to history
            await query(
              `INSERT INTO confidence_history
                 (entity_confidence_id, previous_score, new_score, delta, trigger_reason)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                entity.id,
                currentScore,
                newScore,
                newScore - currentScore,
                `Decay: ${daysSinceInteraction} days without feedback`,
              ]
            );

            decayed++;

            logger.debug('Entity confidence decayed', {
              entityType: entity.entity_type,
              entityId: entity.entity_id,
              previousScore: currentScore,
              newScore,
              daysSinceInteraction,
            });
          }

          // Check if needs refresh
          if (newScore < DECAY_CONFIG.refreshThreshold) {
            refreshCandidates++;
          }
        } catch (error) {
          errors++;
          logger.error('Decay failed for entity', {
            entityId: entity.entity_id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } catch (error) {
      logger.error('Decay job failed', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }

    const duration = Date.now() - startTime;

    logger.info('Decay job completed', {
      tenantId,
      processed,
      decayed,
      refreshCandidates,
      errors,
      duration,
    });

    return { processed, decayed, refreshCandidates, errors, duration };
  }

  /**
   * Get entities that need data refresh due to low confidence
   */
  async getRefreshCandidates(tenantId: string): Promise<StaleEntity[]> {
    const entities = await query<{
      id: string;
      entity_type: ConfidenceEntityType;
      entity_id: string;
      confidence_score: number;
      last_feedback_at: Date | null;
      updated_at: Date;
    }>(
      `SELECT id, entity_type, entity_id, confidence_score, last_feedback_at, updated_at
       FROM entity_confidence
       WHERE tenant_id = $1
         AND confidence_score < $2
       ORDER BY confidence_score ASC
       LIMIT 100`,
      [tenantId, DECAY_CONFIG.refreshThreshold]
    );

    return entities.map(e => ({
      id: e.id,
      entityType: e.entity_type,
      entityId: e.entity_id,
      confidenceScore: Number(e.confidence_score),
      lastFeedbackAt: e.last_feedback_at,
      daysSinceInteraction: Math.floor(
        (Date.now() - new Date(e.last_feedback_at || e.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
  }

  /**
   * Clean up expired memory store entries
   */
  async cleanupExpiredMemory(tenantId: string): Promise<number> {
    const result = await query<{ count: string }>(
      `WITH deleted AS (
         DELETE FROM memory_store
         WHERE tenant_id = $1 AND expires_at < NOW()
         RETURNING id
       )
       SELECT COUNT(*) as count FROM deleted`,
      [tenantId]
    );

    const deletedCount = parseInt(result[0]?.count || '0', 10);

    if (deletedCount > 0) {
      logger.info('Expired memory entries cleaned up', {
        tenantId,
        deletedCount,
      });
    }

    return deletedCount;
  }

  /**
   * Adjust memory TTL based on confidence score
   */
  getAdjustedTTL(baseTTL: number, confidence: number): number {
    let multiplier: number;

    if (confidence > 0.8) {
      multiplier = DECAY_CONFIG.ttlMultipliers.high;
    } else if (confidence >= 0.5) {
      multiplier = DECAY_CONFIG.ttlMultipliers.medium;
    } else {
      multiplier = DECAY_CONFIG.ttlMultipliers.low;
    }

    return Math.floor(baseTTL * multiplier);
  }

  /**
   * Get decay statistics for a tenant
   */
  async getDecayStats(tenantId: string): Promise<{
    totalEntities: number;
    staleEntities: number;
    refreshCandidates: number;
    averageConfidence: number;
    decayedToday: number;
  }> {
    const stats = await queryOne<{
      total: string;
      stale: string;
      refresh: string;
      avg_confidence: number;
    }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE confidence_score < $2) as stale,
         COUNT(*) FILTER (WHERE confidence_score < $3) as refresh,
         AVG(confidence_score) as avg_confidence
       FROM entity_confidence
       WHERE tenant_id = $1`,
      [tenantId, DECAY_CONFIG.staleThreshold, DECAY_CONFIG.refreshThreshold]
    );

    const decayedToday = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM confidence_history ch
       JOIN entity_confidence ec ON ch.entity_confidence_id = ec.id
       WHERE ec.tenant_id = $1
         AND ch.created_at >= NOW() - INTERVAL '1 day'
         AND ch.trigger_reason LIKE 'Decay:%'`,
      [tenantId]
    );

    return {
      totalEntities: parseInt(stats?.total || '0', 10),
      staleEntities: parseInt(stats?.stale || '0', 10),
      refreshCandidates: parseInt(stats?.refresh || '0', 10),
      averageConfidence: Number(stats?.avg_confidence || 0.5),
      decayedToday: parseInt(decayedToday?.count || '0', 10),
    };
  }

  /**
   * Run full decay maintenance job
   */
  async runMaintenanceJob(tenantId: string): Promise<{
    decayResult: DecayJobResult;
    cleanedMemory: number;
    stats: Awaited<ReturnType<DecayEngine['getDecayStats']>>;
  }> {
    logger.info('Starting decay maintenance job', { tenantId });

    // 1. Apply confidence decay
    const decayResult = await this.applyDecay(tenantId);

    // 2. Clean up expired memory
    const cleanedMemory = await this.cleanupExpiredMemory(tenantId);

    // 3. Get current stats
    const stats = await this.getDecayStats(tenantId);

    logger.info('Decay maintenance job completed', {
      tenantId,
      decayed: decayResult.decayed,
      cleanedMemory,
      refreshCandidates: stats.refreshCandidates,
    });

    return { decayResult, cleanedMemory, stats };
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const decayEngine = new DecayEngine();

export default decayEngine;
