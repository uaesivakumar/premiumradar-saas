'use client';

/**
 * Scoring Object - Sprint S27
 * Q/T/L/E score visualization card
 */

import { motion } from 'framer-motion';
import { Target, Clock, Percent, Zap, TrendingUp, Info } from 'lucide-react';

interface QTLEScore {
  Q: number; // Quality
  T: number; // Timing
  L: number; // Likelihood
  E: number; // Effort/Engagement
  total: number;
}

interface ScoreExplanation {
  dimension: 'Q' | 'T' | 'L' | 'E';
  factors: string[];
  recommendation?: string;
}

interface ScoringObjectProps {
  companyName: string;
  score: QTLEScore;
  explanations?: ScoreExplanation[];
  onDimensionClick?: (dimension: 'Q' | 'T' | 'L' | 'E') => void;
}

const DIMENSION_CONFIG = {
  Q: {
    name: 'Quality',
    description: 'Does the prospect match your ICP?',
    icon: Target,
    color: '#3B82F6', // blue
    gradient: 'from-blue-500 to-blue-600',
  },
  T: {
    name: 'Timing',
    description: 'Is now the right time to engage?',
    icon: Clock,
    color: '#8B5CF6', // purple
    gradient: 'from-purple-500 to-purple-600',
  },
  L: {
    name: 'Likelihood',
    description: 'Probability of successful conversion',
    icon: Percent,
    color: '#10B981', // green
    gradient: 'from-green-500 to-green-600',
  },
  E: {
    name: 'Effort',
    description: 'Resources required to close',
    icon: Zap,
    color: '#F59E0B', // amber
    gradient: 'from-amber-500 to-amber-600',
  },
};

export function ScoringObject({
  companyName,
  score,
  explanations,
  onDimensionClick,
}: ScoringObjectProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Header with total score */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white">{companyName}</h4>
          <p className="text-sm text-gray-500">Q/T/L/E Analysis</p>
        </div>
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`text-4xl font-bold ${getScoreColor(score.total)}`}
          >
            {score.total}
          </motion.div>
          <p className="text-xs text-gray-500">{getScoreLabel(score.total)}</p>
        </div>
      </div>

      {/* Radar-style visualization */}
      <div className="relative h-48 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-48 h-48">
          {/* Background circles */}
          {[20, 40, 60, 80, 100].map((r) => (
            <circle
              key={r}
              cx="100"
              cy="100"
              r={r * 0.8}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          ))}

          {/* Axis lines */}
          {[0, 90, 180, 270].map((angle) => (
            <line
              key={angle}
              x1="100"
              y1="100"
              x2={100 + 80 * Math.cos((angle * Math.PI) / 180)}
              y2={100 + 80 * Math.sin((angle * Math.PI) / 180)}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Score polygon */}
          <motion.polygon
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            points={`
              ${100},${100 - score.Q * 0.8}
              ${100 + score.T * 0.8},${100}
              ${100},${100 + score.L * 0.8}
              ${100 - score.E * 0.8},${100}
            `}
            fill="url(#scoreGradient)"
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth="2"
          />

          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.3)" />
            </linearGradient>
          </defs>

          {/* Dimension labels */}
          <text x="100" y="15" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
            Q
          </text>
          <text x="185" y="105" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
            T
          </text>
          <text x="100" y="195" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
            L
          </text>
          <text x="15" y="105" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
            E
          </text>
        </svg>
      </div>

      {/* Dimension Bars */}
      <div className="grid grid-cols-2 gap-3">
        {(['Q', 'T', 'L', 'E'] as const).map((dim, i) => {
          const config = DIMENSION_CONFIG[dim];
          const Icon = config.icon;
          const value = score[dim];

          return (
            <motion.button
              key={dim}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              onClick={() => onDimensionClick?.(dim)}
              className="p-3 bg-slate-900/50 hover:bg-slate-800/70 rounded-xl border border-white/5 hover:border-white/10 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{config.name}</p>
                    <p className="text-xs text-gray-500 hidden group-hover:block">
                      {config.description}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold" style={{ color: config.color }}>
                  {value}
                </span>
              </div>

              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ delay: 0.3 + 0.1 * i, duration: 0.5 }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Recommendations */}
      {explanations && explanations.length > 0 && (
        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Key Insights</span>
          </div>
          <ul className="space-y-1">
            {explanations.slice(0, 3).map((exp, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                <TrendingUp className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-gray-300">{DIMENSION_CONFIG[exp.dimension].name}:</strong>{' '}
                  {exp.factors.join(', ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ScoringObject;
