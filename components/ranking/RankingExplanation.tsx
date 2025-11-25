/**
 * Ranking Explanation Component
 *
 * Detailed breakdown and explanation of domain scores.
 */

'use client';

import {
  type RankingExplanation as RankingExplanationType,
  type ScoreBreakdown,
  type ExplanationFactor,
  getBreakdownChartData,
  getImpactColor,
  getCategoryLabel,
  getCategoryIcon,
} from '@/lib/ranking';

interface RankingExplanationProps {
  explanation: RankingExplanationType;
  domain: string;
  compositeScore: number;
}

export function RankingExplanation({
  explanation,
  domain,
  compositeScore,
}: RankingExplanationProps) {
  const chartData = getBreakdownChartData(explanation.detailedBreakdown);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Ranking Explanation</h3>
        <p className="text-sm text-gray-500">
          Why {domain} scored {compositeScore}/100
        </p>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <p className="text-gray-700">{explanation.summary}</p>
      </div>

      {/* Score Distribution Chart */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Score Distribution</h4>
        <div className="flex items-end gap-1 h-24">
          {chartData.map((item, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className="w-full rounded-t"
                style={{
                  height: `${(item.value / compositeScore) * 100}%`,
                  backgroundColor: item.color,
                  minHeight: '8px',
                }}
              />
              <div className="text-xs text-gray-500 mt-1">{item.name}</div>
              <div className="text-xs font-medium text-gray-700">
                {item.value.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Factors */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Top Contributing Factors</h4>
        <div className="space-y-3">
          {explanation.topFactors.map((factor) => (
            <FactorItem key={factor.id} factor={factor} />
          ))}
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed Breakdown</h4>
        <div className="space-y-4">
          {explanation.detailedBreakdown.map((breakdown) => (
            <BreakdownSection key={breakdown.category} breakdown={breakdown} />
          ))}
        </div>
      </div>

      {/* Comparisons */}
      {explanation.comparisons.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Comparisons</h4>
          <div className="space-y-3">
            {explanation.comparisons.map((comparison, index) => (
              <ComparisonItem key={index} comparison={comparison} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {explanation.recommendations.length > 0 && (
        <div className="px-6 py-4 bg-green-50">
          <h4 className="text-sm font-medium text-green-800 mb-3">
            💡 Recommendations
          </h4>
          <ul className="space-y-2">
            {explanation.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                <span className="text-green-500 mt-0.5">✓</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FactorItem({ factor }: { factor: ExplanationFactor }) {
  const impactColor = getImpactColorClass(factor.impact);

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-8 rounded-full ${
            factor.impact === 'positive'
              ? 'bg-green-500'
              : factor.impact === 'negative'
                ? 'bg-red-500'
                : 'bg-gray-400'
          }`}
        />
        <div>
          <div className="font-medium text-gray-900">{factor.name}</div>
          <div className="text-sm text-gray-500">{factor.description}</div>
        </div>
      </div>
      <div className={`text-lg font-bold ${impactColor}`}>
        {factor.contribution >= 0 ? '+' : ''}
        {factor.contribution.toFixed(1)}
      </div>
    </div>
  );
}

function BreakdownSection({ breakdown }: { breakdown: ScoreBreakdown }) {
  const icon = getCategoryIcon(breakdown.category);
  const label = getCategoryLabel(breakdown.category);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Category Header */}
      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-900">{breakdown.score}</span>
          <span className="text-sm text-gray-500">
            × {(breakdown.weight * 100).toFixed(0)}% = {breakdown.contribution.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Factors */}
      <div className="p-4 space-y-2">
        {breakdown.factors.map((factor, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex-1">
              <span className="text-gray-700">{factor.name}</span>
              <span className="text-gray-400 ml-2">({factor.description})</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500">
                {typeof factor.value === 'number' ? factor.value : factor.value}
              </span>
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${factor.score}%` }}
                />
              </div>
              <span className="w-8 text-right font-medium text-gray-700">
                {factor.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonItem({
  comparison,
}: {
  comparison: RankingExplanationType['comparisons'][0];
}) {
  const isHigher = comparison.difference > 0;

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{comparison.domain}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Score: {comparison.composite}</span>
          <span
            className={`font-medium ${isHigher ? 'text-green-600' : 'text-red-600'}`}
          >
            {isHigher ? '+' : ''}
            {comparison.difference}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 text-xs">Our Strengths:</span>
          <ul className="text-green-700">
            {comparison.strengths.map((s, i) => (
              <li key={i}>+ {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Our Weaknesses:</span>
          <ul className="text-red-700">
            {comparison.weaknesses.map((w, i) => (
              <li key={i}>- {w}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function getImpactColorClass(impact: 'positive' | 'negative' | 'neutral'): string {
  const colors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500',
  };
  return colors[impact];
}
