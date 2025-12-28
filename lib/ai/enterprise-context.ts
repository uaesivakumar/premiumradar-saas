/**
 * S311-S312: Enterprise-Aware AI Context
 * Part of User & Enterprise Management Program v1.1
 * Phase E - AI & BTE Integration
 *
 * Provides enterprise context for SIVA and BTE operations.
 * Ensures all AI operations are scoped to the correct enterprise/workspace.
 */

import { getServerSession, UserSession } from '@/lib/auth/session';
import { query, queryOne } from '@/lib/db/client';

// =============================================================================
// TYPES
// =============================================================================

export interface EnterpriseAIContext {
  enterprise_id: string;
  enterprise_name: string;
  workspace_id: string | null;
  workspace_name: string | null;
  user_id: string;
  user_role: string;
  is_demo: boolean;
  demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
  // Vertical context for SIVA
  vertical: string | null;
  sub_vertical: string | null;
  region: string | null;
  // Feature flags
  features: {
    can_use_siva: boolean;
    can_use_discovery: boolean;
    can_use_outreach: boolean;
    can_export: boolean;
    max_discoveries_per_month: number;
    discoveries_remaining: number;
  };
}

export interface EnterpriseContextOptions {
  require_workspace?: boolean;
  require_vertical?: boolean;
}

// =============================================================================
// CONTEXT RETRIEVAL
// =============================================================================

/**
 * Get the full enterprise context for AI operations
 * Includes workspace, vertical config, and feature flags
 */
