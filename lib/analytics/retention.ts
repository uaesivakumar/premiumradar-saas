/**
 * Retention Metrics Module
 *
 * Cohort-based retention analysis and visualization.
 */

import { create } from 'zustand';
import type { RetentionCohort, RetentionData, RetentionConfig, DateRange } from './types';

// ============================================================
// RETENTION STORE
// ============================================================

interface RetentionState {
  data: RetentionData | null;
  config: RetentionConfig;
  loading: boolean;
  error: string | null;
}

interface RetentionStore extends RetentionState {
  // Data management
  loadRetentionData: (data: RetentionData) => void;
  clearData: () => void;

  // Config
  updateConfig: (config: Partial<RetentionConfig>) => void;
  setPeriodType: (type: 'day' | 'week' | 'month') => void;
  setPeriods: (periods: number) => void;

  // Loading state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRetentionStore = create<RetentionStore>((set) => ({
  data: null,
  config: {
    periodType: 'week',
    periods: 8,
    showPercentages: true,
    colorScale: 'green',
  },
  loading: false,
  error: null,

  loadRetentionData: (data) => set({ data, loading: false, error: null }),
  clearData: () => set({ data: null }),

  updateConfig: (config) =>
    set((state) => ({ config: { ...state.config, ...config } })),

  setPeriodType: (periodType) =>
    set((state) => ({ config: { ...state.config, periodType } })),

