'use client';

/**
 * SignalLab Component
 * Sprint S62: Signal Correlation & Pattern Explorer
 *
 * Interactive laboratory for exploring signal correlations and patterns.
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import type {
  IntelligenceSignalData,
  PatternDetection,
  CorrelationResult,
} from '@/lib/intelligence-suite/types';

interface SignalLabProps {
  signals: IntelligenceSignalData[];
  patterns: PatternDetection[];
  correlations: CorrelationResult[];
  className?: string;
}

export function SignalLab({
  signals,
  patterns,
  correlations,
  className,
}: SignalLabProps) {
  const [activeTab, setActiveTab] = useState<'signals' | 'patterns' | 'correlations'>('signals');
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);

  const tabs = [
    { id: 'signals' as const, label: 'Signals', count: signals.length },
    { id: 'patterns' as const, label: 'Patterns', count: patterns.length },
    { id: 'correlations' as const, label: 'Correlations', count: correlations.length },
  ];

  // Get correlation data for selected signals
  const selectedCorrelations = useMemo(() => {
    if (selectedSignals.length < 2) return [];
    return correlations.filter(
      (c) =>
        selectedSignals.includes(c.signalA) && selectedSignals.includes(c.signalB)
    );
  }, [correlations, selectedSignals]);

  const toggleSignal = (signalId: string) => {
    setSelectedSignals((prev) =>
      prev.includes(signalId)
        ? prev.filter((id) => id !== signalId)
        : [...prev, signalId]
    );
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Signal Lab
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Explore signal correlations and discover patterns
            </p>
          </div>
          {selectedSignals.length > 0 && (
            <button
              onClick={() => setSelectedSignals([])}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Clear selection ({selectedSignals.length})
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'signals' && (
          <SignalsPanel
            signals={signals}
            selectedSignals={selectedSignals}
            onToggleSignal={toggleSignal}
          />
        )}
        {activeTab === 'patterns' && <PatternsPanel patterns={patterns} />}
        {activeTab === 'correlations' && (
          <CorrelationsPanel
            correlations={correlations}
            selectedCorrelations={selectedCorrelations}
            signals={signals}
          />
        )}
      </div>
    </div>
  );
}

interface SignalsPanelProps {
  signals: IntelligenceSignalData[];
  selectedSignals: string[];
  onToggleSignal: (id: string) => void;
}

function SignalsPanel({ signals, selectedSignals, onToggleSignal }: SignalsPanelProps) {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const signalTypes = useMemo(() => {
    const types = new Set(signals.map((s) => s.type));
    return Array.from(types);
  }, [signals]);

  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      if (typeFilter !== 'all' && signal.type !== typeFilter) return false;
      if (filter) {
        const searchLower = filter.toLowerCase();
        return (
          signal.type.toLowerCase().includes(searchLower) ||
          signal.source.toLowerCase().includes(searchLower) ||
          signal.name.toLowerCase().includes(searchLower) ||
          signal.id.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [signals, filter, typeFilter]);

  const getStrengthColor = (strength: 'strong' | 'moderate' | 'weak') => {
    switch (strength) {
      case 'strong':
        return 'text-green-600 bg-green-100 dark:bg-green-900/40';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40';
      case 'weak':
        return 'text-red-600 bg-red-100 dark:bg-red-900/40';
    }
  };

  const getStrengthLabel = (strength: 'strong' | 'moderate' | 'weak') => {
    switch (strength) {
      case 'strong':
        return 'Strong';
      case 'moderate':
        return 'Moderate';
      case 'weak':
        return 'Weak';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search signals..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="all">All Types</option>
          {signalTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Signal List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredSignals.map((signal) => {
          const isSelected = selectedSignals.includes(signal.id);
          return (
            <div
              key={signal.id}
              className={cn(
                'p-3 rounded-lg border cursor-pointer transition-colors',
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              onClick={() => onToggleSignal(signal.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {signal.type}
                  </span>
                  <span className="text-xs text-gray-500">from {signal.source}</span>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded',
                    getStrengthColor(signal.strength)
                  )}
                >
                  {getStrengthLabel(signal.strength)}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500 truncate">
                {signal.name}
              </div>
            </div>
          );
        })}
        {filteredSignals.length === 0 && (
          <div className="text-center py-8 text-gray-500">No signals found</div>
        )}
      </div>
    </div>
  );
}

interface PatternsPanelProps {
  patterns: PatternDetection[];
}

function PatternsPanel({ patterns }: PatternsPanelProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {patterns.map((pattern) => (
        <div
          key={pattern.id}
          className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {pattern.patternType.replace(/-/g, ' ')}
            </span>
            <span className={cn('text-sm font-medium', getConfidenceColor(pattern.confidence))}>
              {(pattern.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {pattern.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {pattern.members.slice(0, 5).map((member, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
              >
                {member.label || member.objectId.substring(0, 8) + '...'}
              </span>
            ))}
            {pattern.members.length > 5 && (
              <span className="text-xs text-gray-500">
                +{pattern.members.length - 5} more
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Detected: {new Date(pattern.discoveredAt).toLocaleDateString()}
          </div>
        </div>
      ))}
      {patterns.length === 0 && (
        <div className="text-center py-8 text-gray-500">No patterns detected</div>
      )}
    </div>
  );
}

interface CorrelationsPanelProps {
  correlations: CorrelationResult[];
  selectedCorrelations: CorrelationResult[];
  signals: IntelligenceSignalData[];
}

function CorrelationsPanel({
  correlations,
  selectedCorrelations,
  signals,
}: CorrelationsPanelProps) {
  const signalMap = useMemo(() => {
    const map: Record<string, IntelligenceSignalData> = {};
    signals.forEach((s) => (map[s.id] = s));
    return map;
  }, [signals]);

  const displayCorrelations =
    selectedCorrelations.length > 0 ? selectedCorrelations : correlations;

  const getCorrelationColor = (value: number) => {
    if (value >= 0.7) return 'bg-green-500';
    if (value >= 0.4) return 'bg-yellow-500';
    if (value >= 0) return 'bg-gray-400';
    if (value >= -0.4) return 'bg-orange-400';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {selectedCorrelations.length > 0 && (
        <div className="text-sm text-blue-600 dark:text-blue-400">
          Showing correlations for selected signals
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayCorrelations.map((corr, i) => {
          const signalA = signalMap[corr.signalA];
          const signalB = signalMap[corr.signalB];

          return (
            <div
              key={i}
              className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 text-sm text-gray-900 dark:text-white truncate">
                  {signalA?.type || corr.signalA.substring(0, 8)}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-16 h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600'
                    )}
                  >
                    <div
                      className={cn(
                        'h-full transition-all',
                        getCorrelationColor(corr.correlation)
                      )}
                      style={{
                        width: `${Math.abs(corr.correlation) * 100}%`,
                        marginLeft: corr.correlation < 0 ? 'auto' : 0,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium w-12 text-right',
                      corr.correlation >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {corr.correlation.toFixed(2)}
                  </span>
                </div>
                <div className="flex-1 text-sm text-gray-900 dark:text-white truncate text-right">
                  {signalB?.type || corr.signalB.substring(0, 8)}
                </div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>significance: {corr.significance.toFixed(2)}</span>
                {corr.sampleSize && <span>n={corr.sampleSize}</span>}
              </div>
            </div>
          );
        })}
        {displayCorrelations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {selectedCorrelations.length === 0
              ? 'No correlations found'
              : 'Select 2+ signals to see correlations'}
          </div>
        )}
      </div>
    </div>
  );
}

export default SignalLab;
