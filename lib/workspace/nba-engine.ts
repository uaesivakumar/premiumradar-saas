/**
 * NBA Engine (Next Best Action)
 *
 * S359: NBA Engine
 * Behavior Contract B010: Single NBA selected per context
 *
 * Selects the single most important action for the user to take
 * at any given moment. Never presents multiple competing NBAs.
 *
 * Architecture:
 * - Evaluates all potential actions
 * - Applies scoring and prioritization rules
 * - Returns exactly ONE action (the NBA)
 * - Respects context (time, user state, lead state)
 */

import { query, queryOne } from '@/lib/db/client';
import { logger } from '@/lib/logging/structured-logger';
import { confidenceEngine } from '@/lib/intelligence/confidence-engine';

// ============================================================
// NBA TYPES
// ============================================================

export type NBAType =
  // High priority actions
  | 'CALL_NOW'           // Time-sensitive outreach
  | 'RESPOND_URGENT'     // Reply to inbound inquiry
  | 'SCHEDULE_MEETING'   // Book a demo/call
  // Standard actions
  | 'SEND_EMAIL'         // Personalized outreach
  | 'SEND_LINKEDIN'      // LinkedIn connection/message
  | 'REVIEW_PROFILE'     // Enrich understanding
  // Follow-up actions
  | 'FOLLOW_UP'          // Follow up on previous contact
  | 'CHECK_IN'           // Re-engage dormant lead
  | 'UPDATE_STATUS'      // Update CRM/pipeline
  // Research actions
  | 'RESEARCH_COMPANY'   // Deep dive on company
  | 'RESEARCH_CONTACT'   // Research decision maker
  | 'FIND_TRIGGER';      // Look for sales trigger

export type NBAUrgency = 'critical' | 'high' | 'medium' | 'low';

export interface NBAContext {
  tenantId: string;
  userId: string;
  workspaceId?: string;
  currentLeadId?: string;  // If user is viewing a specific lead
  currentTime?: Date;
  userActivity?: 'active' | 'idle' | 'returning';
}

export interface NBACandidate {
  id: string;
  type: NBAType;
  leadId: string;
  companyId: string;
  companyName: string;
  contactName?: string;
  urgency: NBAUrgency;
  score: number;
  reason: string;
  expiresAt?: Date;
  metadata: Record<string, unknown>;
}

export interface NBA {
  id: string;
  type: NBAType;
  leadId: string;
  companyId: string;
  companyName: string;
  contactName?: string;
  urgency: NBAUrgency;
  score: number;
  reason: string;
  actionText: string;
  supportingInfo?: string;
  expiresAt?: Date;
  alternatives?: { type: NBAType; leadId: string; reason: string }[];
  metadata: Record<string, unknown>;
}

export interface NBARankingResult {
  nba: NBA | null;
  candidatesEvaluated: number;
  selectionReason: string;
}

// ============================================================
// NBA CONFIGURATION
// ============================================================

export const NBA_CONFIG = {
  // Urgency score multipliers
  urgencyMultipliers: {
    critical: 2.0,
    high: 1.5,
    medium: 1.0,
    low: 0.7,
  },

  // Action type base priorities
  typePriorities: {
    CALL_NOW: 100,
    RESPOND_URGENT: 95,
    SCHEDULE_MEETING: 85,
    SEND_EMAIL: 70,
    SEND_LINKEDIN: 65,
    FOLLOW_UP: 75,
    CHECK_IN: 50,
    UPDATE_STATUS: 40,
    REVIEW_PROFILE: 55,
    RESEARCH_COMPANY: 45,
    RESEARCH_CONTACT: 45,
    FIND_TRIGGER: 35,
  } as Record<NBAType, number>,

  // Maximum candidates to consider
  maxCandidates: 50,

  // Include up to N alternatives in response
  maxAlternatives: 2,

  // Time-based modifiers
  timeModifiers: {
    morningBoost: 1.1,      // 8am-12pm: boost outreach
    afternoonStandard: 1.0, // 12pm-5pm: normal
    eveningResearch: 0.8,   // 5pm-8pm: reduce outreach
    offHours: 0.5,          // 8pm-8am: research only
  },
};

