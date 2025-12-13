'use client';

/**
 * Ranking Page
 * VS12.9: Wired to real OS Ranking API
 *
 * Company ranking and scoring view with Q/T/L/E explanations.
 * Authorization Code: VS12-FRONTEND-WIRING-20251213
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocaleStore } from '@/lib/stores/locale-store';
import { Trophy, Filter, SortAsc, TrendingUp, Clock, Percent, Users, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

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

export default function RankingPage() {
  const { locale } = useLocaleStore();
  const [companies, setCompanies] = useState<RankedCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<RankedCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRTL = locale === 'ar';

  // VS12.9: Fetch rankings from OS API
  const fetchRankings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, get discovered companies from OS discovery
      const discoveryResponse = await fetch('/api/os/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'default',
          region_code: 'UAE',
          vertical_id: 'banking',
        }),
      });
      const discoveryResult = await discoveryResponse.json();

      if (!discoveryResponse.ok || !discoveryResult.success) {
        throw new Error(discoveryResult.error || 'Failed to fetch companies');
      }

      // Transform OS discovery data to ranked companies
      const rankedCompanies: RankedCompany[] = (discoveryResult.data?.opportunities || [])
        .slice(0, 10)
        .map((opp: {
          company_id?: string;
          company_name?: string;
          industry?: string;
          region?: string;
          scores?: { quality?: number; timing?: number; likelihood?: number; engagement?: number };
          qtle_score?: number;
          signals?: Array<{ title?: string; type?: string }>;
        }, index: number) => ({
          id: opp.company_id || `comp_${index}`,
          name: opp.company_name || 'Unknown Company',
          industry: opp.industry || 'Banking',
          country: opp.region || 'UAE',
          score: opp.qtle_score || Math.round((opp.scores?.quality || 70) * 0.3 + (opp.scores?.timing || 70) * 0.25 + (opp.scores?.likelihood || 70) * 0.25 + (opp.scores?.engagement || 70) * 0.2),
          quality: opp.scores?.quality || 70,
          timing: opp.scores?.timing || 70,
          likelihood: opp.scores?.likelihood || 70,
          engagement: opp.scores?.engagement || 70,
          signal: opp.signals?.[0]?.title || opp.signals?.[0]?.type || 'Market opportunity',
        }))
        .sort((a: RankedCompany, b: RankedCompany) => b.score - a.score);

      setCompanies(rankedCompanies);
    } catch (err) {
      console.error('[Ranking] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rankings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // VS12.9: Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading rankings...</p>
        </div>
      </div>
    );
  }

  // VS12.9: Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to load rankings</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchRankings}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          {companies.map((company, index) => (
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