export async function getEnterpriseAIContext(
  options: EnterpriseContextOptions = {}
): Promise<EnterpriseAIContext | null> {
  const session = await getServerSession();

  if (!session) {
    return null;
  }

  // Get enterprise ID from session
  const enterpriseId = session.enterpriseId;

  if (!enterpriseId) {
    return null;
  }

  // Fetch enterprise details and limits
  const enterprise = await queryOne<{
    id: string;
    name: string;
    plan: string;
    max_discoveries_per_month: number;
    type: string;
  }>(
    'SELECT id, name, plan, max_discoveries_per_month, type FROM enterprises WHERE id = $1',
    [enterpriseId]
  );

  if (!enterprise) {
    return null;
  }

  // Fetch current workspace if available
  let workspaceId = session.workspaceId || null;
  let workspaceName: string | null = null;
  let vertical: string | null = null;
  let subVertical: string | null = null;
  let region: string | null = null;

  if (workspaceId) {
    const workspace = await queryOne<{
      id: string;
      name: string;
      sub_vertical_id: string | null;
    }>(
      'SELECT id, name, sub_vertical_id FROM workspaces WHERE id = $1 AND enterprise_id = $2',
      [workspaceId, enterpriseId]
    );

    if (workspace) {
      workspaceName = workspace.name;

      // Get vertical config from sub-vertical if available
      if (workspace.sub_vertical_id) {
        const subVert = await queryOne<{
          slug: string;
          vertical_id: string;
          region_code: string;
        }>(
          `SELECT sv.slug, sv.vertical_id, sv.region_code,
                  v.slug as vertical_slug
           FROM os_sub_verticals sv
           JOIN os_verticals v ON v.id = sv.vertical_id
           WHERE sv.id = $1`,
          [workspace.sub_vertical_id]
        );

        if (subVert) {
          subVertical = subVert.slug;
          vertical = (subVert as Record<string, string>).vertical_slug || null;
          region = subVert.region_code;
        }
      }
    } else {
      // Workspace doesn't exist or doesn't belong to enterprise
      workspaceId = null;
    }
  } else if (options.require_workspace) {
    // If workspace is required but not provided, get default
    const defaultWorkspace = await queryOne<{
      id: string;
      name: string;
    }>(
      'SELECT id, name FROM workspaces WHERE enterprise_id = $1 AND is_default = true LIMIT 1',
      [enterpriseId]
    );

    if (defaultWorkspace) {
      workspaceId = defaultWorkspace.id;
      workspaceName = defaultWorkspace.name;
    }
  }

  // Get discovery usage count for the current month
  const usageResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM evidence_packs
     WHERE enterprise_id = $1
       AND pack_type = 'DISCOVERY'
       AND created_at >= date_trunc('month', NOW())`,
    [enterpriseId]
  );

  const discoveriesThisMonth = parseInt(usageResult?.count || '0');
  const maxDiscoveries = enterprise.max_discoveries_per_month || 100;
  const discoveriesRemaining = Math.max(0, maxDiscoveries - discoveriesThisMonth);

  // Determine feature flags based on plan and demo status
  const isDemo = session.isDemo || false;
  const demoType = session.demoType || null;
  const plan = enterprise.plan || 'free';

  const features = {
    can_use_siva: true, // All plans can use SIVA
    can_use_discovery: true, // All plans can use discovery
    can_use_outreach: plan !== 'free' || isDemo,
    can_export: plan !== 'free',
    max_discoveries_per_month: maxDiscoveries,
    discoveries_remaining: discoveriesRemaining,
  };

  // For demo accounts, limit features based on demo type
  if (isDemo) {
    features.can_export = false; // Demo accounts cannot export
    features.max_discoveries_per_month = demoType === 'ENTERPRISE' ? 50 : 20;
    features.discoveries_remaining = Math.max(
      0,
      features.max_discoveries_per_month - discoveriesThisMonth
    );
  }

  return {
    enterprise_id: enterpriseId,
    enterprise_name: enterprise.name,
    workspace_id: workspaceId,
    workspace_name: workspaceName,
    user_id: session.user.id,
    user_role: session.user.role || 'ENTERPRISE_USER',
    is_demo: isDemo,
    demo_type: demoType,
    vertical,
    sub_vertical: subVertical,
    region,
    features,
  };
}

/**
 * Require enterprise context - throws if not available
 */
export async function requireEnterpriseAIContext(
  options: EnterpriseContextOptions = {}
): Promise<EnterpriseAIContext> {
  const context = await getEnterpriseAIContext(options);

  if (!context) {
    throw new Error('Enterprise context required but not available');
  }

  if (options.require_workspace && !context.workspace_id) {
    throw new Error('Workspace context required but not available');
  }

  if (options.require_vertical && !context.vertical) {
    throw new Error('Vertical context required but not configured');
  }

  return context;
}

// =============================================================================
// SIVA CONTEXT HELPERS (S312)
// =============================================================================

/**
 * Get SIVA request context with enterprise/vertical info
 * This is passed to all SIVA API calls
 */
export function getSIVAContext(aiContext: EnterpriseAIContext): {
  enterprise_id: string;
  workspace_id: string | null;
  vertical: string;
  sub_vertical: string;
  region: string;
  is_demo: boolean;
} {
  return {
    enterprise_id: aiContext.enterprise_id,
    workspace_id: aiContext.workspace_id,
    vertical: aiContext.vertical || 'banking',
    sub_vertical: aiContext.sub_vertical || 'employee_banking',
    region: aiContext.region || 'UAE',
    is_demo: aiContext.is_demo,
  };
}

/**
 * Check if the context allows a specific AI operation
 */
export function canPerformAIOperation(
  context: EnterpriseAIContext,
  operation: 'discovery' | 'ranking' | 'outreach' | 'export'
): { allowed: boolean; reason?: string } {
  switch (operation) {
    case 'discovery':
      if (!context.features.can_use_discovery) {
        return { allowed: false, reason: 'Discovery not available for your plan' };
      }
      if (context.features.discoveries_remaining <= 0) {
        return { allowed: false, reason: 'Monthly discovery limit reached' };
      }
      return { allowed: true };

    case 'ranking':
      if (!context.features.can_use_siva) {
        return { allowed: false, reason: 'SIVA not available for your plan' };
      }
      return { allowed: true };

    case 'outreach':
      if (!context.features.can_use_outreach) {
        return { allowed: false, reason: 'Outreach not available for free plan' };
      }
      return { allowed: true };

    case 'export':
      if (!context.features.can_export) {
        return { allowed: false, reason: 'Export not available for your plan' };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: 'Unknown operation' };
  }
}

// =============================================================================
// WORKSPACE-SCOPED RESULTS (S315)
// =============================================================================

/**
 * Store an evidence pack with proper enterprise/workspace scoping
 */
export async function storeEnterpriseEvidencePack(
  context: EnterpriseAIContext,
  packType: 'DISCOVERY' | 'RANKING' | 'OUTREACH',
  payload: Record<string, unknown>,
  evidence: Record<string, unknown>
): Promise<{ id: string }> {
  const result = await queryOne<{ id: string }>(
    `INSERT INTO evidence_packs (
      enterprise_id, workspace_id, pack_type, payload, evidence, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id`,
    [
      context.enterprise_id,
      context.workspace_id,
      packType,
      JSON.stringify(payload),
      JSON.stringify(evidence),
      context.user_id,
    ]
  );

  if (!result) {
    throw new Error('Failed to store evidence pack');
  }

  return result;
}

/**
 * Get evidence packs for the current enterprise/workspace
 */
export async function getEnterpriseEvidencePacks(
  context: EnterpriseAIContext,
  options: {
    pack_type?: 'DISCOVERY' | 'RANKING' | 'OUTREACH';
    limit?: number;
    workspace_only?: boolean;
  } = {}
): Promise<
  Array<{
    id: string;
    pack_type: string;
    payload: Record<string, unknown>;
    created_at: Date;
    created_by: string;
  }>
> {
  const params: unknown[] = [context.enterprise_id];
  let whereClause = 'enterprise_id = $1';

  if (options.workspace_only && context.workspace_id) {
    params.push(context.workspace_id);
    whereClause += ` AND workspace_id = $${params.length}`;
  }

  if (options.pack_type) {
    params.push(options.pack_type);
    whereClause += ` AND pack_type = $${params.length}`;
  }

  const limit = options.limit || 50;
  params.push(limit);

  const results = await query<{
    id: string;
    pack_type: string;
    payload: Record<string, unknown>;
    created_at: Date;
    created_by: string;
  }>(
    `SELECT id, pack_type, payload, created_at, created_by
     FROM evidence_packs
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params
  );

  return results;
}

