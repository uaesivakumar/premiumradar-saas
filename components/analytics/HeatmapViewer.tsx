/**
 * Heatmap Viewer Component
 *
 * Click, scroll, and attention heatmap visualization.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import {
  useHeatmapStore,
  getHeatmapTypeInfo,
  HEATMAP_COLOR_SCALES,
  calculateIntensity,
  getColorForIntensity,
  calculateAttentionZones,
  getTopClickedElements,
  calculateClickDensity,
  type HeatmapData,
  type HeatmapType,
} from '@/lib/analytics';

interface HeatmapViewerProps {
  data: HeatmapData;
  screenshot?: string;
  onTypeChange?: (type: HeatmapType) => void;
}

export function HeatmapViewer({ data, screenshot, onTypeChange }: HeatmapViewerProps) {
  const [opacity, setOpacity] = useState(0.6);
  const [radius, setRadius] = useState(30);
  const [colorScale, setColorScale] = useState<keyof typeof HEATMAP_COLOR_SCALES>('classic');
  const [showZones, setShowZones] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const typeInfo = getHeatmapTypeInfo(data.type);
  const density = calculateClickDensity(data);
  const topElements = getTopClickedElements(data, 5);
  const attentionZones = calculateAttentionZones(data);

  // Render heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = data.viewport.width;
    canvas.height = data.viewport.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (data.points.length === 0) return;

    // Calculate max value for intensity scaling
    const maxValue = Math.max(...data.points.map((p) => p.value));

    // Draw each point as a radial gradient
    data.points.forEach((point) => {
      const intensity = calculateIntensity(point.value, maxValue);
      const color = getColorForIntensity(intensity, HEATMAP_COLOR_SCALES[colorScale]);

      const gradient = ctx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        radius
      );

      gradient.addColorStop(0, `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${color}00`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, opacity, radius, colorScale]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            {typeInfo.icon} {typeInfo.label}
          </h3>
          <p className="text-sm text-gray-500">{data.pageUrl}</p>
        </div>

        {/* Type selector */}
        <div className="flex items-center gap-2">
          {(['click', 'scroll', 'attention', 'movement'] as HeatmapType[]).map((type) => {
            const info = getHeatmapTypeInfo(type);
            return (
              <button
                key={type}
                onClick={() => onTypeChange?.(type)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  data.type === type
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {info.icon} {info.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Heatmap visualization */}
      <div className="relative">
        {/* Background screenshot */}
        {screenshot && (
          <img
            src={screenshot}
            alt="Page screenshot"
            className="w-full"
            style={{ maxHeight: '600px', objectFit: 'contain' }}
          />
        )}

        {/* Heatmap canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* Attention zones overlay */}
        {showZones &&
          attentionZones.slice(0, 5).map((zone, i) => (
            <div
              key={zone.zone}
              className="absolute border-2 border-blue-500 bg-blue-500/20"
              style={{
                left: `${(zone.x / data.viewport.width) * 100}%`,
                top: `${(zone.y / data.viewport.height) * 100}%`,
                width: `${(zone.width / data.viewport.width) * 100}%`,
                height: `${(zone.height / data.viewport.height) * 100}%`,
              }}
            >
              <span className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                #{i + 1} ({(zone.intensity * 100).toFixed(0)}%)
              </span>
            </div>
          ))}

        {/* No data message */}
        {data.points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">No heatmap data available</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center gap-6">
          {/* Opacity slider */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-500 w-8">
              {(opacity * 100).toFixed(0)}%
            </span>
          </div>

          {/* Radius slider */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Radius</label>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-500 w-8">{radius}px</span>
          </div>

          {/* Color scale */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Colors</label>
            <select
              value={colorScale}
              onChange={(e) =>
                setColorScale(e.target.value as keyof typeof HEATMAP_COLOR_SCALES)
              }
              className="text-sm border border-gray-200 rounded px-2 py-1"
            >
              {Object.keys(HEATMAP_COLOR_SCALES).map((scale) => (
                <option key={scale} value={scale}>
                  {scale.charAt(0).toUpperCase() + scale.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Show zones toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showZones}
              onChange={(e) => setShowZones(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Show zones</span>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-t border-gray-100 grid grid-cols-4 gap-6">
        <div>
          <div className="text-sm text-gray-500">Total Interactions</div>
          <div className="text-lg font-semibold text-gray-900">
            {data.totalInteractions.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Sessions</div>
          <div className="text-lg font-semibold text-gray-900">
            {data.sessionCount.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Avg Clicks/Session</div>
          <div className="text-lg font-semibold text-gray-900">
            {density.avgClicksPerSession.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Hotspots</div>
          <div className="text-lg font-semibold text-gray-900">
            {density.hotspotCount}
          </div>
        </div>
      </div>

      {/* Top clicked elements */}
      {topElements.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Top Clicked Elements
          </h4>
          <div className="space-y-2">
            {topElements.map((element, index) => (
              <div
                key={element.elementId}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                    {index + 1}
                  </span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {element.elementId}
                  </code>
                  <span className="text-gray-500">({element.elementType})</span>
                </div>
                <span className="font-medium text-gray-900">
                  {element.clicks} clicks
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact heatmap card
export function HeatmapCard({ data }: { data: HeatmapData }) {
  const typeInfo = getHeatmapTypeInfo(data.type);
  const density = calculateClickDensity(data);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
          {typeInfo.icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{typeInfo.label}</h3>
          <p className="text-xs text-gray-500 truncate max-w-[200px]">
            {data.pageUrl}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xl font-bold text-gray-900">
            {data.totalInteractions.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Interactions</div>
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">
            {density.hotspotCount}
          </div>
          <div className="text-xs text-gray-500">Hotspots</div>
        </div>
      </div>

      {/* Mini visualization */}
      <div className="mt-4 h-16 bg-gradient-to-r from-blue-100 via-yellow-100 to-red-100 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-gray-500">
            {data.sessionCount} sessions
          </span>
        </div>
      </div>
    </div>
  );
}

// Scroll depth visualization
export function ScrollDepthChart({
  data,
}: {
  data: { depth: number; percentage: number }[];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Scroll Depth</h3>

      <div className="space-y-3">
        {data.map(({ depth, percentage }) => (
          <div key={depth} className="flex items-center gap-3">
            <span className="w-12 text-sm text-gray-500 text-right">{depth}%</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  percentage >= 80
                    ? 'bg-green-500'
                    : percentage >= 50
                      ? 'bg-blue-500'
                      : percentage >= 25
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-12 text-sm font-medium text-gray-900">
              {percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Percentage of users reaching each scroll depth
      </div>
    </div>
  );
}
