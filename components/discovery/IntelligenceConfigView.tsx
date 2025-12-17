'use client';

/**
 * IntelligenceConfigView Component - SAAS_RENDER_ONLY
 *
 * Displays intelligence configuration from OS pack config.
 * Users can view but not modify pack config (read-only display).
 *
 * ARCHITECTURE COMPLIANCE:
 * - SaaS ONLY renders config from OS
 * - SaaS NEVER modifies pack config
 * - Pack config lives in OS, fetched via API
 * - Admin UI for config modification is separate (Super Admin)
 *
 * Architecture: OS decides. SIVA reasons. SaaS renders.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

interface SignalType {
  slug: string;
  name: string;
  category: string;
  description: string;
  weight: number;
  priority: number;
}

interface EdgeCase {
  type: string;
  condition: string;
  action: 'BLOCK' | 'SKIP' | 'WARN' | 'BOOST';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  multiplier: number;
  can_override: boolean;
}

interface QTLEConfig {
  q_score: Record<string, unknown>;
  t_score: Record<string, unknown>;
  l_score: Record<string, unknown>;
  e_score: Record<string, unknown>;
}

interface PackConfig {
  pack_id: string;
  name: string;
  version: string;
  vertical: string;
  sub_vertical: string;
  description: string;
  signal_types: SignalType[];
  edge_cases: EdgeCase[];
  scoring_weights: {
    quality: number;
    timing: number;
    likelihood: number;
    evidence: number;
  };
  qtle_config: QTLEConfig;
  progressive_delivery?: {
    enabled: boolean;
    initial_batch: number;
    subsequent_batch: number;
    require_feedback_before_next: boolean;
    max_leads_per_session: number;
  };
  preference_learning?: {
    enabled: boolean;
    signals_to_track: string[];
    learning_window_days: number;
    min_signals_for_learning: number;
  };
}

interface IntelligenceConfigViewProps {
  /** Pack config from OS */
  config: PackConfig;
  /** Loading state */
  isLoading?: boolean;
}

