'use client';

/**
 * Discovery Page - SIVA Intelligence Enhanced
 *
 * Uses OS discovery API with progressive delivery, preference learning,
 * and conversational UX.
 *
 * ARCHITECTURE COMPLIANCE:
 * - SaaS renders leads from OS (SAAS_RENDER_ONLY)
 * - SaaS emits feedback events to OS (SAAS_EVENT_ONLY)
 * - OS decides batch delivery, learns preferences, generates prompts
 * - SIVA reasons over OS-provided context (stateless)
 *
 * Architecture: OS decides. SIVA reasons. SaaS renders.
 */

// Force dynamic rendering - uses API calls
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUpDown, Sparkles, Loader2, AlertCircle, RefreshCw, BookmarkIcon, Settings2 } from 'lucide-react';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useVerticalConfig } from '@/lib/intelligence/hooks/useVerticalConfig';
import { EBDiscoveryCard, type EBCompanyData } from '@/components/discovery/EBDiscoveryCard';
import { ContextBadge } from '@/components/dashboard/ContextBadge';

// S218-S223: SIVA Intelligence Components
import { ConversationalPrompts, SIVACommentary, RefinementInput } from '@/components/discovery/ConversationalPrompts';
import { SavedLeadsPanel } from '@/components/discovery/SavedLeadsPanel';
import { FeedbackSummary, type FeedbackAction } from '@/components/discovery/FeedbackActions';

// =============================================================================
// TYPES
// =============================================================================

interface EnrichedEntity {
  id: string;
  name: string;
  type: string;
  industry?: string;
  size?: string;
  headcount?: number;
  headcountGrowth?: number;
  region: string;
  city?: string;
  description?: string;
  website?: string;
  linkedIn?: string;
  score: number;
  scoreBreakdown: Record<string, number>;
  signals: Array<{
    type: string;
    title: string;
    description: string;
    source: string;
    sourceUrl: string;
    date?: string;
    confidence: number;
  }>;
  decisionMaker?: {
    name: string;
    title: string;
    email?: string;
    linkedin?: string;
  };
  freshness: string;
  dataSources: string[];
  lastEnriched: string;
}

interface EnrichmentResult {
  entities: EnrichedEntity[];
  total: number;
  regions: string[];
  timestamp: string;
  verticalConfig: {
    vertical: string;
    subVertical: string;
    region: string;
    radarTarget: string;
  };
  dataQuality: {
    sourcesUsed: string[];
    signalCount: number;
    enrichedCount: number;
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

// =============================================================================
// INTELLIGENCE STATE TYPES (S218-S223)
// =============================================================================

interface ConversationalPrompt {
  id: string;
  type: 'AFTER_BATCH' | 'AFTER_LIKE' | 'AFTER_DISLIKE' | 'LOW_MATCHES' | 'REFINEMENT';
  text: string;
  options?: Array<{ label: string; value: string; action: string }>;
  allowFreeform?: boolean;
  placeholder?: string;
}

interface SavedLead {
  companyId: string;
  companyName: string;
  industry?: string;
  location?: string;
  savedAt: string;
  score?: number;
}

interface FeedbackStats {
  likeCount: number;
  dislikeCount: number;
  saveCount: number;
  totalFeedback: number;
}

export default function DiscoveryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'headcount'>('score');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // Real data state
  const [entities, setEntities] = useState<EnrichedEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataQuality, setDataQuality] = useState<EnrichmentResult['dataQuality'] | null>(null);

  // S218-S223: Intelligence State
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Map<string, FeedbackAction>>(new Map());
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>({
    likeCount: 0,
    dislikeCount: 0,
    saveCount: 0,
    totalFeedback: 0,
  });
  const [currentPrompt, setCurrentPrompt] = useState<ConversationalPrompt | null>(null);
  const [sivaCommentary, setSivaCommentary] = useState<string | null>(null);
  const [batchNumber, setBatchNumber] = useState(1);
  const [hasMoreLeads, setHasMoreLeads] = useState(true);

  // Get sales context
  const { vertical, subVertical, regions, subVerticalName, regionsDisplay } = useSalesContext();

  // Get vertical config from API
  const { signalConfigs, isLoading: configLoading, isConfigured } = useVerticalConfig();

  // Fetch real data from enrichment API
  const fetchData = useCallback(async () => {
    if (!vertical || !subVertical) {
      setError('Please configure your vertical context.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enrichment/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical,
          subVertical,
          region: regions[0] || 'UAE',
          regions: regions.length > 0 ? regions : undefined,
          limit: 20,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setEntities(data.data.entities || []);
        setDataQuality(data.data.dataQuality);
      } else {
        if (data.error === 'INTEGRATION_NOT_CONFIGURED') {
          setError('API integrations not configured. Go to Admin → API Integrations to add Apollo/SERP keys.');
        } else if (data.error === 'VERTICAL_NOT_CONFIGURED') {
          setError('Vertical not configured. Contact admin to set up this vertical.');
        } else {
          setError(data.message || 'Failed to fetch data');
        }
      }
    } catch (err) {
      console.error('[Discovery] Fetch error:', err);
      setError('Failed to connect to enrichment API');
    } finally {
      setIsLoading(false);
    }
  }, [vertical, subVertical, regions]);

