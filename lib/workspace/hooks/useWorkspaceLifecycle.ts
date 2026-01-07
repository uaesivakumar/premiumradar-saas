/**
 * Workspace Lifecycle Hook - S377: Silence, TTL, Rehydration
 *
 * Handles workspace initialization and cleanup:
 * - TTL engine start/stop
 * - Card rehydration on mount
 * - Silence pattern cleanup
 *
 * WORKSPACE UX (LOCKED):
 * - Cards persist across page refreshes
 * - Expired cards are cleaned up automatically
 * - Silenced patterns are enforced
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCardStore, startTTLEngine, stopTTLEngine } from '@/lib/stores/card-store';
import { useSilenceStore } from '../silence-store';

// =============================================================================
// TYPES
// =============================================================================

interface UseWorkspaceLifecycleOptions {
  /** Enable TTL engine for automatic expiry (default: true) */
  enableTTL?: boolean;
  /** Enable rehydration from localStorage (default: true) */
  enableRehydration?: boolean;
  /** Enable silence pattern enforcement (default: true) */
  enableSilence?: boolean;
  /** TTL check interval in ms (default: 60000) */
  ttlIntervalMs?: number;
}

interface UseWorkspaceLifecycleResult {
  /** Whether the workspace is initialized */
  isInitialized: boolean;
  /** Force rehydration of cards */
  forceRehydrate: () => void;
  /** Force TTL check */
  forceTTLCheck: () => void;
  /** Cleanup silence patterns */
  cleanupSilence: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function useWorkspaceLifecycle(
  options: UseWorkspaceLifecycleOptions = {}
): UseWorkspaceLifecycleResult {
  const {
    enableTTL = true,
    enableRehydration = true,
    enableSilence = true,
  } = options;

  const isInitializedRef = useRef(false);
  const expireCards = useCardStore((state) => state.expireCards);
  const cleanupExpiredPatterns = useSilenceStore((state) => state.cleanupExpired);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('[WorkspaceLifecycle] Initializing workspace...');

    // 1. Start TTL engine
    if (enableTTL) {
      startTTLEngine();
      console.log('[WorkspaceLifecycle] TTL engine started');
    }

    // 2. Trigger immediate expiry check
    if (enableRehydration) {
      // Cards are auto-rehydrated by zustand persist middleware
      // Just need to check for expired cards
      expireCards();
      console.log('[WorkspaceLifecycle] Initial expiry check complete');
    }

    // 3. Cleanup expired silence patterns
    if (enableSilence) {
      cleanupExpiredPatterns();
      console.log('[WorkspaceLifecycle] Silence patterns cleaned');
    }

    console.log('[WorkspaceLifecycle] Workspace initialized');

    // Cleanup on unmount
    return () => {
      console.log('[WorkspaceLifecycle] Cleaning up...');
      if (enableTTL) {
        stopTTLEngine();
      }
    };
  }, [enableTTL, enableRehydration, enableSilence, expireCards, cleanupExpiredPatterns]);

  // =============================================================================
  // FORCE ACTIONS
  // =============================================================================

  const forceRehydrate = useCallback(() => {
    // The zustand persist middleware handles rehydration automatically
    // This is just for manual triggering if needed
    const storedData = localStorage.getItem('card-store');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.state?.cards) {
          useCardStore.getState().rehydrate(parsed.state.cards);
          console.log('[WorkspaceLifecycle] Force rehydration complete');
        }
      } catch (error) {
        console.error('[WorkspaceLifecycle] Force rehydration failed:', error);
      }
    }
  }, []);

  const forceTTLCheck = useCallback(() => {
    expireCards();
    console.log('[WorkspaceLifecycle] Force TTL check complete');
  }, [expireCards]);

  const cleanupSilence = useCallback(() => {
    cleanupExpiredPatterns();
    console.log('[WorkspaceLifecycle] Silence cleanup complete');
  }, [cleanupExpiredPatterns]);

  return {
    isInitialized: isInitializedRef.current,
    forceRehydrate,
    forceTTLCheck,
    cleanupSilence,
  };
}

// =============================================================================
// VISIBILITY CHANGE HANDLER
// =============================================================================

/**
 * Hook to handle visibility changes (tab switching)
 * Checks TTL when user returns to tab
 */
export function useVisibilityTTLCheck() {
  const expireCards = useCardStore((state) => state.expireCards);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[WorkspaceLifecycle] Tab became visible, checking TTL...');
        expireCards();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [expireCards]);
}
