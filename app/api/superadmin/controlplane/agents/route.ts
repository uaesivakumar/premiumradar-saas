/**
 * OS Control Plane Agents API
 *
 * GET /api/superadmin/controlplane/agents - List available agents
 *
 * Returns the list of agents that can be assigned as default_agent
 * for sub-verticals. This feeds the dropdown in the wizard.
 */

import { validateSuperAdminSession } from '@/lib/superadmin-auth';

interface Agent {
  key: string;
  label: string;
  description?: string;
}

// Available agents in the system
// TODO: In future, this could be fetched from a database table
const AVAILABLE_AGENTS: Agent[] = [
  {
    key: 'SIVA',
    label: 'SIVA (default)',
    description: 'Sales Intelligence Virtual Agent - handles discovery, scoring, and recommendations',
  },
  {
    key: 'SIVA_BANKING',
    label: 'SIVA Banking',
    description: 'Banking-specialized SIVA for financial services verticals',
  },
  {
    key: 'SIVA_INSURANCE',
    label: 'SIVA Insurance',
    description: 'Insurance-specialized SIVA (coming soon)',
  },
];

/**
 * GET /api/superadmin/controlplane/agents
 * Returns list of available agents for default_agent dropdown
 */
export async function GET() {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    success: true,
    agents: AVAILABLE_AGENTS,
  });
}
