/**
 * Fingerprint Engine
 *
 * S354: Action Fingerprinting
 * Behavior Contract B005: Duplicate actions detected via fingerprint
 *
 * Generates and stores fingerprints of user actions for deduplication.
 * When a user attempts the same action twice, they get a warning.
 *
 * Usage:
 * ```typescript
 * import { fingerprintEngine } from '@/lib/memory/fingerprint-engine';
 *
 * // Check for duplicate before executing
 * const check = await fingerprintEngine.checkAndRecord({
 *   tenantId: session.tenantId,
 *   userId: session.user.id,
 *   actionType: 'discovery',
 *   actionParams: { vertical: 'banking', region: 'UAE', query: 'tech companies' }
 * });
 *
 * if (check.isDuplicate) {
 *   // Warn user: "You performed this search on ${check.originalAction.createdAt}"
 * }
 * ```
 */

import { createHash } from 'crypto';
import { query, queryOne } from '@/lib/db/client';
import { logger } from '@/lib/logging/structured-logger';

export type ActionType =
  | 'discovery'
  | 'enrichment'
  | 'outreach'
  | 'score'
  | 'rank'
  | 'export'
  | 'bulk_import'
  | 'individual_intake';

export interface FingerprintInput {
  tenantId: string;
  userId: string;
  actionType: ActionType;
  actionParams: Record<string, unknown>;
  metadata?: Record<string, unknown>; // Human-readable context
}

export interface FingerprintCheck {
  isDuplicate: boolean;
  fingerprint: string;
  originalAction?: {
    id: string;
    createdAt: Date;
    metadata?: Record<string, unknown>;
  };
}

export interface RecentAction {
  id: string;
  actionType: ActionType;
  fingerprint: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

class FingerprintEngine {
  /**
   * Generate a fingerprint hash from action parameters
   */
  generateFingerprint(
    actionType: ActionType,
    actionParams: Record<string, unknown>
  ): string {
    // Sort keys to ensure consistent hashing regardless of parameter order
    const sortedParams = this.sortObject(actionParams);
    const payload = JSON.stringify({ actionType, params: sortedParams });

    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Sort object keys recursively for consistent hashing
   */
  private sortObject(obj: Record<string, unknown>): Record<string, unknown> {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return obj;
    }

    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      const value = obj[key];
      sorted[key] = typeof value === 'object' && value !== null
        ? this.sortObject(value as Record<string, unknown>)
        : value;
    }

    return sorted;
  }

  /**
   * Check if an action is a duplicate and optionally record it
   *
   * @param input - Fingerprint input
   * @param windowMs - Time window for duplicate detection (default: 24 hours)
   * @param record - Whether to record the action if not a duplicate (default: true)
   */
  async checkAndRecord(
    input: FingerprintInput,
    windowMs: number = 24 * 60 * 60 * 1000,
    record: boolean = true
  ): Promise<FingerprintCheck> {
    const fingerprint = this.generateFingerprint(input.actionType, input.actionParams);

    try {
      // Check for existing fingerprint within window
      const existing = await queryOne<{
        id: string;
        created_at: Date;
        action_metadata: Record<string, unknown>;
      }>(`
        SELECT id, created_at, action_metadata
        FROM action_fingerprints
        WHERE tenant_id = $1
          AND fingerprint_hash = $2
          AND created_at > NOW() - INTERVAL '${Math.floor(windowMs / 1000)} seconds'
        LIMIT 1
      `, [input.tenantId, fingerprint]);

      if (existing) {
        logger.info('Duplicate action detected', {
          tenantId: input.tenantId,
          userId: input.userId,
          actionType: input.actionType,
          fingerprint: fingerprint.substring(0, 16) + '...',
          originalActionId: existing.id,
        });

        return {
          isDuplicate: true,
          fingerprint,
          originalAction: {
            id: existing.id,
            createdAt: existing.created_at,
            metadata: existing.action_metadata,
          },
        };
      }

      // Record the new action if requested
      if (record) {
        await this.record(input, fingerprint);
      }

      return {
        isDuplicate: false,
        fingerprint,
      };
    } catch (error) {
      logger.error('Fingerprint check failed', {
        tenantId: input.tenantId,
        actionType: input.actionType,
      }, error as Error);

      // Fail open - allow the action if fingerprinting fails
      return {
        isDuplicate: false,
        fingerprint,
      };
    }
  }

