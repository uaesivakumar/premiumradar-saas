'use client';

/**
 * Discovery Page
 *
 * Main discovery interface for finding and ranking companies.
 *
 * VERTICAL FIX: Now reads vertical from sales-context-store
 * and loads vertical-specific data/config accordingly.
 */

import { useState, useEffect } from 'react';
import { DiscoveryView } from '@/components/discovery';
import { QTLEEngine } from '@/lib/scoring';
import type { BankingCompanyProfile, QTLEScore, BankingSignal } from '@/lib/scoring/types';
import { BANKING_SIGNAL_LIBRARY } from '@/lib/scoring/banking-signals';
import { GCC_REGIONAL_MULTIPLIERS } from '@/lib/scoring/regional-weights';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';
import type { Vertical } from '@/lib/intelligence/context/types';

// Mock data for demo - in production this would come from the OS API
const generateMockCompanies = (): BankingCompanyProfile[] => {
  const companies: BankingCompanyProfile[] = [
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
        { ...BANKING_SIGNAL_LIBRARY.websiteVisit, value: 60, timestamp: new Date() },
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
        { ...BANKING_SIGNAL_LIBRARY.regulatoryDeadline, value: 85, timestamp: new Date() },
        { ...BANKING_SIGNAL_LIBRARY.leadershipChange, value: 75, timestamp: new Date() },
      ] as BankingSignal[],
    },
    {
      id: '3',
      name: 'Mashreq Bank',
      industry: 'Banking',
      subIndustry: 'Retail Banking',
      size: 'enterprise',
      region: 'UAE-Dubai',
      country: 'UAE',
      bankingTier: 'tier2',
      regulatoryStatus: 'transitioning',
      digitalMaturity: 'fast-follower',
      signals: [
        { ...BANKING_SIGNAL_LIBRARY.competitorProduct, value: 65, timestamp: new Date() },
        { ...BANKING_SIGNAL_LIBRARY.contentDownload, value: 50, timestamp: new Date() },
      ] as BankingSignal[],
    },
    {
      id: '4',
      name: 'Al Rajhi Bank',
      industry: 'Banking',
      subIndustry: 'Islamic Banking',
      size: 'enterprise',
      region: 'KSA-Riyadh',
      country: 'Saudi Arabia',
      bankingTier: 'tier1',
      regulatoryStatus: 'compliant',
      digitalMaturity: 'mainstream',
      signals: [
        { ...BANKING_SIGNAL_LIBRARY.marketExpansion, value: 80, timestamp: new Date() },
        { ...BANKING_SIGNAL_LIBRARY.budgetApproval, value: 70, timestamp: new Date() },
        { ...BANKING_SIGNAL_LIBRARY.eventAttendance, value: 55, timestamp: new Date() },
      ] as BankingSignal[],
    },
    {
      id: '5',
      name: 'Saudi National Bank',
      industry: 'Banking',
      subIndustry: 'Commercial Banking',
      size: 'enterprise',
      region: 'KSA-Riyadh',
      country: 'Saudi Arabia',
      bankingTier: 'tier1',
      regulatoryStatus: 'compliant',
      digitalMaturity: 'fast-follower',
      signals: [
        { ...BANKING_SIGNAL_LIBRARY.digitalBankingLaunch, value: 75, timestamp: new Date() },
        { ...BANKING_SIGNAL_LIBRARY.regulatoryDeadline, value: 80, timestamp: new Date() },
      ] as BankingSignal[],
    },
    {
      id: '6',
      name: 'Liv Digital Bank',
      industry: 'Banking',
      subIndustry: 'Digital Banking',
      size: 'startup',
      region: 'UAE-Dubai',
      country: 'UAE',
      bankingTier: 'challenger',
      regulatoryStatus: 'compliant',
      digitalMaturity: 'leader',
      signals: [
        { ...BANKING_SIGNAL_LIBRARY.websiteVisit, value: 80, timestamp: new Date() },
        { ...BANKING_SIGNAL_LIBRARY.contentDownload, value: 70, timestamp: new Date() },
      ] as BankingSignal[],
    },
    {
      id: '7',
      name: 'Qatar National Bank',
      industry: 'Banking',
      subIndustry: 'Retail Banking',
      size: 'enterprise',
      region: 'Qatar',
      country: 'Qatar',
      bankingTier: 'tier1',
      regulatoryStatus: 'compliant',
      digitalMaturity: 'mainstream',
      signals: [
        { ...BANKING_SIGNAL_LIBRARY.cloudMigration, value: 60, timestamp: new Date() },
      ] as BankingSignal[],
    },
    {
      id: '8',
      name: 'Bahrain Islamic Bank',
      industry: 'Banking',
      subIndustry: 'Islamic Banking',
      size: 'mid-market',
      region: 'Bahrain',
      country: 'Bahrain',
      bankingTier: 'tier2',
      regulatoryStatus: 'transitioning',
      digitalMaturity: 'laggard',
      signals: [
        { ...BANKING_SIGNAL_LIBRARY.legacyModernization, value: 95, timestamp: new Date() },
        { ...BANKING_SIGNAL_LIBRARY.regulatoryDeadline, value: 90, timestamp: new Date() },
        { ...BANKING_SIGNAL_LIBRARY.leadershipChange, value: 85, timestamp: new Date() },
      ] as BankingSignal[],
    },
  ];

  return companies;
};

