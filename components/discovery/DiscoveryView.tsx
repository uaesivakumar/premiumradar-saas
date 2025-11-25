'use client';

/**
 * Discovery View Component
 *
 * Main discovery interface with list/grid views and company ranking.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CompanyCard } from './CompanyCard';
import { FilterBar, type DiscoveryFilters } from './FilterBar';
import { ScoreCard } from '../scoring/ScoreCard';
import { ScoreBreakdown } from '../scoring/ScoreBreakdown';
import type { CompanyProfile, BankingCompanyProfile, QTLEScore } from '@/lib/scoring/types';

interface DiscoveryViewProps {
  companies: (CompanyProfile | BankingCompanyProfile)[];
  scores: Map<string, QTLEScore>;
  onCompanySelect?: (company: CompanyProfile | BankingCompanyProfile) => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'composite' | 'quality' | 'timing' | 'likelihood' | 'engagement' | 'name';

const initialFilters: DiscoveryFilters = {
  grades: ['A', 'B', 'C', 'D', 'F'],
  minScore: 0,
  maxScore: 100,
  industries: [],
  regions: [],
  sizes: [],
  bankingTiers: [],
  digitalMaturity: [],
  hasSignals: [],
};

export function DiscoveryView({ companies, scores, onCompanySelect }: DiscoveryViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('composite');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<DiscoveryFilters>(initialFilters);
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | BankingCompanyProfile | null>(null);

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    let result = companies.filter((company) => {
      const score = scores.get(company.id);

      // Grade filter
      if (score && !filters.grades.includes(score.grade)) return false;

      // Score range filter
      if (score && (score.composite < filters.minScore || score.composite > filters.maxScore)) {
        return false;
      }

      // Region filter
      if (filters.regions.length > 0 && !filters.regions.includes(company.region)) {
        return false;
      }

      // Banking tier filter
      if (filters.bankingTiers.length > 0 && 'bankingTier' in company) {
        if (!filters.bankingTiers.includes((company as BankingCompanyProfile).bankingTier)) {
          return false;
        }
      }

      // Digital maturity filter
      if (filters.digitalMaturity.length > 0 && 'digitalMaturity' in company) {
        if (!filters.digitalMaturity.includes((company as BankingCompanyProfile).digitalMaturity)) {
          return false;
        }
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      const scoreA = scores.get(a.id);
      const scoreB = scores.get(b.id);

      if (sortBy === 'name') {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }

      if (!scoreA || !scoreB) return 0;

      const diff = scoreA[sortBy] - scoreB[sortBy];
      return sortDirection === 'asc' ? diff : -diff;
    });

    return result;
  }, [companies, scores, filters, sortBy, sortDirection]);

  const handleCompanyClick = (company: CompanyProfile | BankingCompanyProfile) => {
    setSelectedCompany(company);
    onCompanySelect?.(company);
  };

  const selectedScore = selectedCompany ? scores.get(selectedCompany.id) : undefined;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discovery</h1>
            <p className="text-sm text-gray-500">
              {filteredCompanies.length} companies found
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white'
                    : 'text-gray-500'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white'
                    : 'text-gray-500'
                }`}
              >
                List
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="composite">Sort: Overall Score</option>
              <option value="quality">Sort: Quality</option>
              <option value="timing">Sort: Timing</option>
              <option value="likelihood">Sort: Likelihood</option>
              <option value="engagement">Sort: Engagement</option>
              <option value="name">Sort: Name</option>
            </select>

            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {sortDirection === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar currentFilters={filters} onFilterChange={setFilters} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Company List */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  score={scores.get(company.id)}
                  view="grid"
                  selected={selectedCompany?.id === company.id}
                  onClick={() => handleCompanyClick(company)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  score={scores.get(company.id)}
                  view="list"
                  selected={selectedCompany?.id === company.id}
                  onClick={() => handleCompanyClick(company)}
                />
              ))}
            </div>
          )}

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No companies found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedCompany && selectedScore && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedCompany.name}
                </h2>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  ✕
                </button>
              </div>

              <ScoreCard score={selectedScore} size="lg" />

              <div className="mt-4">
                <ScoreBreakdown
                  score={selectedScore}
                  signals={selectedCompany.signals}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default DiscoveryView;
