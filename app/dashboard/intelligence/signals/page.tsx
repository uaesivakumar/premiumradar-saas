'use client';

/**
 * Signal Intelligence Page - Sprint S138
 *
 * CRITICAL ARCHITECTURE CONSTRAINT:
 * Signal filtering must derive from Intelligence Packs, NOT hardcoded UI logic.
 *
 * This page displays signals using:
 * - SignalEngine for Pack-based filtering
 * - QTLE contribution per signal
 * - Category groupings from Pack metadata
 * - Evidence sources for transparency
 *
 * This ensures ONE CONSCIOUSNESS of SIVA across all surfaces.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import {
  SignalEngine,
  type SignalInstance,
  type SignalFilter,
} from '@/lib/intelligence/signal-engine';
import type { SalesSignalType } from '@/lib/intelligence/context/types';
import {
  Zap,
  Filter,
  Search,
  TrendingUp,
  Clock,
  MapPin,
  Building,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles,
  RefreshCw,
  Download,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

interface GroupedSignals {
  category: string;
  categoryLabel: string;
  signals: SignalInstance[];
  avgQTLE: number;
}

// =============================================================================
// Mock Data Generator (until API is connected)
// =============================================================================

function generateMockSignals(engine: SignalEngine): SignalInstance[] {
  const allowedTypes = engine.getAllowedTypes();
  const companies = [
    'Emirates NBD', 'ADCB', 'Mashreq Bank', 'Dubai Islamic Bank', 'RAK Bank',
    'Abu Dhabi Commercial Bank', 'First Abu Dhabi Bank', 'Sharjah Islamic Bank',
    'National Bank of Fujairah', 'Commercial Bank of Dubai',
  ];

  const signals: SignalInstance[] = [];
  const now = new Date();

  for (let i = 0; i < 25; i++) {
    const type = allowedTypes[i % allowedTypes.length];
    const priorities: PriorityLevel[] = ['critical', 'high', 'medium', 'low'];
    const priority = priorities[Math.floor(Math.random() * 4)] as PriorityLevel;
    const companyName = companies[i % companies.length];
    const detectedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(detectedAt.getTime() + 90 * 24 * 60 * 60 * 1000);

    const signal: SignalInstance = {
      id: `sig-${i + 1}`,
      type,
      companyId: `comp-${i + 1}`,
      companyName,
      title: `${type.replace(/-/g, ' ')} detected`,
      description: `${companyName} showing ${type.replace(/-/g, ' ')} activity`,
      priority,
      confidence: 0.7 + Math.random() * 0.25,
      relevance: 0.6 + Math.random() * 0.35,
      source: ['Apollo', 'LinkedIn', 'News'][Math.floor(Math.random() * 3)],
      detectedAt,
      expiresAt,
      metadata: {
        headcountChange: Math.floor(Math.random() * 100) + 10,
        timeToDecision: Math.floor(Math.random() * 60) + 14,
        city: ['Dubai', 'Abu Dhabi', 'Sharjah'][Math.floor(Math.random() * 3)],
      },
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

  return signals;
}

// =============================================================================
// Component
// =============================================================================

export default function SignalsPage() {
  const { vertical, subVertical, regions, verticalName, subVerticalName } = useSalesContext();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  // State
  const [signals, setSignals] = useState<SignalInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');

  // Initialize Signal Engine with Pack configuration
  const signalEngine = useMemo(() => {
    return new SignalEngine(vertical || 'banking', subVertical || 'employee-banking');
  }, [vertical, subVertical]);

  // Get allowed signal types from Pack
  const allowedTypes = useMemo(() => signalEngine.getAllowedTypes(), [signalEngine]);

  // Fetch and filter signals
  useEffect(() => {
    setLoading(true);

    // Simulate API call - in production this would fetch from /api/signals
    const timer = setTimeout(() => {
      const mockSignals = generateMockSignals(signalEngine);
      setSignals(mockSignals);
      setLoading(false);

      // Expand first category by default
      const grouped = signalEngine.groupByCategory(mockSignals);
      const categories = Object.keys(grouped);
      if (categories.length > 0) {
        setExpandedCategories(new Set([categories[0]]));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [signalEngine]);

  // Apply filters
  const filteredSignals = useMemo(() => {
    // Use SignalFilter properties correctly
    const filter: Partial<SignalFilter> = {};

    if (selectedType) {
      filter.signalTypes = [selectedType as SalesSignalType];
    }

    if (selectedPriority) {
      filter.priority = [selectedPriority];
    }

    // First apply SignalEngine filters
    let result = signalEngine.filterSignals(signals, filter);

    // Then apply search filter locally (not in SignalFilter interface)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(signal =>
        signal.title.toLowerCase().includes(query) ||
        signal.description.toLowerCase().includes(query) ||
        signal.companyName.toLowerCase().includes(query) ||
        signal.type.toLowerCase().includes(query)
      );
    }

    return result;
  }, [signals, searchQuery, selectedType, selectedPriority, signalEngine]);

  // Group signals by category and transform to GroupedSignals[]
  const groupedSignals: GroupedSignals[] = useMemo(() => {
    const grouped = signalEngine.groupByCategory(filteredSignals);
    return Object.entries(grouped).map(([category, categorySignals]) => {
      const avgQTLE = categorySignals.length > 0
        ? categorySignals.reduce((sum, s) => {
            const { quality, timing, likelihood, engagement } = s.qtleContribution;
            return sum + (quality + timing + likelihood + engagement) / 4;
          }, 0) / categorySignals.length
        : 0;

      return {
        category,
        categoryLabel: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
        signals: categorySignals,
        avgQTLE: Math.round(avgQTLE),
      };
    });
  }, [filteredSignals, signalEngine]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Priority colors
  const priorityColors: Record<PriorityLevel, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };

  const priorityTextColors: Record<PriorityLevel, string> = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-yellow-600',
    low: 'text-blue-600',
  };

  // Format relative time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Format signal type for display
  const formatSignalType = (type: string) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading signals from Intelligence Pack...</p>
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
            <Zap size={24} style={{ color: industryConfig.primaryColor }} />
            Signal Intelligence
          </h1>
          <p className="text-gray-500 mt-1">
            Pack-derived signals for {subVerticalName} in {regions?.join(', ') || 'UAE'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: industryConfig.primaryColor }}
            />
            <span className="text-xs text-gray-600">
              {allowedTypes.length} signal types active
            </span>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grouped' : 'list')}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {viewMode === 'list' ? 'Group View' : 'List View'}
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search signals by company or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {allowedTypes.map(type => (
                <option key={type} value={type}>
                  {formatSignalType(type)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={selectedPriority || ''}
              onChange={(e) => setSelectedPriority(e.target.value as PriorityLevel || null)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedType || selectedPriority) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-red-500">×</button>
              </span>
            )}
            {selectedType && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                {formatSignalType(selectedType)}
                <button onClick={() => setSelectedType(null)} className="hover:text-red-500">×</button>
              </span>
            )}
            {selectedPriority && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${priorityTextColors[selectedPriority]} bg-gray-50`}>
                {selectedPriority}
                <button onClick={() => setSelectedPriority(null)} className="hover:text-red-500">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType(null);
                setSelectedPriority(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Signals', value: filteredSignals.length, icon: Zap },
          { label: 'Critical', value: filteredSignals.filter(s => s.priority === 'critical').length, icon: AlertCircle },
          { label: 'High Priority', value: filteredSignals.filter(s => s.priority === 'high').length, icon: TrendingUp },
          { label: 'Avg QTLE', value: Math.round(filteredSignals.reduce((sum, s) => {
            const { quality, timing, likelihood, engagement } = s.qtleContribution || { quality: 0, timing: 0, likelihood: 0, engagement: 0 };
            return sum + (quality + timing + likelihood + engagement) / 4;
          }, 0) / (filteredSignals.length || 1)), icon: Sparkles },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${industryConfig.primaryColor}15` }}
              >
                <stat.icon size={20} style={{ color: industryConfig.primaryColor }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Signals Display */}
      {viewMode === 'grouped' ? (
        // Grouped View
        <div className="space-y-4">
          {groupedSignals.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Info size={40} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No signals match your filters</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            groupedSignals.map((group) => (
              <motion.div
                key={group.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(group.category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${industryConfig.primaryColor}15` }}
                    >
                      <Zap size={16} style={{ color: industryConfig.primaryColor }} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">{group.categoryLabel}</h3>
                      <p className="text-xs text-gray-500">{group.signals.length} signals | Avg QTLE: {group.avgQTLE}</p>
                    </div>
                  </div>
                  {expandedCategories.has(group.category) ? (
                    <ChevronDown size={20} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-400" />
                  )}
                </button>

                {/* Signals List */}
                <AnimatePresence>
                  {expandedCategories.has(group.category) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 divide-y divide-gray-50"
                    >
                      {group.signals.map((signal) => (
                        <SignalCard
                          key={signal.id}
                          signal={signal}
                          formatTime={formatTime}
                          formatSignalType={formatSignalType}
                          priorityColors={priorityColors}
                          priorityTextColors={priorityTextColors}
                          industryConfig={industryConfig}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filteredSignals.length === 0 ? (
            <div className="p-8 text-center">
              <Info size={40} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No signals match your filters</p>
            </div>
          ) : (
            filteredSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                formatTime={formatTime}
                formatSignalType={formatSignalType}
                priorityColors={priorityColors}
                priorityTextColors={priorityTextColors}
                industryConfig={industryConfig}
              />
            ))
          )}
        </div>
      )}

      {/* Pack Info Footer */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Pack Configuration</span>
        </div>
        <p className="text-xs text-gray-500">
          Signal types derived from {verticalName} &gt; {subVerticalName} Intelligence Pack.
          Showing only signals relevant to your sales context.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {allowedTypes.map(type => (
            <span key={type} className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded">
              {formatSignalType(type)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Signal Card Component
// =============================================================================

interface SignalCardProps {
  signal: SignalInstance;
  formatTime: (timestamp: string) => string;
  formatSignalType: (type: string) => string;
  priorityColors: Record<PriorityLevel, string>;
  priorityTextColors: Record<PriorityLevel, string>;
  industryConfig: { primaryColor: string };
}

function SignalCard({
  signal,
  formatTime,
  formatSignalType,
  priorityColors,
  priorityTextColors,
  industryConfig,
}: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const priority = signal.priority as PriorityLevel;
  const city = (signal.metadata?.city as string) || 'UAE';

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Priority Indicator */}
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${priorityColors[priority]}`} />

        {/* Company Avatar */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
          style={{ backgroundColor: industryConfig.primaryColor }}
        >
          {signal.companyName.substring(0, 2)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{signal.companyName}</h4>
            <span className={`text-xs px-1.5 py-0.5 rounded ${priorityTextColors[priority]} bg-gray-50`}>
              {priority}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <Building size={12} />
              Banking
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {city}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatTime(signal.detectedAt.toISOString())}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-2">{signal.description}</p>

          {/* Signal Type & Source */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {formatSignalType(signal.type)}
            </span>
            <span className="text-xs text-gray-400">
              via {signal.source}
            </span>
            <span className="text-xs text-gray-400">
              {Math.round(signal.confidence * 100)}% confidence
            </span>
          </div>

          {/* QTLE Contribution (expandable) */}
          {signal.qtleContribution && (
            <div className="mt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <Sparkles size={12} />
                QTLE: {Math.round((signal.qtleContribution.quality + signal.qtleContribution.timing + signal.qtleContribution.likelihood + signal.qtleContribution.engagement) / 4)}
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 grid grid-cols-4 gap-2"
                  >
                    {[
                      { label: 'Quality', value: signal.qtleContribution.quality, color: '#3B82F6' },
                      { label: 'Timing', value: signal.qtleContribution.timing, color: '#10B981' },
                      { label: 'Likelihood', value: signal.qtleContribution.likelihood, color: '#F59E0B' },
                      { label: 'Engagement', value: signal.qtleContribution.engagement, color: '#8B5CF6' },
                    ].map((metric) => (
                      <div key={metric.label} className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-bold" style={{ color: metric.color }}>
                          {metric.value}
                        </div>
                        <div className="text-xs text-gray-500">{metric.label}</div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
