/**
 * useWorkspaceNBA Hook - S374: NBA → Card Wiring
 *
 * Hook to manage NBA lifecycle in the workspace.
 *
 * WORKSPACE UX (LOCKED):
 * - Fetches NBA on workspace load
 * - Refreshes NBA periodically (every 15 min)
 * - Handles NBA actions (execute, defer, dismiss)
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useCardStore } from '@/lib/stores/card-store';
import { useSalesContextStore } from '@/lib/stores/sales-context-store';
import { fetchAndCreateNBACard, refreshNBACard } from '../nba-card-adapter';
import { dispatchAction, ActionContext, ActionResult } from '../action-handlers';
import { Card } from '../card-state';
import { NBAContext } from '../nba-engine';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * NBA refresh interval (15 minutes)
 */
const NBA_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Default tenant ID (will be replaced by session in production)
 */
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Default user ID (will be replaced by session in production)
 */
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000002';

// =============================================================================
// HOOK
// =============================================================================

export interface UseWorkspaceNBAOptions {
  /**
   * Enable automatic fetch on mount
   * @default true
   */
  autoFetch?: boolean;

  /**
   * Enable periodic refresh
   * @default true
   */
  autoRefresh?: boolean;

  /**
   * Refresh interval in milliseconds
   * @default 15 * 60 * 1000 (15 minutes)
   */
  refreshInterval?: number;
}

export interface UseWorkspaceNBAResult {
  /**
   * Current NBA card (if any)
   */
  nba: Card | null;

  /**
   * Whether NBA is currently being fetched
   */
  isLoading: boolean;

  /**
   * Manually fetch/refresh NBA
   */
  refresh: () => Promise<void>;

  /**
   * Handle action on NBA card
   */
  handleAction: (actionId: string) => Promise<ActionResult>;

  /**
   * Get current NBA context
   */
  getContext: () => NBAContext;
}

/**
 * Hook to manage NBA in workspace
 */
export function useWorkspaceNBA(
  options: UseWorkspaceNBAOptions = {}
): UseWorkspaceNBAResult {
  const {
    autoFetch = true,
    autoRefresh = true,
    refreshInterval = NBA_REFRESH_INTERVAL_MS,
  } = options;

  const nba = useCardStore((state) => state.getNBA());
  const salesContext = useSalesContextStore((state) => state.context);
  const isLoadingRef = useRef(false);
  const hasInitialized = useRef(false);

  /**
   * Build NBA context from current session/context
   */
  const getContext = useCallback((): NBAContext => {
    // TODO: Get from actual session when auth is implemented
    const tenantId = typeof window !== 'undefined'
      ? localStorage.getItem('tenant_id') || DEFAULT_TENANT_ID
      : DEFAULT_TENANT_ID;

    const userId = typeof window !== 'undefined'
      ? localStorage.getItem('user_id') || DEFAULT_USER_ID
      : DEFAULT_USER_ID;

    return {
      tenantId,
      userId,
      workspaceId: salesContext.subVertical,
      currentTime: new Date(),
      userActivity: 'active',
    };
  }, [salesContext.subVertical]);

  /**
   * Build action context
   */
  const getActionContext = useCallback((): ActionContext => {
    const nbaContext = getContext();
    return {
      tenantId: nbaContext.tenantId,
      userId: nbaContext.userId,
      workspaceId: nbaContext.workspaceId,
    };
  }, [getContext]);

  /**
   * Fetch/refresh NBA
   */
  const refresh = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    console.log('[useWorkspaceNBA] Refreshing NBA...');

    try {
      const context = getContext();

      if (hasInitialized.current) {
        // Refresh existing
        await refreshNBACard(context);
      } else {
        // Initial fetch
        await fetchAndCreateNBACard(context);
        hasInitialized.current = true;
      }
    } catch (error) {
      console.error('[useWorkspaceNBA] Error refreshing NBA:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [getContext]);

  /**
   * Handle action on NBA card
   */
  const handleAction = useCallback(async (actionId: string): Promise<ActionResult> => {
    if (!nba) {
      return {
        success: false,
        error: 'No NBA card to act on',
      };
    }

    const context = getActionContext();
    const action = nba.actions?.find(a => a.id === actionId);

    if (!action) {
      return {
        success: false,
        error: `Action not found: ${actionId}`,
      };
    }

    console.log('[useWorkspaceNBA] Handling action:', action.handler);
    return dispatchAction(action.handler, nba, context);
  }, [nba, getActionContext]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && !hasInitialized.current) {
      // Delay slightly to ensure stores are ready
      const timer = setTimeout(() => {
        refresh();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoFetch, refresh]);

  // Auto-refresh on interval
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    nba,
    isLoading: isLoadingRef.current,
    refresh,
    handleAction,
    getContext,
  };
}

export default useWorkspaceNBA;
