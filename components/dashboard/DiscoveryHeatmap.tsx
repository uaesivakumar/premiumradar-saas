/**
 * Discovery Heatmap Component
 * Sprint S54: Vertical Dashboards
 *
 * Displays a heatmap visualization for response rates by time/persona/industry.
 */

import React from 'react';
import type { HeatmapData, HeatmapCell } from '../../lib/dashboard';

interface DiscoveryHeatmapProps {
  heatmap: HeatmapData | null;
  loading?: boolean;
}

export function DiscoveryHeatmap({ heatmap, loading = false }: DiscoveryHeatmapProps) {
  if (loading) {
    return <HeatmapSkeleton />;
  }

  if (!heatmap || heatmap.cells.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No heatmap data available
      </div>
    );
  }

  // Create cell lookup for quick access
  const cellMap = new Map<string, HeatmapCell>();
  heatmap.cells.forEach((cell) => {
    cellMap.set(`${cell.x}-${cell.y}`, cell);
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{heatmap.title}</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-16" />
              {heatmap.xLabels.map((label) => (
                <th
                  key={label}
                  className="text-xs font-medium text-gray-500 pb-2 px-1 text-center"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.yLabels.map((yLabel) => (
              <tr key={yLabel}>
                <td className="text-xs font-medium text-gray-500 pr-2 text-right">
                  {yLabel}
                </td>
                {heatmap.xLabels.map((xLabel) => {
                  const cell = cellMap.get(`${xLabel}-${yLabel}`);
                  return (
                    <td key={`${xLabel}-${yLabel}`} className="p-0.5">
                      <HeatmapCellBox
                        cell={cell}
                        minValue={heatmap.minValue}
                        maxValue={heatmap.maxValue}
                        colorScale={heatmap.colorScale}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <span className="text-xs text-gray-500">Low</span>
        <div className="flex">
          {[0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
            <div
              key={intensity}
              className="w-6 h-4"
              style={{
                backgroundColor: getColor(heatmap.colorScale, intensity),
              }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">High</span>
      </div>
    </div>
  );
}

interface HeatmapCellBoxProps {
  cell: HeatmapCell | undefined;
  minValue: number;
  maxValue: number;
  colorScale: 'green' | 'blue' | 'red' | 'orange';
}

function HeatmapCellBox({ cell, minValue, maxValue, colorScale }: HeatmapCellBoxProps) {
  if (!cell) {
    return (
      <div className="w-8 h-8 bg-gray-100 rounded" title="No data" />
    );
  }

  const range = maxValue - minValue || 1;
  const intensity = Math.max(0, Math.min(1, (cell.value - minValue) / range));
  const color = getColor(colorScale, intensity);

  return (
    <div
      className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-400 transition-all"
      style={{
        backgroundColor: color,
        color: intensity > 0.5 ? 'white' : 'inherit',
      }}
      title={cell.label || `${cell.value}%`}
    >
      {cell.value > 0 ? Math.round(cell.value) : ''}
    </div>
  );
}

function getColor(scale: 'green' | 'blue' | 'red' | 'orange', intensity: number): string {
  const colors: Record<string, [number, number, number][]> = {
    green: [
      [240, 253, 244], // green-50
      [134, 239, 172], // green-300
      [34, 197, 94],   // green-500
      [22, 163, 74],   // green-600
      [21, 128, 61],   // green-700
    ],
    blue: [
      [239, 246, 255], // blue-50
      [147, 197, 253], // blue-300
      [59, 130, 246],  // blue-500
      [37, 99, 235],   // blue-600
      [29, 78, 216],   // blue-700
    ],
    red: [
      [254, 242, 242], // red-50
      [252, 165, 165], // red-300
      [239, 68, 68],   // red-500
      [220, 38, 38],   // red-600
      [185, 28, 28],   // red-700
    ],
    orange: [
      [255, 247, 237], // orange-50
      [253, 186, 116], // orange-300
      [249, 115, 22],  // orange-500
      [234, 88, 12],   // orange-600
      [194, 65, 12],   // orange-700
    ],
  };

  const palette = colors[scale] || colors.green;
  const index = Math.floor(intensity * (palette.length - 1));
  const [r, g, b] = palette[index];
  return `rgb(${r}, ${g}, ${b})`;
}

function HeatmapSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="w-48 h-6 bg-gray-200 rounded mb-4" />
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 70 }).map((_, i) => (
          <div key={i} className="w-8 h-8 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}

export default DiscoveryHeatmap;
