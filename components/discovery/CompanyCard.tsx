'use client';

/**
 * Company Card Component
 *
 * Rich company preview card with key metrics and Q/T/L/E score.
 */

import { motion } from 'framer-motion';
import type { CompanyProfile, BankingCompanyProfile, QTLEScore } from '@/lib/scoring/types';

interface CompanyCardProps {
  company: CompanyProfile | BankingCompanyProfile;
  score?: QTLEScore;
  view?: 'grid' | 'list';
  selected?: boolean;
  onClick?: () => void;
}

const gradeColors = {
  A: 'bg-emerald-500',
  B: 'bg-blue-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-500',
  F: 'bg-red-500',
};

const sizeLabels = {
  startup: 'Startup',
  smb: 'SMB',
  'mid-market': 'Mid-Market',
  enterprise: 'Enterprise',
};

export function CompanyCard({
  company,
  score,
  view = 'grid',
  selected = false,
  onClick,
}: CompanyCardProps) {
  const isBanking = 'bankingTier' in company;

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClick}
        className={`
          flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border
          ${selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'}
          ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        `}
      >
        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{company.name}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span>{company.industry}</span>
            <span>•</span>
            <span>{sizeLabels[company.size]}</span>
            <span>•</span>
            <span>{company.region}</span>
          </div>
        </div>

        {/* Banking Tier Badge */}
        {isBanking && (
          <div className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
            {(company as BankingCompanyProfile).bankingTier.toUpperCase()}
          </div>
        )}

        {/* Score */}
        {score && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{score.composite}</div>
              <div className="text-xs text-gray-500">{score.confidence}% confident</div>
            </div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${gradeColors[score.grade]}`}
            >
              {score.grade}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-xl border overflow-hidden
        ${selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'}
        ${onClick ? 'cursor-pointer hover:shadow-lg transition-all' : ''}
      `}
    >
      {/* Header with Score */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{company.name}</h3>
          <p className="text-sm text-gray-500 truncate">{company.industry}</p>
        </div>

        {score && (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${gradeColors[score.grade]}`}
          >
            {score.grade}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Score Breakdown Mini */}
        {score && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {(['quality', 'timing', 'likelihood', 'engagement'] as const).map((cat) => (
              <div key={cat} className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {score[cat]}
                </div>
                <div className="text-xs text-gray-500 capitalize">{cat.charAt(0)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Size</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {sizeLabels[company.size]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Region</span>
            <span className="font-medium text-gray-900 dark:text-white">{company.region}</span>
          </div>
          {isBanking && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Tier</span>
                <span className="font-medium text-purple-600">
                  {(company as BankingCompanyProfile).bankingTier}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Digital Maturity</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(company as BankingCompanyProfile).digitalMaturity}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Signals Count */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {company.signals.length} signal{company.signals.length !== 1 ? 's' : ''}
            </span>
            {score && (
              <span className="text-gray-500">
                Confidence: <span className="font-medium">{score.confidence}%</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CompanyCard;
