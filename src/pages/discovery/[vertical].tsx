/**
 * Vertical Discovery Page
 * Sprint S55: Discovery UI
 *
 * Main discovery page for a specific vertical.
 * Shows ranked companies with scores, signals, and evidence.
 */

import { useRouter } from 'next/router';
import Head from 'next/head';
import { useState } from 'react';
import {
  DiscoveryList,
  DiscoveryUIFilters,
  CompanyProfileCard,
  EvidenceSummaryPanel,
  SignalImpactPanel,
  ScoreBreakdown,
  ObjectGraphMini,
  DiscoveryEmptyState,
  DiscoveryErrorState,
} from '../../../components/discovery';
import {
  useDiscoveryList,
  useDiscoveryFilters,
  useCompanyProfile,
  useEvidenceSummary,
  useSignalImpacts,
  useScoreBreakdown,
  useObjectGraphMini,
  type CompanySizeCategory,
} from '../../../lib/discovery';
import { isValidVertical, getVerticalConfig, type VerticalId } from '../../../lib/dashboard';

export default function VerticalDiscoveryPage() {
  const router = useRouter();
  const { vertical, territory } = router.query;

  // Determine the vertical
  const verticalId: VerticalId = (typeof vertical === 'string' && isValidVertical(vertical))
    ? vertical as VerticalId
    : 'banking';

  // Filter state
  const {
    filters,
    setVertical,
    setTerritory,
    setIndustries,
    setCompanySizes,
    setScoreRange,
    setFreshness,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    resetFilters,
    hasActiveFilters,
  } = useDiscoveryFilters(verticalId);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Discovery list data
  const {
    items,
    stats,
    isLoading,
    error,
    refresh,
    totalPages,
  } = useDiscoveryList(filters.vertical || verticalId, {
    filters,
    page,
    pageSize,
  });

  // Selected company state
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Company detail hooks
  const { profile, isLoading: isLoadingProfile } = useCompanyProfile(selectedObjectId);
  const { evidence, isLoading: isLoadingEvidence } = useEvidenceSummary(selectedObjectId);
  const { signals, isLoading: isLoadingSignals } = useSignalImpacts(selectedObjectId);
  const { breakdown: score, isLoading: isLoadingScore } = useScoreBreakdown(selectedObjectId);
  const { graph, isLoading: isLoadingGraph } = useObjectGraphMini(selectedObjectId);

  const isLoadingCompany = isLoadingProfile || isLoadingEvidence || isLoadingSignals || isLoadingScore || isLoadingGraph;

  // Handle invalid vertical
  if (typeof vertical === 'string' && !isValidVertical(vertical)) {
    return (
      <>
        <Head>
          <title>Invalid Vertical | PremiumRadar Discovery</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Vertical</h1>
            <p className="text-gray-500 mb-6">
              The vertical &quot;{vertical}&quot; is not recognized.
            </p>
            <button
              onClick={() => router.push('/discovery/banking')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Go to Banking Discovery
            </button>
          </div>
        </div>
      </>
    );
  }

  // Loading state while router query is resolving
  if (!vertical || typeof vertical !== 'string') {
    return (
      <>
        <Head>
          <title>Discovery | PremiumRadar</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading discovery...</p>
          </div>
        </div>
      </>
    );
  }

  const config = getVerticalConfig(verticalId);

  const handleVerticalChange = (newVertical: VerticalId) => {
    setVertical(newVertical);
    setPage(1);
    setSelectedObjectId(null);

    const query: Record<string, string> = {};
    if (filters.territory) {
      query.territory = filters.territory;
    }

    router.push({
      pathname: `/discovery/${newVertical}`,
      query: Object.keys(query).length > 0 ? query : undefined,
    });
  };

  const handleCompanySelect = (objectId: string) => {
    setSelectedObjectId(objectId === selectedObjectId ? null : objectId);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedObjectId(null);
  };

  const handleResetFilters = () => {
    resetFilters();
    setPage(1);
    setSelectedObjectId(null);
  };

  const handleSizesChange = (sizes: CompanySizeCategory[]) => {
    setCompanySizes(sizes);
  };

  return (
    <>
      <Head>
        <title>{config.name} Discovery | PremiumRadar</title>
        <meta name="description" content={`Discover high-potential ${config.name.toLowerCase()} prospects`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {config.icon} {config.name} Discovery
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  AI-powered prospect intelligence for {config.name.toLowerCase()} sales
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => refresh()}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Left Sidebar - Filters */}
            <aside className="w-72 flex-shrink-0">
              <DiscoveryUIFilters
                filters={filters}
                onVerticalChange={handleVerticalChange}
                onTerritoryChange={setTerritory}
                onIndustriesChange={setIndustries}
                onSizesChange={handleSizesChange}
                onScoreRangeChange={setScoreRange}
                onFreshnessChange={setFreshness}
                onSearchChange={setSearchQuery}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
                onReset={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </aside>

            {/* Center - Discovery List */}
            <div className="flex-1 min-w-0">
              {error ? (
                <DiscoveryErrorState
                  error={error}
                  onRetry={() => refresh()}
                  onGoBack={() => router.back()}
                />
              ) : !isLoading && items.length === 0 ? (
                <DiscoveryEmptyState
                  vertical={verticalId}
                  hasFilters={hasActiveFilters}
                  onResetFilters={handleResetFilters}
                />
              ) : (
                <DiscoveryList
                  items={items}
                  stats={stats}
                  isLoading={isLoading}
                  selectedId={selectedObjectId}
                  onSelect={handleCompanySelect}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {/* Right Sidebar - Company Details */}
            {selectedObjectId && (
              <aside className="w-96 flex-shrink-0 space-y-4">
                {/* Company Profile */}
                {profile && (
                  <CompanyProfileCard data={profile} isLoading={isLoadingCompany} />
                )}

                {/* Score Breakdown */}
                {score && (
                  <ScoreBreakdown data={score} isLoading={isLoadingCompany} />
                )}

                {/* Signal Impact */}
                {signals && (
                  <SignalImpactPanel data={signals} isLoading={isLoadingCompany} />
                )}

                {/* Evidence Summary */}
                {evidence && (
                  <EvidenceSummaryPanel data={evidence} isLoading={isLoadingCompany} />
                )}

                {/* Object Graph */}
                {graph && (
                  <ObjectGraphMini
                    data={graph}
                    isLoading={isLoadingCompany}
                    onNodeClick={(nodeId, nodeType) => {
                      console.log('Node clicked:', nodeId, nodeType);
                    }}
                  />
                )}
              </aside>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
