'use client';

/**
 * VerticalInsightPanel - Sprint P3
 * Displays vertical-specific intelligence insights
 *
 * Adapts content based on active vertical:
 * - Banking: Company signals, payroll opportunities
 * - Insurance: Life events, coverage gaps
 * - Real Estate: Buyer/seller signals, property matches
 * - Recruitment: Candidate availability, hiring needs
 * - SaaS Sales: Tech signals, buying intent
 */

import { useMemo } from 'react';
import {
  Building2,
  Shield,
  Home,
  Users,
  Layers,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';
import type { Vertical } from '@/lib/intelligence/context/types';

// =============================================================================
// TYPES
// =============================================================================

interface InsightData {
  topSignals: SignalInsight[];
  patterns: PatternInsight[];
  opportunities: OpportunityInsight[];
  recommendations: string[];
}

interface SignalInsight {
  id: string;
  name: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  importance: 'high' | 'medium' | 'low';
}

interface PatternInsight {
  id: string;
  name: string;
  matches: number;
  action: string;
}

interface OpportunityInsight {
  id: string;
  title: string;
  score: number;
  signals: string[];
}

// =============================================================================
// VERTICAL CONFIGURATIONS
// =============================================================================

const VERTICAL_CONFIGS: Record<Vertical, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  title: string;
  signalLabel: string;
  targetLabel: string;
}> = {
  'banking': {
    icon: Building2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    title: 'Banking Intelligence',
    signalLabel: 'Company Signals',
    targetLabel: 'Corporate Accounts',
  },
  'insurance': {
    icon: Shield,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    title: 'Insurance Intelligence',
    signalLabel: 'Life Event Signals',
    targetLabel: 'Individuals',
  },
  'real-estate': {
    icon: Home,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    title: 'Real Estate Intelligence',
    signalLabel: 'Buyer/Seller Signals',
    targetLabel: 'Property Seekers',
  },
  'recruitment': {
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    title: 'Recruitment Intelligence',
    signalLabel: 'Talent Signals',
    targetLabel: 'Candidates & Companies',
  },
  'saas-sales': {
    icon: Layers,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    title: 'SaaS Sales Intelligence',
    signalLabel: 'Buying Intent Signals',
    targetLabel: 'Target Accounts',
  },
};

// Mock data generator based on vertical
function getMockInsightData(vertical: Vertical): InsightData {
  const baseData: Record<Vertical, InsightData> = {
    'banking': {
      topSignals: [
        { id: '1', name: 'Hiring Expansion', count: 24, trend: 'up', importance: 'high' },
        { id: '2', name: 'Funding Round', count: 12, trend: 'up', importance: 'high' },
        { id: '3', name: 'Office Opening', count: 8, trend: 'stable', importance: 'medium' },
        { id: '4', name: 'Digital Transformation', count: 15, trend: 'up', importance: 'high' },
      ],
      patterns: [
        { id: '1', name: 'Expansion + Payroll', matches: 6, action: 'Reach out with employee banking' },
        { id: '2', name: 'Post-Funding Growth', matches: 4, action: 'Present treasury solutions' },
      ],
      opportunities: [
        { id: '1', title: 'TechCorp Industries', score: 85, signals: ['Funding', 'Hiring'] },
        { id: '2', title: 'Global Logistics LLC', score: 78, signals: ['Expansion', 'New Office'] },
      ],
      recommendations: [
        'Focus on funded companies with hiring surge',
        'Prioritize digital-first companies for modern banking',
        'Target companies entering UAE market',
      ],
    },
    'insurance': {
      topSignals: [
        { id: '1', name: 'New Parent', count: 45, trend: 'up', importance: 'high' },
        { id: '2', name: 'Marriage', count: 32, trend: 'stable', importance: 'high' },
        { id: '3', name: 'Home Purchase', count: 28, trend: 'up', importance: 'high' },
        { id: '4', name: 'Job Change', count: 56, trend: 'up', importance: 'medium' },
      ],
      patterns: [
        { id: '1', name: 'Growing Family Protection', matches: 18, action: 'Life insurance priority outreach' },
        { id: '2', name: 'Major Life Transition', matches: 12, action: 'Bundle coverage review' },
      ],
      opportunities: [
        { id: '1', title: 'Ahmed K. (New Parent)', score: 92, signals: ['New Baby', 'Promotion'] },
        { id: '2', title: 'Sara M. (Newlywed)', score: 88, signals: ['Marriage', 'Home Purchase'] },
      ],
      recommendations: [
        'Prioritize new parents within 60 days of birth',
        'Bundle offerings for multiple life events',
        'Focus on high-income professionals with gaps',
      ],
    },
    'real-estate': {
      topSignals: [
        { id: '1', name: 'Lease Expiring', count: 67, trend: 'up', importance: 'high' },
        { id: '2', name: 'Job Relocation', count: 34, trend: 'up', importance: 'high' },
        { id: '3', name: 'Family Growth', count: 23, trend: 'stable', importance: 'high' },
        { id: '4', name: 'Pre-Approval', count: 19, trend: 'up', importance: 'high' },
      ],
      patterns: [
        { id: '1', name: 'Relocation Buyer', matches: 14, action: 'Urgent property tours' },
        { id: '2', name: 'First-Time Buyer Ready', matches: 22, action: 'Schedule consultation' },
      ],
      opportunities: [
        { id: '1', title: 'Johnson Family', score: 89, signals: ['Relocation', 'Pre-Approved'] },
        { id: '2', title: 'Mike T. (First-Time)', score: 82, signals: ['Lease Expiring', 'Income Up'] },
      ],
      recommendations: [
        'Fast-track relocation buyers with 30-day timelines',
        'Convert renters facing rent increases',
        'Target long-term homeowners for listing opportunities',
      ],
    },
    'recruitment': {
      topSignals: [
        { id: '1', name: 'Open to Work', count: 156, trend: 'up', importance: 'high' },
        { id: '2', name: 'Mass Hiring', count: 28, trend: 'up', importance: 'high' },
        { id: '3', name: 'Executive Departure', count: 12, trend: 'stable', importance: 'high' },
        { id: '4', name: 'Recent Layoff', count: 89, trend: 'up', importance: 'medium' },
      ],
      patterns: [
        { id: '1', name: 'Passive Star Candidate', matches: 8, action: 'Personalized outreach' },
        { id: '2', name: 'Urgent Backfill', matches: 5, action: 'Present shortlist in 48h' },
      ],
      opportunities: [
        { id: '1', title: 'TechStart Inc (10 roles)', score: 91, signals: ['Funding', 'Mass Hiring'] },
        { id: '2', title: 'Senior Dev Candidate', score: 88, signals: ['Rare Skills', 'Open'] },
      ],
      recommendations: [
        'Move fast on available quality candidates',
        'Engage funded companies for retained search',
        'Focus on backfill urgency for quick wins',
      ],
    },
    'saas-sales': {
      topSignals: [
        { id: '1', name: 'Trial Signup', count: 45, trend: 'up', importance: 'high' },
        { id: '2', name: 'Competitor Research', count: 34, trend: 'up', importance: 'high' },
        { id: '3', name: 'Tech Stack Change', count: 23, trend: 'stable', importance: 'high' },
        { id: '4', name: 'Funding Round', count: 18, trend: 'up', importance: 'high' },
      ],
      patterns: [
        { id: '1', name: 'Trial Conversion', matches: 12, action: 'Schedule success call' },
        { id: '2', name: 'Competitor Displacement', matches: 8, action: 'Migration-focused outreach' },
      ],
      opportunities: [
        { id: '1', title: 'CloudFirst Corp', score: 94, signals: ['Trial Active', 'Funding'] },
        { id: '2', title: 'DataDriven Inc', score: 87, signals: ['Competitor Churn', 'ICP Match'] },
      ],
      recommendations: [
        'Prioritize active trials with multi-stakeholder engagement',
        'Target recently funded companies for expansion',
        'Engage competitor customers showing churn signals',
      ],
    },
  };

  return baseData[vertical];
}