// =============================================================================
// ENTERPRISE FILTER HELPERS (S313, S314)
// =============================================================================

/**
 * Add enterprise filter to a discovery query
 */
export function addEnterpriseDiscoveryFilter(
  context: EnterpriseAIContext,
  baseQuery: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...baseQuery,
    enterprise_id: context.enterprise_id,
    workspace_id: context.workspace_id,
    vertical: context.vertical || 'banking',
    sub_vertical: context.sub_vertical || 'employee_banking',
    region: context.region || 'UAE',
  };
}

/**
 * Add enterprise filter to a ranking request
 */
export function addEnterpriseRankingFilter(
  context: EnterpriseAIContext,
  entities: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return entities.map((entity) => ({
    ...entity,
    enterprise_id: context.enterprise_id,
    workspace_id: context.workspace_id,
  }));
}

// =============================================================================
// EXPORT
// =============================================================================

export const enterpriseAIContext = {
  getContext: getEnterpriseAIContext,
  requireContext: requireEnterpriseAIContext,
  getSIVAContext,
  canPerformOperation: canPerformAIOperation,
  storeEvidencePack: storeEnterpriseEvidencePack,
  getEvidencePacks: getEnterpriseEvidencePacks,
  addDiscoveryFilter: addEnterpriseDiscoveryFilter,
  addRankingFilter: addEnterpriseRankingFilter,
};

export default enterpriseAIContext;
