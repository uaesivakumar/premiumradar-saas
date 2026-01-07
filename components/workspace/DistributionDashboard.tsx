/**
 * Distribution Dashboard Component
 *
 * S363: Distribution Dashboard
 * Behavior Contract B014: Distribution transparency shown
 *
 * Displays lead distribution metrics and team workload.
 * Provides transparency into how leads are being assigned.
 */

'use client';

import React from 'react';

export interface TeamMemberStats {
  userId: string;
  name: string;
  email: string;
  currentLoad: number;
  maxCapacity: number;
  assignedToday: number;
  assignedThisWeek: number;
  conversionRate: number;
  territories: string[];
  isActive: boolean;
}

export interface DistributionStats {
  totalDistributed: number;
  distributedToday: number;
  distributedThisWeek: number;
  averageTimeToAssign: number;
  reassignmentRate: number;
}

export interface DistributionDashboardProps {
  teamMembers: TeamMemberStats[];
  stats: DistributionStats;
  onToggleMemberActive?: (userId: string, active: boolean) => void;
  onViewMemberDetails?: (userId: string) => void;
  className?: string;
}

export function DistributionDashboard({
  teamMembers,
  stats,
  onToggleMemberActive,
  onViewMemberDetails,
  className = '',
}: DistributionDashboardProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Distributed"
          value={stats.totalDistributed}
          subtext="All time"
        />
        <StatCard
          label="Today"
          value={stats.distributedToday}
          subtext="Leads assigned"
        />
        <StatCard
          label="This Week"
          value={stats.distributedThisWeek}
          subtext="Leads assigned"
        />
        <StatCard
          label="Avg Time"
          value={formatDuration(stats.averageTimeToAssign)}
          subtext="To assign"
        />
        <StatCard
          label="Reassignment"
          value={`${(stats.reassignmentRate * 100).toFixed(1)}%`}
          subtext="Rate"
        />
      </div>

      {/* Team Workload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Team Workload
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Current lead distribution across team members
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Today / Week
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Conversion
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Territories
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {teamMembers.map((member) => (
                <TeamMemberRow
                  key={member.userId}
                  member={member}
                  onToggleActive={onToggleMemberActive}
                  onViewDetails={onViewMemberDetails}
                />
              ))}
            </tbody>
          </table>
        </div>

        {teamMembers.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No team members configured for distribution.
          </div>
        )}
      </div>

      {/* Distribution Fairness */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Distribution Fairness
        </h3>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <FairnessBar
              key={member.userId}
              name={member.name}
              count={member.assignedThisWeek}
              total={stats.distributedThisWeek}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{subtext}</p>
    </div>
  );
}

function TeamMemberRow({
  member,
  onToggleActive,
  onViewDetails,
}: {
  member: TeamMemberStats;
  onToggleActive?: (userId: string, active: boolean) => void;
  onViewDetails?: (userId: string) => void;
}) {
  const capacityPercent = (member.currentLoad / member.maxCapacity) * 100;
  const capacityColor =
    capacityPercent >= 90
      ? 'bg-red-500'
      : capacityPercent >= 70
      ? 'bg-yellow-500'
      : 'bg-green-500';

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
      <td className="px-4 py-3">
        <button
          onClick={() => onViewDetails?.(member.userId)}
          className="text-left"
        >
          <p className="font-medium text-gray-900 dark:text-white">
            {member.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {member.email}
          </p>
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${capacityColor} transition-all`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {member.currentLoad}/{member.maxCapacity}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
        {member.assignedToday} / {member.assignedThisWeek}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
        {(member.conversionRate * 100).toFixed(1)}%
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {member.territories.slice(0, 3).map((territory) => (
            <span
              key={territory}
              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
            >
              {territory}
            </span>
          ))}
          {member.territories.length > 3 && (
            <span className="text-xs text-gray-400">
              +{member.territories.length - 3}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onToggleActive?.(member.userId, !member.isActive)}
          className={`
            px-2 py-1 text-xs font-medium rounded
            ${
              member.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }
          `}
        >
          {member.isActive ? 'Active' : 'Paused'}
        </button>
      </td>
    </tr>
  );
}

function FairnessBar({
  name,
  count,
  total,
}: {
  name: string;
  count: number;
  total: number;
}) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  const expectedPercent = 100 / (total > 0 ? Math.ceil(total / 10) : 1); // Rough expected share

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-gray-600 dark:text-gray-300 truncate">
        {name}
      </span>
      <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${percent}%` }}
        />
        {/* Expected line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
          style={{ left: `${expectedPercent}%` }}
        />
      </div>
      <span className="w-12 text-sm text-gray-600 dark:text-gray-300 text-right">
        {count}
      </span>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatDuration(minutes: number): string {
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default DistributionDashboard;
