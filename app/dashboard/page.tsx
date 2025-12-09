'use client';

/**
 * Dashboard Home - Sprint S136
 *
 * CRITICAL ARCHITECTURE CONSTRAINT:
 * Dashboard must pull from SIVA Intelligence Engine, NOT static data.
 * All stats are derived from:
 * - Pack engine (signal types per vertical)
 * - Evidence engine (factual backing)
 * - Reasoning chain (explainable scores)
 * - SalesContext (vertical/sub-vertical/region)
 * - Persona (sub-vertical specific)
 *
 * This ensures ONE CONSCIOUSNESS of SIVA across all surfaces.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useLocaleStore } from '@/lib/stores/locale-store';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { ContextBadge } from '@/components/dashboard/ContextBadge';
import { EBHeroSection } from '@/components/dashboard/EBHeroSection';
import {
  TrendingUp,
  Users,
  Target,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';

// =============================================================================
// Types (from /api/dashboard/stats)
// =============================================================================

interface SignalSummary {
  total: number;
  byType: Record<string, number>;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recentCount: number;
}

interface ScoreSummary {
  avgQuality: number;
  avgTiming: number;
  avgLikelihood: number;
  avgEngagement: number;
  totalScored: number;
  topPerformers: number;
}

interface PipelineSummary {
  totalProspects: number;
  activeOpportunities: number;
  conversionRate: number;
  revenueProjection: number;
}

interface ActivityItem {
  id: string;
  companyName: string;
  action: string;
  signalType: string;
  timestamp: string;
  score?: number;
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'alert' | 'trend' | 'recommendation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  relatedSignals?: string[];
}

interface DashboardStats {
  signals: SignalSummary;
  scores: ScoreSummary;
  pipeline: PipelineSummary;
  recentActivity: ActivityItem[];
  aiInsights: AIInsight[];
  lastUpdated: string;
}

// =============================================================================
// Dashboard Page Component
// =============================================================================

export default function DashboardPage() {
  const { detectedIndustry } = useIndustryStore();
  const { locale } = useLocaleStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const { vertical, subVertical, region } = useSalesContext();

  const isRTL = locale === 'ar';
  const isEmployeeBanking = vertical === 'banking' && subVertical === 'employee-banking';

  // State for intelligence-driven stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Fetch stats from Intelligence Engine
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const regions = region ? [region] : ['UAE'];
      const params = new URLSearchParams({
        vertical: vertical || 'banking',
        subVertical: subVertical || 'employee-banking',
        regions: regions.join(','),
      });

      const response = await fetch(`/api/dashboard/stats?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setLastRefresh(new Date());
      } else {
        setError(data.error || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      setError('Failed to connect to intelligence engine');
      console.error('[Dashboard] Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [vertical, subVertical, region]);

  // Initial fetch and refresh on context change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  // Format signal type for display
  const formatSignalType = (type: string) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return isRTL ? 'الآن' : 'Just now';
    if (minutes < 60) return isRTL ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
    return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
  };

  // Build stats cards from intelligence data
  const statCards = stats
    ? [
        {
          label: isRTL ? 'العملاء المحتملين' : 'Total Prospects',
          value: stats.pipeline.totalProspects.toLocaleString(),
          change: `+${Math.abs(stats.signals.recentCount)}`,
          trend: 'up' as const,
          icon: <Users size={20} />,
          subtitle: isRTL ? 'إشارات جديدة اليوم' : 'New signals today',
        },
        {
          label: isRTL ? 'الفرص النشطة' : 'Active Opportunities',
          value: stats.pipeline.activeOpportunities.toString(),
          change: `${stats.scores.topPerformers} high`,
          trend: 'up' as const,
          icon: <Target size={20} />,
          subtitle: isRTL ? 'أعلى الأداء' : 'Top performers',
        },
        {
          label: isRTL ? 'نمو الإيرادات' : 'Revenue Projection',
          value: formatCurrency(stats.pipeline.revenueProjection),
          change: `${stats.pipeline.conversionRate}%`,
          trend: stats.pipeline.conversionRate > 10 ? 'up' as const : 'down' as const,
          icon: <TrendingUp size={20} />,
          subtitle: isRTL ? 'معدل التحويل' : 'Conversion rate',
        },
        {
          label: isRTL ? 'التنبيهات' : 'Active Signals',
          value: stats.signals.total.toString(),
          change: `${stats.signals.byPriority.critical + stats.signals.byPriority.high} urgent`,
          trend: stats.signals.byPriority.critical > 5 ? 'up' as const : 'down' as const,
          icon: <Bell size={20} />,
          subtitle: isRTL ? 'تنبيهات عاجلة' : 'Urgent alerts',
        },
      ]
    : [];

  // Priority color mapping
  const priorityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };

  const priorityTextColors = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-yellow-600',
    low: 'text-blue-600',
  };

  // Loading state
  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <ContextBadge />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">
              {isRTL ? 'جاري تحميل بيانات الذكاء...' : 'Loading intelligence data...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="space-y-6">
        <ContextBadge />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
            <p className="text-gray-900 font-medium mb-2">
              {isRTL ? 'فشل تحميل البيانات' : 'Failed to load dashboard'}
            </p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Badge - Shows current role and territory */}
      <ContextBadge />

      {/* EB Hero Section - Shows EB-specific actions when in Employee Banking context */}
      {isEmployeeBanking && <EBHeroSection />}

      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRTL ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            {isRTL
              ? 'مرحباً بعودتك! إليك آخر التحديثات'
              : 'Welcome back! Here are your latest updates'}
            {lastRefresh && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                {formatRelativeTime(lastRefresh.toISOString())}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid - Intelligence Driven */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${industryConfig.primaryColor}15` }}
              >
                <span style={{ color: industryConfig.primaryColor }}>{stat.icon}</span>
              </div>
              <span
                className={`flex items-center text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-amber-600'
                }`}
              >
                {stat.trend === 'up' ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            <p className="text-gray-400 text-xs mt-0.5">{stat.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* QTLE Score Summary */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={20} style={{ color: industryConfig.primaryColor }} />
            {isRTL ? 'ملخص درجات QTLE' : 'QTLE Score Summary'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Quality', value: stats.scores.avgQuality, color: '#3B82F6' },
              { label: 'Timing', value: stats.scores.avgTiming, color: '#10B981' },
              { label: 'Likelihood', value: stats.scores.avgLikelihood, color: '#F59E0B' },
              { label: 'Engagement', value: stats.scores.avgEngagement, color: '#8B5CF6' },
            ].map((score) => (
              <div key={score.label} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#E5E7EB"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke={score.color}
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(score.value / 100) * 176} 176`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                    {score.value}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700">{score.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>
              {isRTL ? `${stats.scores.totalScored} شركة مسجلة` : `${stats.scores.totalScored} companies scored`}
            </span>
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle size={14} />
              {isRTL ? `${stats.scores.topPerformers} أعلى أداء` : `${stats.scores.topPerformers} top performers`}
            </span>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights Panel - From Intelligence Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles
                size={20}
                style={{ color: industryConfig.primaryColor }}
              />
              <h2 className="font-semibold text-gray-900">
                {isRTL ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}
              </h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {(stats?.aiInsights || []).slice(0, 5).map((insight) => (
              <div key={insight.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${priorityColors[insight.priority]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">{insight.title}</h4>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${priorityTextColors[insight.priority]} bg-gray-50`}>
                        {insight.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{insight.description}</p>
                    {insight.actionable && (
                      <button
                        className="mt-2 text-xs font-medium"
                        style={{ color: industryConfig.primaryColor }}
                      >
                        {isRTL ? 'اتخاذ إجراء →' : 'Take action →'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <button
              className="w-full py-2 text-sm font-medium rounded-lg transition-colors hover:bg-gray-50"
              style={{ color: industryConfig.primaryColor }}
            >
              {isRTL ? 'عرض جميع الرؤى' : 'View all insights'}
            </button>
          </div>
        </motion.div>

        {/* Recent Activity - From Intelligence Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {isRTL ? 'النشاط الأخير' : 'Recent Activity'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {isRTL ? 'الإشارات المستمدة من حزم الاستخبارات' : 'Signals derived from Intelligence Packs'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    {isRTL ? 'الشركة' : 'Company'}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    {isRTL ? 'نوع الإشارة' : 'Signal Type'}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    {isRTL ? 'الدرجة' : 'Score'}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    {isRTL ? 'الوقت' : 'Time'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(stats?.recentActivity || []).map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: industryConfig.primaryColor }}
                        >
                          {activity.companyName.substring(0, 2)}
                        </div>
                        <span className="font-medium text-gray-900">{activity.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatSignalType(activity.signalType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {activity.score !== undefined ? (
                        <span
                          className={`font-medium ${
                            activity.score >= 80
                              ? 'text-green-600'
                              : activity.score >= 60
                              ? 'text-amber-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {activity.score}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {formatRelativeTime(activity.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100">
            <button
              className="w-full py-2 text-sm font-medium rounded-lg transition-colors hover:bg-gray-50"
              style={{ color: industryConfig.primaryColor }}
            >
              {isRTL ? 'عرض كل النشاطات' : 'View all activity'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Signal Distribution by Type */}
      {stats && Object.keys(stats.signals.byType).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="font-semibold text-gray-900 mb-4">
            {isRTL ? 'توزيع الإشارات حسب النوع' : 'Signal Distribution by Type'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.signals.byType).map(([type, count]) => (
              <div key={type} className="p-4 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500">{formatSignalType(type)}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
