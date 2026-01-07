/**
 * Lead Distributor
 *
 * S362: Lead Distribution Engine
 * Behavior Contract B013: Leads distributed fairly with explanation
 *
 * Distributes incoming leads to team members based on:
 * - Territory/region assignment
 * - Capacity and workload
 * - Expertise matching (vertical/sub-vertical)
 * - Round-robin fairness
 * - Performance-weighted distribution
 *
 * Architecture:
 * - Supports multiple distribution strategies
 * - Always provides explanation for assignment
 * - Tracks distribution for audit
 * - Handles overflow and re-assignment
 */

import { query, queryOne } from '@/lib/db/client';
import { logger } from '@/lib/logging/structured-logger';

// ============================================================
// TYPES
// ============================================================

export type DistributionStrategy =
  | 'round_robin'     // Equal distribution in order
  | 'capacity_based'  // Based on current workload
  | 'territory'       // Based on region assignment
  | 'expertise'       // Based on vertical expertise
  | 'performance'     // Based on conversion rates
  | 'hybrid';         // Combination of factors

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  territories: string[];
  verticals: string[];
  subVerticals: string[];
  maxCapacity: number;
  currentLoad: number;
  conversionRate: number;
  isActive: boolean;
  lastAssignedAt: Date | null;
}

export interface Lead {
  id: string;
  companyId: string;
  companyName: string;
  region: string;
  vertical: string;
  subVertical: string;
  score: number;
  signalType?: string;
}

export interface DistributionResult {
  success: boolean;
  leadId: string;
  assignedTo: {
    userId: string;
    name: string;
    email: string;
  } | null;
  explanation: string;
  factors: DistributionFactor[];
  alternativeCandidates?: { userId: string; name: string; score: number }[];
}

export interface DistributionFactor {
  factor: string;
  weight: number;
  value: number;
  contribution: number;
}

export interface DistributionConfig {
  strategy: DistributionStrategy;
  weights: {
    territory: number;
    capacity: number;
    expertise: number;
    performance: number;
    fairness: number;
  };
  maxLeadsPerUser: number;
  requireTerritoryMatch: boolean;
}

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

export const DEFAULT_DISTRIBUTION_CONFIG: DistributionConfig = {
  strategy: 'hybrid',
  weights: {
    territory: 0.3,
    capacity: 0.25,
    expertise: 0.2,
    performance: 0.15,
    fairness: 0.1,
  },
  maxLeadsPerUser: 50,
  requireTerritoryMatch: false,
};

// ============================================================
// LEAD DISTRIBUTOR
// ============================================================

