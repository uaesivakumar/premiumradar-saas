'use client';

/**
 * Intelligence Page - EB Journey Fix
 *
 * Now properly routes between:
 * - Employee Banking: Shows EBJourneyStages + EBKPIPanel
 * - Generic: Shows IntelligenceDashboard
 *
 * Uses useSalesContext() for vertical/subVertical context
 */

import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { ContextBadge } from '@/components/dashboard/ContextBadge';
import { EBJourneyStages } from '@/components/intelligence/EBJourneyStages';
import { EBKPIPanel } from '@/components/intelligence/EBKPIPanel';
import { IntelligenceDashboard } from '@/components/intelligence';
import { Sparkles } from 'lucide-react';

export default function IntelligencePage() {
  // Get sales context
  const { vertical, subVertical, subVerticalName, regionsDisplay } = useSalesContext();

  // Determine if we're in Employee Banking mode
  const isEmployeeBanking = vertical === 'banking' && subVertical === 'employee-banking';

  // ==========================================================================
  // EMPLOYEE BANKING INTELLIGENCE VIEW
  // ==========================================================================

  if (isEmployeeBanking) {
    // Mock progress data (in production, fetch from API)
    const mockProgress = [
      { stageId: 'discovery', completed: 45, inProgress: 12, total: 100 },
      { stageId: 'enrichment', completed: 30, inProgress: 8, total: 45 },
      { stageId: 'scoring', completed: 22, inProgress: 5, total: 30 },
      { stageId: 'outreach', completed: 10, inProgress: 8, total: 22 },
      { stageId: 'engagement', completed: 3, inProgress: 4, total: 10 },
    ];

    // Mock KPI actuals (in production, fetch from API)
    const mockActuals = [
      { product: 'Payroll Accounts', current: 15, previousPeriod: 12 },
      { product: 'Employee Benefits', current: 380000, previousPeriod: 320000 },
    ];

    return (
      <div className="h-full overflow-auto p-6 space-y-6">
        {/* Context Banner */}
        <ContextBadge />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Employee Banking Intelligence
            </h1>
            <p className="text-gray-500 mt-1">
              Pipeline stages and KPIs for {subVerticalName} in {regionsDisplay}
            </p>
          </div>

          {/* Config Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
            <Sparkles className="w-4 h-4" />
            <span>EB Intelligence Active</span>
          </div>
        </div>

        {/* Journey Stages */}
        <EBJourneyStages
          progress={mockProgress}
          activeStageId="scoring"
          onStageClick={(stageId) => console.log('Stage clicked:', stageId)}
        />

        {/* KPI Panel */}
        <EBKPIPanel
          actuals={mockActuals}
          periodLabel="Q1 2024"
        />

        {/* Additional Intelligence Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Signals */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top EB Signals This Week</h3>
            <div className="space-y-3">
              {[
                { name: 'Emirates Airlines', signal: 'Hiring 3,000 cabin crew', score: 92 },
                { name: 'G42', signal: '45% headcount growth', score: 95 },
                { name: 'ADNOC Group', signal: 'New subsidiary launch', score: 87 },
                { name: 'Etihad Airways', signal: 'Route expansion hiring', score: 85 },
                { name: 'Hilton UAE', signal: '800 positions for new hotels', score: 84 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.signal}</div>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{item.score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Opportunity Breakdown</h3>
            <div className="space-y-4">
              {[
                { region: 'Dubai', employers: 156, signals: 423, growth: '+18%' },
                { region: 'Abu Dhabi', employers: 89, signals: 267, growth: '+22%' },
                { region: 'Sharjah', employers: 34, signals: 78, growth: '+8%' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-medium text-gray-900">{item.region}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{item.employers} employers</span>
                    <span className="text-gray-500">{item.signals} signals</span>
                    <span className="text-green-600 font-medium">{item.growth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // GENERIC INTELLIGENCE VIEW (fallback)
  // ==========================================================================

  return (
    <div className="h-full overflow-auto p-6">
      <ContextBadge />
      <IntelligenceDashboard vertical={vertical} />
    </div>
  );
}
