'use client';

/**
 * Demo Page - S17
 *
 * Interactive demo mode with fake data and locked features.
 */

import { useState } from 'react';
import { useLocaleStore } from '@/lib/stores/locale-store';
import { Play, Sparkles, Lock, Users, TrendingUp, Calendar } from 'lucide-react';

export default function DemoPage() {
  const { locale } = useLocaleStore();
  const [remainingActions] = useState(47);
  const isRTL = locale === 'ar';

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Play size={20} />
          <span className="font-medium">
            {isRTL ? 'أنت في وضع العرض التجريبي' : 'You are in Demo Mode'}
          </span>
        </div>
        <button className="px-4 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30">
          {isRTL ? 'ترقية الآن' : 'Upgrade Now'}
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            {isRTL ? 'وضع العرض التجريبي' : 'Demo Mode'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isRTL
              ? 'استكشف ميزات المنصة مع بيانات تجريبية'
              : 'Explore platform features with sample data'}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {isRTL ? 'الإجراءات المتبقية:' : 'Actions remaining:'}{' '}
          <span className="font-semibold text-gray-900">{remainingActions}</span>
        </div>
      </div>

      {/* Demo Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DemoFeatureCard
          icon={<Play className="text-green-500" />}
          title={isRTL ? 'اكتشاف العملاء' : 'Discovery'}
          description={
            isRTL
              ? 'اكتشف الشركات المستهدفة بناءً على إشارات السوق'
              : 'Discover target companies based on market signals'
          }
          isLocked={false}
        />
        <DemoFeatureCard
          icon={<Sparkles className="text-purple-500" />}
          title={isRTL ? 'تصنيف الذكاء' : 'AI Ranking'}
          description={
            isRTL
              ? 'تصنيف العملاء المحتملين بناءً على نظام Q/T/L/E'
              : 'Rank prospects using Q/T/L/E scoring system'
          }
          isLocked={false}
        />
        <DemoFeatureCard
          icon={<Lock className="text-gray-400" />}
          title={isRTL ? 'التصدير المجمع' : 'Bulk Export'}
          description={
            isRTL
              ? 'تصدير جميع البيانات بتنسيقات متعددة'
              : 'Export all data in multiple formats'
          }
          isLocked={true}
        />
      </div>

      {/* Demo Pipeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isRTL ? 'خط أنابيب العملاء' : 'Sales Pipeline'}
        </h2>
        <DemoPipelineView />
      </div>

      {/* Demo Discovery */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isRTL ? 'اكتشاف الشركات' : 'Company Discovery'}
        </h2>
        <DemoDiscoveryView />
      </div>

      {/* Booking CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-2">
          {isRTL ? 'هل أعجبك ما رأيته؟' : 'Like What You See?'}
        </h3>
        <p className="text-blue-100 mb-6">
          {isRTL
            ? 'احجز عرضًا توضيحيًا مع فريقنا لمعرفة المزيد'
            : 'Book a demo with our team to learn more'}
        </p>
        <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50">
          {isRTL ? 'احجز اجتماعًا' : 'Book a Meeting'}
        </button>
      </div>
    </div>
  );
}

function DemoFeatureCard({
  icon,
  title,
  description,
  isLocked,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isLocked: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${
        isLocked
          ? 'bg-gray-50 border-gray-200 opacity-60'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
      } transition-all`}
    >
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      {isLocked && (
        <div className="mt-3 flex items-center gap-1 text-xs text-orange-600">
          <Lock size={12} />
          <span>Premium Feature</span>
        </div>
      )}
    </div>
  );
}

function DemoPipelineView() {
  const stages = [
    { name: 'Discovery', count: 24, value: '$1.2M', color: 'bg-blue-500' },
    { name: 'Contacted', count: 18, value: '$890K', color: 'bg-purple-500' },
    { name: 'Negotiating', count: 8, value: '$450K', color: 'bg-yellow-500' },
    { name: 'Proposal', count: 5, value: '$280K', color: 'bg-orange-500' },
    { name: 'Won', count: 3, value: '$150K', color: 'bg-green-500' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {stages.map((stage) => (
        <div key={stage.name} className="flex-1 min-w-[150px]">
          <div className={`h-2 ${stage.color} rounded-full mb-3`} />
          <h4 className="font-medium text-gray-900">{stage.name}</h4>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-500">{stage.count} deals</span>
            <span className="text-sm font-semibold text-gray-900">{stage.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DemoDiscoveryView() {
  const companies = [
    { name: 'Emirates NBD', industry: 'Banking', score: 92, signal: 'Digital transformation' },
    { name: 'ADCB', industry: 'Banking', score: 88, signal: 'Leadership change' },
    { name: 'Al Rajhi Bank', industry: 'Islamic Banking', score: 85, signal: 'Market expansion' },
    { name: 'Mashreq Bank', industry: 'Banking', score: 78, signal: 'Cloud migration' },
  ];

  return (
    <div className="space-y-3">
      {companies.map((company) => (
        <div
          key={company.name}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold">
              {company.name.substring(0, 2)}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{company.name}</h4>
              <p className="text-sm text-gray-500">{company.industry}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-gray-500">Signal</div>
              <div className="text-sm font-medium text-purple-600">{company.signal}</div>
            </div>
            <div className="w-16 text-center">
              <div className="text-2xl font-bold text-gray-900">{company.score}</div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
