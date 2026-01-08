/**
 * Demo Mode Module
 *
 * Core demo mode state management and functionality.
 */

import { create } from 'zustand';
import type {
  DemoModeState,
  DemoLimits,
  LockedFeature,
  BookingCTA,
  BookingCTATrigger,
  DemoSession,
} from './types';

// ============================================================
// DEMO LIMITS
// ============================================================

export const DEFAULT_DEMO_LIMITS: DemoLimits = {
  maxActions: 50,
  maxDomains: 10,
  maxSearchResults: 25,
  maxOutreachMessages: 3,
  sessionDurationMinutes: 30,
};

export const LOCKED_FEATURES: LockedFeature[] = [
  'export',
  'bulk-operations',
  'integrations',
  'api-access',
  'advanced-filters',
  'custom-reports',
  'team-features',
  'white-label',
];

// ============================================================
// DEMO MODE STORE
// ============================================================

interface DemoModeStore {
  // State
  state: DemoModeState | null;
  limits: DemoLimits;
  currentCTA: BookingCTA | null;
  session: DemoSession | null;

  // Actions
  startDemo: () => void;
  endDemo: () => void;
  incrementAction: () => void;
  isDemo: () => boolean;
  isActionAllowed: () => boolean;
  isFeatureLocked: (feature: LockedFeature) => boolean;
  getRemainingActions: () => number;
  getRemainingTime: () => number;

  // CTA management
  showCTA: (trigger: BookingCTATrigger) => void;
  dismissCTA: () => void;
  trackCTAClick: () => void;

  // Feature attempts
  attemptLockedFeature: (feature: LockedFeature) => void;

  // Session tracking
  trackPageVisit: (page: string) => void;
  trackConversion: (action: DemoSession['conversionAction']) => void;
}

export const useDemoModeStore = create<DemoModeStore>((set, get) => ({
  state: null,
  limits: DEFAULT_DEMO_LIMITS,
  currentCTA: null,
  session: null,

  startDemo: () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEFAULT_DEMO_LIMITS.sessionDurationMinutes * 60 * 1000);

    const state: DemoModeState = {
      isDemo: true,
      userId: `demo_${Date.now()}`,
      sessionId: `session_${Date.now()}`,
      startedAt: now,
      expiresAt,
      actionsPerformed: 0,
      maxActions: DEFAULT_DEMO_LIMITS.maxActions,
      lockedFeatures: LOCKED_FEATURES,
      bookingCTAShown: false,
      bookingCTADismissed: false,
    };

    const session: DemoSession = {
      sessionId: state.sessionId,
      startedAt: now,
      actionsPerformed: 0,
      pagesVisited: [],
      featuresAttempted: [],
      bookingCTAsShown: 0,
      bookingCTAsClicked: 0,
      converted: false,
    };

    set({ state, session });
  },

  endDemo: () => {
    const { session } = get();
    if (session) {
      set({
        session: {
          ...session,
          endedAt: new Date(),
        },
      });
    }
    set({ state: null, currentCTA: null });
  },

  incrementAction: () => {
    const { state, limits } = get();
    if (!state) return;

    const newCount = state.actionsPerformed + 1;

    set({
      state: {
        ...state,
        actionsPerformed: newCount,
      },
      session: get().session
        ? { ...get().session!, actionsPerformed: newCount }
        : null,
    });

    // Check if we should show CTA
    if (newCount >= limits.maxActions * 0.8) {
      get().showCTA('action-limit');
    }
  },

  isDemo: () => {
    return get().state?.isDemo === true;
  },

  isActionAllowed: () => {
    const { state, limits } = get();
    if (!state) return true; // Not in demo mode, allow all

    // Check time limit
    if (new Date() > state.expiresAt) {
      get().showCTA('time-limit');
      return false;
    }

    // Check action limit
    if (state.actionsPerformed >= limits.maxActions) {
      get().showCTA('action-limit');
      return false;
    }

    return true;
  },

  isFeatureLocked: (feature) => {
    const { state } = get();
    if (!state) return false;
    return state.lockedFeatures.includes(feature);
  },

  getRemainingActions: () => {
    const { state, limits } = get();
    if (!state) return Infinity;
    return Math.max(0, limits.maxActions - state.actionsPerformed);
  },

  getRemainingTime: () => {
    const { state } = get();
    if (!state) return Infinity;
    // Handle string from JSON deserialization
    const expiresAt = state.expiresAt instanceof Date
      ? state.expiresAt
      : new Date(state.expiresAt);
    const remaining = expiresAt.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000 / 60)); // Minutes
  },

  showCTA: (trigger) => {
    const { state } = get();
    if (!state || state.bookingCTADismissed) return;

    const cta = getCTAForTrigger(trigger);
    set({
      currentCTA: cta,
      state: { ...state, bookingCTAShown: true },
      session: get().session
        ? {
            ...get().session!,
            bookingCTAsShown: get().session!.bookingCTAsShown + 1,
          }
        : null,
    });
  },

  dismissCTA: () => {
    const { state } = get();
    if (state) {
      set({
        currentCTA: null,
        state: { ...state, bookingCTADismissed: true },
      });
    }
  },

  trackCTAClick: () => {
    const { session } = get();
    if (session) {
      set({
        session: {
          ...session,
          bookingCTAsClicked: session.bookingCTAsClicked + 1,
        },
      });
    }
  },

  attemptLockedFeature: (feature) => {
    const { session } = get();
    if (session && !session.featuresAttempted.includes(feature)) {
      set({
        session: {
          ...session,
          featuresAttempted: [...session.featuresAttempted, feature],
        },
      });
    }
    get().showCTA('feature-locked');
  },

  trackPageVisit: (page) => {
    const { session } = get();
    if (session && !session.pagesVisited.includes(page)) {
      set({
        session: {
          ...session,
          pagesVisited: [...session.pagesVisited, page],
        },
      });
    }
  },

  trackConversion: (action) => {
    const { session } = get();
    if (session) {
      set({
        session: {
          ...session,
          converted: true,
          conversionAction: action,
          endedAt: new Date(),
        },
      });
    }
  },
}));

