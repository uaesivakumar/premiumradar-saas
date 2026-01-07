/**
 * Workspace Hooks - S374, S377, S378
 */

export { useWorkspaceNBA } from './useWorkspaceNBA';
export type { UseWorkspaceNBAOptions, UseWorkspaceNBAResult } from './useWorkspaceNBA';

// S377: Lifecycle hooks
export { useWorkspaceLifecycle, useVisibilityTTLCheck } from './useWorkspaceLifecycle';

// S378: Master workspace hook
export { useWorkspace, useWorkspaceCards, useWorkspaceSystemState } from './useWorkspace';
export type { WorkspaceState, WorkspaceActions, UseWorkspaceResult } from './useWorkspace';
