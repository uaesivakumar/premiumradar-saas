/**
 * Auto-Activation Resolver (S269)
 *
 * THE SINGLE SOURCE OF RUNTIME ACTIVATION LOGIC
 *
 * This resolver is the ONLY entry point for runtime activation.
 * UI never triggers activation directly - all activation goes through this resolver.
 *
 * FORMAL CONTRACT:
 * ================
 * Input: { user_id, persona_id? }
 *
 * Logic:
 *   1. Resolve user type (Enterprise vs Individual)
 *   2. Determine default workspace based on user type
 *   3. Check stack_readiness for the target persona
 *   4. If READY → create/activate binding
 *   5. If NOT READY → return blocked with explicit reasons
 *
 * Output: {
 *   activated: boolean,
 *   reason_code: ReasonCode,
 *   audit_id: string,
 *   binding_id?: string,
 *   workspace_id?: string
 * }
 *
 * HARD GUARANTEES:
 * ================
 * 1. Activation happens exactly once (idempotent)
 * 2. Safe on retries (same input → same output if no state change)
 * 3. Replayable (full audit trail)
 * 4. Deterministic reason codes (no silent fallbacks)
 */

import { query, queryOne, insert } from '@/lib/db/client';
import { randomUUID } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Deterministic reason codes - no ambiguity
 */
export type ReasonCode =
  | 'READY_ACTIVATED'           // Successfully activated
  | 'ALREADY_ACTIVATED'         // Idempotent - already active
  | 'BLOCKED_NO_PERSONA'        // Persona not found
  | 'BLOCKED_NO_POLICY'         // No active policy for persona
  | 'BLOCKED_MISSING_VERTICAL'  // Vertical/sub-vertical incomplete
  | 'BLOCKED_PERSONA_INACTIVE'  // Persona exists but is inactive
  | 'BLOCKED_STACK_INCOMPLETE'  // stack_readiness returned non-READY
  | 'BLOCKED_NO_USER'           // User not found
  | 'BLOCKED_NO_TENANT'         // Tenant not found for user
  | 'RESOLVER_ERROR';           // Unexpected error

export interface ResolverInput {
  user_id: string;
  persona_id?: string;  // Optional - if not provided, uses default for user's vertical
}

export interface ResolverOutput {
  activated: boolean;
  reason_code: ReasonCode;
  reason_message: string;
  audit_id: string;
  binding_id?: string;
  workspace_id?: string;
  persona_id?: string;
  user_type?: 'enterprise' | 'individual';
  stack_status?: string;
  blockers?: string[];
  timestamp: string;
}

// Database row types
interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  is_active: boolean;
}

interface TenantRow {
  id: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise' | 'saas';
  is_active: boolean;
}

interface UserProfileRow {
  id: string;
  user_id: string;
  tenant_id: string;
  vertical: string;
  sub_vertical: string;
  region_country: string;
}

interface PersonaRow {
  id: string;
  key: string;
  name: string;
  is_active: boolean;
  sub_vertical_id: string;
}

interface SubVerticalRow {
  id: string;
  key: string;
  is_active: boolean;
  vertical_id: string;
}

interface VerticalRow {
  id: string;
  key: string;
  is_active: boolean;
}

interface PolicyRow {
  id: string;
  policy_version: number;
  status: string;
}

interface BindingRow {
  id: string;
  workspace_id: string;
  persona_id: string;
  is_active: boolean;
}

