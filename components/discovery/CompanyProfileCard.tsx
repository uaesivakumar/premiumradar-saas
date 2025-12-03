/**
 * Company Profile Card Component
 * Sprint S55: Discovery UI
 *
 * Detailed company profile panel with intelligence data.
 */

import React from 'react';
import type { CompanyProfileCardData } from '../../lib/discovery';

interface CompanyProfileCardProps {
  data: CompanyProfileCardData;
  isLoading?: boolean;
}

export function CompanyProfileCard({ data, isLoading = false }: CompanyProfileCardProps) {
  if (isLoading) {
    return <CompanyProfileCardSkeleton />;
  }

  const { company, profile, intelligence, verticalContext, osState } = data;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-4">
          {company.logo ? (
            <img
              src={company.logo}
              alt={company.name}
              className="w-12 h-12 rounded-lg"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xl font-bold text-gray-500">
              {company.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{company.name}</h2>
            <p className="text-sm text-gray-500">{company.industry}</p>
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Company Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Location</span>
            <p className="font-medium text-gray-900">
              {company.location.city ? `${company.location.city}, ` : ''}{company.location.country}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Size</span>
            <p className="font-medium text-gray-900 capitalize">{company.size}</p>
          </div>
          {profile.employees && (
            <div>
              <span className="text-gray-500">Employees</span>
              <p className="font-medium text-gray-900">{profile.employees.toLocaleString()}</p>
            </div>
          )}
          {profile.founded && (
            <div>
              <span className="text-gray-500">Founded</span>
              <p className="font-medium text-gray-900">{profile.founded}</p>
            </div>
          )}
          {profile.revenue && (
            <div>
              <span className="text-gray-500">Revenue</span>
              <p className="font-medium text-gray-900">{profile.revenue}</p>
            </div>
          )}
          {profile.funding && (
            <div>
              <span className="text-gray-500">Funding</span>
              <p className="font-medium text-gray-900">{profile.funding}</p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {(company.description || profile.summary) && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">About</h3>
          <p className="text-sm text-gray-600">{company.description || profile.summary}</p>
        </div>
      )}

      {/* Intelligence Summary */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Intelligence Summary</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total Score</span>
            <span className="font-medium text-gray-900">{intelligence.score.total}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Top Signals</span>
            <span className="font-medium text-gray-900">{intelligence.topSignals.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Top Evidence</span>
            <span className="font-medium text-gray-900">{intelligence.topEvidence.length}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {intelligence.recentActivity && intelligence.recentActivity.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {intelligence.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 text-sm">
                <span className="text-gray-400 text-xs mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </span>
                <span className="text-gray-600">{activity.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vertical Context */}
      {verticalContext && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Vertical Context
            <span className="ml-2 text-xs text-gray-400 capitalize">({verticalContext.vertical})</span>
          </h3>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Relevance Score</span>
            <span className="font-medium text-gray-900">{verticalContext.relevanceScore}</span>
          </div>
          {verticalContext.applicableSignals.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {verticalContext.applicableSignals.map((signal, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded"
                >
                  {signal}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OS Object State */}
      {osState && (
        <div className="p-4 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">OS Object State</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Object ID</span>
              <p className="font-mono text-gray-700 truncate">{osState.objectId}</p>
            </div>
            <div>
              <span className="text-gray-500">State</span>
              <p className="text-gray-700 capitalize">{osState.state}</p>
            </div>
            <div>
              <span className="text-gray-500">Last Processed</span>
              <p className="text-gray-700">{formatRelativeTime(osState.lastProcessed)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Social Links */}
      {(profile.linkedin || profile.twitter) && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600"
                title="LinkedIn"
              >
                <LinkedInIcon />
              </a>
            )}
            {profile.twitter && (
              <a
                href={profile.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400"
                title="Twitter"
              >
                <TwitterIcon />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function LinkedInIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
    </svg>
  );
}

function CompanyProfileCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          <div className="flex-1">
            <div className="w-32 h-5 bg-gray-200 rounded mb-2" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
      <div className="p-4 border-b border-gray-100">
        <div className="w-28 h-4 bg-gray-200 rounded mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="w-16 h-3 bg-gray-200 rounded mb-1" />
              <div className="w-24 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="w-20 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-full h-12 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default CompanyProfileCard;