// ============================================================
// NBA ENGINE
// ============================================================

class NBAEngine {
  /**
   * Get the single Next Best Action for a user context
   * B010: Always returns exactly one NBA (or null if no actions)
   */
  async getNBA(context: NBAContext): Promise<NBARankingResult> {
    const startTime = Date.now();

    try {
      // 1. Get all candidate actions
      const candidates = await this.getCandidates(context);

      if (candidates.length === 0) {
        return {
          nba: null,
          candidatesEvaluated: 0,
          selectionReason: 'No actionable leads found',
        };
      }

      // 2. Score and rank all candidates
      const rankedCandidates = await this.rankCandidates(candidates, context);

      // 3. Select the winner (highest score)
      const winner = rankedCandidates[0];

      // 4. Get alternatives (for context, not for display as options)
      const alternatives = rankedCandidates
        .slice(1, NBA_CONFIG.maxAlternatives + 1)
        .map(c => ({
          type: c.type,
          leadId: c.leadId,
          reason: c.reason,
        }));

      // 5. Build the NBA response
      const nba: NBA = {
        id: winner.id,
        type: winner.type,
        leadId: winner.leadId,
        companyId: winner.companyId,
        companyName: winner.companyName,
        contactName: winner.contactName,
        urgency: winner.urgency,
        score: winner.score,
        reason: winner.reason,
        actionText: this.getActionText(winner),
        supportingInfo: this.getSupportingInfo(winner),
        expiresAt: winner.expiresAt,
        alternatives: alternatives.length > 0 ? alternatives : undefined,
        metadata: winner.metadata,
      };

      // 6. Log the NBA selection
      await this.logNBASelection(context, nba, rankedCandidates.length);

      const duration = Date.now() - startTime;
      logger.info('NBA selected', {
        tenantId: context.tenantId,
        userId: context.userId,
        nbaType: nba.type,
        leadId: nba.leadId,
        score: nba.score,
        candidatesEvaluated: candidates.length,
        duration,
      });

      return {
        nba,
        candidatesEvaluated: candidates.length,
        selectionReason: `Selected ${winner.type} for ${winner.companyName} based on ${winner.reason}`,
      };
    } catch (error) {
      logger.error('NBA selection failed', {
        tenantId: context.tenantId,
        userId: context.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get candidate actions from the database
   * Note: Returns empty array if leads table doesn't exist (graceful degradation)
   */
  private async getCandidates(context: NBAContext): Promise<NBACandidate[]> {
    // Query leads with pending actions
    let leads: {
      id: string;
      company_id: string;
      company_name: string;
      contact_name: string | null;
      status: string;
      last_contacted_at: Date | null;
      signal_type: string | null;
      signal_date: Date | null;
      score: number;
      has_urgent_signal: boolean;
      pending_action_type: string | null;
    }[] = [];

    try {
      leads = await query<{
        id: string;
        company_id: string;
        company_name: string;
        contact_name: string | null;
        status: string;
        last_contacted_at: Date | null;
        signal_type: string | null;
        signal_date: Date | null;
        score: number;
        has_urgent_signal: boolean;
        pending_action_type: string | null;
      }>(
        `SELECT
           l.id,
           l.company_id,
           l.company_name,
           l.contact_name,
           l.status,
           l.last_contacted_at,
           l.signal_type,
           l.signal_date,
           COALESCE(l.score, 50) as score,
           (l.signal_date > NOW() - INTERVAL '24 hours') as has_urgent_signal,
           l.pending_action_type
         FROM leads l
         WHERE l.tenant_id = $1
           AND l.user_id = $2
           AND l.status NOT IN ('won', 'lost', 'disqualified')
         ORDER BY l.score DESC, l.updated_at DESC
         LIMIT $3`,
        [context.tenantId, context.userId, NBA_CONFIG.maxCandidates]
      );
    } catch (error) {
      // Graceful degradation: if leads table doesn't exist, return empty
      // This allows the app to function without NBA until the table is created
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('relation "leads" does not exist') ||
          errorMessage.includes('does not exist')) {
        logger.warn('NBA getCandidates: leads table not found, returning empty candidates', {
          tenantId: context.tenantId,
        });
        return [];
      }
      // Re-throw other errors
      throw error;
    }

    // Convert to candidates
    const candidates: NBACandidate[] = [];

    for (const lead of leads) {
      const actionType = this.determineActionType(lead);
      const urgency = this.determineUrgency(lead);

      // Get confidence for this company
      const confidence = await confidenceEngine.getConfidence(
        context.tenantId,
        'COMPANY',
        lead.company_id
      );

      candidates.push({
        id: `nba-${lead.id}-${actionType}`,
        type: actionType,
        leadId: lead.id,
        companyId: lead.company_id,
        companyName: lead.company_name,
        contactName: lead.contact_name || undefined,
        urgency,
        score: this.calculateBaseScore(lead, actionType, confidence),
        reason: this.generateReason(lead, actionType),
        expiresAt: urgency === 'critical' ? new Date(Date.now() + 4 * 60 * 60 * 1000) : undefined,
        metadata: {
          signalType: lead.signal_type,
          signalDate: lead.signal_date,
          lastContacted: lead.last_contacted_at,
          confidence,
        },
      });
    }

    return candidates;
  }

  /**
   * Determine the appropriate action type for a lead
   */
  private determineActionType(lead: {
    status: string;
    last_contacted_at: Date | null;
    signal_date: Date | null;
    pending_action_type: string | null;
    has_urgent_signal: boolean;
  }): NBAType {
    // If there's an explicit pending action, use it
    if (lead.pending_action_type) {
      return lead.pending_action_type as NBAType;
    }

    // Fresh signal = time-sensitive outreach
    if (lead.has_urgent_signal) {
      return 'CALL_NOW';
    }

    // Never contacted = initial outreach
    if (!lead.last_contacted_at) {
      return 'SEND_EMAIL';
    }

    // Recently contacted = follow up
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceContact < 3) {
      return 'UPDATE_STATUS'; // Too soon for follow-up
    } else if (daysSinceContact < 7) {
      return 'FOLLOW_UP';
    } else if (daysSinceContact < 30) {
      return 'CHECK_IN';
    } else {
      return 'RESEARCH_COMPANY'; // Re-qualify before outreach
    }
  }

  /**
   * Determine urgency based on lead state
   */
  private determineUrgency(lead: {
    has_urgent_signal: boolean;
    signal_date: Date | null;
    score: number;
  }): NBAUrgency {
    if (lead.has_urgent_signal) {
      return 'critical';
    }

    if (lead.signal_date) {
      const daysSinceSignal = Math.floor(
        (Date.now() - new Date(lead.signal_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceSignal < 3) return 'high';
      if (daysSinceSignal < 7) return 'medium';
    }

    if (lead.score > 80) return 'high';
    if (lead.score > 60) return 'medium';

    return 'low';
  }

  /**
   * Calculate base score for a candidate
   */
  private calculateBaseScore(
    lead: { score: number },
    actionType: NBAType,
    confidence: number
  ): number {
    const typePriority = NBA_CONFIG.typePriorities[actionType] || 50;
    const leadScore = lead.score;
    const confidenceFactor = 0.5 + confidence * 0.5; // Range: 0.5-1.0

    return (typePriority * 0.4 + leadScore * 0.6) * confidenceFactor;
  }

  /**
   * Generate human-readable reason for the action
   */
  private generateReason(
    lead: {
      signal_type: string | null;
      signal_date: Date | null;
      last_contacted_at: Date | null;
      has_urgent_signal: boolean;
    },
    actionType: NBAType
  ): string {
    if (lead.has_urgent_signal && lead.signal_type) {
      return `Fresh ${lead.signal_type.replace('_', ' ')} signal detected`;
    }

    switch (actionType) {
      case 'CALL_NOW':
        return 'Time-sensitive opportunity';
      case 'SEND_EMAIL':
        return 'High-potential lead awaiting outreach';
      case 'FOLLOW_UP':
        return 'Due for follow-up';
      case 'CHECK_IN':
        return 'Re-engage dormant opportunity';
      case 'RESEARCH_COMPANY':
        return 'Needs qualification refresh';
      default:
        return 'Prioritized based on score';
    }
  }

  /**
   * Rank candidates by applying all scoring factors
   */
  private async rankCandidates(
    candidates: NBACandidate[],
    context: NBAContext
  ): Promise<NBACandidate[]> {
    const currentHour = (context.currentTime || new Date()).getHours();
    const timeModifier = this.getTimeModifier(currentHour);

    // Apply all scoring factors
    const scoredCandidates = candidates.map(c => {
      const urgencyMultiplier = NBA_CONFIG.urgencyMultipliers[c.urgency];
      const finalScore = c.score * urgencyMultiplier * timeModifier;

      return { ...c, score: finalScore };
    });

    // Sort by score descending
    return scoredCandidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Get time-based scoring modifier
   */
  private getTimeModifier(hour: number): number {
    if (hour >= 8 && hour < 12) return NBA_CONFIG.timeModifiers.morningBoost;
    if (hour >= 12 && hour < 17) return NBA_CONFIG.timeModifiers.afternoonStandard;
    if (hour >= 17 && hour < 20) return NBA_CONFIG.timeModifiers.eveningResearch;
    return NBA_CONFIG.timeModifiers.offHours;
  }

  /**
   * Get action text for display
   */
  private getActionText(candidate: NBACandidate): string {
    const { type, companyName, contactName } = candidate;
    const target = contactName || companyName;

    switch (type) {
      case 'CALL_NOW':
        return `Call ${target} now`;
      case 'RESPOND_URGENT':
        return `Respond to ${target}`;
      case 'SCHEDULE_MEETING':
        return `Schedule meeting with ${target}`;
      case 'SEND_EMAIL':
        return `Send email to ${target}`;
      case 'SEND_LINKEDIN':
        return `Connect on LinkedIn with ${target}`;
      case 'FOLLOW_UP':
        return `Follow up with ${target}`;
      case 'CHECK_IN':
        return `Check in with ${target}`;
      case 'UPDATE_STATUS':
        return `Update ${companyName} status`;
      case 'REVIEW_PROFILE':
        return `Review ${companyName} profile`;
      case 'RESEARCH_COMPANY':
        return `Research ${companyName}`;
      case 'RESEARCH_CONTACT':
        return `Research contacts at ${companyName}`;
      case 'FIND_TRIGGER':
        return `Find triggers for ${companyName}`;
      default:
        return `Take action on ${target}`;
    }
  }

  /**
   * Get supporting info for the NBA
   */
  private getSupportingInfo(candidate: NBACandidate): string | undefined {
    const { type, metadata } = candidate;

    if (metadata.signalType && metadata.signalDate) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(metadata.signalDate as string).getTime()) / (1000 * 60 * 60 * 24)
      );
      return `${(metadata.signalType as string).replace('_', ' ')} signal ${daysAgo === 0 ? 'today' : `${daysAgo} days ago`}`;
    }

    if (metadata.lastContacted) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(metadata.lastContacted as string).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (type === 'FOLLOW_UP' || type === 'CHECK_IN') {
        return `Last contacted ${daysAgo} days ago`;
      }
    }

    return undefined;
  }

  /**
   * Log NBA selection for analytics
   */
  private async logNBASelection(
    context: NBAContext,
    nba: NBA,
    candidatesEvaluated: number
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO nba_selections (
          tenant_id, user_id, lead_id, nba_type, nba_score, urgency,
          candidates_evaluated, selected_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          context.tenantId,
          context.userId,
          nba.leadId,
          nba.type,
          nba.score,
          nba.urgency,
          candidatesEvaluated,
        ]
      );
    } catch (error) {
      // Non-critical, just log
      logger.warn('Failed to log NBA selection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Mark an NBA as completed
   */
  async markCompleted(
    tenantId: string,
    userId: string,
    nbaId: string,
    outcome: 'completed' | 'dismissed' | 'deferred'
  ): Promise<void> {
    await query(
      `UPDATE nba_selections
       SET outcome = $4, completed_at = NOW()
       WHERE tenant_id = $1 AND user_id = $2 AND id = $3`,
      [tenantId, userId, nbaId, outcome]
    );

    logger.info('NBA outcome recorded', {
      tenantId,
      userId,
      nbaId,
      outcome,
    });
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const nbaEngine = new NBAEngine();

export default nbaEngine;
