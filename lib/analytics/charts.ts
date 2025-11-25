/**
 * Charts Module
 *
 * Mixpanel/PostHog-style chart generation and configuration.
 */

import { create } from 'zustand';
import type {
  ChartType,
  ChartConfig,
  ChartSeries,
  ChartDataPoint,
  TimeGranularity,
  DateRange,
  ChartAnnotation,
} from './types';

// ============================================================
// CHART STORE
// ============================================================

interface ChartState {
  charts: Map<string, { config: ChartConfig; series: ChartSeries[] }>;
  activeChartId: string | null;
  loading: boolean;
  error: string | null;
}

interface ChartStore extends ChartState {
  // Chart management
  createChart: (id: string, config: ChartConfig) => void;
  updateChart: (id: string, config: Partial<ChartConfig>) => void;
  deleteChart: (id: string) => void;
  setActiveChart: (id: string | null) => void;

  // Series management
  addSeries: (chartId: string, series: ChartSeries) => void;
  updateSeries: (chartId: string, seriesId: string, data: ChartDataPoint[]) => void;
  removeSeries: (chartId: string, seriesId: string) => void;
  toggleSeriesVisibility: (chartId: string, seriesId: string) => void;

  // Data loading
  loadChartData: (chartId: string, data: ChartSeries[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChartStore = create<ChartStore>((set, get) => ({
  charts: new Map(),
  activeChartId: null,
  loading: false,
  error: null,

  createChart: (id, config) => {
    set((state) => {
      const charts = new Map(state.charts);
      charts.set(id, { config, series: [] });
      return { charts, activeChartId: id };
    });
  },

  updateChart: (id, config) => {
    set((state) => {
      const charts = new Map(state.charts);
      const existing = charts.get(id);
      if (existing) {
        charts.set(id, { ...existing, config: { ...existing.config, ...config } });
      }
      return { charts };
    });
  },

  deleteChart: (id) => {
    set((state) => {
      const charts = new Map(state.charts);
      charts.delete(id);
      return {
        charts,
        activeChartId: state.activeChartId === id ? null : state.activeChartId,
      };
    });
  },

  setActiveChart: (id) => {
    set({ activeChartId: id });
  },

  addSeries: (chartId, series) => {
    set((state) => {
      const charts = new Map(state.charts);
      const chart = charts.get(chartId);
      if (chart) {
        charts.set(chartId, { ...chart, series: [...chart.series, series] });
      }
      return { charts };
    });
  },

  updateSeries: (chartId, seriesId, data) => {
    set((state) => {
      const charts = new Map(state.charts);
      const chart = charts.get(chartId);
      if (chart) {
        const series = chart.series.map((s) =>
          s.id === seriesId ? { ...s, data } : s
        );
        charts.set(chartId, { ...chart, series });
      }
      return { charts };
    });
  },

  removeSeries: (chartId, seriesId) => {
    set((state) => {
      const charts = new Map(state.charts);
      const chart = charts.get(chartId);
      if (chart) {
        const series = chart.series.filter((s) => s.id !== seriesId);
        charts.set(chartId, { ...chart, series });
      }
      return { charts };
    });
  },

  toggleSeriesVisibility: (chartId, seriesId) => {
    set((state) => {
      const charts = new Map(state.charts);
      const chart = charts.get(chartId);
      if (chart) {
        const series = chart.series.map((s) =>
          s.id === seriesId ? { ...s, visible: !s.visible } : s
        );
        charts.set(chartId, { ...chart, series });
      }
      return { charts };
    });
  },

  loadChartData: (chartId, data) => {
    set((state) => {
      const charts = new Map(state.charts);
      const chart = charts.get(chartId);
      if (chart) {
        charts.set(chartId, { ...chart, series: data });
      }
      return { charts, loading: false };
    });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// ============================================================
// CHART HELPERS
// ============================================================

/**
 * Default chart colors (accessible palette)
 */
export const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

/**
 * Get date range boundaries
 */
export function getDateRangeBoundaries(dateRange: DateRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (dateRange) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '14d':
      start.setDate(end.getDate() - 14);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2020, 0, 1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return { start, end };
}

/**
 * Get appropriate granularity for date range
 */
export function getDefaultGranularity(dateRange: DateRange): TimeGranularity {
  switch (dateRange) {
    case '7d':
      return 'hour';
    case '14d':
    case '30d':
      return 'day';
    case '90d':
      return 'week';
    case '1y':
    case 'all':
      return 'month';
    default:
      return 'day';
  }
}

/**
 * Format timestamp for display based on granularity
 */
export function formatTimestamp(date: Date, granularity: TimeGranularity): string {
  const options: Intl.DateTimeFormatOptions = {};

  switch (granularity) {
    case 'hour':
      options.hour = 'numeric';
      options.minute = '2-digit';
      break;
    case 'day':
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'week':
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'month':
      options.month = 'short';
      options.year = 'numeric';
      break;
    case 'quarter':
      return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
    case 'year':
      options.year = 'numeric';
      break;
  }

  return date.toLocaleDateString('en-US', options);
}

/**
 * Generate time buckets for date range
 */
export function generateTimeBuckets(
  start: Date,
  end: Date,
  granularity: TimeGranularity
): Date[] {
  const buckets: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    buckets.push(new Date(current));

    switch (granularity) {
      case 'hour':
        current.setHours(current.getHours() + 1);
        break;
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'quarter':
        current.setMonth(current.getMonth() + 3);
        break;
      case 'year':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return buckets;
}

/**
 * Calculate chart statistics
 */
export function calculateSeriesStats(data: ChartDataPoint[]): {
  min: number;
  max: number;
  avg: number;
  sum: number;
  count: number;
  latest: number;
  change: number;
  changePercent: number;
} {
  if (data.length === 0) {
    return { min: 0, max: 0, avg: 0, sum: 0, count: 0, latest: 0, change: 0, changePercent: 0 };
  }

  const values = data.map((d) => d.value);
  const sum = values.reduce((a, b) => a + b, 0);
  const latest = values[values.length - 1];
  const previous = values.length > 1 ? values[values.length - 2] : latest;
  const change = latest - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    sum,
    count: values.length,
    latest,
    change,
    changePercent,
  };
}

/**
 * Create default chart config
 */
export function createChartConfig(
  type: ChartType,
  title: string,
  dateRange: DateRange = '30d'
): ChartConfig {
  return {
    type,
    title,
    granularity: getDefaultGranularity(dateRange),
    dateRange,
    showLegend: true,
    showTooltip: true,
    showGrid: true,
    stacked: type === 'stacked',
    normalized: false,
    annotations: [],
  };
}

/**
 * Create a series with generated color
 */
export function createSeries(
  id: string,
  name: string,
  data: ChartDataPoint[],
  colorIndex = 0
): ChartSeries {
  return {
    id,
    name,
    color: CHART_COLORS[colorIndex % CHART_COLORS.length],
    data,
    visible: true,
  };
}

/**
 * Normalize series data to percentages (for stacked charts)
 */
export function normalizeSeriesData(series: ChartSeries[]): ChartSeries[] {
  if (series.length === 0) return series;

  // Get all unique timestamps
  const timestamps = new Set<number>();
  series.forEach((s) => s.data.forEach((d) => timestamps.add(d.timestamp.getTime())));

  // Calculate totals per timestamp
  const totals = new Map<number, number>();
  timestamps.forEach((ts) => {
    let total = 0;
    series.forEach((s) => {
      const point = s.data.find((d) => d.timestamp.getTime() === ts);
      if (point) total += point.value;
    });
    totals.set(ts, total);
  });

  // Normalize each series
  return series.map((s) => ({
    ...s,
    data: s.data.map((d) => {
      const total = totals.get(d.timestamp.getTime()) || 1;
      return { ...d, value: (d.value / total) * 100 };
    }),
  }));
}

/**
 * Add annotation to chart
 */
export function createAnnotation(
  type: ChartAnnotation['type'],
  label: string,
  timestamp?: Date,
  range?: { start: Date; end: Date }
): ChartAnnotation {
  return {
    type,
    label,
    timestamp,
    range,
    color: '#EF4444',
  };
}

/**
 * Export chart data to CSV
 */
export function exportChartToCSV(config: ChartConfig, series: ChartSeries[]): string {
  const headers = ['Timestamp', ...series.map((s) => s.name)];
  const rows: string[][] = [];

  // Get all unique timestamps
  const timestamps = new Set<number>();
  series.forEach((s) => s.data.forEach((d) => timestamps.add(d.timestamp.getTime())));

  // Sort timestamps
  const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);

  // Create rows
  sortedTimestamps.forEach((ts) => {
    const date = new Date(ts);
    const row = [formatTimestamp(date, config.granularity)];

    series.forEach((s) => {
      const point = s.data.find((d) => d.timestamp.getTime() === ts);
      row.push(point ? point.value.toString() : '0');
    });

    rows.push(row);
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
