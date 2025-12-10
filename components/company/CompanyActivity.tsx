'use client';

/**
 * CompanyActivity - S139: Company Profiles
 *
 * Activity timeline showing:
 * - User interactions (views, outreach, notes)
 * - System events (score changes, signal updates)
 * - SIVA actions (recommendations, analyses)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  MessageSquare,
  FileText,
  Zap,
  TrendingUp,
  TrendingDown,
  Bot,
  Calendar,
  Clock,
  ChevronDown,
  User,
  Mail,
  Phone,
  Filter,
} from 'lucide-react';

export type ActivityType =
  | 'view'
  | 'outreach_email'
  | 'outreach_call'
  | 'outreach_linkedin'
  | 'note'
  | 'signal_detected'
  | 'score_change'
  | 'siva_recommendation'
  | 'siva_analysis';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    oldScore?: number;
    newScore?: number;
    signalType?: string;
    contactName?: string;
    channel?: string;
  };
}

export interface CompanyActivityProps {
  activities: Activity[];
  maxVisible?: number;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: typeof Eye; color: string; bgColor: string; label: string }
> = {
  view: {
    icon: Eye,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Profile View',
  },
  outreach_email: {
    icon: Mail,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Email Sent',
  },
  outreach_call: {
    icon: Phone,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Call Made',
  },
  outreach_linkedin: {
    icon: MessageSquare,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'LinkedIn Message',
  },
  note: {
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Note Added',
  },
  signal_detected: {
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Signal Detected',
  },
  score_change: {
    icon: TrendingUp,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    label: 'Score Change',
  },
  siva_recommendation: {
    icon: Bot,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    label: 'SIVA Recommendation',
  },
  siva_analysis: {
    icon: Bot,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    label: 'SIVA Analysis',
  },
};

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupActivitiesByDate(activities: Activity[]): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>();

  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(activity);
  });

  return groups;
}

export function CompanyActivity({ activities, maxVisible = 10 }: CompanyActivityProps) {
  const [expanded, setExpanded] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Filter activities
  const filteredActivities = filterType
    ? activities.filter((a) => {
        if (filterType === 'outreach') {
          return a.type.startsWith('outreach_');
        }
        if (filterType === 'siva') {
          return a.type.startsWith('siva_');
        }
        return a.type === filterType;
      })
    : activities;

  // Sort by timestamp (newest first)
  const sortedActivities = [...filteredActivities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const visibleActivities = expanded ? sortedActivities : sortedActivities.slice(0, maxVisible);
  const hasMore = sortedActivities.length > maxVisible;

  // Group by date
  const groupedActivities = groupActivitiesByDate(visibleActivities);

  // Activity type counts for filter
  const typeCounts = activities.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
              <p className="text-sm text-gray-500">{activities.length} activities recorded</p>
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Activity</option>
              <option value="view">Views ({typeCounts['view'] || 0})</option>
              <option value="outreach">Outreach ({(typeCounts['outreach_email'] || 0) + (typeCounts['outreach_call'] || 0) + (typeCounts['outreach_linkedin'] || 0)})</option>
              <option value="note">Notes ({typeCounts['note'] || 0})</option>
              <option value="signal_detected">Signals ({typeCounts['signal_detected'] || 0})</option>
              <option value="score_change">Score Changes ({typeCounts['score_change'] || 0})</option>
              <option value="siva">SIVA Actions ({(typeCounts['siva_recommendation'] || 0) + (typeCounts['siva_analysis'] || 0)})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-10 top-0 bottom-0 w-px bg-gray-200" />

        {Array.from(groupedActivities.entries()).map(([date, dayActivities], groupIndex) => (
          <div key={date}>
            {/* Date Header */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Calendar className="w-4 h-4" />
                {date}
              </div>
            </div>

            {/* Day's Activities */}
            <div className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {dayActivities.map((activity, index) => {
                  const config = ACTIVITY_CONFIG[activity.type];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.02 }}
                      className="relative px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`relative z-10 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}
                        >
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{activity.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                              {config.label}
                            </span>
                          </div>

                          {activity.description && (
                            <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                          )}

                          {/* Score Change Visualization */}
                          {activity.type === 'score_change' && activity.metadata && (
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-gray-500">{activity.metadata.oldScore}</span>
                              <span
                                className={
                                  (activity.metadata.newScore || 0) > (activity.metadata.oldScore || 0)
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }
                              >
                                →{' '}
                                {(activity.metadata.newScore || 0) > (activity.metadata.oldScore || 0) ? (
                                  <TrendingUp className="w-4 h-4 inline" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 inline" />
                                )}{' '}
                                {activity.metadata.newScore}
                              </span>
                              <span className="text-gray-400">
                                ({(activity.metadata.newScore || 0) > (activity.metadata.oldScore || 0) ? '+' : ''}
                                {(activity.metadata.newScore || 0) - (activity.metadata.oldScore || 0)} pts)
                              </span>
                            </div>
                          )}

                          {/* Meta Row */}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{formatRelativeTime(activity.timestamp)}</span>
                            {activity.user && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {activity.user.name}
                              </span>
                            )}
                            {activity.metadata?.contactName && (
                              <span>Contact: {activity.metadata.contactName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 border-t border-gray-100"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Show Less' : `Show ${sortedActivities.length - maxVisible} More`}
        </button>
      )}

      {/* Empty State */}
      {activities.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No activity recorded for this company yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Activity will appear here as you interact with this company.
          </p>
        </div>
      )}

      {/* Filtered Empty State */}
      {activities.length > 0 && filteredActivities.length === 0 && (
        <div className="px-6 py-8 text-center">
          <p className="text-gray-500">No activities match the selected filter.</p>
          <button
            onClick={() => setFilterType(null)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}

export default CompanyActivity;