// =============================================================================
// COMPONENTS
// =============================================================================

function SignalCard({ signal, verticalColor }: {
  signal: SignalInsight;
  verticalColor: string;
}) {
  const TrendIcon = signal.trend === 'up' ? TrendingUp :
    signal.trend === 'down' ? AlertCircle : Zap;

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          signal.importance === 'high' ? 'bg-red-400' :
          signal.importance === 'medium' ? 'bg-amber-400' : 'bg-gray-400'
        }`} />
        <span className="text-sm text-gray-200">{signal.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{signal.count}</span>
        <TrendIcon className={`w-4 h-4 ${
          signal.trend === 'up' ? 'text-green-400' :
          signal.trend === 'down' ? 'text-red-400' : 'text-gray-400'
        }`} />
      </div>
    </div>
  );
}

function PatternCard({ pattern }: { pattern: PatternInsight }) {
  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{pattern.name}</span>
        <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-300">
          {pattern.matches} matches
        </span>
      </div>
      <p className="text-xs text-gray-400">{pattern.action}</p>
    </div>
  );
}

function OpportunityCard({ opportunity, verticalColor, bgColor }: {
  opportunity: OpportunityInsight;
  verticalColor: string;
  bgColor: string;
}) {
  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{opportunity.title}</span>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${verticalColor}`}>
          {opportunity.score}
        </div>
      </div>
      <div className="flex gap-2">
        {opportunity.signals.map((signal) => (
          <span
            key={signal}
            className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-400"
          >
            {signal}
          </span>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VerticalInsightPanel() {
  const vertical = useSalesContextStore(selectVertical);
  const config = VERTICAL_CONFIGS[vertical];
  const data = useMemo(() => getMockInsightData(vertical), [vertical]);

  const Icon = config.icon;

  return (
    <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${config.bgColor} border-b border-white/10`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-white font-medium">{config.title}</h3>
            <p className="text-xs text-gray-400">
              Targeting: {config.targetLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Top Signals */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">
              {config.signalLabel}
            </h4>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <div className="space-y-2">
            {data.topSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                verticalColor={config.color}
              />
            ))}
          </div>
        </section>

        {/* Patterns Detected */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-medium text-gray-300">
              Patterns Detected
            </h4>
          </div>
          <div className="space-y-2">
            {data.patterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </section>

        {/* Top Opportunities */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-green-400" />
            <h4 className="text-sm font-medium text-gray-300">
              Top Opportunities
            </h4>
          </div>
          <div className="space-y-2">
            {data.opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                verticalColor={config.color}
                bgColor={config.bgColor}
              />
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section>
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            SIVA Recommendations
          </h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                {rec}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default VerticalInsightPanel;
