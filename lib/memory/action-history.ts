/**
 * Action History
 *
 * S355: Historical Action Recall
 * Behavior Contract B006: Historical recall advisory shown
 *
 * Provides "memory" of past user actions for advisory purposes.
 * When a user attempts something similar to a past action, we inform them.
 *
 * Usage:
 * ```typescript
 * import { actionHistory } from '@/lib/memory/action-history';
 *
 * // Check for similar past actions
 * const recall = await actionHistory.findSimilar({
 *   tenantId: session.tenantId,
 *   userId: session.user.id,
 *   actionType: 'enrichment',
 *   context: { companyName: 'Acme Corp', domain: 'acme.com' }
 * });
 *
 * if (recall.hasSimilar) {
 *   // Show advisory: "You enriched Acme Corp on Nov 15, 2024"
 * }
 * ```
 */

import { query, queryOne } from '@/lib/db/client';
import { logger } from '@/lib/logging/structured-logger';
import { fingerprintEngine, ActionType, RecentAction } from './fingerprint-engine';

export interface SimilarActionQuery {
  tenantId: string;
  userId: string;
  actionType: ActionType;
  context: {
    companyName?: string;
    companyDomain?: string;
    query?: string;
    entityId?: string;
  };
}

export interface SimilarActionResult {
  hasSimilar: boolean;
  similarActions: Array<{
    id: string;
    actionType: ActionType;
    when: Date;
    description: string;
    metadata?: Record<string, unknown>;
  }>;
  advisory?: string;
}

export interface ActionHistoryEntry {
  id: string;
  actionType: ActionType;
  description: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

class ActionHistory {
  /**
   * Find similar past actions
   *
   * Uses fingerprint metadata and fuzzy matching to find related actions.
   */
  async findSimilar(input: SimilarActionQuery): Promise<SimilarActionResult> {
    try {
      const similarActions: SimilarActionResult['similarActions'] = [];
      const searchTerms: string[] = [];

      // Build search terms from context
      if (input.context.companyName) {
        searchTerms.push(input.context.companyName.toLowerCase());
      }
      if (input.context.companyDomain) {
        searchTerms.push(input.context.companyDomain.toLowerCase());
      }
      if (input.context.entityId) {
        searchTerms.push(input.context.entityId);
      }
      if (input.context.query) {
        // Extract significant words from query
        const words = input.context.query.toLowerCase().split(/\s+/)
          .filter(w => w.length > 3);
        searchTerms.push(...words);
      }

      if (searchTerms.length === 0) {
        return { hasSimilar: false, similarActions: [] };
      }

      // Search for matching fingerprints by metadata
      // Using JSONB containment and text search
      const result = await query<{
        id: string;
        action_type: ActionType;
        action_metadata: Record<string, unknown>;
        created_at: Date;
      }>(`
        SELECT DISTINCT id, action_type, action_metadata, created_at
        FROM action_fingerprints
        WHERE tenant_id = $1
          AND user_id = $2
          AND action_type = $3
          AND action_metadata IS NOT NULL
          AND (
            ${searchTerms.map((_, i) => `
              action_metadata::text ILIKE $${i + 4}
            `).join(' OR ')}
          )
        ORDER BY created_at DESC
        LIMIT 5
      `, [
        input.tenantId,
        input.userId,
        input.actionType,
        ...searchTerms.map(t => `%${t}%`),
      ]);

      for (const row of result) {
        similarActions.push({
          id: row.id,
          actionType: row.action_type,
          when: row.created_at,
          description: this.generateDescription(row.action_type, row.action_metadata),
          metadata: row.action_metadata,
        });
      }

      // Generate advisory message if similar actions found
      let advisory: string | undefined;
      if (similarActions.length > 0) {
        const latest = similarActions[0];
        const daysAgo = Math.floor(
          (Date.now() - new Date(latest.when).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysAgo === 0) {
          advisory = `You performed a similar ${latest.actionType} today: ${latest.description}`;
        } else if (daysAgo === 1) {
          advisory = `You performed a similar ${latest.actionType} yesterday: ${latest.description}`;
        } else {
          advisory = `You performed a similar ${latest.actionType} ${daysAgo} days ago: ${latest.description}`;
        }
      }

      return {
        hasSimilar: similarActions.length > 0,
        similarActions,
        advisory,
      };
    } catch (error) {
      logger.error('Failed to find similar actions', {
        tenantId: input.tenantId,
        userId: input.userId,
        actionType: input.actionType,
      }, error as Error);

      return { hasSimilar: false, similarActions: [] };
    }
  }

  /**
   * Generate human-readable description from action metadata
   */
  private generateDescription(
    actionType: ActionType,
    metadata: Record<string, unknown> | null
  ): string {
    if (!metadata) {
      return `${actionType} action`;
    }

    switch (actionType) {
      case 'discovery':
        return metadata.query
          ? `Search for "${metadata.query}"`
          : metadata.vertical
          ? `Discovery in ${metadata.vertical}`
          : 'Discovery search';

      case 'enrichment':
        return metadata.companyName
          ? `Enriched ${metadata.companyName}`
          : metadata.companyDomain
          ? `Enriched ${metadata.companyDomain}`
          : 'Company enrichment';

      case 'outreach':
        return metadata.recipientName
          ? `Outreach to ${metadata.recipientName}`
          : metadata.companyName
          ? `Outreach to ${metadata.companyName}`
          : 'Outreach message';

      case 'score':
        return metadata.companyName
          ? `Scored ${metadata.companyName}`
          : 'Company scoring';

      case 'export':
        return metadata.format
          ? `Export to ${metadata.format}`
          : 'Data export';

      default:
        return `${actionType} action`;
    }
  }

  /**
   * Get user's action history
   */
  async getHistory(
    tenantId: string,
    userId: string,
    options: {
      actionType?: ActionType;
      limit?: number;
      daysBack?: number;
    } = {}
  ): Promise<ActionHistoryEntry[]> {
    const { actionType, limit = 20, daysBack = 30 } = options;

    try {
      let sql = `
        SELECT id, action_type, action_metadata, created_at
        FROM action_fingerprints
        WHERE tenant_id = $1
          AND user_id = $2
          AND created_at > NOW() - INTERVAL '${daysBack} days'
      `;
      const params: unknown[] = [tenantId, userId];

      if (actionType) {
        sql += ` AND action_type = $3`;
        params.push(actionType);
      }

      sql += ` ORDER BY created_at DESC LIMIT ${limit}`;

      const result = await query<{
        id: string;
        action_type: ActionType;
        action_metadata: Record<string, unknown>;
        created_at: Date;
      }>(sql, params);

      return result.map(row => ({
        id: row.id,
        actionType: row.action_type,
        description: this.generateDescription(row.action_type, row.action_metadata),
        createdAt: row.created_at,
        metadata: row.action_metadata,
      }));
    } catch (error) {
      logger.error('Failed to get action history', { tenantId, userId }, error as Error);
      return [];
    }
  }

  /**
   * Record an action with metadata (delegates to fingerprint engine)
   */
  async recordAction(
    tenantId: string,
    userId: string,
    actionType: ActionType,
    actionParams: Record<string, unknown>,
    metadata: Record<string, unknown>
  ): Promise<void> {
    await fingerprintEngine.record({
      tenantId,
      userId,
      actionType,
      actionParams,
      metadata,
    });
  }
}

// Export singleton instance
export const actionHistory = new ActionHistory();

// Export class for testing
export { ActionHistory };
