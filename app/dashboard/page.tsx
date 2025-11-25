'use client';

/**
 * Dashboard Home - Sprint 4
 * Main dashboard with stats, recent activity, and AI insights
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useLocaleStore } from '@/lib/stores/locale-store';
import {
  TrendingUp,
  Users,
  Target,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { detectedIndustry } = useIndustryStore();
  const { locale } = useLocaleStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const isRTL = locale === 'ar';

  const stats = [
    {
      label: isRTL ? 'العملاء المحتملين' : 'Total Prospects',
      value: '2,847',
      change: '+12.5%',
      trend: 'up',
      icon: <Users size={20} />,
    },
    {
      label: isRTL ? 'الفرص النشطة' : 'Active Opportunities',
      value: '142',
      change: '+8.2%',
      trend: 'up',
      icon: <Target size={20} />,
    },
    {
      label: isRTL ? 'نمو الإيرادات' : 'Revenue Growth',
      value: '$2.4M',
      change: '+23.1%',
      trend: 'up',
      icon: <TrendingUp size={20} />,
    },
    {
      label: isRTL ? 'التنبيهات' : 'Alerts',
      value: '18',
      change: '-5.3%',
      trend: 'down',
      icon: <Bell size={20} />,
    },
  ];

  const recentActivity = [
    { company: 'TechCorp Solutions', action: 'Price change detected', time: '5 min ago' },
    { company: 'Global Finance Ltd', action: 'New product launch', time: '1 hour ago' },
    { company: 'Healthcare Plus', action: 'Leadership change', time: '2 hours ago' },
    { company: 'Retail Giant Inc', action: 'Expansion announced', time: '3 hours ago' },
    { company: 'Manufacturing Pro', action: 'Partnership formed', time: '5 hours ago' },
  ];

  const aiInsights = [
    {
      title: isRTL ? 'فرصة نمو' : 'Growth Opportunity',
      description: isRTL
        ? 'تم تحديد 3 منافسين يعانون من مشكلات في الاحتفاظ بالعملاء'
        : '3 competitors identified with customer retention issues',
      priority: 'high',
    },
    {
      title: isRTL ? 'تحذير السوق' : 'Market Alert',
      description: isRTL
        ? 'تغير تنظيمي قادم قد يؤثر على صناعتك'
        : 'Upcoming regulatory change may impact your industry',
      priority: 'medium',
    },
    {
      title: isRTL ? 'اتجاه صعودي' : 'Rising Trend',
      description: isRTL
        ? 'زيادة الطلب على حلول الذكاء الاصطناعي بنسبة 40%'
        : '40% increase in demand for AI solutions',
      priority: 'info',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRTL ? 'لوحة التحكم' : 'Dashboard'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isRTL
            ? 'مرحباً بعودتك! إليك آخر التحديثات'
            : 'Welcome back! Here are your latest updates'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
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
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights Panel */}
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
            {aiInsights.map((insight, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      insight.priority === 'high'
                        ? 'bg-red-500'
                        : insight.priority === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{insight.description}</p>
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

        {/* Recent Activity */}
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
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    {isRTL ? 'الشركة' : 'Company'}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    {isRTL ? 'الإجراء' : 'Action'}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    {isRTL ? 'الوقت' : 'Time'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActivity.map((activity, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: industryConfig.primaryColor }}
                        >
                          {activity.company.substring(0, 2)}
                        </div>
                        <span className="font-medium text-gray-900">{activity.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{activity.action}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{activity.time}</td>
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
    </div>
  );
}
