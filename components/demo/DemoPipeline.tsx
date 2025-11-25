/**
 * Demo Pipeline Component
 *
 * Display fake pipeline data for demo mode.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  generateFakePipeline,
  type FakePipelineDeal,
  type PipelineStage,
} from '@/lib/demo';

interface DemoPipelineProps {
  initialDeals?: number;
}

export function DemoPipeline({ initialDeals = 20 }: DemoPipelineProps) {
  const [deals] = useState(() => generateFakePipeline(initialDeals));
  const [selectedDeal, setSelectedDeal] = useState<FakePipelineDeal | null>(null);

  // Group deals by stage
  const stages = useMemo(() => {
    const stageOrder: PipelineStage[] = [
      'discovery',
      'contacted',
      'negotiating',
      'offer-made',
      'due-diligence',
      'won',
      'lost',
    ];

    return stageOrder.map((stage) => ({
      stage,
      deals: deals.filter((d) => d.stage === stage),
      totalValue: deals
        .filter((d) => d.stage === stage)
        .reduce((sum, d) => sum + d.value, 0),
    }));
  }, [deals]);

  // Calculate pipeline metrics
  const metrics = useMemo(() => {
    const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
    const weightedValue = deals.reduce(
      (sum, d) => sum + d.value * (d.probability / 100),
      0
    );
    const wonValue = deals
      .filter((d) => d.stage === 'won')
      .reduce((sum, d) => sum + d.value, 0);
    const activeDeals = deals.filter(
      (d) => !['won', 'lost'].includes(d.stage)
    ).length;

    return { totalValue, weightedValue, wonValue, activeDeals };
  }, [deals]);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Pipeline"
          value={`$${(metrics.totalValue / 1000).toFixed(0)}K`}
          icon="📊"
        />
        <MetricCard
          label="Weighted Value"
          value={`$${(metrics.weightedValue / 1000).toFixed(0)}K`}
          icon="⚖️"
        />
        <MetricCard
          label="Won This Month"
          value={`$${(metrics.wonValue / 1000).toFixed(0)}K`}
          icon="🏆"
          highlight
        />
        <MetricCard
          label="Active Deals"
          value={metrics.activeDeals.toString()}
          icon="🎯"
        />
      </div>

      {/* Pipeline board */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Deal Pipeline</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
              Demo Data
            </span>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {stages.map(({ stage, deals: stageDeals, totalValue }) => (
              <div key={stage} className="w-72 flex-shrink-0">
                {/* Stage header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${getStageColor(stage)}`} />
                    <span className="font-medium text-gray-900 capitalize">
                      {stage.replace('-', ' ')}
                    </span>
                    <span className="text-sm text-gray-400">
                      ({stageDeals.length})
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ${(totalValue / 1000).toFixed(0)}K
                  </span>
                </div>

                {/* Deal cards */}
                <div className="space-y-2">
                  {stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onClick={() => setSelectedDeal(deal)}
                      isSelected={selectedDeal?.id === deal.id}
                    />
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="py-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                      No deals
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deal detail modal */}
      {selectedDeal && (
        <DealDetailModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
        />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        highlight
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div
        className={`text-2xl font-bold ${
          highlight ? 'text-green-700' : 'text-gray-900'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  onClick,
  isSelected,
}: {
  deal: FakePipelineDeal;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-400 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900 truncate">
          {deal.domain.fullDomain}
        </span>
        <span className="text-sm font-medium text-gray-900">
          ${deal.value.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{deal.domain.vertical}</span>
        <span>{deal.probability}%</span>
      </div>

      {deal.nextAction && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
          <span className="text-gray-400">Next:</span>{' '}
          <span className="text-gray-600">{deal.nextAction}</span>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium`}
        >
          {deal.owner[0]}
        </span>
        <span className="text-xs text-gray-500">
          Updated {formatRelativeTime(deal.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function DealDetailModal({
  deal,
  onClose,
}: {
  deal: FakePipelineDeal;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {deal.domain.fullDomain}
            </h3>
            <p className="text-sm text-gray-500">
              {deal.domain.vertical} • Score: {deal.domain.overallScore}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Deal Value</span>
              <div className="text-lg font-semibold text-gray-900">
                ${deal.value.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Probability</span>
              <div className="text-lg font-semibold text-gray-900">
                {deal.probability}%
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Stage</span>
              <div className="text-lg font-semibold text-gray-900 capitalize">
                {deal.stage.replace('-', ' ')}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Owner</span>
              <div className="text-lg font-semibold text-gray-900">
                {deal.owner}
              </div>
            </div>
          </div>

          <div>
            <span className="text-sm text-gray-500">Notes</span>
            <p className="mt-1 text-gray-700">{deal.notes}</p>
          </div>

          {deal.nextAction && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <span className="text-sm font-medium text-yellow-800">
                Next Action:
              </span>
              <p className="text-yellow-700">{deal.nextAction}</p>
              {deal.nextActionDate && (
                <p className="text-sm text-yellow-600 mt-1">
                  Due: {deal.nextActionDate.toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Demo data • Not real deal
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function getStageColor(stage: PipelineStage): string {
  const colors: Record<PipelineStage, string> = {
    discovery: 'bg-gray-400',
    contacted: 'bg-blue-400',
    negotiating: 'bg-yellow-400',
    'offer-made': 'bg-orange-400',
    'due-diligence': 'bg-purple-400',
    won: 'bg-green-500',
    lost: 'bg-red-400',
  };
  return colors[stage];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}
