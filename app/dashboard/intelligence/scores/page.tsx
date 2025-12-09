'use client';

/**
 * QTLE Scoring Visualization - Sprint S140
 *
 * CRITICAL ARCHITECTURE CONSTRAINT:
 * QTLE visualization must EXACTLY match the reasoning chain.
 *
 * This page displays scores using:
 * - ScoreEngine for QTLE computation
 * - Factor-based breakdown with evidence
 * - Full reasoning chain transparency
 * - Pack-derived scoring rules
 *
 * This ensures ONE CONSCIOUSNESS of SIVA across all surfaces.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import {
  ScoreEngine,
  type QTLEBreakdown,
  type EntityScoreInput,
} from '@/lib/intelligence/score-engine';
import { type SignalInstance, SignalEngine } from '@/lib/intelligence/signal-engine';
import {
  Target,
  TrendingUp,
  Clock,
  Users,
  Sparkles,
  CheckCircle,
  Info,
  RefreshCw,
  Search,
  Building,
  MapPin,
  BarChart3,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface ScoredEntity {
  id: string;
  name: string;
  industry: string;
  city: string;
  headcount: number;
  headcountGrowth: number;
  score: QTLEBreakdown;
  signalCount: number;
}

// =============================================================================
// Mock Data Generator
// =============================================================================

function generateMockEntities(scoreEngine: ScoreEngine, signalEngine: SignalEngine): ScoredEntity[] {
  const companies = [
    { name: 'Emirates NBD', industry: 'Banking', city: 'Dubai', headcount: 12000, growth: 15 },
    { name: 'ADCB', industry: 'Banking', city: 'Abu Dhabi', headcount: 8500, growth: 8 },
    { name: 'Mashreq Bank', industry: 'Banking', city: 'Dubai', headcount: 5000, growth: 22 },
    { name: 'Dubai Islamic Bank', industry: 'Banking', city: 'Dubai', headcount: 7000, growth: 12 },
    { name: 'RAK Bank', industry: 'Banking', city: 'Ras Al Khaimah', headcount: 3500, growth: 18 },
    { name: 'First Abu Dhabi Bank', industry: 'Banking', city: 'Abu Dhabi', headcount: 9500, growth: 10 },
    { name: 'Commercial Bank of Dubai', industry: 'Banking', city: 'Dubai', headcount: 4000, growth: 25 },
    { name: 'National Bank of Fujairah', industry: 'Banking', city: 'Fujairah', headcount: 2000, growth: 5 },
  ];

  const allowedTypes = signalEngine.getAllowedTypes();

  return companies.map((company, idx) => {
    // Generate mock signals for this company using signal engine types
    const numSignals = 2 + Math.floor(Math.random() * 3);
    const signals: SignalInstance[] = [];

    for (let i = 0; i < numSignals; i++) {
      const type = allowedTypes[i % allowedTypes.length];
      const now = new Date();
      const detectedAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const expiresAt = new Date(detectedAt.getTime() + 90 * 24 * 60 * 60 * 1000);

      const signal: SignalInstance = {
        id: `sig-${idx}-${i}`,
        type,
        companyId: `comp-${idx}`,
        companyName: company.name,
        title: `${type.replace(/-/g, ' ')} detected`,
        description: `${company.name} showing ${type.replace(/-/g, ' ')} activity`,
        priority: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as 'critical' | 'high' | 'medium' | 'low',
        confidence: 0.7 + Math.random() * 0.25,
        relevance: 0.6 + Math.random() * 0.35,
        source: ['Apollo', 'LinkedIn', 'News'][Math.floor(Math.random() * 3)],
        detectedAt,
        expiresAt,
        metadata: {},
        qtleContribution: {
          quality: 50 + Math.floor(Math.random() * 40),
          timing: 50 + Math.floor(Math.random() * 40),
          likelihood: 50 + Math.floor(Math.random() * 40),
          engagement: 50 + Math.floor(Math.random() * 40),
        },
        evidence: [{
          sourceType: 'news' as const,
          extractedAt: detectedAt,
          confidence: 0.7 + Math.random() * 0.25,
        }],
      };
      signals.push(signal);
    }

    // Build entity input for score engine
    const entityInput: EntityScoreInput = {
      id: `company-${idx + 1}`,
      companyName: company.name,
      industry: company.industry,
      size: company.headcount >= 5000 ? 'enterprise' : company.headcount >= 1000 ? 'mid-market' : 'smb',
      location: company.city,
      signals: signals,
      engagementHistory: {
        interactions: Math.floor(Math.random() * 10),
        emailOpens: Math.floor(Math.random() * 20),
        meetings: Math.floor(Math.random() * 3),
        avgResponseTime: 24 + Math.floor(Math.random() * 48),
      },
    };

    const breakdown = scoreEngine.calculateScore(entityInput);

    return {
      id: `company-${idx + 1}`,
      name: company.name,
      industry: company.industry,
      city: company.city,
      headcount: company.headcount,
      headcountGrowth: company.growth,
      score: breakdown,
      signalCount: signals.length,
    };
  });
}

// =============================================================================
// Component
// =============================================================================

export default function ScoresPage() {
  const { vertical, subVertical, verticalName, subVerticalName } = useSalesContext();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  // State
  const [entities, setEntities] = useState<ScoredEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<ScoredEntity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'composite' | 'quality' | 'timing' | 'likelihood' | 'engagement'>('composite');

  // Initialize engines with Pack configuration
  const scoreEngine = useMemo(() => {
    return new ScoreEngine(vertical || 'banking', subVertical || 'employee-banking');
  }, [vertical, subVertical]);

  const signalEngine = useMemo(() => {
    return new SignalEngine(vertical || 'banking', subVertical || 'employee-banking');
  }, [vertical, subVertical]);

  // Fetch and score entities
  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      const scoredEntities = generateMockEntities(scoreEngine, signalEngine);
      setEntities(scoredEntities);
      setSelectedEntity(scoredEntities[0] || null);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [scoreEngine, signalEngine]);

  // Filter and sort entities
  const filteredEntities = useMemo(() => {
    let result = [...entities];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.city.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return b.score.score.quality - a.score.score.quality;
        case 'timing':
          return b.score.score.timing - a.score.score.timing;
        case 'likelihood':
          return b.score.score.likelihood - a.score.score.likelihood;
        case 'engagement':
          return b.score.score.engagement - a.score.score.engagement;
        default:
          return b.score.score.composite - a.score.score.composite;
      }
    });

    return result;
  }, [entities, searchQuery, sortBy]);

  // QTLE colors
  const qtleColors = {
    quality: '#3B82F6',
    timing: '#10B981',
    likelihood: '#F59E0B',
    engagement: '#8B5CF6',
    composite: industryConfig.primaryColor,
  };

  // Get score tier
  const getScoreTier = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-gray-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Computing QTLE scores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target size={24} style={{ color: industryConfig.primaryColor }} />
            QTLE Score Explorer
          </h1>
          <p className="text-gray-500 mt-1">
            Factor-based scoring with full reasoning chain transparency
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: industryConfig.primaryColor }}
            />
            <span className="text-xs text-gray-600">
              {entities.length} entities scored
            </span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Avg Composite', value: Math.round(entities.reduce((sum, e) => sum + e.score.score.composite, 0) / (entities.length || 1)), color: qtleColors.composite },
          { label: 'Avg Quality', value: Math.round(entities.reduce((sum, e) => sum + e.score.score.quality, 0) / (entities.length || 1)), color: qtleColors.quality },
          { label: 'Avg Timing', value: Math.round(entities.reduce((sum, e) => sum + e.score.score.timing, 0) / (entities.length || 1)), color: qtleColors.timing },
          { label: 'Avg Likelihood', value: Math.round(entities.reduce((sum, e) => sum + e.score.score.likelihood, 0) / (entities.length || 1)), color: qtleColors.likelihood },
          { label: 'Avg Engagement', value: Math.round(entities.reduce((sum, e) => sum + e.score.score.engagement, 0) / (entities.length || 1)), color: qtleColors.engagement },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="#E5E7EB" strokeWidth="6" fill="none" />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke={stat.color}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(stat.value / 100) * 176} 176`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">
                  {stat.value}
                </span>
              </div>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entity List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
              >
                <option value="composite">Composite</option>
                <option value="quality">Quality</option>
                <option value="timing">Timing</option>
                <option value="likelihood">Likelihood</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-50">
            {filteredEntities.map((entity) => (
              <button
                key={entity.id}
                onClick={() => setSelectedEntity(entity)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedEntity?.id === entity.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: industryConfig.primaryColor }}
                  >
                    {entity.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{entity.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={10} />
                      {entity.city}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: industryConfig.primaryColor }}>
                      {entity.score.score.composite}
                    </p>
                    <p className={`text-xs ${getScoreTier(entity.score.score.composite).color}`}>
                      {getScoreTier(entity.score.score.composite).label}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Score Detail Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEntity ? (
            <>
              {/* Entity Header */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: industryConfig.primaryColor }}
                    >
                      {selectedEntity.name.substring(0, 2)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedEntity.name}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Building size={14} />
                          {selectedEntity.industry}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {selectedEntity.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {selectedEntity.headcount.toLocaleString()} employees
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-4xl font-bold" style={{ color: industryConfig.primaryColor }}>
                      {selectedEntity.score.score.composite}
                    </div>
                    <p className={`text-sm font-medium ${getScoreTier(selectedEntity.score.score.composite).color}`}>
                      {getScoreTier(selectedEntity.score.score.composite).label} Score
                    </p>
                  </div>
                </div>

                {/* QTLE Breakdown */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Quality', value: selectedEntity.score.score.quality, color: qtleColors.quality, icon: Target },
                    { label: 'Timing', value: selectedEntity.score.score.timing, color: qtleColors.timing, icon: Clock },
                    { label: 'Likelihood', value: selectedEntity.score.score.likelihood, color: qtleColors.likelihood, icon: TrendingUp },
                    { label: 'Engagement', value: selectedEntity.score.score.engagement, color: qtleColors.engagement, icon: Users },
                  ].map((metric) => (
                    <div key={metric.label} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <metric.icon size={16} style={{ color: metric.color }} />
                        <span className="text-2xl font-bold" style={{ color: metric.color }}>
                          {metric.value}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reasoning Chain */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles size={18} style={{ color: industryConfig.primaryColor }} />
                  Reasoning Chain
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                  {selectedEntity.score.reasoning}
                </div>
              </div>

              {/* Evidence Sources */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-500" />
                  Evidence Sources
                </h3>
                <div className="space-y-3">
                  {selectedEntity.score.evidence.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        item.impact === 'positive' ? 'bg-green-500' :
                        item.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 capitalize">{item.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            item.impact === 'positive' ? 'bg-green-100 text-green-700' :
                            item.impact === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.impact}
                          </span>
                          <span className="text-xs text-gray-400">
                            Strength: {item.strength}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Factor Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 size={18} style={{ color: industryConfig.primaryColor }} />
                  Factor Breakdown
                </h3>
                <div className="space-y-3">
                  {selectedEntity.score.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-32 text-sm text-gray-600 truncate">{factor.name}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(0, Math.min(100, factor.contribution + 50))}%`,
                            backgroundColor:
                              factor.dimension === 'quality' ? qtleColors.quality :
                              factor.dimension === 'timing' ? qtleColors.timing :
                              factor.dimension === 'likelihood' ? qtleColors.likelihood :
                              qtleColors.engagement,
                          }}
                        />
                      </div>
                      <div className="w-16 text-right text-sm font-medium text-gray-900">
                        {factor.contribution > 0 ? '+' : ''}{factor.contribution}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Target size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Select an entity to view QTLE breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Pack Info Footer */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Scoring Configuration</span>
        </div>
        <p className="text-xs text-gray-500">
          QTLE scores computed using {verticalName} &gt; {subVerticalName} Intelligence Pack rules.
          Factor weights and thresholds derived from Pack configuration.
        </p>
      </div>
    </div>
  );
}
