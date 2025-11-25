/**
 * Heatmaps Module
 *
 * Click, scroll, and attention heatmap tracking and visualization.
 */

import { create } from 'zustand';
import type { HeatmapData, HeatmapPoint, HeatmapConfig, HeatmapType, DateRange } from './types';

// ============================================================
// HEATMAP STORE
// ============================================================

interface HeatmapState {
  heatmaps: Map<string, HeatmapData>;
  activeHeatmapId: string | null;
  config: HeatmapConfig;
  recording: boolean;
  loading: boolean;
  error: string | null;
}

interface HeatmapStore extends HeatmapState {
  // Heatmap management
  createHeatmap: (pageUrl: string, type: HeatmapType) => string;
  loadHeatmap: (id: string, data: HeatmapData) => void;
  deleteHeatmap: (id: string) => void;
  setActiveHeatmap: (id: string | null) => void;

  // Recording
  startRecording: () => void;
  stopRecording: () => void;
  recordPoint: (heatmapId: string, point: Omit<HeatmapPoint, 'value'>) => void;

  // Config
  updateConfig: (config: Partial<HeatmapConfig>) => void;
  setOpacity: (opacity: number) => void;
  setRadius: (radius: number) => void;

  // Loading state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useHeatmapStore = create<HeatmapStore>((set, get) => ({
  heatmaps: new Map(),
  activeHeatmapId: null,
  config: {
    type: 'click',
    opacity: 0.6,
    radius: 30,
    colorScale: ['#0000FF', '#00FF00', '#FFFF00', '#FF0000'],
  },
  recording: false,
  loading: false,
  error: null,

  createHeatmap: (pageUrl, type) => {
    const id = `hm_${Date.now()}`;
    const heatmap: HeatmapData = {
      type,
      pageUrl,
      points: [],
      totalInteractions: 0,
      sessionCount: 0,
      dateRange: '7d',
      viewport: { width: 1920, height: 1080 },
    };

    set((state) => {
      const heatmaps = new Map(state.heatmaps);
      heatmaps.set(id, heatmap);
      return { heatmaps, activeHeatmapId: id };
    });

    return id;
  },

  loadHeatmap: (id, data) => {
    set((state) => {
      const heatmaps = new Map(state.heatmaps);
      heatmaps.set(id, data);
      return { heatmaps, loading: false };
    });
  },

  deleteHeatmap: (id) => {
    set((state) => {
      const heatmaps = new Map(state.heatmaps);
      heatmaps.delete(id);
      return {
        heatmaps,
        activeHeatmapId: state.activeHeatmapId === id ? null : state.activeHeatmapId,
      };
    });
  },

  setActiveHeatmap: (id) => set({ activeHeatmapId: id }),

  startRecording: () => set({ recording: true }),
  stopRecording: () => set({ recording: false }),

  recordPoint: (heatmapId, point) => {
    set((state) => {
      const heatmaps = new Map(state.heatmaps);
      const heatmap = heatmaps.get(heatmapId);
      if (!heatmap) return state;

      // Find existing point at similar location
      const threshold = 10; // Pixels
      const existingIndex = heatmap.points.findIndex(
        (p) => Math.abs(p.x - point.x) < threshold && Math.abs(p.y - point.y) < threshold
      );

      let newPoints: HeatmapPoint[];
      if (existingIndex >= 0) {
        // Increment existing point
        newPoints = [...heatmap.points];
        newPoints[existingIndex] = {
          ...newPoints[existingIndex],
          value: newPoints[existingIndex].value + 1,
        };
      } else {
        // Add new point
        newPoints = [...heatmap.points, { ...point, value: 1 }];
      }

      heatmaps.set(heatmapId, {
        ...heatmap,
        points: newPoints,
        totalInteractions: heatmap.totalInteractions + 1,
      });

      return { heatmaps };
    });
  },

  updateConfig: (config) =>
    set((state) => ({ config: { ...state.config, ...config } })),

