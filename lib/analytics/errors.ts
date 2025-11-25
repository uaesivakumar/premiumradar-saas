/**
 * Error Events Module
 *
 * Error tracking, grouping, and analysis.
 */

import { create } from 'zustand';
import type {
  ErrorEvent,
  ErrorGroup,
  ErrorMetrics,
  ErrorSeverity,
  ErrorCategory,
  DateRange,
} from './types';

// ============================================================
// ERROR STORE
// ============================================================

interface ErrorState {
  events: ErrorEvent[];
  groups: Map<string, ErrorGroup>;
  metrics: ErrorMetrics | null;
  dateRange: DateRange;
  loading: boolean;
  error: string | null;
}

interface ErrorStore extends ErrorState {
  // Error tracking
  trackError: (error: Omit<ErrorEvent, 'id' | 'timestamp' | 'fingerprint' | 'count'>) => void;
  loadEvents: (events: ErrorEvent[]) => void;
  clearEvents: () => void;

  // Group management
  updateGroupStatus: (fingerprint: string, status: ErrorGroup['status']) => void;
  assignGroup: (fingerprint: string, assignee: string) => void;
  ignoreGroup: (fingerprint: string) => void;

  // Analysis
  calculateMetrics: () => void;
  groupErrors: () => void;

  // Filters
  setDateRange: (range: DateRange) => void;
  getEventsBySeverity: (severity: ErrorSeverity) => ErrorEvent[];
  getEventsByCategory: (category: ErrorCategory) => ErrorEvent[];

  // Loading state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useErrorStore = create<ErrorStore>((set, get) => ({
  events: [],
  groups: new Map(),
  metrics: null,
  dateRange: '30d',
  loading: false,
  error: null,

  trackError: (error) => {
    const fingerprint = generateFingerprint(error.message, error.stack);
    const newEvent: ErrorEvent = {
      ...error,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      fingerprint,
      count: 1,
    };

    set((state) => ({
      events: [...state.events, newEvent],
    }));

    // Recalculate groups and metrics
    get().groupErrors();
    get().calculateMetrics();
  },

  loadEvents: (events) => {
    set({ events, loading: false });
    get().groupErrors();
    get().calculateMetrics();
  },

  clearEvents: () => {
    set({ events: [], groups: new Map(), metrics: null });
  },

  updateGroupStatus: (fingerprint, status) => {
    set((state) => {
      const groups = new Map(state.groups);
      const group = groups.get(fingerprint);
      if (group) {
        groups.set(fingerprint, { ...group, status });
      }
      return { groups };
    });
  },

  assignGroup: (fingerprint, assignee) => {
    set((state) => {
      const groups = new Map(state.groups);
      const group = groups.get(fingerprint);
      if (group) {
        groups.set(fingerprint, { ...group, assignee, status: 'investigating' });
      }
      return { groups };
    });
  },

  ignoreGroup: (fingerprint) => {
    set((state) => {
      const groups = new Map(state.groups);
      const group = groups.get(fingerprint);
      if (group) {
        groups.set(fingerprint, { ...group, status: 'ignored' });
      }
      return { groups };
    });
  },