/**
 * Get vertical-specific scoring engine configuration
 */
function getVerticalScoringConfig(vertical: Vertical) {
  const configs: Record<Vertical, object> = {
    'banking': {
      weights: {
        quality: 0.25,
        timing: 0.30, // Higher timing weight for banking
        likelihood: 0.25,
        engagement: 0.20,
      },
      regionalMultipliers: GCC_REGIONAL_MULTIPLIERS,
      industryAdjustments: {
        Banking: {
          qualitySignals: ['digital-maturity-score', 'regulatory-compliance-status'],
          timingSignals: ['core-banking-renewal-cycle', 'regulatory-deadline-approaching'],
          baseWeight: 1.15,
        },
      },
    },
    'insurance': {
      weights: {
        quality: 0.30,
        timing: 0.25,
        likelihood: 0.25,
        engagement: 0.20,
      },
      regionalMultipliers: GCC_REGIONAL_MULTIPLIERS,
      industryAdjustments: {
        Insurance: {
          qualitySignals: ['claims-ratio', 'customer-retention'],
          timingSignals: ['policy-renewal-cycle', 'regulatory-changes'],
          baseWeight: 1.10,
        },
      },
    },
    'real-estate': {
      weights: {
        quality: 0.20,
        timing: 0.35, // Timing very important in real estate
        likelihood: 0.25,
        engagement: 0.20,
      },
      regionalMultipliers: GCC_REGIONAL_MULTIPLIERS,
      industryAdjustments: {
        RealEstate: {
          qualitySignals: ['property-value-trend', 'location-score'],
          timingSignals: ['lease-expiry', 'market-cycle'],
          baseWeight: 1.20,
        },
      },
    },
    'recruitment': {
      weights: {
        quality: 0.25,
        timing: 0.25,
        likelihood: 0.30, // Higher likelihood weight for recruitment
        engagement: 0.20,
      },
      regionalMultipliers: GCC_REGIONAL_MULTIPLIERS,
      industryAdjustments: {
        Recruitment: {
          qualitySignals: ['hiring-velocity', 'company-growth'],
          timingSignals: ['budget-cycle', 'project-kickoff'],
          baseWeight: 1.10,
        },
      },
    },
    'saas-sales': {
      weights: {
        quality: 0.25,
        timing: 0.25,
        likelihood: 0.25,
        engagement: 0.25, // Balanced for SaaS
      },
      regionalMultipliers: GCC_REGIONAL_MULTIPLIERS,
      industryAdjustments: {
        SaaS: {
          qualitySignals: ['tech-stack-fit', 'budget-indicators'],
          timingSignals: ['contract-renewal', 'funding-round'],
          baseWeight: 1.15,
        },
      },
    },
  };

  return configs[vertical] || configs['banking'];
}

/**
 * Get vertical display name
 */
function getVerticalDisplayName(vertical: Vertical): string {
  const names: Record<Vertical, string> = {
    'banking': 'Banking',
    'insurance': 'Insurance',
    'real-estate': 'Real Estate',
    'recruitment': 'Recruitment',
    'saas-sales': 'SaaS Sales',
  };
  return names[vertical] || vertical;
}

export default function DiscoveryPage() {
  // Read vertical from sales context (synced from onboarding)
  const vertical = useSalesContextStore(selectVertical);

  const [companies, setCompanies] = useState<BankingCompanyProfile[]>([]);
  const [scores, setScores] = useState<Map<string, QTLEScore>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize scoring engine with vertical-specific config
    const verticalConfig = getVerticalScoringConfig(vertical);
    const engine = new QTLEEngine(verticalConfig);

    // Generate mock data
    // Note: Currently only banking has full mock data
    // Other verticals will show banking data as placeholder until OS integration
    const mockCompanies = generateMockCompanies();
    setCompanies(mockCompanies);

    // Calculate scores
    const scoreMap = new Map<string, QTLEScore>();
    mockCompanies.forEach((company) => {
      const score = engine.calculateScore(company);
      scoreMap.set(company.id, score);
    });
    setScores(scoreMap);

    setIsLoading(false);
  }, [vertical]); // Re-run when vertical changes

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Vertical indicator */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Discovery for:</span>
          <span className="px-2 py-0.5 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            {getVerticalDisplayName(vertical)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <DiscoveryView
          companies={companies}
          scores={scores}
          onCompanySelect={(company) => {
            console.log('Selected company:', company.name);
          }}
        />
      </div>
    </div>
  );
}
