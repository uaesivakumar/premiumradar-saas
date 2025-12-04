'use client';

/**
 * Discovery Page - EB Journey Fix
 *
 * Now properly routes between:
 * - Employee Banking: Shows EMPLOYERS with hiring/payroll signals
 * - Generic Banking: Shows BANKS with digital transformation signals
 *
 * Uses:
 * - useSalesContext() for vertical/subVertical/regions
 * - useVerticalConfig() for EB-specific signal configs
 * - EBDiscoveryCard for Employee Banking cards
 */

// Force dynamic rendering - uses React Query hooks
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUpDown, Sparkles, Loader2 } from 'lucide-react';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useVerticalConfig } from '@/lib/intelligence/hooks/useVerticalConfig';
import { generateEBEmployers, scoreEBEmployer } from '@/lib/discovery/eb-employers';
import { EBDiscoveryCard, type EBCompanyData } from '@/components/discovery/EBDiscoveryCard';
import { ContextBadge } from '@/components/dashboard/ContextBadge';

// Legacy imports for generic banking (fallback)
import { DiscoveryView } from '@/components/discovery';
import { QTLEEngine } from '@/lib/scoring';
import type { BankingCompanyProfile, QTLEScore, BankingSignal } from '@/lib/scoring/types';
import { BANKING_SIGNAL_LIBRARY } from '@/lib/scoring/banking-signals';
import { GCC_REGIONAL_MULTIPLIERS } from '@/lib/scoring/regional-weights';
import { getScoringWeightsForVertical } from '@/lib/vertical';

// =============================================================================
// GENERIC BANKING MOCK DATA (fallback for non-EB)
// =============================================================================

const generateMockBanks = (): BankingCompanyProfile[] => [
  {
    id: '1',
    name: 'Emirates NBD',
    industry: 'Banking',
    subIndustry: 'Retail Banking',
    size: 'enterprise',
    region: 'UAE-Dubai',
    country: 'UAE',
    bankingTier: 'tier1',
    regulatoryStatus: 'compliant',
    digitalMaturity: 'leader',
    signals: [
      { ...BANKING_SIGNAL_LIBRARY.digitalBankingLaunch, value: 85, timestamp: new Date() },
      { ...BANKING_SIGNAL_LIBRARY.cloudMigration, value: 70, timestamp: new Date() },
    ] as BankingSignal[],
  },
  {
    id: '2',
    name: 'Abu Dhabi Commercial Bank',
    industry: 'Banking',
    subIndustry: 'Commercial Banking',
    size: 'enterprise',
    region: 'UAE-AbuDhabi',
    country: 'UAE',
    bankingTier: 'tier1',
    regulatoryStatus: 'compliant',
    digitalMaturity: 'fast-follower',
    signals: [
      { ...BANKING_SIGNAL_LIBRARY.legacyModernization, value: 90, timestamp: new Date() },
    ] as BankingSignal[],
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'headcount'>('score');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Get sales context
  const { vertical, subVertical, regions, subVerticalName, regionsDisplay } = useSalesContext();

  // Get vertical config from API
  const { signalConfigs, isLoading: configLoading, isConfigured } = useVerticalConfig();

  // Determine if we're in Employee Banking mode
  const isEmployeeBanking = vertical === 'banking' && subVertical === 'employee-banking';

  // Generate data based on context
  const employers = useMemo(() => {
    if (!isEmployeeBanking) return [];
    const data = generateEBEmployers(regions);
    // Recalculate scores
    return data.map(emp => ({
      ...emp,
      score: scoreEBEmployer(emp),
    })).sort((a, b) => b.score - a.score);
  }, [isEmployeeBanking, regions]);

  // Filter and sort employers
  const filteredEmployers = useMemo(() => {
    let result = [...employers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(emp =>
        emp.name.toLowerCase().includes(query) ||
        emp.industry.toLowerCase().includes(query) ||
        emp.city?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'score':
        result.sort((a, b) => b.score - a.score);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'headcount':
        result.sort((a, b) => (b.headcount || 0) - (a.headcount || 0));
        break;
    }

    return result;
  }, [employers, searchQuery, sortBy]);

  // Handle SIVA actions
  const handleSivaAction = (action: string, company: EBCompanyData) => {
    console.log(`[SIVA Action] ${action} for ${company.name}`);
    // TODO: Integrate with SIVA
  };

  // ==========================================================================
  // EMPLOYEE BANKING VIEW
  // ==========================================================================

  if (isEmployeeBanking) {
    return (
      <div className="space-y-6">
        {/* Context Banner */}
        <ContextBadge />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Employer Discovery
            </h1>
            <p className="text-gray-500 mt-1">
              Find companies hiring in {regionsDisplay} for payroll opportunities
            </p>
          </div>

          {/* Signal Config Status */}
          {isConfigured && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
              <Sparkles className="w-4 h-4" />
              <span>EB Intelligence Active</span>
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employers by name, industry, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="score">Sort by Score</option>
              <option value="headcount">Sort by Headcount</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          {/* Filter button */}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {filteredEmployers.length} employers in {regionsDisplay}
          </span>
          <span>
            Active signals: {signalConfigs.length > 0 ? signalConfigs.map(s => s.name).join(', ') : 'Loading...'}
          </span>
        </div>

        {/* Results Grid */}
        {configLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEmployers.map((employer, index) => (
              <motion.div
                key={employer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EBDiscoveryCard
                  company={employer}
                  rank={index + 1}
                  isSelected={selectedCompany === employer.id}
                  onSelect={setSelectedCompany}
                  onSivaAction={handleSivaAction}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredEmployers.length === 0 && !configLoading && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employers found</h3>
            <p className="text-gray-500">
              Try adjusting your search or region filters
            </p>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // GENERIC BANKING VIEW (fallback)
  // ==========================================================================

  // Use legacy scoring for non-EB
  const scoringWeights = getScoringWeightsForVertical(vertical);
  const engine = new QTLEEngine({
    weights: scoringWeights,
    regionalMultipliers: GCC_REGIONAL_MULTIPLIERS,
    industryAdjustments: {
      Banking: {
        qualitySignals: ['digital-maturity-score', 'regulatory-compliance-status'],
        timingSignals: ['core-banking-renewal-cycle', 'regulatory-deadline-approaching'],
        baseWeight: 1.15,
      },
    },
  });

  const mockBanks = generateMockBanks();
  const bankScores = new Map<string, QTLEScore>();
  mockBanks.forEach((bank) => {
    const score = engine.calculateScore(bank);
    bankScores.set(bank.id, score);
  });

  return (
    <div className="space-y-6">
      <ContextBadge />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bank Discovery</h1>
        <p className="text-gray-500 mt-1">
          Generic banking prospects (not Employee Banking context)
        </p>
      </div>
      <DiscoveryView
        companies={mockBanks}
        scores={bankScores}
        onCompanySelect={(company) => console.log('Selected:', company.name)}
      />
    </div>
  );
}