  calculateMetrics: () => {
    const { events, groups } = get();

    const errorsBySeverity: Record<ErrorSeverity, number> = {
      critical: 0,
      error: 0,
      warning: 0,
      info: 0,
    };

    const errorsByCategory: Record<ErrorCategory, number> = {
      api: 0,
      validation: 0,
      auth: 0,
      network: 0,
      ui: 0,
      unknown: 0,
    };

    events.forEach((event) => {
      errorsBySeverity[event.severity]++;
      errorsByCategory[event.category]++;
    });

    // Calculate error rate (per 1000 sessions - estimated)
    const estimatedSessions = Math.max(events.length * 10, 1000);
    const errorRate = (events.length / estimatedSessions) * 1000;

    // Calculate trend
    const midpoint = Math.floor(events.length / 2);
    const olderCount = events.slice(0, midpoint).length;
    const recentCount = events.slice(midpoint).length;
    const trend: 'up' | 'down' | 'stable' =
      recentCount > olderCount * 1.1 ? 'up' : recentCount < olderCount * 0.9 ? 'down' : 'stable';

    // Get top errors
    const topErrors = Array.from(groups.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    set({
      metrics: {
        totalErrors: events.length,
        errorsBySeverity,
        errorsByCategory,
        errorRate: Math.round(errorRate * 10) / 10,
        trend,
        topErrors,
      },
    });
  },

  groupErrors: () => {
    const { events } = get();
    const groups = new Map<string, ErrorGroup>();

    events.forEach((event) => {
      const existing = groups.get(event.fingerprint);
      if (existing) {
        const affectedUsers = new Set(existing.events.map((e) => e.userId).filter(Boolean));
        if (event.userId) affectedUsers.add(event.userId);

        groups.set(event.fingerprint, {
          ...existing,
          count: existing.count + 1,
          lastSeen: event.timestamp > existing.lastSeen ? event.timestamp : existing.lastSeen,
          affectedUsers: affectedUsers.size,
          events: [...existing.events, event],
        });
      } else {
        groups.set(event.fingerprint, {
          fingerprint: event.fingerprint,
          message: event.message,
          severity: event.severity,
          category: event.category,
          count: 1,
          firstSeen: event.timestamp,
          lastSeen: event.timestamp,
          affectedUsers: event.userId ? 1 : 0,
          status: 'new',
          events: [event],
        });
      }
    });

    set({ groups });
  },

  setDateRange: (dateRange) => set({ dateRange }),

  getEventsBySeverity: (severity) => {
    return get().events.filter((e) => e.severity === severity);
  },

  getEventsByCategory: (category) => {
    return get().events.filter((e) => e.category === category);
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// ============================================================
// ERROR HELPERS
// ============================================================

/**
 * Generate fingerprint for error grouping
 */
function generateFingerprint(message: string, stack?: string): string {
  // Normalize message (remove numbers, specific IDs, etc.)
  const normalizedMessage = message
    .replace(/\b\d+\b/g, 'N') // Replace numbers
    .replace(/[a-f0-9]{8,}/gi, 'ID') // Replace hex IDs
    .replace(/"[^"]+"/g, '"..."') // Replace quoted strings
    .trim();

  // Get first meaningful stack frame
  let stackFrame = '';
  if (stack) {
    const lines = stack.split('\n');
    const firstFrame = lines.find((line) =>
      line.includes('at ') && !line.includes('node_modules')
    );
    if (firstFrame) {
      stackFrame = firstFrame
        .replace(/:\d+:\d+/g, ':L:C') // Normalize line/column
        .trim();
    }
  }

  // Create fingerprint
  const input = `${normalizedMessage}::${stackFrame}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `fp_${Math.abs(hash).toString(16)}`;
}

/**
 * Get severity display info
 */
export function getSeverityInfo(severity: ErrorSeverity): {
  label: string;
  color: string;
  icon: string;
  bgColor: string;
} {
  const info: Record<ErrorSeverity, { label: string; color: string; icon: string; bgColor: string }> = {
    critical: { label: 'Critical', color: 'red', icon: '🔴', bgColor: 'bg-red-100 text-red-800' },
    error: { label: 'Error', color: 'orange', icon: '🟠', bgColor: 'bg-orange-100 text-orange-800' },
    warning: { label: 'Warning', color: 'yellow', icon: '🟡', bgColor: 'bg-yellow-100 text-yellow-800' },
    info: { label: 'Info', color: 'blue', icon: '🔵', bgColor: 'bg-blue-100 text-blue-800' },
  };
  return info[severity];
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: ErrorCategory): {
  label: string;
  icon: string;
  description: string;
} {
  const info: Record<ErrorCategory, { label: string; icon: string; description: string }> = {
    api: { label: 'API', icon: '🔌', description: 'API request/response errors' },
    validation: { label: 'Validation', icon: '✓', description: 'Input validation failures' },
    auth: { label: 'Auth', icon: '🔐', description: 'Authentication/authorization errors' },
    network: { label: 'Network', icon: '🌐', description: 'Network connectivity issues' },
    ui: { label: 'UI', icon: '🖥️', description: 'User interface errors' },
    unknown: { label: 'Unknown', icon: '❓', description: 'Uncategorized errors' },
  };
  return info[category];
}

/**
 * Get status display info
 */
export function getStatusInfo(status: ErrorGroup['status']): {
  label: string;
  color: string;
  icon: string;
} {
  const info: Record<ErrorGroup['status'], { label: string; color: string; icon: string }> = {
    new: { label: 'New', color: 'blue', icon: '🆕' },
    investigating: { label: 'Investigating', color: 'yellow', icon: '🔍' },
    resolved: { label: 'Resolved', color: 'green', icon: '✅' },
    ignored: { label: 'Ignored', color: 'gray', icon: '🚫' },
  };
  return info[status];
}

/**
 * Calculate error rate change
 */
export function calculateErrorRateChange(
  current: number,
  previous: number
): { change: number; direction: 'up' | 'down' | 'stable' } {
  if (previous === 0) {
    return { change: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'stable' };
  }

  const change = ((current - previous) / previous) * 100;
  const direction: 'up' | 'down' | 'stable' =
    change > 5 ? 'up' : change < -5 ? 'down' : 'stable';

  return { change: Math.round(change * 10) / 10, direction };
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Get error impact score
 */
export function calculateImpactScore(group: ErrorGroup): number {
  const severityWeights: Record<ErrorSeverity, number> = {
    critical: 100,
    error: 50,
    warning: 20,
    info: 5,
  };

  const severityScore = severityWeights[group.severity];
  const countScore = Math.min(group.count * 2, 100);
  const userScore = Math.min(group.affectedUsers * 5, 100);
  const recencyScore = isRecent(group.lastSeen) ? 50 : 0;

  return Math.min(
    Math.round((severityScore + countScore + userScore + recencyScore) / 4),
    100
  );
}

function isRecent(date: Date): boolean {
  const hourAgo = new Date();
  hourAgo.setHours(hourAgo.getHours() - 1);
  return date > hourAgo;
}

/**
 * Suggest error category based on message
 */
export function suggestCategory(message: string, stack?: string): ErrorCategory {
  const lowerMessage = message.toLowerCase();
  const lowerStack = (stack || '').toLowerCase();

  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden') ||
      lowerMessage.includes('authentication') || lowerMessage.includes('auth')) {
    return 'auth';
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('timeout') ||
      lowerMessage.includes('connection') || lowerMessage.includes('econnrefused')) {
    return 'network';
  }

  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') ||
      lowerMessage.includes('required') || lowerMessage.includes('must be')) {
    return 'validation';
  }

  if (lowerMessage.includes('api') || lowerMessage.includes('endpoint') ||
      lowerMessage.includes('request') || lowerMessage.includes('response') ||
      lowerStack.includes('fetch') || lowerStack.includes('axios')) {
    return 'api';
  }

  if (lowerStack.includes('react') || lowerStack.includes('component') ||
      lowerMessage.includes('render') || lowerMessage.includes('dom')) {
    return 'ui';
  }

  return 'unknown';
}

/**
 * Export errors to CSV
 */
export function exportErrorsToCSV(events: ErrorEvent[]): string {
  const headers = [
    'Timestamp',
    'Severity',
    'Category',
    'Message',
    'User ID',
    'Page URL',
    'Fingerprint',
  ];

  const rows = events.map((e) => [
    e.timestamp.toISOString(),
    e.severity,
    e.category,
    `"${e.message.replace(/"/g, '""')}"`,
    e.userId || '-',
    e.pageUrl || '-',
    e.fingerprint,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
