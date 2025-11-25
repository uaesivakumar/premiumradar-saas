/**
 * Company Profile Component
 *
 * Display company information for domain owners.
 */

'use client';

import {
  type CompanyProfile as CompanyProfileType,
  getEmployeeRangeLabel,
  getRevenueRangeLabel,
  getFundingStageLabel,
  getFundingStageColor,
  formatLocation,
  getSocialProfileUrl,
} from '@/lib/discovery';

interface CompanyProfileProps {
  profile: CompanyProfileType;
  compact?: boolean;
  onEnrich?: () => void;
}

export function CompanyProfile({ profile, compact, onEnrich }: CompanyProfileProps) {
  if (compact) {
    return <CompanyProfileCompact profile={profile} />;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{profile.name}</h3>
            <a
              href={`https://${profile.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {profile.domain}
            </a>
          </div>
          <DataQualityBadge score={profile.dataQuality.score} />
        </div>
      </div>

      {/* Description */}
      {profile.description && (
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-gray-600">{profile.description}</p>
        </div>
      )}

      {/* Key Info Grid */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-100">
        <InfoItem
          label="Industry"
          value={profile.industry}
          subValue={profile.subIndustry}
        />
        <InfoItem
          label="Founded"
          value={profile.foundedYear?.toString() || 'Unknown'}
        />
        <InfoItem
          label="Employees"
          value={profile.employeeCount ? getEmployeeRangeLabel(profile.employeeCount) : 'Unknown'}
        />
        <InfoItem
          label="Revenue"
          value={profile.revenue ? getRevenueRangeLabel(profile.revenue) : 'Unknown'}
        />
      </div>

      {/* Funding */}
      {profile.fundingStage && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">Funding Stage</span>
              <div className="flex items-center gap-2 mt-1">
                <FundingBadge stage={profile.fundingStage} />
                {profile.totalFunding && (
                  <span className="text-gray-600">
                    (${(profile.totalFunding / 1000000).toFixed(1)}M total)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500">Location</span>
              <div className="text-gray-900">{formatLocation(profile.headquarters)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Technologies */}
      {profile.technologies.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm text-gray-500 block mb-2">Technologies</span>
          <div className="flex flex-wrap gap-2">
            {profile.technologies.map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Social Profiles */}
      <div className="px-6 py-4 border-b border-gray-100">
        <span className="text-sm text-gray-500 block mb-2">Social Profiles</span>
        <div className="flex flex-wrap gap-3">
          {Object.entries(profile.socialProfiles).map(([platform, handle]) => {
            if (!handle) return null;
            const url = getSocialProfileUrl(
              platform as keyof typeof profile.socialProfiles,
              handle
            );
            return (
              <SocialLink key={platform} platform={platform} url={url || '#'} />
            );
          })}
        </div>
      </div>

      {/* Data Quality */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Data Quality</span>
            <div className="flex items-center gap-4 mt-1">
              <QualityMetric
                label="Completeness"
                value={profile.dataQuality.completeness}
              />
              <QualityMetric
                label="Freshness"
                value={profile.dataQuality.freshness}
              />
              <QualityMetric
                label="Accuracy"
                value={profile.dataQuality.accuracy}
              />
            </div>
          </div>
          {onEnrich && (
            <button
              onClick={onEnrich}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enrich Data
            </button>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Sources: {profile.dataQuality.sources.join(', ')}
        </div>
      </div>
    </div>
  );
}

function CompanyProfileCompact({ profile }: { profile: CompanyProfileType }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{profile.name}</h4>
          <p className="text-sm text-gray-500">{profile.industry}</p>
        </div>
        <DataQualityBadge score={profile.dataQuality.score} small />
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
        {profile.employeeCount && (
          <span>{getEmployeeRangeLabel(profile.employeeCount)}</span>
        )}
        {profile.headquarters.city && (
          <span>{profile.headquarters.city}</span>
        )}
        {profile.fundingStage && (
          <FundingBadge stage={profile.fundingStage} small />
        )}
      </div>
    </div>
  );
}

function DataQualityBadge({ score, small }: { score: number; small?: boolean }) {
  const color =
    score >= 80
      ? 'bg-green-100 text-green-700'
      : score >= 60
        ? 'bg-blue-100 text-blue-700'
        : 'bg-yellow-100 text-yellow-700';

  if (small) {
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${color}`}>
        {score}%
      </span>
    );
  }

  return (
    <div className={`px-3 py-1.5 rounded-lg ${color}`}>
      <div className="text-xs font-medium">Data Quality</div>
      <div className="text-lg font-bold">{score}%</div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div>
      <span className="text-sm text-gray-500 block">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
      {subValue && <span className="text-sm text-gray-500 block">{subValue}</span>}
    </div>
  );
}

function FundingBadge({
  stage,
  small,
}: {
  stage: CompanyProfileType['fundingStage'];
  small?: boolean;
}) {
  if (!stage) return null;

  const colorMap: Record<string, string> = {
    bootstrapped: 'bg-gray-100 text-gray-700',
    'pre-seed': 'bg-purple-100 text-purple-700',
    seed: 'bg-blue-100 text-blue-700',
    'series-a': 'bg-green-100 text-green-700',
    'series-b': 'bg-teal-100 text-teal-700',
    'series-c': 'bg-cyan-100 text-cyan-700',
    'series-d+': 'bg-indigo-100 text-indigo-700',
    public: 'bg-yellow-100 text-yellow-700',
    acquired: 'bg-orange-100 text-orange-700',
  };

  const colorClass = colorMap[stage] || 'bg-gray-100 text-gray-700';

  return (
    <span
      className={`px-2 py-1 rounded font-medium ${colorClass} ${small ? 'text-xs' : 'text-sm'}`}
    >
      {getFundingStageLabel(stage)}
    </span>
  );
}

function SocialLink({ platform, url }: { platform: string; url: string }) {
  const icons: Record<string, string> = {
    linkedin: '💼',
    twitter: '🐦',
    facebook: '📘',
    instagram: '📷',
    youtube: '📺',
    crunchbase: '📊',
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors"
    >
      <span>{icons[platform] || '🔗'}</span>
      <span className="capitalize">{platform}</span>
    </a>
  );
}

function QualityMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{label}:</span>
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