  /**
   * Record an action fingerprint
   */
  async record(input: FingerprintInput, fingerprint?: string): Promise<void> {
    const hash = fingerprint || this.generateFingerprint(input.actionType, input.actionParams);

    try {
      await query(`
        INSERT INTO action_fingerprints (tenant_id, user_id, fingerprint_hash, action_type, action_metadata)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tenant_id, fingerprint_hash) DO UPDATE SET
          action_metadata = EXCLUDED.action_metadata
      `, [
        input.tenantId,
        input.userId,
        hash,
        input.actionType,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ]);

      logger.debug('Action fingerprint recorded', {
        tenantId: input.tenantId,
        userId: input.userId,
        actionType: input.actionType,
        fingerprint: hash.substring(0, 16) + '...',
      });
    } catch (error) {
      logger.error('Failed to record fingerprint', {
        tenantId: input.tenantId,
        actionType: input.actionType,
      }, error as Error);
    }
  }

  /**
   * Get recent actions for a user
   */
  async getRecentActions(
    tenantId: string,
    userId: string,
    limit: number = 10
  ): Promise<RecentAction[]> {
    try {
      const result = await query<{
        id: string;
        action_type: ActionType;
        fingerprint_hash: string;
        action_metadata: Record<string, unknown>;
        created_at: Date;
      }>(`
        SELECT id, action_type, fingerprint_hash, action_metadata, created_at
        FROM action_fingerprints
        WHERE tenant_id = $1 AND user_id = $2
        ORDER BY created_at DESC
        LIMIT $3
      `, [tenantId, userId, limit]);

      return result.map(r => ({
        id: r.id,
        actionType: r.action_type,
        fingerprint: r.fingerprint_hash,
        metadata: r.action_metadata,
        createdAt: r.created_at,
      }));
    } catch (error) {
      logger.error('Failed to get recent actions', { tenantId, userId }, error as Error);
      return [];
    }
  }

  /**
   * Get recent actions by type
   */
  async getRecentByType(
    tenantId: string,
    actionType: ActionType,
    limit: number = 10
  ): Promise<RecentAction[]> {
    try {
      const result = await query<{
        id: string;
        action_type: ActionType;
        fingerprint_hash: string;
        action_metadata: Record<string, unknown>;
        created_at: Date;
      }>(`
        SELECT id, action_type, fingerprint_hash, action_metadata, created_at
        FROM action_fingerprints
        WHERE tenant_id = $1 AND action_type = $2
        ORDER BY created_at DESC
        LIMIT $3
      `, [tenantId, actionType, limit]);

      return result.map(r => ({
        id: r.id,
        actionType: r.action_type,
        fingerprint: r.fingerprint_hash,
        metadata: r.action_metadata,
        createdAt: r.created_at,
      }));
    } catch (error) {
      logger.error('Failed to get recent actions by type', { tenantId, actionType }, error as Error);
      return [];
    }
  }

  /**
   * Clear fingerprints for a user (for testing or admin purposes)
   */
  async clearUserFingerprints(tenantId: string, userId: string): Promise<number> {
    try {
      const result = await query<{ count: string }>(`
        WITH deleted AS (
          DELETE FROM action_fingerprints
          WHERE tenant_id = $1 AND user_id = $2
          RETURNING id
        )
        SELECT COUNT(*) as count FROM deleted
      `, [tenantId, userId]);

      return parseInt(result[0]?.count || '0');
    } catch (error) {
      logger.error('Failed to clear user fingerprints', { tenantId, userId }, error as Error);
      return 0;
    }
  }
}

// Export singleton instance
export const fingerprintEngine = new FingerprintEngine();

// Export class for testing
export { FingerprintEngine };
