/**
 * Workspace - S369: Single Pageless Entry Point
 *
 * LOCKED UX IMPLEMENTATION:
 * - One workspace (pageless)
 * - State-driven (not page-driven)
 * - Cards are the only visible artifacts
 * - Conversation is ephemeral
 * - Decisions persist
 *
 * See docs/WORKSPACE_UX_DECISION.md (LOCKED)
 * See docs/WORKSPACE_EXPERIENCE_FLOW.md (LOCKED)
 */

'use client';

import { PagelessShell } from '@/components/shell/PagelessShell';

export default function WorkspacePage() {
  // S369: Single entry point for workspace
  // PagelessShell already renders SIVASurface internally
  // All navigation happens via state changes, not page routing
  return <PagelessShell />;
}