class LeadDistributor {
  /**
   * Distribute a lead to the best team member
   * B013: Always returns explanation for the assignment
   */
  async distributeLead(
    tenantId: string,
    lead: Lead,
    config: DistributionConfig = DEFAULT_DISTRIBUTION_CONFIG
  ): Promise<DistributionResult> {
    try {
      // 1. Get eligible team members
      const teamMembers = await this.getEligibleTeamMembers(tenantId, lead, config);

      if (teamMembers.length === 0) {
        return {
          success: false,
          leadId: lead.id,
          assignedTo: null,
          explanation: 'No eligible team members found for this lead',
          factors: [],
        };
      }

      // 2. Score each team member
      const scoredMembers = teamMembers.map(member => ({
        member,
        ...this.calculateMemberScore(member, lead, config),
      }));

      // 3. Sort by score descending
      scoredMembers.sort((a, b) => b.totalScore - a.totalScore);

      // 4. Select the winner
      const winner = scoredMembers[0];
      const alternatives = scoredMembers.slice(1, 4).map(s => ({
        userId: s.member.userId,
        name: s.member.name,
        score: s.totalScore,
      }));

      // 5. Record the assignment
      await this.recordAssignment(tenantId, lead.id, winner.member.userId, winner.factors);

      // 6. Update team member's last assigned timestamp
      await this.updateLastAssigned(winner.member.id);

      const explanation = this.generateExplanation(winner.member, winner.factors, lead);

      logger.info('Lead distributed', {
        tenantId,
        leadId: lead.id,
        assignedTo: winner.member.userId,
        score: winner.totalScore,
        strategy: config.strategy,
      });

      return {
        success: true,
        leadId: lead.id,
        assignedTo: {
          userId: winner.member.userId,
          name: winner.member.name,
          email: winner.member.email,
        },
        explanation,
        factors: winner.factors,
        alternativeCandidates: alternatives,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Lead distribution failed', {
        tenantId,
        leadId: lead.id,
        error: errorMessage,
      });

      return {
        success: false,
        leadId: lead.id,
        assignedTo: null,
        explanation: `Distribution failed: ${errorMessage}`,
        factors: [],
      };
    }
  }

  /**
   * Get team members eligible for this lead
   */
  private async getEligibleTeamMembers(
    tenantId: string,
    lead: Lead,
    config: DistributionConfig
  ): Promise<TeamMember[]> {
    let sql = `
      SELECT
        tm.id,
        tm.user_id,
        u.name,
        u.email,
        tm.territories,
        tm.verticals,
        tm.sub_verticals,
        tm.max_capacity,
        COALESCE(tm.current_load, 0) as current_load,
        COALESCE(tm.conversion_rate, 0.1) as conversion_rate,
        tm.is_active,
        tm.last_assigned_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.tenant_id = $1
        AND tm.is_active = true
        AND COALESCE(tm.current_load, 0) < tm.max_capacity
    `;
    const params: unknown[] = [tenantId];

    // If territory match is required, filter by region
    if (config.requireTerritoryMatch) {
      sql += ` AND $2 = ANY(tm.territories)`;
      params.push(lead.region);
    }

    sql += ` ORDER BY tm.last_assigned_at NULLS FIRST`;

    const rows = await query<{
      id: string;
      user_id: string;
      name: string;
      email: string;
      territories: string[];
      verticals: string[];
      sub_verticals: string[];
      max_capacity: number;
      current_load: number;
      conversion_rate: number;
      is_active: boolean;
      last_assigned_at: Date | null;
    }>(sql, params);

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      territories: row.territories || [],
      verticals: row.verticals || [],
      subVerticals: row.sub_verticals || [],
      maxCapacity: row.max_capacity,
      currentLoad: Number(row.current_load),
      conversionRate: Number(row.conversion_rate),
      isActive: row.is_active,
      lastAssignedAt: row.last_assigned_at,
    }));
  }

  /**
   * Calculate score for a team member for this lead
   */
  private calculateMemberScore(
    member: TeamMember,
    lead: Lead,
    config: DistributionConfig
  ): { totalScore: number; factors: DistributionFactor[] } {
    const factors: DistributionFactor[] = [];
    let totalScore = 0;

    // 1. Territory match
    const territoryMatch = member.territories.includes(lead.region);
    const territoryScore = territoryMatch ? 1 : 0.5;
    const territoryContribution = territoryScore * config.weights.territory;
    factors.push({
      factor: 'territory',
      weight: config.weights.territory,
      value: territoryScore,
      contribution: territoryContribution,
    });
    totalScore += territoryContribution;

    // 2. Capacity (inverse of load ratio)
    const loadRatio = member.currentLoad / member.maxCapacity;
    const capacityScore = 1 - loadRatio;
    const capacityContribution = capacityScore * config.weights.capacity;
    factors.push({
      factor: 'capacity',
      weight: config.weights.capacity,
      value: capacityScore,
      contribution: capacityContribution,
    });
    totalScore += capacityContribution;

    // 3. Expertise match
    const verticalMatch = member.verticals.includes(lead.vertical);
    const subVerticalMatch = member.subVerticals.includes(lead.subVertical);
    const expertiseScore = subVerticalMatch ? 1 : verticalMatch ? 0.7 : 0.3;
    const expertiseContribution = expertiseScore * config.weights.expertise;
    factors.push({
      factor: 'expertise',
      weight: config.weights.expertise,
      value: expertiseScore,
      contribution: expertiseContribution,
    });
    totalScore += expertiseContribution;

    // 4. Performance (conversion rate normalized 0-1)
    const performanceScore = Math.min(member.conversionRate * 5, 1); // 20% conversion = 1.0
    const performanceContribution = performanceScore * config.weights.performance;
    factors.push({
      factor: 'performance',
      weight: config.weights.performance,
      value: performanceScore,
      contribution: performanceContribution,
    });
    totalScore += performanceContribution;

    // 5. Fairness (time since last assignment)
    const hoursSinceAssigned = member.lastAssignedAt
      ? (Date.now() - new Date(member.lastAssignedAt).getTime()) / (1000 * 60 * 60)
      : 24; // If never assigned, treat as 24 hours
    const fairnessScore = Math.min(hoursSinceAssigned / 24, 1);
    const fairnessContribution = fairnessScore * config.weights.fairness;
    factors.push({
      factor: 'fairness',
      weight: config.weights.fairness,
      value: fairnessScore,
      contribution: fairnessContribution,
    });
    totalScore += fairnessContribution;

    return { totalScore, factors };
  }

  /**
   * Generate human-readable explanation for the assignment
   */
  private generateExplanation(
    member: TeamMember,
    factors: DistributionFactor[],
    lead: Lead
  ): string {
    const topFactors = [...factors]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 2);

    const reasons: string[] = [];

    for (const factor of topFactors) {
      switch (factor.factor) {
        case 'territory':
          if (factor.value === 1) {
            reasons.push(`covers ${lead.region} territory`);
          }
          break;
        case 'capacity':
          if (factor.value > 0.7) {
            reasons.push('has available capacity');
          }
          break;
        case 'expertise':
          if (factor.value === 1) {
            reasons.push(`specializes in ${lead.subVertical}`);
          } else if (factor.value >= 0.7) {
            reasons.push(`experienced in ${lead.vertical}`);
          }
          break;
        case 'performance':
          if (factor.value > 0.8) {
            reasons.push('has strong conversion rate');
          }
          break;
        case 'fairness':
          if (factor.value > 0.8) {
            reasons.push('due for next assignment');
          }
          break;
      }
    }

    if (reasons.length === 0) {
      reasons.push('best overall match');
    }

    return `Assigned to ${member.name} because they ${reasons.join(' and ')}`;
  }

  /**
   * Record the assignment for audit
   */
  private async recordAssignment(
    tenantId: string,
    leadId: string,
    userId: string,
    factors: DistributionFactor[]
  ): Promise<void> {
    await query(
      `INSERT INTO lead_assignments (
        tenant_id, lead_id, user_id, distribution_factors, assigned_at
      )
      VALUES ($1, $2, $3, $4, NOW())`,
      [tenantId, leadId, userId, JSON.stringify(factors)]
    );
  }

  /**
   * Update team member's last assigned timestamp
   */
  private async updateLastAssigned(teamMemberId: string): Promise<void> {
    await query(
      `UPDATE team_members
       SET last_assigned_at = NOW(),
           current_load = COALESCE(current_load, 0) + 1
       WHERE id = $1`,
      [teamMemberId]
    );
  }

  /**
   * Get distribution statistics for a tenant
   */
  async getDistributionStats(
    tenantId: string,
    since: Date
  ): Promise<{
    totalDistributed: number;
    byUser: { userId: string; name: string; count: number }[];
    byTerritory: { territory: string; count: number }[];
    averageFactors: Record<string, number>;
  }> {
    const byUser = await query<{ user_id: string; name: string; count: string }>(
      `SELECT la.user_id, u.name, COUNT(*) as count
       FROM lead_assignments la
       JOIN users u ON la.user_id = u.id
       WHERE la.tenant_id = $1 AND la.assigned_at >= $2
       GROUP BY la.user_id, u.name
       ORDER BY count DESC`,
      [tenantId, since]
    );

    const totalDistributed = byUser.reduce((sum, u) => sum + parseInt(u.count, 10), 0);

    return {
      totalDistributed,
      byUser: byUser.map(u => ({
        userId: u.user_id,
        name: u.name,
        count: parseInt(u.count, 10),
      })),
      byTerritory: [], // Would need lead territory data
      averageFactors: {},
    };
  }

  /**
   * Reassign a lead to a different team member
   */
  async reassignLead(
    tenantId: string,
    leadId: string,
    newUserId: string,
    reason: string
  ): Promise<void> {
    await query(
      `INSERT INTO lead_assignments (
        tenant_id, lead_id, user_id, distribution_factors, assigned_at, is_reassignment, reassignment_reason
      )
      VALUES ($1, $2, $3, '{}', NOW(), true, $4)`,
      [tenantId, leadId, newUserId, reason]
    );

    logger.info('Lead reassigned', {
      tenantId,
      leadId,
      newUserId,
      reason,
    });
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const leadDistributor = new LeadDistributor();

export default leadDistributor;