  // Fetch data on mount and when context changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort entities
  const filteredEntities = entities
    .filter(entity => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        entity.name.toLowerCase().includes(query) ||
        (entity.industry?.toLowerCase() || '').includes(query) ||
        (entity.city?.toLowerCase() || '').includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'headcount':
          return (b.headcount || 0) - (a.headcount || 0);
        default:
          return 0;
      }
    });

  // Convert to EBCompanyData format for existing card component
  const convertToCardData = (entity: EnrichedEntity): EBCompanyData => ({
    id: entity.id,
    name: entity.name,
    industry: entity.industry || 'Unknown',
    size: (entity.size as 'startup' | 'smb' | 'mid-market' | 'enterprise') || 'mid-market',
    region: entity.region,
    city: entity.city || entity.region,
    headcount: entity.headcount || 0,
    headcountGrowth: entity.headcountGrowth || 0,
    bankingTier: entity.size === 'enterprise' ? 'tier1' : 'tier2',
    signals: entity.signals.map(s => ({
      type: s.type,
      title: s.title,
      description: s.description,
      source: s.source,
      confidence: s.confidence,
    })),
    score: entity.score,
    decisionMaker: entity.decisionMaker ? {
      name: entity.decisionMaker.name,
      title: entity.decisionMaker.title,
      linkedin: entity.decisionMaker.linkedin,
    } : undefined,
    freshness: (entity.freshness as 'fresh' | 'recent' | 'stale') || 'stale',
  });

  // Handle SIVA actions
  const handleSivaAction = (action: string, company: EBCompanyData) => {
    console.log(`[SIVA Action] ${action} for ${company.name}`);
    // TODO: Integrate with SIVA
  };

  // =============================================================================
  // S218-S223: INTELLIGENCE HANDLERS
  // =============================================================================

  /**
   * Handle feedback - SAAS_EVENT_ONLY
   * Emits event to OS, which stores and learns from it
   */
  const handleFeedback = useCallback(async (
    companyId: string,
    action: FeedbackAction,
    metadata?: Record<string, unknown>
  ) => {
    console.log(`[Feedback] ${action} for ${companyId}`, metadata);

    // Update local feedback map for UI (SAAS_RENDER_ONLY from future OS response)
    setFeedbackMap(prev => {
      const next = new Map(prev);
      next.set(companyId, action);
      return next;
    });

    // Update stats
    setFeedbackStats(prev => {
      const newStats = { ...prev, totalFeedback: prev.totalFeedback + 1 };
      if (action === 'LIKE') newStats.likeCount++;
      if (action === 'DISLIKE') newStats.dislikeCount++;
      if (action === 'SAVE') newStats.saveCount++;
      return newStats;
    });

    // Handle SAVE action
    if (action === 'SAVE') {
      const entity = entities.find(e => e.id === companyId);
      if (entity) {
        setSavedLeads(prev => [...prev, {
          companyId,
          companyName: entity.name,
          industry: entity.industry,
          location: entity.city || entity.region,
          savedAt: new Date().toISOString(),
          score: entity.score,
        }]);
      }
    }

    // Generate contextual prompt after feedback (simulating OS response)
    if (action === 'LIKE') {
      const entity = entities.find(e => e.id === companyId);
      setCurrentPrompt({
        id: `prompt_${Date.now()}`,
        type: 'AFTER_LIKE',
        text: `Great choice! Want more companies like ${entity?.name || 'this'}?`,
        options: [
          { label: 'Yes, more like this', value: 'similar', action: 'FIND_SIMILAR' },
          { label: 'Show different types', value: 'different', action: 'DIVERSIFY' },
        ],
        allowFreeform: true,
        placeholder: 'Or tell me what you prefer...',
      });
    } else if (action === 'DISLIKE') {
      const entity = entities.find(e => e.id === companyId);
      setCurrentPrompt({
        id: `prompt_${Date.now()}`,
        type: 'AFTER_DISLIKE',
        text: `Got it. Should I avoid ${entity?.industry || 'similar'} companies?`,
        options: [
          { label: 'Yes, avoid this type', value: 'avoid', action: 'FILTER_OUT' },
          { label: 'No, keep showing all', value: 'keep', action: 'CONTINUE' },
        ],
      });
    }

    // TODO: Call OS API to record feedback
    // await fetch('/api/os/feedback', { method: 'POST', body: JSON.stringify({ companyId, action, metadata }) });
  }, [entities]);

  /**
   * Handle prompt response - SAAS_EVENT_ONLY
   */
  const handlePromptResponse = useCallback(async (
    promptId: string,
    response: { action: string; value?: string }
  ) => {
    console.log(`[Prompt Response] ${promptId}:`, response);
    setCurrentPrompt(null);

    // Update SIVA commentary based on response
    if (response.action === 'FIND_SIMILAR') {
      setSivaCommentary('Finding more companies with similar characteristics...');
    } else if (response.action === 'FILTER_OUT') {
      setSivaCommentary('I\'ll focus on different types of companies for you.');
    } else if (response.action === 'FREEFORM' && response.value) {
      setSivaCommentary(`Adjusting search based on: "${response.value}"`);
    }

    // Clear commentary after delay
    setTimeout(() => setSivaCommentary(null), 5000);

    // TODO: Call OS API to apply refinement
  }, []);

  /**
   * Handle refinement input - SAAS_EVENT_ONLY
   */
  const handleRefinement = useCallback(async (text: string) => {
    console.log(`[Refinement] ${text}`);
    setSivaCommentary(`Processing: "${text}"...`);

    // Simulate processing delay
    setTimeout(() => {
      setSivaCommentary(`Adjusted results based on: "${text}"`);
      setTimeout(() => setSivaCommentary(null), 5000);
    }, 1000);

    // TODO: Call OS API to apply refinement
  }, []);

  /**
   * Handle unsave - SAAS_EVENT_ONLY
   */
  const handleUnsave = useCallback(async (companyId: string) => {
    setSavedLeads(prev => prev.filter(l => l.companyId !== companyId));
    setFeedbackStats(prev => ({ ...prev, saveCount: Math.max(0, prev.saveCount - 1) }));
    setFeedbackMap(prev => {
      const next = new Map(prev);
      next.delete(companyId);
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Context Banner */}
      <ContextBadge />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discovery</h1>
          <p className="text-gray-500 mt-1">
            {subVerticalName || 'Find opportunities'} in {regionsDisplay}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Feedback Stats - SAAS_RENDER_ONLY */}
          {feedbackStats.totalFeedback > 0 && (
            <FeedbackSummary summary={feedbackStats} />
          )}

          {/* Saved Leads Toggle */}
          <button
            onClick={() => setShowSavedPanel(!showSavedPanel)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showSavedPanel
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BookmarkIcon className="w-4 h-4" />
            <span>Saved ({savedLeads.length})</span>
          </button>

          {/* Data Quality Badge */}
          {dataQuality && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <span>Sources: {dataQuality.sourcesUsed.join(', ') || 'None'}</span>
              <span>|</span>
              <span>{dataQuality.signalCount} signals</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Signal Config Status */}
          {isConfigured && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Config Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, industry, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="score">Sort by Score</option>
            <option value="headcount">Sort by Headcount</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Filter button */}
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {filteredEntities.length} results in {regionsDisplay}
        </span>
        <span>
          {signalConfigs.length > 0
            ? `Signals: ${signalConfigs.map(s => s.name).join(', ')}`
            : 'Loading config...'}
        </span>
      </div>

      {/* S222: SIVA Intelligence Section - SAAS_RENDER_ONLY */}
      <div className="space-y-3">
        {/* SIVA Commentary */}
        <SIVACommentary commentary={sivaCommentary} />

        {/* Conversational Prompt */}
        <ConversationalPrompts
          prompt={currentPrompt}
          onResponse={handlePromptResponse}
          onDismiss={() => setCurrentPrompt(null)}
        />

        {/* Refinement Input */}
        <RefinementInput
          onSubmit={handleRefinement}
          examples={[
            'Show only 100+ employees',
            'Focus on DIFC companies',
            'No construction companies',
          ]}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Data fetch failed</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500">Fetching real data from Apollo + SERP...</p>
        </div>
      ) : (
        <>
          {/* Main Content Area */}
          <div className="flex gap-6">
            {/* Results Grid */}
            <div className={`grid grid-cols-1 ${showSavedPanel ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-4 flex-1`}>
              {filteredEntities.map((entity, index) => (
                <motion.div
                  key={entity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EBDiscoveryCard
                    company={convertToCardData(entity)}
                    rank={index + 1}
                    isSelected={selectedCompany === entity.id}
                    onSelect={setSelectedCompany}
                    onSivaAction={handleSivaAction}
                    // S221: Feedback props - SAAS_EVENT_ONLY
                    currentFeedback={feedbackMap.get(entity.id)}
                    isSaved={savedLeads.some(l => l.companyId === entity.id)}
                    onFeedback={handleFeedback}
                  />
                </motion.div>
              ))}
            </div>

            {/* S221: Saved Leads Panel - SAAS_RENDER_ONLY */}
            {showSavedPanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 350, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <SavedLeadsPanel
                  savedLeads={savedLeads}
                  totalCount={savedLeads.length}
                  onUnsave={handleUnsave}
                  onViewLead={(companyId) => setSelectedCompany(companyId)}
                />
              </motion.div>
            )}
          </div>

          {/* Empty State */}
          {filteredEntities.length === 0 && !error && (
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 mb-4">
                {entities.length === 0
                  ? 'Configure API integrations in Admin → API Integrations'
                  : 'Try adjusting your search or filters'}
              </p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
