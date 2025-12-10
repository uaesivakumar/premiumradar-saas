'use client';

/**
 * CompanyHeader - S139: Company Profiles
 *
 * Displays company overview with:
 * - Logo, name, industry
 * - Location and size
 * - QTLE score breakdown
 * - Banking tier badge
 * - Data freshness indicator
 */

import { Building2, MapPin, Users, TrendingUp, Globe, Linkedin, ExternalLink, Clock } from 'lucide-react';

export interface CompanyHeaderProps {
  company: {
    id: string;
    name: string;
    logo?: string;
    industry: string;
    description?: string;
    website?: string;
    linkedin?: string;
    size: 'startup' | 'smb' | 'mid-market' | 'enterprise';
    headcount?: number;
    headcountGrowth?: number;
    region: string;
    city?: string;
    bankingTier?: 'tier1' | 'tier2' | 'tier3' | 'government' | 'mnc';
    freshness: 'fresh' | 'recent' | 'stale';
  };
  score: {
    total: number;
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
  };
  lastUpdated?: string;
}

const SIZE_LABELS: Record<string, string> = {
  startup: '1-50 employees',
  smb: '51-200 employees',
  'mid-market': '201-1000 employees',
  enterprise: '1000+ employees',
};

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  tier1: { label: 'Tier 1', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  tier2: { label: 'Tier 2', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  tier3: { label: 'Tier 3', color: 'bg-green-100 text-green-700 border-green-200' },
  government: { label: 'Government', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  mnc: { label: 'MNC', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

const FRESHNESS_CONFIG = {
  fresh: { label: 'Fresh', color: 'bg-green-100 text-green-700' },
  recent: { label: 'Recent', color: 'bg-yellow-100 text-yellow-700' },
  stale: { label: 'Stale', color: 'bg-gray-100 text-gray-500' },
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-gray-600';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-blue-50 border-blue-200';
  if (score >= 40) return 'bg-yellow-50 border-yellow-200';
  return 'bg-gray-50 border-gray-200';
}

export function CompanyHeader({ company, score, lastUpdated }: CompanyHeaderProps) {
  const freshness = FRESHNESS_CONFIG[company.freshness];
  const tier = company.bankingTier ? TIER_CONFIG[company.bankingTier] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Main Header */}
      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* Company Logo/Avatar */}
          {company.logo ? (
            <img
              src={company.logo}
              alt={company.name}
              className="w-20 h-20 rounded-xl object-cover border border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{company.name[0]}</span>
            </div>
          )}

          {/* Company Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{company.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full ${freshness.color}`}>
                {freshness.label}
              </span>
              {tier && (
                <span className={`text-xs px-2 py-1 rounded-full border ${tier.color}`}>
                  {tier.label}
                </span>
              )}
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-400" />
                {company.industry}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                {company.city ? `${company.city}, ` : ''}{company.region}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400" />
                {company.headcount ? `${company.headcount.toLocaleString()} employees` : SIZE_LABELS[company.size]}
                {company.headcountGrowth !== undefined && company.headcountGrowth > 0 && (
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="w-3 h-3" />
                    +{company.headcountGrowth}%
                  </span>
                )}
              </span>
            </div>

            {/* Description */}
            {company.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{company.description}</p>
            )}

            {/* Links */}
            <div className="flex items-center gap-3">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Globe className="w-4 h-4" />
                  Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {company.linkedin && (
                <a
                  href={company.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Score Card */}
          <div className={`flex-shrink-0 p-4 rounded-xl border ${getScoreBg(score.total)}`}>
            <div className={`text-4xl font-bold mb-1 ${getScoreColor(score.total)}`}>
              {score.total}
            </div>
            <div className="text-xs text-gray-500 mb-3">QTLE Score</div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Q</span>
                <span className="font-medium">{score.quality}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">T</span>
                <span className="font-medium">{score.timing}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">L</span>
                <span className="font-medium">{score.likelihood}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">E</span>
                <span className="font-medium">{score.engagement}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated Footer */}
      {lastUpdated && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
}

export default CompanyHeader;
