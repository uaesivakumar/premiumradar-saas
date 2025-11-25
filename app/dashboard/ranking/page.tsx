'use client';

/**
 * Ranking Page - S13
 *
 * Company ranking and scoring view with Q/T/L/E explanations.
 */

import { useState } from 'react';
import { useLocaleStore } from '@/lib/stores/locale-store';
import { Trophy, Filter, SortAsc, TrendingUp, Clock, Percent, Users } from 'lucide-react';

interface RankedCompany {
  id: string;
  name: string;
  industry: string;
  country: string;
  score: number;
  quality: number;
  timing: number;
  likelihood: number;
  engagement: number;
  signal: string;
}

const mockCompanies: RankedCompany[] = [
  {
    id: '1',
    name: 'Emirates NBD',
    industry: 'Retail Banking',
    country: 'UAE',
    score: 92,
    quality: 95,
    timing: 88,
    likelihood: 90,
    engagement: 94,
    signal: 'Digital transformation initiative',
  },
  {
    id: '2',
    name: 'Abu Dhabi Commercial Bank',
    industry: 'Commercial Banking',
    country: 'UAE',
    score: 88,
    quality: 90,
    timing: 92,
    likelihood: 85,
    engagement: 86,
    signal: 'Leadership change announced',
  },
  {
    id: '3',
    name: 'Al Rajhi Bank',
    industry: 'Islamic Banking',
    country: 'Saudi Arabia',
    score: 85,
    quality: 88,
    timing: 80,
    likelihood: 88,
    engagement: 82,
    signal: 'Market expansion plans',
  },
  {
    id: '4',
    name: 'Saudi National Bank',
    industry: 'Commercial Banking',
    country: 'Saudi Arabia',
    score: 82,
    quality: 85,
    timing: 78,
    likelihood: 84,
    engagement: 80,
    signal: 'Core banking renewal',
  },
  {
    id: '5',
    name: 'Qatar National Bank',
    industry: 'Retail Banking',
    country: 'Qatar',
    score: 78,
    quality: 80,
    timing: 75,
    likelihood: 80,
    engagement: 76,
    signal: 'Cloud migration project',
  },
];

export default function RankingPage() {
  const { locale } = useLocaleStore();
  const [selectedCompany, setSelectedCompany] = useState<RankedCompany | null>(null);
  const isRTL = locale === 'ar';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            {isRTL ? 'تصنيف الشركات' : 'Company Rankings'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isRTL
              ? 'تصنيف العملاء المحتملين بناءً على درجات Q/T/L/E'
              : 'Rank prospects based on Q/T/L/E scores'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            <Filter size={18} />
            {isRTL ? 'تصفية' : 'Filter'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            <SortAsc size={18} />
            {isRTL ? 'ترتيب' : 'Sort'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rankings List */}
        <div className="lg:col-span-2 space-y-4">
          {mockCompanies.map((company, index) => (
            <div
              key={company.id}
              onClick={() => setSelectedCompany(company)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedCompany?.id === company.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : index === 1
                        ? 'bg-gray-100 text-gray-700'
                        : index === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-500">
                      {company.industry} • {company.country}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{company.score}</div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-purple-600">
                  <TrendingUp size={14} />
                  <span>{company.signal}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Explanation Panel */}
        <div className="lg:col-span-1">
          {selectedCompany ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isRTL ? 'تفاصيل التصنيف' : 'Score Breakdown'}
              </h3>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-blue-600">{selectedCompany.score}</div>
                <div className="text-sm text-gray-500">Overall Score</div>
              </div>
              <div className="space-y-4">
                <ScoreBar
                  label="Quality"
                  icon={<Trophy size={16} />}
                  value={selectedCompany.quality}
                  color="bg-blue-500"
                />
                <ScoreBar
                  label="Timing"
                  icon={<Clock size={16} />}
                  value={selectedCompany.timing}
                  color="bg-purple-500"
                />
                <ScoreBar
                  label="Likelihood"
                  icon={<Percent size={16} />}
                  value={selectedCompany.likelihood}
                  color="bg-green-500"
                />
                <ScoreBar
                  label="Engagement"
                  icon={<Users size={16} />}
                  value={selectedCompany.engagement}
                  color="bg-orange-500"
                />
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Signal</h4>
                <p className="text-sm text-gray-600">{selectedCompany.signal}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">
                {isRTL
                  ? 'اختر شركة لعرض تفاصيل التصنيف'
                  : 'Select a company to view ranking details'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  icon,
  value,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