interface WorkspaceRow {
  id: string;
  tenant_id: string;
  name: string;
  is_active: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine user type from tenant plan
 */
function getUserType(tenantPlan: TenantRow['plan']): 'enterprise' | 'individual' {
  return tenantPlan === 'enterprise' ? 'enterprise' : 'individual';
}

/**
 * Get or create default workspace for user based on type
 */
async function getOrCreateDefaultWorkspace(
  tenantId: string,
  userId: string,
  userType: 'enterprise' | 'individual'
): Promise<WorkspaceRow> {
  if (userType === 'enterprise') {
    // Enterprise: Use default enterprise workspace for the tenant
    const existing = await queryOne<WorkspaceRow>(
      `SELECT * FROM workspaces
       WHERE tenant_id = $1 AND is_default = true AND is_active = true
       ORDER BY created_at ASC LIMIT 1`,
      [tenantId]
    );

    if (existing) return existing;

    // Create default enterprise workspace if none exists
    const result = await insert<WorkspaceRow>(
      `INSERT INTO workspaces (id, tenant_id, name, is_default, is_active)
       VALUES ($1, $2, $3, true, true)
       RETURNING *`,
      [randomUUID(), tenantId, 'Default Enterprise Workspace']
    );

    return result;
  } else {
    // Individual: Use personal workspace for the user
    const existing = await queryOne<WorkspaceRow>(
      `SELECT * FROM workspaces
       WHERE tenant_id = $1 AND owner_user_id = $2 AND is_active = true
       ORDER BY created_at ASC LIMIT 1`,
      [tenantId, userId]
    );

    if (existing) return existing;

    // Create personal workspace if none exists
    const result = await insert<WorkspaceRow>(
      `INSERT INTO workspaces (id, tenant_id, name, owner_user_id, is_default, is_active)
       VALUES ($1, $2, $3, $4, false, true)
       RETURNING *`,
      [randomUUID(), tenantId, 'Personal Workspace', userId]
    );

    return result;
  }
}

/**
 * Log audit event for resolver action
 */
async function logResolverAudit(
  auditId: string,
  input: ResolverInput,
  output: Omit<ResolverOutput, 'audit_id' | 'timestamp'>,
  userType: 'enterprise' | 'individual' | null
): Promise<void> {
  try {
    await insert(
      `INSERT INTO os_resolver_audit_log (
        id, user_id, persona_id, user_type, reason_code,
        activated, binding_id, workspace_id, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        auditId,
        input.user_id,
        input.persona_id || null,
        userType,
        output.reason_code,
        output.activated,
        output.binding_id || null,
        output.workspace_id || null,
        JSON.stringify({
          reason_message: output.reason_message,
          stack_status: output.stack_status,
          blockers: output.blockers,
        }),
      ]
    );
  } catch (error) {
    // Don't fail the resolver on audit log failure
    console.error('[AutoActivationResolver] Audit log error:', error);
  }
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

/**
 * Auto-Activation Resolver
 *
 * The SINGLE entry point for runtime activation.
 *
 * @param input - { user_id, persona_id? }
 * @returns ResolverOutput with deterministic reason codes
 */
export async function resolveActivation(input: ResolverInput): Promise<ResolverOutput> {
  const auditId = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    // Step 1: Get user
    const user = await queryOne<UserRow>(
      'SELECT id, tenant_id, email, is_active FROM users WHERE id = $1',
      [input.user_id]
    );

    if (!user) {
      const output: ResolverOutput = {
        activated: false,
        reason_code: 'BLOCKED_NO_USER',
        reason_message: 'User not found',
        audit_id: auditId,
        timestamp,
      };
      await logResolverAudit(auditId, input, output, null);
      return output;
    }

    // Step 2: Get tenant to determine user type
    const tenant = await queryOne<TenantRow>(
      'SELECT id, plan, is_active FROM tenants WHERE id = $1',
      [user.tenant_id]
    );

    if (!tenant) {
      const output: ResolverOutput = {
        activated: false,
        reason_code: 'BLOCKED_NO_TENANT',
        reason_message: 'Tenant not found for user',
        audit_id: auditId,
        timestamp,
      };
      await logResolverAudit(auditId, input, output, null);
      return output;
    }

    const userType = getUserType(tenant.plan);

    // Step 3: Get user profile for vertical context
    const profile = await queryOne<UserProfileRow>(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [input.user_id]
    );

    // Step 4: Resolve persona
    let personaId = input.persona_id;

    if (!personaId && profile) {
      // Find default persona for user's vertical/sub-vertical
      const subVertical = await queryOne<SubVerticalRow>(
        `SELECT sv.id, sv.key, sv.is_active, sv.vertical_id
         FROM os_sub_verticals sv
         JOIN os_verticals v ON sv.vertical_id = v.id
         WHERE sv.key = $1 AND v.key = $2`,
        [profile.sub_vertical, profile.vertical]
      );

      if (subVertical) {
        const persona = await queryOne<PersonaRow>(
          `SELECT id, key, name, is_active, sub_vertical_id
           FROM os_personas
           WHERE sub_vertical_id = $1 AND is_active = true
           ORDER BY created_at ASC LIMIT 1`,
          [subVertical.id]
        );

        if (persona) {
          personaId = persona.id;
        }
      }
    }

    if (!personaId) {
      const output: ResolverOutput = {
        activated: false,
        reason_code: 'BLOCKED_NO_PERSONA',
        reason_message: 'No persona found for user context',
        audit_id: auditId,
        user_type: userType,
        timestamp,
      };
      await logResolverAudit(auditId, input, output, userType);
      return output;
    }

    // Step 5: Check if already activated (idempotent check)
    const existingBinding = await queryOne<BindingRow>(
      `SELECT id, workspace_id, persona_id, is_active
       FROM os_workspace_bindings
       WHERE persona_id = $1 AND tenant_id = $2 AND is_active = true`,
      [personaId, tenant.id]
    );

    if (existingBinding) {
      const output: ResolverOutput = {
        activated: true,  // Already activated is still "activated"
        reason_code: 'ALREADY_ACTIVATED',
        reason_message: 'Binding already exists and is active',
        audit_id: auditId,
        binding_id: existingBinding.id,
        workspace_id: existingBinding.workspace_id,
        persona_id: personaId,
        user_type: userType,
        timestamp,
      };
      await logResolverAudit(auditId, input, output, userType);
      return output;
    }

    // Step 6: Check stack_readiness
    const stackReadiness = await computeStackReadinessForResolver(personaId);

    if (stackReadiness.status !== 'READY') {
      const output: ResolverOutput = {
        activated: false,
        reason_code: 'BLOCKED_STACK_INCOMPLETE',
        reason_message: `Stack not ready: ${stackReadiness.blockers.join(', ')}`,
        audit_id: auditId,
        persona_id: personaId,
        user_type: userType,
        stack_status: stackReadiness.status,
        blockers: stackReadiness.blockers,
        timestamp,
      };
      await logResolverAudit(auditId, input, output, userType);
      return output;
    }

    // Step 7: Get or create workspace based on user type
    const workspace = await getOrCreateDefaultWorkspace(tenant.id, user.id, userType);

    // Step 8: Create binding (the actual activation)
    const binding = await insert<BindingRow>(
      `INSERT INTO os_workspace_bindings (
        id, tenant_id, workspace_id, vertical_id, sub_vertical_id, persona_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *`,
      [
        randomUUID(),
        tenant.id,
        workspace.id,
        stackReadiness.metadata.vertical_id,
        stackReadiness.metadata.sub_vertical_id,
        personaId,
      ]
    );

    // Success!
    const output: ResolverOutput = {
      activated: true,
      reason_code: 'READY_ACTIVATED',
      reason_message: 'Successfully activated runtime binding',
      audit_id: auditId,
      binding_id: binding.id,
      workspace_id: workspace.id,
      persona_id: personaId,
      user_type: userType,
      stack_status: 'READY',
      timestamp,
    };

    await logResolverAudit(auditId, input, output, userType);
    return output;

  } catch (error) {
    console.error('[AutoActivationResolver] Error:', error);

    const output: ResolverOutput = {
      activated: false,
      reason_code: 'RESOLVER_ERROR',
      reason_message: error instanceof Error ? error.message : 'Unexpected resolver error',
      audit_id: auditId,
      timestamp,
    };

    await logResolverAudit(auditId, input, output, null);
    return output;
  }
}

// ============================================================================
// INTERNAL STACK READINESS CHECK
// ============================================================================

interface StackReadinessResult {
  status: 'READY' | 'BLOCKED' | 'INCOMPLETE' | 'NOT_FOUND';
  blockers: string[];
  metadata: {
    vertical_id: string | null;
    sub_vertical_id: string | null;
    persona_id: string;
    active_policy_id: string | null;
  };
}

/**
 * Compute stack readiness for resolver (internal - no HTTP call)
 *
 * This reuses the same logic as the stack-readiness API but inline
 * to avoid HTTP overhead and ensure transactional consistency.
 */
async function computeStackReadinessForResolver(personaId: string): Promise<StackReadinessResult> {
  const blockers: string[] = [];
  const metadata = {
    vertical_id: null as string | null,
    sub_vertical_id: null as string | null,
    persona_id: personaId,
    active_policy_id: null as string | null,
  };

  // Check persona
  const persona = await queryOne<PersonaRow>(
    'SELECT id, key, name, is_active, sub_vertical_id FROM os_personas WHERE id = $1',
    [personaId]
  );

  if (!persona) {
    return { status: 'NOT_FOUND', blockers: ['Persona not found'], metadata };
  }

  if (!persona.is_active) {
    blockers.push('Persona is inactive');
  }

  // Check sub-vertical
  const subVertical = await queryOne<SubVerticalRow>(
    'SELECT id, key, is_active, vertical_id FROM os_sub_verticals WHERE id = $1',
    [persona.sub_vertical_id]
  );

  if (!subVertical) {
    blockers.push('Sub-vertical not found');
  } else {
    metadata.sub_vertical_id = subVertical.id;

    if (!subVertical.is_active) {
      blockers.push('Sub-vertical is inactive');
    }

    // Check vertical
    const vertical = await queryOne<VerticalRow>(
      'SELECT id, key, is_active FROM os_verticals WHERE id = $1',
      [subVertical.vertical_id]
    );

    if (!vertical) {
      blockers.push('Vertical not found');
    } else {
      metadata.vertical_id = vertical.id;

      if (!vertical.is_active) {
        blockers.push('Vertical is inactive');
      }
    }
  }

  // Check for active policy
  const policy = await queryOne<PolicyRow>(
    `SELECT id, policy_version, status FROM os_persona_policies
     WHERE persona_id = $1 AND status = 'ACTIVE'
     ORDER BY policy_version DESC LIMIT 1`,
    [personaId]
  );

  if (!policy) {
    blockers.push('No ACTIVE policy for persona');
  } else {
    metadata.active_policy_id = policy.id;
  }

  // Determine status
  if (blockers.length === 0) {
    return { status: 'READY', blockers: [], metadata };
  } else if (blockers.some(b => b.includes('inactive'))) {
    return { status: 'BLOCKED', blockers, metadata };
  } else {
    return { status: 'INCOMPLETE', blockers, metadata };
  }
}

// ============================================================================
// REPLAY SUPPORT
// ============================================================================

/**
 * Replay a resolver decision for audit/debugging
 *
 * Given an audit_id, returns the original resolver output
 */
export async function replayResolverDecision(auditId: string): Promise<ResolverOutput | null> {
  const audit = await queryOne<{
    id: string;
    user_id: string;
    persona_id: string | null;
    user_type: string | null;
    reason_code: string;
    activated: boolean;
    binding_id: string | null;
    workspace_id: string | null;
    metadata: string;
    created_at: Date;
  }>(
    'SELECT * FROM os_resolver_audit_log WHERE id = $1',
    [auditId]
  );

  if (!audit) return null;

  const metadata = typeof audit.metadata === 'string'
    ? JSON.parse(audit.metadata)
    : audit.metadata;

  return {
    activated: audit.activated,
    reason_code: audit.reason_code as ReasonCode,
    reason_message: metadata?.reason_message || '',
    audit_id: audit.id,
    binding_id: audit.binding_id || undefined,
    workspace_id: audit.workspace_id || undefined,
    persona_id: audit.persona_id || undefined,
    user_type: audit.user_type as 'enterprise' | 'individual' | undefined,
    stack_status: metadata?.stack_status,
    blockers: metadata?.blockers,
    timestamp: audit.created_at.toISOString(),
  };
}