  setOpacity: (opacity) =>
    set((state) => ({ config: { ...state.config, opacity } })),

  setRadius: (radius) =>
    set((state) => ({ config: { ...state.config, radius } })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// ============================================================
// HEATMAP HELPERS
// ============================================================

/**
 * Get heatmap type info
 */
export function getHeatmapTypeInfo(type: HeatmapType): {
  label: string;
  icon: string;
  description: string;
} {
  const info: Record<HeatmapType, { label: string; icon: string; description: string }> = {
    click: {
      label: 'Click Heatmap',
      icon: '👆',
      description: 'Shows where users click most frequently',
    },
    scroll: {
      label: 'Scroll Heatmap',
      icon: '📜',
      description: 'Shows how far users scroll down the page',
    },
    attention: {
      label: 'Attention Heatmap',
      icon: '👁️',
      description: 'Shows where users spend the most time looking',
    },
    movement: {
      label: 'Mouse Movement',
      icon: '🖱️',
      description: 'Shows mouse cursor movement patterns',
    },
  };
  return info[type];
}

/**
 * Default color scales
 */
export const HEATMAP_COLOR_SCALES = {
  classic: ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000'],
  warm: ['#FFF5F0', '#FEE0D2', '#FCBBA1', '#FC9272', '#FB6A4A', '#EF3B2C', '#CB181D'],
  cool: ['#F7FBFF', '#DEEBF7', '#C6DBEF', '#9ECAE1', '#6BAED6', '#4292C6', '#2171B5'],
  viridis: ['#440154', '#482777', '#3F4A8A', '#31678E', '#26838F', '#1F9D8A', '#6CCE5A', '#B6DE2B', '#FEE825'],
};

/**
 * Calculate intensity value for rendering
 */
export function calculateIntensity(
  value: number,
  maxValue: number,
  minValue = 0
): number {
  if (maxValue === minValue) return 0.5;
  return (value - minValue) / (maxValue - minValue);
}

/**
 * Get color for intensity value
 */
export function getColorForIntensity(
  intensity: number,
  colorScale: string[]
): string {
  const index = Math.min(
    Math.floor(intensity * (colorScale.length - 1)),
    colorScale.length - 1
  );
  return colorScale[index];
}

/**
 * Normalize heatmap points to viewport
 */
export function normalizePoints(
  points: HeatmapPoint[],
  sourceViewport: { width: number; height: number },
  targetViewport: { width: number; height: number }
): HeatmapPoint[] {
  const scaleX = targetViewport.width / sourceViewport.width;
  const scaleY = targetViewport.height / sourceViewport.height;

  return points.map((point) => ({
    ...point,
    x: point.x * scaleX,
    y: point.y * scaleY,
  }));
}

/**
 * Generate scroll depth data
 */
export function generateScrollDepthData(
  scrollEvents: { userId: string; maxScrollPercent: number }[]
): { depth: number; percentage: number }[] {
  const depths = [0, 25, 50, 75, 100];

  return depths.map((depth) => {
    const reachedCount = scrollEvents.filter(
      (e) => e.maxScrollPercent >= depth
    ).length;
    const percentage = scrollEvents.length > 0
      ? (reachedCount / scrollEvents.length) * 100
      : 0;
    return { depth, percentage: Math.round(percentage * 10) / 10 };
  });
}

/**
 * Calculate attention zones from heatmap data
 */
export function calculateAttentionZones(
  data: HeatmapData
): Array<{ zone: string; x: number; y: number; width: number; height: number; intensity: number }> {
  if (data.points.length === 0) return [];

  // Grid-based zone calculation
  const gridSize = 100; // pixels
  const zones = new Map<string, { totalValue: number; count: number }>();

  data.points.forEach((point) => {
    const gridX = Math.floor(point.x / gridSize);
    const gridY = Math.floor(point.y / gridSize);
    const key = `${gridX},${gridY}`;

    if (!zones.has(key)) {
      zones.set(key, { totalValue: 0, count: 0 });
    }
    const zone = zones.get(key)!;
    zone.totalValue += point.value;
    zone.count++;
  });

  // Convert to array and calculate intensity
  const maxValue = Math.max(...Array.from(zones.values()).map((z) => z.totalValue));

  return Array.from(zones.entries())
    .map(([key, zone]) => {
      const [gridX, gridY] = key.split(',').map(Number);
      return {
        zone: key,
        x: gridX * gridSize,
        y: gridY * gridSize,
        width: gridSize,
        height: gridSize,
        intensity: zone.totalValue / maxValue,
      };
    })
    .filter((z) => z.intensity > 0.1) // Filter low-intensity zones
    .sort((a, b) => b.intensity - a.intensity);
}

/**
 * Get top clicked elements
 */
export function getTopClickedElements(
  data: HeatmapData,
  limit = 10
): Array<{ elementId: string; elementType: string; clicks: number }> {
  const elementClicks = new Map<string, { type: string; clicks: number }>();

  data.points.forEach((point) => {
    if (point.elementId) {
      if (!elementClicks.has(point.elementId)) {
        elementClicks.set(point.elementId, {
          type: point.elementType || 'unknown',
          clicks: 0,
        });
      }
      elementClicks.get(point.elementId)!.clicks += point.value;
    }
  });

  return Array.from(elementClicks.entries())
    .map(([elementId, data]) => ({
      elementId,
      elementType: data.type,
      clicks: data.clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);
}

/**
 * Calculate click density metrics
 */
export function calculateClickDensity(
  data: HeatmapData
): {
  avgClicksPerSession: number;
  hotspotCount: number;
  deadZonePercent: number;
  concentrationScore: number;
} {
  const avgClicksPerSession = data.sessionCount > 0
    ? data.totalInteractions / data.sessionCount
    : 0;

  // Count hotspots (points with value > average)
  const avgValue = data.points.length > 0
    ? data.points.reduce((sum, p) => sum + p.value, 0) / data.points.length
    : 0;
  const hotspotCount = data.points.filter((p) => p.value > avgValue * 2).length;

  // Calculate dead zone percentage (areas with no clicks)
  const gridSize = 100;
  const totalGridCells = Math.ceil(data.viewport.width / gridSize) *
    Math.ceil(data.viewport.height / gridSize);
  const activeGridCells = new Set(
    data.points.map((p) =>
      `${Math.floor(p.x / gridSize)},${Math.floor(p.y / gridSize)}`
    )
  ).size;
  const deadZonePercent = ((totalGridCells - activeGridCells) / totalGridCells) * 100;

  // Concentration score: how clustered are the clicks
  const maxValue = Math.max(...data.points.map((p) => p.value), 1);
  const topClicksShare = data.points
    .filter((p) => p.value > maxValue * 0.5)
    .reduce((sum, p) => sum + p.value, 0) / data.totalInteractions;
  const concentrationScore = Math.round(topClicksShare * 100);

  return {
    avgClicksPerSession: Math.round(avgClicksPerSession * 10) / 10,
    hotspotCount,
    deadZonePercent: Math.round(deadZonePercent * 10) / 10,
    concentrationScore,
  };
}

/**
 * Export heatmap data
 */
export function exportHeatmapData(data: HeatmapData): {
  csv: string;
  json: string;
} {
  // CSV export
  const headers = ['X', 'Y', 'Value', 'Element ID', 'Element Type'];
  const rows = data.points.map((p) => [
    p.x.toString(),
    p.y.toString(),
    p.value.toString(),
    p.elementId || '',
    p.elementType || '',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  // JSON export
  const json = JSON.stringify({
    type: data.type,
    pageUrl: data.pageUrl,
    viewport: data.viewport,
    dateRange: data.dateRange,
    totalInteractions: data.totalInteractions,
    sessionCount: data.sessionCount,
    points: data.points,
  }, null, 2);

  return { csv, json };
}