// ============================================================
// CTA TEMPLATES
// ============================================================

function getCTAForTrigger(trigger: BookingCTATrigger): BookingCTA {
  const ctas: Record<BookingCTATrigger, BookingCTA> = {
    'action-limit': {
      id: 'cta_action_limit',
      type: 'modal',
      trigger,
      headline: 'You\'ve reached the demo limit',
      subheadline: 'Book a meeting to unlock unlimited access and see the full potential of PremiumRadar.',
      ctaText: 'Book a Meeting',
      ctaUrl: '/book-demo',
      dismissable: true,
    },
    'time-limit': {
      id: 'cta_time_limit',
      type: 'modal',
      trigger,
      headline: 'Your demo session has expired',
      subheadline: 'Want more time? Book a personalized demo with our team.',
      ctaText: 'Book a Meeting',
      ctaUrl: '/book-demo',
      dismissable: true,
    },
    'feature-locked': {
      id: 'cta_feature_locked',
      type: 'modal',
      trigger,
      headline: 'This feature is available in the full version',
      subheadline: 'Unlock all features including exports, bulk operations, and advanced analytics.',
      ctaText: 'Upgrade Now',
      ctaUrl: '/pricing',
      dismissable: true,
    },
    'export-attempt': {
      id: 'cta_export',
      type: 'modal',
      trigger,
      headline: 'Export is a Pro feature',
      subheadline: 'Export your data to CSV, Excel, or integrate with your CRM. Available in Pro and Enterprise plans.',
      ctaText: 'See Pricing',
      ctaUrl: '/pricing',
      dismissable: true,
    },
    manual: {
      id: 'cta_manual',
      type: 'banner',
      trigger,
      headline: 'Ready to see more?',
      subheadline: 'Book a demo to explore all features.',
      ctaText: 'Book Demo',
      ctaUrl: '/book-demo',
      dismissable: true,
    },
    'exit-intent': {
      id: 'cta_exit',
      type: 'modal',
      trigger,
      headline: 'Wait! Before you go...',
      subheadline: 'Get a personalized walkthrough and see how PremiumRadar can help your business.',
      ctaText: 'Book a Free Demo',
      ctaUrl: '/book-demo',
      dismissable: true,
    },
  };

  return ctas[trigger];
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Get locked feature info
 */
export function getLockedFeatureInfo(feature: LockedFeature): {
  label: string;
  description: string;
  icon: string;
  tier: 'Pro' | 'Enterprise';
} {
  const info: Record<LockedFeature, { label: string; description: string; icon: string; tier: 'Pro' | 'Enterprise' }> = {
    export: {
      label: 'Data Export',
      description: 'Export to CSV, Excel, JSON',
      icon: '📤',
      tier: 'Pro',
    },
    'bulk-operations': {
      label: 'Bulk Operations',
      description: 'Bulk analyze, compare, and manage domains',
      icon: '📦',
      tier: 'Pro',
    },
    integrations: {
      label: 'Integrations',
      description: 'Connect with CRM, Slack, Zapier',
      icon: '🔗',
      tier: 'Pro',
    },
    'api-access': {
      label: 'API Access',
      description: 'Full REST API access',
      icon: '🔌',
      tier: 'Pro',
    },
    'advanced-filters': {
      label: 'Advanced Filters',
      description: 'Complex filtering and saved searches',
      icon: '🔍',
      tier: 'Pro',
    },
    'custom-reports': {
      label: 'Custom Reports',
      description: 'Build and schedule custom reports',
      icon: '📊',
      tier: 'Enterprise',
    },
    'team-features': {
      label: 'Team Features',
      description: 'Collaboration, roles, permissions',
      icon: '👥',
      tier: 'Enterprise',
    },
    'white-label': {
      label: 'White Label',
      description: 'Custom branding and domains',
      icon: '🏷️',
      tier: 'Enterprise',
    },
  };

  return info[feature];
}

/**
 * Format remaining time
 */
export function formatRemainingTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}m`;
}

/**
 * Check if demo should auto-start
 */
export function shouldAutoStartDemo(): boolean {
  // Check if user is logged in (would be replaced with actual auth check)
  const isLoggedIn = false;
  return !isLoggedIn;
}
