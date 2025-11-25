'use client';

/**
 * Ranking Object - Sprint S27
 * Ranked prospect list with Q/T/L/E breakdown
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  ChevronRight,
  Target,
  Clock,
  Percent,
  Zap,
  TrendingUp,
  Medal,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

interface RankedCompany {
  rank: number;
  name: string;
  industry: string;
  country: string;
  Q: number;
  T: number;
  L: number;
  E: number;
  total: number;
  signal: string;
  change?: 'up' | 'down' | 'same';
  previousRank?: number;
}

interface RankingObjectProps {
  rankings: RankedCompany[];
  onCompanySelect?: (company: RankedCompany) => void;
  onViewDetails?: (company: RankedCompany) => void;
}

export function RankingObject({
  rankings,
  onCompanySelect,
  onViewDetails,
}: RankingObjectProps) {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const [expandedRank, setExpandedRank] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'total' | 'Q' | 'T' | 'L' | 'E'>('total');

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          icon: <Trophy className="w-4 h-4 text-yellow-400" />,
        };
      case 2:
        return {
          bg: 'bg-gray-400/20',
          border: 'border-gray-400/30',
          text: 'text-gray-300',
          icon: <Medal className="w-4 h-4 text-gray-300" />,
        };
      case 3:
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          icon: <Medal className="w-4 h-4 text-orange-400" />,
        };
      default:
        return {
          bg: 'bg-white/5',
          border: 'border-white/10',
          text: 'text-gray-400',
          icon: null,
        };
    }
  };

  const sortedRankings = [...rankings].sort((a, b) => {
    if (sortBy === 'total') return b.total - a.total;
    return b[sortBy] - a[sortBy];
  });

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs text-gray-500 flex-shrink-0">Sort by:</span>
        {(['total', 'Q', 'T', 'L', 'E'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              sortBy === key
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {key === 'total' ? 'Overall' : key}
          </button>
        ))}
      </div>

      {/* Rankings List */}
      <div className="space-y-2">
        {sortedRankings.map((company, i) => {
          const rankStyle = getRankStyle(company.rank);
          const isExpanded = expandedRank === company.rank;

          return (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border overflow-hidden transition-all ${
                rankStyle.bg
              } ${rankStyle.border} ${
                isExpanded ? 'ring-1 ring-blue-500/30' : ''
              }`}
            >
              {/* Main Row */}
              <div
                onClick={() => setExpandedRank(isExpanded ? null : company.rank)}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${rankStyle.bg} ${rankStyle.text}`}
                  >
                    {rankStyle.icon || `#${company.rank}`}
                  </div>

                  {/* Company Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{company.name}</span>
                      {company.change && company.change !== 'same' && (
                        <span
                          className={`flex items-center text-xs ${
                            company.change === 'up' ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {company.change === 'up' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          {company.previousRank && Math.abs(company.rank - company.previousRank)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {company.industry} · {company.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Mini Q/T/L/E */}
                  <div className="hidden md:flex items-center gap-2">
                    <MiniScore label="Q" value={company.Q} color="#3B82F6" />
                    <MiniScore label="T" value={company.T} color="#8B5CF6" />
                    <MiniScore label="L" value={company.L} color="#10B981" />
                    <MiniScore label="E" value={company.E} color="#F59E0B" />
                  </div>

                  {/* Total Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{company.total}</div>
                    <div className="text-xs text-gray-500">score</div>
                  </div>

                  <ChevronRight
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 overflow-hidden"
                  >
                    <div className="p-4 space-y-4">
                      {/* Q/T/L/E Breakdown */}
                      <div className="grid grid-cols-4 gap-3">
                        <ScoreCard
                          label="Quality"
                          value={company.Q}
                          icon={<Target className="w-4 h-4" />}
                          color="#3B82F6"
                        />
                        <ScoreCard
                          label="Timing"
                          value={company.T}
                          icon={<Clock className="w-4 h-4" />}
                          color="#8B5CF6"
                        />
                        <ScoreCard
                          label="Likelihood"
                          value={company.L}
                          icon={<Percent className="w-4 h-4" />}
                          color="#10B981"
                        />
                        <ScoreCard
                          label="Effort"
                          value={company.E}
                          icon={<Zap className="w-4 h-4" />}
                          color="#F59E0B"
                        />
                      </div>

                      {/* Key Signal */}
                      <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-300">{company.signal}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewDetails?.(company)}
                          className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors"
                        >
                          View Full Profile
                        </button>
                        <button
                          onClick={() => onCompanySelect?.(company)}
                          className="flex-1 py-2 rounded-lg text-sm text-white transition-colors"
                          style={{
                            background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
                          }}
                        >
                          Start Outreach
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Mini Score Badge
function MiniScore({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs" style={{ color }}>
        {label}
      </span>
      <span className="text-xs font-bold text-white">{value}</span>
    </div>
  );
}

// Score Card
function ScoreCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="p-3 bg-slate-900/50 rounded-lg text-center">
      <div
        className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-2"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="text-lg font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

export default RankingObject;