  setPeriods: (periods) =>
    set((state) => ({ config: { ...state.config, periods } })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// ============================================================
// RETENTION HELPERS
// ============================================================

/**
 * Calculate retention data from user events
 */
export function calculateRetention(
  events: { userId: string; timestamp: Date }[],
  config: RetentionConfig
): RetentionData {
  const { periodType, periods } = config;

  // Group users by cohort (first event date)
  const userFirstSeen = new Map<string, Date>();
  events.forEach((event) => {
    const existing = userFirstSeen.get(event.userId);
    if (!existing || event.timestamp < existing) {
      userFirstSeen.set(event.userId, event.timestamp);
    }
  });

  // Group users into cohorts
  const cohortUsers = new Map<string, Set<string>>();
  userFirstSeen.forEach((date, userId) => {
    const cohortKey = getCohortKey(date, periodType);
    if (!cohortUsers.has(cohortKey)) {
      cohortUsers.set(cohortKey, new Set());
    }
    cohortUsers.get(cohortKey)!.add(userId);
  });

  // Calculate retention for each cohort
  const cohorts: RetentionCohort[] = [];
  const sortedCohortKeys = Array.from(cohortUsers.keys()).sort();

  // Limit to most recent cohorts that can have full retention data
  const maxCohorts = Math.min(sortedCohortKeys.length, 12);
  const recentCohortKeys = sortedCohortKeys.slice(-maxCohorts);

  recentCohortKeys.forEach((cohortKey) => {
    const users = cohortUsers.get(cohortKey)!;
    const cohortDate = parseCohortKey(cohortKey);
    const retentionByPeriod: number[] = [];

    for (let p = 0; p <= periods; p++) {
      const periodStart = addPeriods(cohortDate, p, periodType);
      const periodEnd = addPeriods(cohortDate, p + 1, periodType);

      const activeUsers = new Set<string>();
      events.forEach((event) => {
        if (
          users.has(event.userId) &&
          event.timestamp >= periodStart &&
          event.timestamp < periodEnd
        ) {
          activeUsers.add(event.userId);
        }
      });

      const retention = users.size > 0 ? (activeUsers.size / users.size) * 100 : 0;
      retentionByPeriod.push(Math.round(retention * 10) / 10);
    }

    cohorts.push({
      cohortDate,
      cohortSize: users.size,
      retentionByPeriod,
      label: formatCohortLabel(cohortDate, periodType),
    });
  });

  // Calculate averages and medians
  const averageRetention = calculateAverageRetention(cohorts, periods);
  const medianRetention = calculateMedianRetention(cohorts, periods);

  return {
    cohorts,
    periodType,
    periods,
    averageRetention,
    medianRetention,
  };
}

/**
 * Get cohort key from date
 */
function getCohortKey(date: Date, periodType: 'day' | 'week' | 'month'): string {
  const d = new Date(date);

  switch (periodType) {
    case 'day':
      return d.toISOString().split('T')[0];
    case 'week':
      // Start of week (Sunday)
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split('T')[0];
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}

/**
 * Parse cohort key back to date
 */
function parseCohortKey(key: string): Date {
  if (key.length === 7) {
    // Month format: YYYY-MM
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }
  return new Date(key);
}

/**
 * Add periods to date
 */
function addPeriods(
  date: Date,
  periods: number,
  periodType: 'day' | 'week' | 'month'
): Date {
  const result = new Date(date);

  switch (periodType) {
    case 'day':
      result.setDate(result.getDate() + periods);
      break;
    case 'week':
      result.setDate(result.getDate() + periods * 7);
      break;
    case 'month':
      result.setMonth(result.getMonth() + periods);
      break;
  }

  return result;
}

/**
 * Format cohort label
 */
function formatCohortLabel(date: Date, periodType: 'day' | 'week' | 'month'): string {
  switch (periodType) {
    case 'day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'week':
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    case 'month':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

/**
 * Calculate average retention across cohorts
 */
function calculateAverageRetention(
  cohorts: RetentionCohort[],
  periods: number
): number[] {
  const averages: number[] = [];

  for (let p = 0; p <= periods; p++) {
    const values = cohorts
      .filter((c) => c.retentionByPeriod.length > p)
      .map((c) => c.retentionByPeriod[p]);

    if (values.length === 0) {
      averages.push(0);
    } else {
      averages.push(
        Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      );
    }
  }

  return averages;
}

/**
 * Calculate median retention across cohorts
 */
function calculateMedianRetention(
  cohorts: RetentionCohort[],
  periods: number
): number[] {
  const medians: number[] = [];

  for (let p = 0; p <= periods; p++) {
    const values = cohorts
      .filter((c) => c.retentionByPeriod.length > p)
      .map((c) => c.retentionByPeriod[p])
      .sort((a, b) => a - b);

    if (values.length === 0) {
      medians.push(0);
    } else {
      const mid = Math.floor(values.length / 2);
      medians.push(
        values.length % 2 !== 0
          ? values[mid]
          : (values[mid - 1] + values[mid]) / 2
      );
    }
  }

  return medians;
}

/**
 * Get retention cell color based on value
 */
export function getRetentionColor(
  value: number,
  colorScale: 'green' | 'blue' | 'purple' = 'green'
): string {
  const scales = {
    green: [
      { threshold: 80, bg: 'bg-green-600', text: 'text-white' },
      { threshold: 60, bg: 'bg-green-500', text: 'text-white' },
      { threshold: 40, bg: 'bg-green-400', text: 'text-white' },
      { threshold: 20, bg: 'bg-green-300', text: 'text-green-900' },
      { threshold: 10, bg: 'bg-green-200', text: 'text-green-900' },
      { threshold: 0, bg: 'bg-green-100', text: 'text-green-800' },
    ],
    blue: [
      { threshold: 80, bg: 'bg-blue-600', text: 'text-white' },
      { threshold: 60, bg: 'bg-blue-500', text: 'text-white' },
      { threshold: 40, bg: 'bg-blue-400', text: 'text-white' },
      { threshold: 20, bg: 'bg-blue-300', text: 'text-blue-900' },
      { threshold: 10, bg: 'bg-blue-200', text: 'text-blue-900' },
      { threshold: 0, bg: 'bg-blue-100', text: 'text-blue-800' },
    ],
    purple: [
      { threshold: 80, bg: 'bg-purple-600', text: 'text-white' },
      { threshold: 60, bg: 'bg-purple-500', text: 'text-white' },
      { threshold: 40, bg: 'bg-purple-400', text: 'text-white' },
      { threshold: 20, bg: 'bg-purple-300', text: 'text-purple-900' },
      { threshold: 10, bg: 'bg-purple-200', text: 'text-purple-900' },
      { threshold: 0, bg: 'bg-purple-100', text: 'text-purple-800' },
    ],
  };

  const scale = scales[colorScale];
  for (const level of scale) {
    if (value >= level.threshold) {
      return `${level.bg} ${level.text}`;
    }
  }

  return 'bg-gray-100 text-gray-500';
}

/**
 * Format period label
 */
export function formatPeriodLabel(
  period: number,
  periodType: 'day' | 'week' | 'month'
): string {
  if (period === 0) return 'Initial';

  const labels = {
    day: period === 1 ? 'Day 1' : `Day ${period}`,
    week: period === 1 ? 'Week 1' : `Week ${period}`,
    month: period === 1 ? 'Month 1' : `Month ${period}`,
  };

  return labels[periodType];
}

/**
 * Get retention summary stats
 */
export function getRetentionSummary(data: RetentionData): {
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  avgCohortSize: number;
  trend: 'improving' | 'declining' | 'stable';
} {
  const avg = data.averageRetention;

  // Map periods to approximate day equivalents
  let day1 = 0,
    day7 = 0,
    day30 = 0;

  if (data.periodType === 'day') {
    day1 = avg[1] || 0;
    day7 = avg[7] || 0;
    day30 = avg[Math.min(30, avg.length - 1)] || 0;
  } else if (data.periodType === 'week') {
    day1 = avg[1] || 0; // Week 1
    day7 = avg[1] || 0; // ~Week 1
    day30 = avg[4] || 0; // ~Week 4
  } else {
    day1 = avg[1] || 0; // Month 1
    day7 = avg[1] || 0;
    day30 = avg[1] || 0;
  }

  const avgCohortSize = Math.round(
    data.cohorts.reduce((sum, c) => sum + c.cohortSize, 0) / data.cohorts.length
  );

  // Determine trend by comparing recent vs older cohorts
  const recentCohorts = data.cohorts.slice(-3);
  const olderCohorts = data.cohorts.slice(0, 3);

  const recentAvg =
    recentCohorts.reduce((sum, c) => sum + (c.retentionByPeriod[1] || 0), 0) /
    recentCohorts.length;
  const olderAvg =
    olderCohorts.reduce((sum, c) => sum + (c.retentionByPeriod[1] || 0), 0) /
    olderCohorts.length;

  const diff = recentAvg - olderAvg;
  const trend: 'improving' | 'declining' | 'stable' =
    diff > 5 ? 'improving' : diff < -5 ? 'declining' : 'stable';

  return { day1Retention: day1, day7Retention: day7, day30Retention: day30, avgCohortSize, trend };
}

/**
 * Export retention data to CSV
 */
export function exportRetentionToCSV(data: RetentionData): string {
  const headers = [
    'Cohort',
    'Size',
    ...Array.from({ length: data.periods + 1 }, (_, i) =>
      formatPeriodLabel(i, data.periodType)
    ),
  ];

  const rows = data.cohorts.map((cohort) => [
    cohort.label || formatCohortLabel(cohort.cohortDate, data.periodType),
    cohort.cohortSize.toString(),
    ...cohort.retentionByPeriod.map((v) => `${v}%`),
  ]);

  // Add average row
  rows.push([
    'Average',
    '-',
    ...data.averageRetention.map((v) => `${v}%`),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
