'use client';

/**
 * Discovery Page
 *
 * Main discovery interface for finding and ranking companies.
 *
 * P2 VERTICALISATION: Now uses dynamic scoring weights based on sales context vertical.
 */

import { useState, useEffect } from 'react';
import { DiscoveryView } from '@/components/discovery';
import { QTLEEngine } from '@/lib/scoring';
import type { BankingCompanyProfile, QTLEScore, BankingSignal } from '@/lib/scoring/types';
import { BANKING_SIGNAL_LIBRARY } from '@/lib/scoring/banking-signals';
import { GCC_REGIONAL_MULTIPLIERS } from '@/lib/scoring/regional-weights';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';
import { getScoringWeightsForVertical, getUILabelsForVertical } from '@/lib/vertical';

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

export default function DiscoveryPage() {
  const [companies, setCompanies] = useState<BankingCompanyProfile[]>([]);
  const [scores, setScores] = useState<Map<string, QTLEScore>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // P2 VERTICALISATION: Get vertical from sales context
  const vertical = useSalesContextStore(selectVertical);
  const scoringWeights = getScoringWeightsForVertical(vertical);
  const uiLabels = getUILabelsForVertical(vertical);

  useEffect(() => {
    // P2 VERTICALISATION: Initialize scoring engine with vertical-specific weights
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

    // Generate mock data
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
  }, [scoringWeights]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading companies...</div>
      </div>
    );
  }

  return (
    <DiscoveryView
      companies={companies}
      scores={scores}
      onCompanySelect={(company) => {
        console.log('Selected company:', company.name);
      }}
    />
  );
}
