/**
 * Decision Store - S375: Decision Persistence & Recall
 *
 * Persists user decisions on entities (companies, contacts, leads).
 * Enables recall without chat history replay.
 *
 * WORKSPACE UX (LOCKED):
 * - Decisions persist, not conversations
 * - Recall shows decisions, not chat messages
 * - No chat history stored
 *
 * See docs/WORKSPACE_UX_DECISION.md (LOCKED)
 */

// =============================================================================
// TYPES
// =============================================================================

export type DecisionType = 'pursue' | 'reject' | 'defer' | 'save';

export type EntityType = 'company' | 'contact' | 'lead';

export interface Decision {
  id: string;
  entityId: string;
  entityType: EntityType;
  entityName: string;
  decision: DecisionType;
  reason: string;
  confidence: number;
  createdAt: Date;
  userId: string;
  tenantId: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateDecisionInput {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  decision: DecisionType;
  reason: string;
  confidence: number;
  userId: string;
  tenantId: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
}

export interface DecisionQuery {
  tenantId: string;
  userId?: string;
  entityId?: string;
  entityType?: EntityType;
  decision?: DecisionType;
  limit?: number;
  offset?: number;
}

// =============================================================================
// DECISION STORE API (Client-Side)
// =============================================================================

/**
 * Persist a decision via API
 */
export async function persistDecision(
  input: CreateDecisionInput
): Promise<Decision | null> {
  try {
    const response = await fetch('/api/workspace/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    const result = await response.json();

    if (!result.success) {
      console.error('[DecisionStore] Failed to persist decision:', result.error);
      return null;
    }

    // Convert date strings back to Date objects
    return {
      ...result.data,
      createdAt: new Date(result.data.createdAt),
    };
  } catch (error) {
    console.error('[DecisionStore] Error persisting decision:', error);
    return null;
  }
}

/**
 * Get decisions for an entity
 */
export async function getDecisionsForEntity(
  entityId: string,
  options?: { limit?: number }
): Promise<Decision[]> {
  try {
    const params = new URLSearchParams();
    params.set('entityId', entityId);
    if (options?.limit) params.set('limit', options.limit.toString());

    const response = await fetch(`/api/workspace/decisions?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const result = await response.json();

    if (!result.success) {
      console.error('[DecisionStore] Failed to get decisions:', result.error);
      return [];
    }

    return (result.data || []).map((d: any) => ({
      ...d,
      createdAt: new Date(d.createdAt),
    }));
  } catch (error) {
    console.error('[DecisionStore] Error getting decisions:', error);
    return [];
  }
}

/**
 * Get latest decision for an entity
 */
export async function getLatestDecision(
  entityId: string
): Promise<Decision | null> {
  const decisions = await getDecisionsForEntity(entityId, { limit: 1 });
  return decisions.length > 0 ? decisions[0] : null;
}

/**
 * Search decisions by entity name (fuzzy)
 */
export async function searchDecisionsByName(
  entityName: string,
  options?: { limit?: number }
): Promise<Decision[]> {
  try {
    const params = new URLSearchParams();
    params.set('search', entityName);
    if (options?.limit) params.set('limit', options.limit.toString());

    const response = await fetch(`/api/workspace/decisions?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const result = await response.json();

    if (!result.success) {
      console.error('[DecisionStore] Failed to search decisions:', result.error);
      return [];
    }

    return (result.data || []).map((d: any) => ({
      ...d,
      createdAt: new Date(d.createdAt),
    }));
  } catch (error) {
    console.error('[DecisionStore] Error searching decisions:', error);
    return [];
  }
}

/**
 * Get recent decisions for a user
 */
export async function getRecentDecisions(
  options?: { limit?: number; offset?: number }
): Promise<Decision[]> {
  try {
    const params = new URLSearchParams();
    params.set('recent', 'true');
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    const response = await fetch(`/api/workspace/decisions?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const result = await response.json();

    if (!result.success) {
      console.error('[DecisionStore] Failed to get recent decisions:', result.error);
      return [];
    }

    return (result.data || []).map((d: any) => ({
      ...d,
      createdAt: new Date(d.createdAt),
    }));
  } catch (error) {
    console.error('[DecisionStore] Error getting recent decisions:', error);
    return [];
  }
}

// =============================================================================
// DECISION FORMATTING HELPERS
// =============================================================================

/**
 * Get human-readable decision label
 */
export function getDecisionLabel(decision: DecisionType): string {
  const labels: Record<DecisionType, string> = {
    pursue: 'Pursue',
    reject: 'Rejected',
    defer: 'Deferred',
    save: 'Saved',
  };
  return labels[decision];
}

/**
 * Get decision color for UI
 */
export function getDecisionColor(decision: DecisionType): string {
  const colors: Record<DecisionType, string> = {
    pursue: '#10b981', // green
    reject: '#ef4444', // red
    defer: '#f59e0b', // amber
    save: '#3b82f6', // blue
  };
  return colors[decision];
}

/**
 * Format decision for display
 */
export function formatDecisionSummary(decision: Decision): string {
  const date = decision.createdAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  return `Previously evaluated: ${date}. Decision: ${getDecisionLabel(decision.decision)}.`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const decisionStore = {
  persist: persistDecision,
  getForEntity: getDecisionsForEntity,
  getLatest: getLatestDecision,
  searchByName: searchDecisionsByName,
  getRecent: getRecentDecisions,
};

export default decisionStore;
