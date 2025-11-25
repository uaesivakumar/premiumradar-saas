/**
 * Funnel Analytics Module
 *
 * Conversion funnel tracking and analysis.
 */

import { create } from 'zustand';
import type { FunnelData, FunnelStep, FunnelConfig, DateRange } from './types';

// ============================================================
// FUNNEL STORE
// ============================================================

interface FunnelState {
  funnels: Map<string, FunnelData>;
  activeFunnelId: string | null;
  loading: boolean;
  error: string | null;
}

interface FunnelStore extends FunnelState {
  // Funnel management
  createFunnel: (id: string, name: string, config: FunnelConfig) => void;
  updateFunnel: (id: string, data: Partial<FunnelData>) => void;
  deleteFunnel: (id: string) => void;
  setActiveFunnel: (id: string | null) => void;

  // Data loading
  loadFunnelData: (id: string, steps: FunnelStep[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFunnelStore = create<FunnelStore>((set, get) => ({
  funnels: new Map(),
  activeFunnelId: null,
  loading: false,
  error: null,

  createFunnel: (id, name, config) => {
    const funnel: FunnelData = {
      id,
      name,
      steps: config.steps.map((stepName, index) => ({
        id: `step_${index}`,
        name: stepName,
        count: 0,
        conversionRate: index === 0 ? 100 : 0,
        dropoffRate: 0,
      })),
      totalConversion: 0,
      dateRange: config.dateRange,
      totalUsers: 0,
    };

    set((state) => {
      const funnels = new Map(state.funnels);
      funnels.set(id, funnel);
      return { funnels, activeFunnelId: id };
    });
  },

  updateFunnel: (id, data) => {
    set((state) => {
      const funnels = new Map(state.funnels);
      const existing = funnels.get(id);
      if (existing) {
        funnels.set(id, { ...existing, ...data });
      }
      return { funnels };
    });
  },

  deleteFunnel: (id) => {
    set((state) => {
      const funnels = new Map(state.funnels);
      funnels.delete(id);
      return {
        funnels,
        activeFunnelId: state.activeFunnelId === id ? null : state.activeFunnelId,
      };
    });
  },

  setActiveFunnel: (id) => set({ activeFunnelId: id }),

  loadFunnelData: (id, steps) => {
    set((state) => {
      const funnels = new Map(state.funnels);
      const existing = funnels.get(id);
      if (existing) {
        const totalUsers = steps[0]?.count || 0;
        const totalConversion = totalUsers > 0
          ? ((steps[steps.length - 1]?.count || 0) / totalUsers) * 100
          : 0;
        funnels.set(id, { ...existing, steps, totalUsers, totalConversion });
      }
      return { funnels, loading: false };
    });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// ============================================================
// FUNNEL HELPERS
// ============================================================

/**
 * Calculate funnel from events
 */
export function calculateFunnel(
  events: { userId: string; step: string; timestamp: Date }[],
  steps: string[]
): FunnelStep[] {
  // Group events by user
  const userEvents = new Map<string, Map<string, Date>>();

  events.forEach((event) => {
    if (!userEvents.has(event.userId)) {
      userEvents.set(event.userId, new Map());
    }
    const userMap = userEvents.get(event.userId)!;

    // Keep earliest occurrence of each step
    if (!userMap.has(event.step) || event.timestamp < userMap.get(event.step)!) {
      userMap.set(event.step, event.timestamp);
    }
  });

  // Calculate completion for each step (in order)
  const stepCounts: number[] = [];
  const stepTimes: number[][] = [];

  steps.forEach((step, index) => {
    let count = 0;
    const times: number[] = [];

    userEvents.forEach((userMap, userId) => {
      // User must complete all previous steps in order
      let completedPrevious = true;
      let prevTimestamp: Date | null = null;

      for (let i = 0; i < index; i++) {
        const stepTime = userMap.get(steps[i]);
        if (!stepTime) {
          completedPrevious = false;
          break;
        }
        if (prevTimestamp && stepTime < prevTimestamp) {
          completedPrevious = false;
          break;
        }
        prevTimestamp = stepTime;
      }

      if (completedPrevious && userMap.has(step)) {
        const stepTime = userMap.get(step)!;
        if (!prevTimestamp || stepTime >= prevTimestamp) {
          count++;
          if (prevTimestamp) {
            times.push(stepTime.getTime() - prevTimestamp.getTime());
          }
        }
      }
    });

    stepCounts.push(count);
    stepTimes.push(times);
  });

  // Build funnel steps with conversion rates
  return steps.map((stepName, index) => {
    const count = stepCounts[index];
    const previousCount = index > 0 ? stepCounts[index - 1] : count;
    const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 100;
    const dropoffRate = 100 - conversionRate;
    const times = stepTimes[index];
    const averageTime = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : undefined;

    return {
      id: `step_${index}`,
      name: stepName,
      count,
      conversionRate: Math.round(conversionRate * 10) / 10,
      dropoffRate: Math.round(dropoffRate * 10) / 10,
      averageTime,
    };
  });
}

/**
 * Get funnel step color based on conversion rate
 */
export function getFunnelStepColor(conversionRate: number): string {
  if (conversionRate >= 80) return 'bg-green-500';
  if (conversionRate >= 60) return 'bg-green-400';
  if (conversionRate >= 40) return 'bg-yellow-400';
  if (conversionRate >= 20) return 'bg-orange-400';
  return 'bg-red-400';
}

/**
 * Calculate funnel width for visualization
 */
export function getFunnelStepWidth(
  stepIndex: number,
  steps: FunnelStep[]
): number {
  if (steps.length === 0) return 100;

  const firstCount = steps[0].count;
  if (firstCount === 0) return 100;

  const currentCount = steps[stepIndex].count;
  const widthPercent = (currentCount / firstCount) * 100;

  // Minimum width of 20% for visibility
  return Math.max(20, widthPercent);
}

/**
 * Format time duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

/**
 * Get funnel summary stats
 */
export function getFunnelSummary(funnel: FunnelData): {
  totalConversion: number;
  biggestDropoff: { step: string; rate: number } | null;
  averageConversion: number;
  bottleneck: string | null;
} {
  if (funnel.steps.length === 0) {
    return {
      totalConversion: 0,
      biggestDropoff: null,
      averageConversion: 0,
      bottleneck: null,
    };
  }

  // Find biggest dropoff
  let biggestDropoff: { step: string; rate: number } | null = null;
  let maxDropoff = 0;

  funnel.steps.forEach((step, index) => {
    if (index > 0 && step.dropoffRate > maxDropoff) {
      maxDropoff = step.dropoffRate;
      biggestDropoff = { step: step.name, rate: step.dropoffRate };
    }
  });

  // Calculate average conversion (excluding first step which is always 100%)
  const conversionRates = funnel.steps.slice(1).map((s) => s.conversionRate);
  const averageConversion = conversionRates.length > 0
    ? conversionRates.reduce((a, b) => a + b, 0) / conversionRates.length
    : 0;

  // Bottleneck is the step with lowest conversion rate
  const bottleneckStep = funnel.steps
    .slice(1)
    .reduce((min, step) =>
      step.conversionRate < min.conversionRate ? step : min
    );

  return {
    totalConversion: funnel.totalConversion,
    biggestDropoff,
    averageConversion: Math.round(averageConversion * 10) / 10,
    bottleneck: bottleneckStep?.name || null,
  };
}

/**
 * Compare two funnels
 */
export function compareFunnels(
  funnelA: FunnelData,
  funnelB: FunnelData
): {
  stepComparisons: Array<{
    step: string;
    aConversion: number;
    bConversion: number;
    difference: number;
    winner: 'A' | 'B' | 'tie';
  }>;
  overallWinner: 'A' | 'B' | 'tie';
  improvementPercent: number;
} {
  const stepComparisons: Array<{
    step: string;
    aConversion: number;
    bConversion: number;
    difference: number;
    winner: 'A' | 'B' | 'tie';
  }> = [];

  const minSteps = Math.min(funnelA.steps.length, funnelB.steps.length);

  for (let i = 0; i < minSteps; i++) {
    const stepA = funnelA.steps[i];
    const stepB = funnelB.steps[i];
    const difference = stepA.conversionRate - stepB.conversionRate;

    stepComparisons.push({
      step: stepA.name,
      aConversion: stepA.conversionRate,
      bConversion: stepB.conversionRate,
      difference: Math.round(difference * 10) / 10,
      winner: difference > 1 ? 'A' : difference < -1 ? 'B' : 'tie',
    });
  }

  const totalDiff = funnelA.totalConversion - funnelB.totalConversion;
  const overallWinner: 'A' | 'B' | 'tie' =
    totalDiff > 1 ? 'A' : totalDiff < -1 ? 'B' : 'tie';

  const improvementPercent = funnelB.totalConversion > 0
    ? ((funnelA.totalConversion - funnelB.totalConversion) / funnelB.totalConversion) * 100
    : 0;

  return {
    stepComparisons,
    overallWinner,
    improvementPercent: Math.round(improvementPercent * 10) / 10,
  };
}

/**
 * Predefined funnel templates
 */
export const FUNNEL_TEMPLATES = {
  signup: {
    name: 'User Signup',
    steps: ['Visit Landing', 'Click Signup', 'Enter Email', 'Verify Email', 'Complete Profile'],
  },
  purchase: {
    name: 'Purchase Flow',
    steps: ['View Domain', 'Add to Cart', 'Start Checkout', 'Enter Payment', 'Complete Purchase'],
  },
  onboarding: {
    name: 'User Onboarding',
    steps: ['Create Account', 'Add First Domain', 'Run First Analysis', 'Export Report'],
  },
  outreach: {
    name: 'Outreach Campaign',
    steps: ['Select Domain', 'Find Owner', 'Compose Message', 'Send Message', 'Get Response'],
  },
};

/**
 * Export funnel data to CSV
 */
export function exportFunnelToCSV(funnel: FunnelData): string {
  const headers = ['Step', 'Users', 'Conversion Rate', 'Dropoff Rate', 'Avg Time'];

  const rows = funnel.steps.map((step) => [
    step.name,
    step.count.toString(),
    `${step.conversionRate}%`,
    `${step.dropoffRate}%`,
    step.averageTime ? formatDuration(step.averageTime) : '-',
  ]);

  // Add summary row
  rows.push([
    'Total',
    funnel.totalUsers.toString(),
    `${Math.round(funnel.totalConversion * 10) / 10}%`,
    '-',
    '-',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
