'use client';

/**
 * EBDiscoveryCard - EB Journey Phase 4.3
 *
 * Employee Banking-specific discovery card that shows:
 * - Company hiring/expansion signals as payroll opportunities
 * - Headcount and growth indicators
 * - Banking tier and decision maker access
 * - SIVA quick actions for outreach
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  TrendingUp,
  MapPin,
  Zap,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Sparkles,
  ExternalLink,
  BadgeCheck,
} from 'lucide-react';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useVerticalConfig, type SignalConfig } from '@/lib/intelligence/hooks/useVerticalConfig';

// =============================================================================
// TYPES
// =============================================================================

export interface EBSignal {
  type: string;
  title: string;
  description?: string;
  confidence: number;
  source?: string;
  date?: string;
}

export interface EBCompanyData {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  size: 'startup' | 'smb' | 'mid-market' | 'enterprise';
  headcount?: number;
  headcountGrowth?: number; // percentage growth
  region: string;
  city?: string;
  description?: string;
  signals: EBSignal[];
  score: number;
  bankingTier?: 'tier1' | 'tier2' | 'tier3' | 'government' | 'mnc';
  decisionMaker?: {
    name: string;
    title: string;
    linkedin?: string;
  };
  freshness: 'fresh' | 'recent' | 'stale';
}

interface EBDiscoveryCardProps {
  company: EBCompanyData;
  rank?: number;
  isSelected?: boolean;
  onSelect?: (companyId: string) => void;
  onSivaAction?: (action: string, company: EBCompanyData) => void;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SIZE_LABELS: Record<string, string> = {
  startup: '1-50',
  smb: '51-200',
  'mid-market': '201-1000',
  enterprise: '1000+',
};

const TIER_LABELS: Record<string, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3',
  government: 'Govt',
  mnc: 'MNC',
};

const TIER_COLORS: Record<string, string> = {
  tier1: 'bg-purple-100 text-purple-700',
  tier2: 'bg-blue-100 text-blue-700',
  tier3: 'bg-green-100 text-green-700',
  government: 'bg-amber-100 text-amber-700',
  mnc: 'bg-indigo-100 text-indigo-700',
};

const FRESHNESS_STYLES = {
  fresh: { bg: 'bg-green-100', text: 'text-green-700', label: 'New' },
  recent: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Recent' },
  stale: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Older' },
};

const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  'hiring-expansion': <Users className="w-3.5 h-3.5" />,
  'office-opening': <Building2 className="w-3.5 h-3.5" />,
  'headcount-jump': <TrendingUp className="w-3.5 h-3.5" />,
  'subsidiary-creation': <Building2 className="w-3.5 h-3.5" />,
  'market-entry': <Zap className="w-3.5 h-3.5" />,
  'leadership-hiring': <Users className="w-3.5 h-3.5" />,
  'funding-round': <TrendingUp className="w-3.5 h-3.5" />,
};

// =============================================================================
// COMPONENT
// =============================================================================

export function EBDiscoveryCard({
  company,
  rank,
  isSelected = false,
  onSelect,
  onSivaAction,
  className = '',
}: EBDiscoveryCardProps) {
  const { subVertical } = useSalesContext();
  const { getSignalConfig } = useVerticalConfig();
  const [isExpanded, setIsExpanded] = useState(false);

  const freshness = FRESHNESS_STYLES[company.freshness];
  const tierClass = company.bankingTier ? TIER_COLORS[company.bankingTier] : '';

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // Get signal display info from VerticalConfig
  const getSignalDisplay = (signal: EBSignal) => {
    const config = getSignalConfig(signal.type);
    return {
      name: config?.name || signal.title,
      description: config?.description || signal.description,
      icon: SIGNAL_ICONS[signal.type] || <Zap className="w-3.5 h-3.5" />,
    };
  };

  // EB-specific opportunity label
  const getOpportunityLabel = () => {
    if (subVertical === 'employee-banking') {
      const hiringSignals = company.signals.filter(
        (s) => s.type === 'hiring-expansion' || s.type === 'headcount-jump'
      );
      if (hiringSignals.length > 0) {
        return 'Payroll Opportunity';
      }
      if (company.signals.some((s) => s.type === 'office-opening' || s.type === 'market-entry')) {
        return 'New Accounts Opportunity';
      }
    }
    return 'Sales Opportunity';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect?.(company.id)}
      className={`
        bg-white rounded-xl border overflow-hidden transition-all
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
        ${onSelect ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        {/* Rank */}
        {rank && (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-gray-600">#{rank}</span>
          </div>
        )}

        {/* Company Logo/Initial */}
        {company.logo ? (
          <img
            src={company.logo}
            alt={company.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{company.name[0]}</span>
          </div>
        )}

        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${freshness.bg} ${freshness.text}`}>
              {freshness.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <span>{company.industry}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {company.city || company.region}
            </span>
            {company.bankingTier && (
              <>
                <span>•</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${tierClass}`}>
                  {TIER_LABELS[company.bankingTier]}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Score */}
        <div className={`flex-shrink-0 px-3 py-2 rounded-lg border ${getScoreColor(company.score)}`}>
          <div className="text-2xl font-bold">{company.score}</div>
          <div className="text-xs opacity-70">Score</div>
        </div>
      </div>

      {/* EB Metrics Row */}
      <div className="px-4 pb-3 flex items-center gap-4 text-sm">
        {/* Headcount */}
        {company.headcount && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{company.headcount.toLocaleString()}</span>
            {company.headcountGrowth !== undefined && company.headcountGrowth > 0 && (
              <span className="text-green-600 text-xs flex items-center">
                <TrendingUp className="w-3 h-3" />
                +{company.headcountGrowth}%
              </span>
            )}
          </div>
        )}

        {/* Size */}
        <div className="flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{SIZE_LABELS[company.size]} employees</span>
        </div>

        {/* Opportunity Label */}
        <div className="ml-auto flex items-center gap-1 text-blue-600">
          <BadgeCheck className="w-4 h-4" />
          <span className="text-xs font-medium">{getOpportunityLabel()}</span>
        </div>
      </div>

      {/* Signals Preview */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {company.signals.slice(0, 3).map((signal, i) => {
            const display = getSignalDisplay(signal);
            return (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                title={display.description}
              >
                {display.icon}
                <span>{display.name}</span>
              </div>
            );
          })}
          {company.signals.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{company.signals.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="w-full px-4 py-2 border-t border-gray-100 flex items-center justify-center gap-1 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Less details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            More details
          </>
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-4 space-y-4">
              {/* Description */}
              {company.description && (
                <p className="text-sm text-gray-600">{company.description}</p>
              )}

              {/* Decision Maker */}
              {company.decisionMaker && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {company.decisionMaker.name}
                    </div>
                    <div className="text-sm text-gray-500">{company.decisionMaker.title}</div>
                  </div>
                  {company.decisionMaker.linkedin && (
                    <a
                      href={company.decisionMaker.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {/* All Signals */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  All Signals ({company.signals.length})
                </h4>
                <div className="space-y-2">
                  {company.signals.map((signal, i) => {
                    const display = getSignalDisplay(signal);
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-sm"
                      >
                        <div className="mt-0.5 text-blue-600">{display.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{display.name}</div>
                          {display.description && (
                            <div className="text-gray-500 text-xs">{display.description}</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {Math.round(signal.confidence * 100)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SIVA Quick Actions */}
              {onSivaAction && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSivaAction('draft-email', company);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Draft Email
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSivaAction('prep-call', company);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Prep Call
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSivaAction('ask-siva', company);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ask SIVA
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default EBDiscoveryCard;
