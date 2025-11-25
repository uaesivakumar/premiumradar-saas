'use client';

/**
 * Analytics Page - S16
 *
 * Dashboard analytics with charts, retention, funnels, AI usage.
 */

import { useState } from 'react';
import { useLocaleStore } from '@/lib/stores/locale-store';
import { BarChart3, Users, Zap, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

type TabType = 'overview' | 'retention' | 'funnel' | 'ai-usage' | 'verticals';

export default function AnalyticsPage() {
  const { locale } = useLocaleStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const isRTL = locale === 'ar';

  const tabs: { id: TabType; label: string; labelAr: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة', icon: <BarChart3 size={18} /> },
    { id: 'retention', label: 'Retention', labelAr: 'الاحتفاظ', icon: <Users size={18} /> },
    { id: 'funnel', label: 'Funnels', labelAr: 'القمع', icon: <TrendingUp size={18} /> },
    { id: 'ai-usage', label: 'AI Usage', labelAr: 'استخدام الذكاء', icon: <Zap size={18} /> },
    { id: 'verticals', label: 'Verticals', labelAr: 'القطاعات', icon: <BarChart3 size={18} /> },
  ];

  const stats = [
    { label: isRTL ? 'إجمالي المستخدمين' : 'Total Users', value: '12,847', change: '+12.5%', trend: 'up' as const },
    { label: isRTL ? 'المستخدمين النشطين' : 'Active Users', value: '8,234', change: '+8.2%', trend: 'up' as const },
    { label: isRTL ? 'معدل التحويل' : 'Conversion Rate', value: '24.3%', change: '+2.1%', trend: 'up' as const },
    { label: isRTL ? 'الإيرادات' : 'Revenue', value: '$48.2K', change: '+18.7%', trend: 'up' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRTL ? 'التحليلات' : 'Analytics'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isRTL
            ? 'تتبع أداء منصتك ومشاركة المستخدمين'
            : 'Track your platform performance and user engagement'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {isRTL ? tab.labelAr : tab.label}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className={`flex items-center gap-1 text-sm mt-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'overview' && <OverviewChart />}
        {activeTab === 'retention' && <RetentionView />}
        {activeTab === 'funnel' && <FunnelView />}
        {activeTab === 'ai-usage' && <AIUsageView />}
        {activeTab === 'verticals' && <VerticalsView />}
      </div>
    </div>
  );
}

function OverviewChart() {
  const data = [
    { month: 'Jan', users: 4000, revenue: 2400 },
    { month: 'Feb', users: 3000, revenue: 1398 },
    { month: 'Mar', users: 5000, revenue: 9800 },
    { month: 'Apr', users: 2780, revenue: 3908 },
    { month: 'May', users: 1890, revenue: 4800 },
    { month: 'Jun', users: 2390, revenue: 3800 },
  ];

  const maxUsers = Math.max(...data.map(d => d.users));

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
      <div className="h-64 flex items-end gap-4">
        {data.map((item) => (
          <div key={item.month} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              style={{ height: `${(item.users / maxUsers) * 200}px` }}
            />
            <span className="text-sm text-gray-500 mt-2">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RetentionView() {
  const cohorts = [
    { week: 'Week 1', d1: 100, d7: 65, d14: 48, d30: 35 },
    { week: 'Week 2', d1: 100, d7: 62, d14: 45, d30: 32 },
    { week: 'Week 3', d1: 100, d7: 68, d14: 52, d30: 38 },
    { week: 'Week 4', d1: 100, d7: 70, d14: 55, d30: 40 },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort Retention</h3>
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-500 text-sm">
            <th className="pb-3">Cohort</th>
            <th className="pb-3">Day 1</th>
            <th className="pb-3">Day 7</th>
            <th className="pb-3">Day 14</th>
            <th className="pb-3">Day 30</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr key={cohort.week} className="border-t border-gray-100">
              <td className="py-3 font-medium">{cohort.week}</td>
              <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded">{cohort.d1}%</span></td>
              <td className="py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded">{cohort.d7}%</span></td>
              <td className="py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">{cohort.d14}%</span></td>
              <td className="py-3"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">{cohort.d30}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FunnelView() {
  const steps = [
    { name: 'Page Visit', value: 10000, rate: 100 },
    { name: 'Sign Up Started', value: 4500, rate: 45 },
    { name: 'Email Verified', value: 3200, rate: 32 },
    { name: 'First Action', value: 2100, rate: 21 },
    { name: 'Subscribed', value: 890, rate: 8.9 },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.name} className="flex items-center gap-4">
            <div className="w-40 text-sm font-medium text-gray-700">{step.name}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-3"
                style={{ width: `${step.rate}%` }}
              >
                <span className="text-xs text-white font-medium">{step.value.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-16 text-right text-sm text-gray-500">{step.rate}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIUsageView() {
  const models = [
    { name: 'GPT-4', tokens: 2450000, cost: 73.50, calls: 12500 },
    { name: 'Claude 3', tokens: 1890000, cost: 45.20, calls: 8900 },
    { name: 'GPT-3.5', tokens: 890000, cost: 1.78, calls: 5600 },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Model Usage</h3>
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-500 text-sm">
            <th className="pb-3">Model</th>
            <th className="pb-3">Tokens</th>
            <th className="pb-3">API Calls</th>
            <th className="pb-3">Cost</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.name} className="border-t border-gray-100">
              <td className="py-3 font-medium">{model.name}</td>
              <td className="py-3">{(model.tokens / 1000000).toFixed(2)}M</td>
              <td className="py-3">{model.calls.toLocaleString()}</td>
              <td className="py-3 text-green-600">${model.cost.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VerticalsView() {
  const verticals = [
    { name: 'Banking', score: 92, domains: 1247, growth: '+15%' },
    { name: 'Technology', score: 88, domains: 982, growth: '+22%' },
    { name: 'Healthcare', score: 85, domains: 756, growth: '+8%' },
    { name: 'Finance', score: 82, domains: 634, growth: '+12%' },
    { name: 'Retail', score: 78, domains: 521, growth: '+5%' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vertical Popularity</h3>
      <div className="space-y-4">
        {verticals.map((vertical) => (
          <div key={vertical.name} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-32 font-medium">{vertical.name}</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${vertical.score}%` }}
                />
              </div>
            </div>
            <div className="w-16 text-center font-semibold">{vertical.score}</div>
            <div className="w-24 text-right text-sm text-gray-500">{vertical.domains} domains</div>
            <div className="w-16 text-right text-sm text-green-600">{vertical.growth}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