export function IntelligenceConfigView({
  config,
  isLoading = false,
}: IntelligenceConfigViewProps) {
  const [activeTab, setActiveTab] = useState<'signals' | 'edge_cases' | 'scoring' | 'features'>('signals');

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {config.name}
          </h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            v{config.version}
          </span>
        </div>
        <p className="text-sm text-gray-500">{config.description}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
            {config.vertical}
          </span>
          <span>→</span>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
            {config.sub_vertical}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
        {(['signals', 'edge_cases', 'scoring', 'features'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab === 'signals' && `Signals (${config.signal_types.length})`}
            {tab === 'edge_cases' && `Edge Cases (${config.edge_cases.length})`}
            {tab === 'scoring' && 'Scoring'}
            {tab === 'features' && 'Features'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'signals' && (
          <SignalTypesSection signals={config.signal_types} />
        )}
        {activeTab === 'edge_cases' && (
          <EdgeCasesSection edgeCases={config.edge_cases} />
        )}
        {activeTab === 'scoring' && (
          <ScoringSection
            weights={config.scoring_weights}
            qtle={config.qtle_config}
          />
        )}
        {activeTab === 'features' && (
          <FeaturesSection
            progressiveDelivery={config.progressive_delivery}
            preferenceLearning={config.preference_learning}
          />
        )}
      </div>

      {/* Read-Only Notice */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-500">
          Configuration is managed by OS. Contact admin to modify pack settings.
        </p>
      </div>
    </div>
  );
}

function SignalTypesSection({ signals }: { signals: SignalType[] }) {
  const grouped = signals.reduce(
    (acc, signal) => {
      if (!acc[signal.category]) acc[signal.category] = [];
      acc[signal.category].push(signal);
      return acc;
    },
    {} as Record<string, SignalType[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categorySignals]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
            {category}
          </h3>
          <div className="space-y-2">
            {categorySignals
              .sort((a, b) => a.priority - b.priority)
              .map((signal) => (
                <motion.div
                  key={signal.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {signal.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {signal.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        P{signal.priority}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {(signal.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EdgeCasesSection({ edgeCases }: { edgeCases: EdgeCase[] }) {
  const actionColors = {
    BLOCK: 'bg-red-100 text-red-700',
    SKIP: 'bg-orange-100 text-orange-700',
    WARN: 'bg-yellow-100 text-yellow-700',
    BOOST: 'bg-green-100 text-green-700',
  };

  const severityColors = {
    CRITICAL: 'text-red-600',
    HIGH: 'text-orange-600',
    MEDIUM: 'text-yellow-600',
    LOW: 'text-gray-600',
  };

  return (
    <div className="space-y-3">
      {edgeCases.map((edgeCase, idx) => (
        <motion.div
          key={edgeCase.type}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${actionColors[edgeCase.action]}`}>
                {edgeCase.action}
              </span>
              <span className={`text-xs font-medium ${severityColors[edgeCase.severity]}`}>
                {edgeCase.severity}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {edgeCase.can_override ? '✓ Can override' : '✕ No override'}
            </div>
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            {edgeCase.type.replace(/_/g, ' ')}
          </h4>
          <p className="text-sm text-gray-500 mt-1">{edgeCase.condition}</p>
          <div className="mt-2 text-xs text-gray-400">
            Multiplier: {edgeCase.multiplier}x
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ScoringSection({
  weights,
  qtle,
}: {
  weights: PackConfig['scoring_weights'];
  qtle: QTLEConfig;
}) {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  return (
    <div className="space-y-6">
      {/* Weights */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          QTLE Weights
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(weights).map(([key, value]) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {key}
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {((value / totalWeight) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(value / totalWeight) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QTLE Config Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          QTLE Configuration
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(qtle).map(([score, config]) => (
            <div
              key={score}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {score.replace('_', ' ').toUpperCase()}
              </h4>
              <div className="text-xs text-gray-500 space-y-1">
                {Object.keys(config as object)
                  .slice(0, 3)
                  .map((key) => (
                    <div key={key} className="flex justify-between">
                      <span>{key.replace(/_/g, ' ')}</span>
                      <span className="font-mono">
                        {JSON.stringify((config as Record<string, unknown>)[key]).slice(0, 15)}
                      </span>
                    </div>
                  ))}
                {Object.keys(config as object).length > 3 && (
                  <div className="text-gray-400">
                    +{Object.keys(config as object).length - 3} more...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesSection({
  progressiveDelivery,
  preferenceLearning,
}: {
  progressiveDelivery?: PackConfig['progressive_delivery'];
  preferenceLearning?: PackConfig['preference_learning'];
}) {
  return (
    <div className="space-y-4">
      {/* Progressive Delivery */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Progressive Lead Delivery
          </h4>
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              progressiveDelivery?.enabled
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {progressiveDelivery?.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        {progressiveDelivery && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Initial batch</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {progressiveDelivery.initial_batch} leads
              </div>
            </div>
            <div>
              <span className="text-gray-500">Subsequent batch</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {progressiveDelivery.subsequent_batch} leads
              </div>
            </div>
            <div>
              <span className="text-gray-500">Max per session</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {progressiveDelivery.max_leads_per_session} leads
              </div>
            </div>
            <div>
              <span className="text-gray-500">Feedback required</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {progressiveDelivery.require_feedback_before_next ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preference Learning */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Preference Learning
          </h4>
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              preferenceLearning?.enabled
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {preferenceLearning?.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        {preferenceLearning && (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">Tracked signals</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {preferenceLearning.signals_to_track.map((signal) => (
                  <span
                    key={signal}
                    className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Learning window</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {preferenceLearning.learning_window_days} days
                </div>
              </div>
              <div>
                <span className="text-gray-500">Min signals</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {preferenceLearning.min_signals_for_learning}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IntelligenceConfigView;
