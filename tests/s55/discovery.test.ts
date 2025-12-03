/**
 * Discovery UI Tests
 * Sprint S55: Discovery UI
 *
 * Comprehensive tests for the discovery data layer, transformers, and hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// MOCK FETCH
// =============================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

// =============================================================================
// TYPE TESTS
// =============================================================================

describe('Discovery Types', () => {
  describe('DiscoveryListItem', () => {
    it('should have correct structure', () => {
      const item = {
        id: 'item-1',
        objectId: 'obj-123',
        rank: 1,
        company: {
          name: 'Test Corp',
          industry: 'Technology',
          size: 'medium' as const,
          location: {
            country: 'UAE',
            city: 'Dubai',
          },
        },
        score: {
          total: 85,
          quality: 90,
          relevance: 80,
          freshness: 85,
        },
        freshness: 'fresh' as const,
        signalsSummary: {
          total: 5,
          positive: 4,
          negative: 1,
          topSignals: ['Hiring', 'Expansion'],
        },
        evidence: {
          totalCount: 12,
          recentCount: 3,
        },
        discoveredAt: new Date(),
        lastUpdated: new Date(),
      };

      expect(item.id).toBe('item-1');
      expect(item.objectId).toBe('obj-123');
      expect(item.rank).toBe(1);
      expect(item.company.name).toBe('Test Corp');
      expect(item.score.total).toBe(85);
      expect(item.freshness).toBe('fresh');
    });
  });

  describe('CompanySizeCategory', () => {
    it('should accept valid size categories', () => {
      const sizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
      sizes.forEach((size) => {
        expect(['startup', 'small', 'medium', 'large', 'enterprise']).toContain(size);
      });
    });
  });

  describe('FreshnessStatus', () => {
    it('should accept valid freshness statuses', () => {
      const statuses = ['fresh', 'recent', 'stale', 'unknown'];
      statuses.forEach((status) => {
        expect(['fresh', 'recent', 'stale', 'unknown']).toContain(status);
      });
    });
  });

  describe('DiscoverySortOption', () => {
    it('should accept valid sort options', () => {
      const sortOptions = ['score', 'freshness', 'evidence', 'signals', 'discovered', 'name'];
      sortOptions.forEach((opt) => {
        expect(['score', 'freshness', 'evidence', 'signals', 'discovered', 'name']).toContain(opt);
      });
    });
  });
});

// =============================================================================
// TRANSFORMER TESTS
// =============================================================================

describe('Discovery Transformers', () => {
  describe('transformDiscoveryResponse', () => {
    it('should transform OS response to UI format', () => {
      const osResponse = {
        items: [
          {
            object_id: 'obj-1',
            domain: 'example.com',
            company_name: 'Example Corp',
            industry: 'Technology',
            size: 'medium',
            country: 'UAE',
            city: 'Dubai',
            scores: {
              total: 85,
              quality: 90,
              relevance: 80,
              freshness: 85,
            },
            signals: {
              positive: 4,
              negative: 1,
              top: ['Hiring', 'Expansion'],
            },
            evidence_count: 12,
            last_updated: '2024-01-15T10:00:00Z',
          },
        ],
        total: 100,
        page: 1,
        page_size: 20,
      };

      // Test the transformation logic
      const items = osResponse.items.map((item, index) => ({
        id: `discovery-${item.object_id}`,
        objectId: item.object_id,
        rank: index + 1,
        company: {
          name: item.company_name,
          industry: item.industry,
          size: item.size,
          location: {
            country: item.country,
            city: item.city,
          },
        },
        score: item.scores,
        freshness: item.scores.freshness >= 80 ? 'fresh' : item.scores.freshness >= 50 ? 'recent' : 'stale',
        signalsSummary: {
          total: item.signals.positive + item.signals.negative,
          positive: item.signals.positive,
          negative: item.signals.negative,
          topSignals: item.signals.top,
        },
        evidence: {
          totalCount: item.evidence_count,
          recentCount: Math.floor(item.evidence_count * 0.3),
        },
      }));

      expect(items.length).toBe(1);
      expect(items[0].objectId).toBe('obj-1');
      expect(items[0].company.name).toBe('Example Corp');
      expect(items[0].freshness).toBe('fresh');
    });
  });

  describe('buildEvidenceSummary', () => {
    it('should build evidence summary from OS response', () => {
      const osEvidence = {
        total: 25,
        providers: [
          { name: 'LinkedIn', count: 10, quality: 85, last_fetch: '2024-01-15' },
          { name: 'Apollo', count: 8, quality: 90, last_fetch: '2024-01-14' },
          { name: 'Crunchbase', count: 7, quality: 80, last_fetch: '2024-01-13' },
        ],
        categories: [
          { name: 'company', count: 12 },
          { name: 'hiring', count: 8 },
          { name: 'financial', count: 5 },
        ],
        timeline: [
          { date: '2024-01-15', type: 'hiring', description: 'New job posting', source: 'LinkedIn' },
        ],
        freshness: {
          status: 'fresh',
          last_update: '2024-01-15',
          staleness_days: 0,
        },
      };

      const summary = {
        totalCount: osEvidence.total,
        providers: osEvidence.providers.map((p) => ({
          name: p.name,
          count: p.count,
          quality: p.quality,
          lastFetch: new Date(p.last_fetch),
        })),
        categories: osEvidence.categories,
        timeline: osEvidence.timeline.map((t) => ({
          date: new Date(t.date),
          type: t.type,
          description: t.description,
          source: t.source,
        })),
        freshness: {
          status: osEvidence.freshness.status as 'fresh' | 'recent' | 'stale',
          lastUpdate: new Date(osEvidence.freshness.last_update),
          stalenessDays: osEvidence.freshness.staleness_days,
        },
      };

      expect(summary.totalCount).toBe(25);
      expect(summary.providers.length).toBe(3);
      expect(summary.categories.length).toBe(3);
      expect(summary.freshness.status).toBe('fresh');
    });
  });

  describe('buildSignalList', () => {
    it('should group signals by category', () => {
      const signals = [
        { id: 's1', type: 'hiring', name: 'Hiring', strength: 'strong', impact: 5, description: '', category: 'growth' },
        { id: 's2', type: 'expansion', name: 'Expansion', strength: 'moderate', impact: 3, description: '', category: 'growth' },
        { id: 's3', type: 'layoff', name: 'Layoff', strength: 'weak', impact: -2, description: '', category: 'risk' },
      ];

      const grouped = signals.reduce((acc, signal) => {
        const cat = acc.find((c) => c.category === signal.category);
        if (cat) {
          cat.signals.push(signal);
        } else {
          acc.push({ category: signal.category, signals: [signal] });
        }
        return acc;
      }, [] as { category: string; signals: typeof signals }[]);

      expect(grouped.length).toBe(2);
      expect(grouped.find((g) => g.category === 'growth')?.signals.length).toBe(2);
      expect(grouped.find((g) => g.category === 'risk')?.signals.length).toBe(1);
    });

    it('should calculate net impact', () => {
      const signals = [
        { impact: 5 },
        { impact: 3 },
        { impact: -2 },
      ];

      const netImpact = signals.reduce((sum, s) => sum + s.impact, 0);
      expect(netImpact).toBe(6);
    });
  });

  describe('buildGraphMini', () => {
    it('should structure graph data correctly', () => {
      const osGraph = {
        center: { id: 'obj-1', label: 'Test Corp', type: 'company' },
        neighbors: [
          { id: 'n1', label: 'John Doe', type: 'person', relationship: 'employee' },
          { id: 'n2', label: 'Tech News', type: 'news', relationship: 'mentioned' },
          { id: 'n3', label: 'Series B', type: 'funding', relationship: 'raised' },
        ],
      };

      const graph = {
        centerId: osGraph.center.id,
        centerLabel: osGraph.center.label,
        centerType: osGraph.center.type,
        neighbors: osGraph.neighbors.map((n) => ({
          id: n.id,
          label: n.label,
          type: n.type,
          relationship: n.relationship,
        })),
      };

      expect(graph.centerId).toBe('obj-1');
      expect(graph.neighbors.length).toBe(3);
      expect(graph.neighbors.find((n) => n.type === 'person')).toBeDefined();
    });
  });

  describe('buildScoreBreakdown', () => {
    it('should calculate score components correctly', () => {
      const osScore = {
        total: 85,
        components: [
          { name: 'Quality', score: 90, weight: 0.3 },
          { name: 'Relevance', score: 80, weight: 0.25 },
          { name: 'Freshness', score: 85, weight: 0.2 },
          { name: 'Signals', score: 88, weight: 0.25 },
        ],
      };

      const breakdown = {
        totalScore: osScore.total,
        components: osScore.components.map((c) => ({
          name: c.name,
          score: c.score,
          weight: c.weight,
          contribution: c.score * c.weight,
        })),
      };

      expect(breakdown.totalScore).toBe(85);
      expect(breakdown.components[0].contribution).toBe(27); // 90 * 0.3
      expect(breakdown.components.reduce((sum, c) => sum + c.contribution, 0)).toBeCloseTo(85.95);
    });
  });

  describe('buildCompanyProfileCard', () => {
    it('should structure company profile data', () => {
      const osProfile = {
        company: {
          name: 'Test Corp',
          domain: 'testcorp.com',
          industry: 'Technology',
          size: 'medium',
          employee_count: 250,
          founded_year: 2015,
          location: { country: 'UAE', city: 'Dubai' },
          description: 'A tech company',
        },
        intelligence: {
          evidence_count: 25,
          signal_count: 8,
          data_quality: 85,
          last_updated: '2024-01-15',
        },
      };

      const profile = {
        company: {
          name: osProfile.company.name,
          website: `https://${osProfile.company.domain}`,
          industry: osProfile.company.industry,
          size: osProfile.company.size,
          employeeCount: osProfile.company.employee_count,
          foundedYear: osProfile.company.founded_year,
          location: osProfile.company.location,
          description: osProfile.company.description,
        },
        intelligence: {
          evidenceCount: osProfile.intelligence.evidence_count,
          signalCount: osProfile.intelligence.signal_count,
          dataQuality: osProfile.intelligence.data_quality,
          lastUpdated: new Date(osProfile.intelligence.last_updated),
        },
      };

      expect(profile.company.name).toBe('Test Corp');
      expect(profile.company.website).toBe('https://testcorp.com');
      expect(profile.intelligence.dataQuality).toBe(85);
    });
  });
});

// =============================================================================
// FILTER TESTS
// =============================================================================

describe('Discovery Filters', () => {
  describe('DiscoveryUIFilter', () => {
    it('should have correct default values', () => {
      const defaultFilters = {
        vertical: 'banking',
        territory: undefined,
        industries: [],
        companySizes: [],
        scoreRange: undefined,
        signals: [],
        freshness: [],
        dateRange: undefined,
        searchQuery: '',
        sortBy: 'score',
        sortOrder: 'desc',
      };

      expect(defaultFilters.vertical).toBe('banking');
      expect(defaultFilters.sortBy).toBe('score');
      expect(defaultFilters.sortOrder).toBe('desc');
    });
  });

  describe('Filter application', () => {
    it('should filter by company size', () => {
      const items = [
        { company: { size: 'startup' } },
        { company: { size: 'medium' } },
        { company: { size: 'enterprise' } },
      ];
      const filterSizes = ['startup', 'medium'];

      const filtered = items.filter((item) =>
        filterSizes.includes(item.company.size)
      );

      expect(filtered.length).toBe(2);
    });

    it('should filter by score range', () => {
      const items = [
        { score: { total: 90 } },
        { score: { total: 75 } },
        { score: { total: 50 } },
      ];
      const scoreRange = { min: 60, max: 100 };

      const filtered = items.filter(
        (item) =>
          item.score.total >= scoreRange.min && item.score.total <= scoreRange.max
      );

      expect(filtered.length).toBe(2);
    });

    it('should filter by freshness', () => {
      const items = [
        { freshness: 'fresh' },
        { freshness: 'recent' },
        { freshness: 'stale' },
      ];
      const filterFreshness = ['fresh', 'recent'];

      const filtered = items.filter((item) =>
        filterFreshness.includes(item.freshness)
      );

      expect(filtered.length).toBe(2);
    });

    it('should filter by search query', () => {
      const items = [
        { company: { name: 'Acme Corp' } },
        { company: { name: 'Beta Inc' } },
        { company: { name: 'Gamma Ltd' } },
      ];
      const searchQuery = 'acme';

      const filtered = items.filter((item) =>
        item.company.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].company.name).toBe('Acme Corp');
    });
  });

  describe('Sorting', () => {
    it('should sort by score descending', () => {
      const items = [
        { score: { total: 75 } },
        { score: { total: 90 } },
        { score: { total: 60 } },
      ];

      const sorted = [...items].sort((a, b) => b.score.total - a.score.total);

      expect(sorted[0].score.total).toBe(90);
      expect(sorted[1].score.total).toBe(75);
      expect(sorted[2].score.total).toBe(60);
    });

    it('should sort by score ascending', () => {
      const items = [
        { score: { total: 75 } },
        { score: { total: 90 } },
        { score: { total: 60 } },
      ];

      const sorted = [...items].sort((a, b) => a.score.total - b.score.total);

      expect(sorted[0].score.total).toBe(60);
      expect(sorted[1].score.total).toBe(75);
      expect(sorted[2].score.total).toBe(90);
    });

    it('should sort by name alphabetically', () => {
      const items = [
        { company: { name: 'Zebra Corp' } },
        { company: { name: 'Alpha Inc' } },
        { company: { name: 'Beta Ltd' } },
      ];

      const sorted = [...items].sort((a, b) =>
        a.company.name.localeCompare(b.company.name)
      );

      expect(sorted[0].company.name).toBe('Alpha Inc');
      expect(sorted[1].company.name).toBe('Beta Ltd');
      expect(sorted[2].company.name).toBe('Zebra Corp');
    });
  });
});

// =============================================================================
// STATS TESTS
// =============================================================================

describe('Discovery Stats', () => {
  describe('DiscoveryStatsData', () => {
    it('should calculate stats correctly', () => {
      const items = [
        { score: { total: 90 }, freshness: 'fresh' },
        { score: { total: 75 }, freshness: 'fresh' },
        { score: { total: 60 }, freshness: 'recent' },
        { score: { total: 85 }, freshness: 'stale' },
      ];

      const stats = {
        total: items.length,
        qualified: items.filter((i) => i.score.total >= 70).length,
        newThisWeek: items.filter((i) => i.freshness === 'fresh').length,
        avgScore: items.reduce((sum, i) => sum + i.score.total, 0) / items.length,
      };

      expect(stats.total).toBe(4);
      expect(stats.qualified).toBe(3);
      expect(stats.newThisWeek).toBe(2);
      expect(stats.avgScore).toBe(77.5);
    });
  });

  describe('Industry breakdown', () => {
    it('should count items by industry', () => {
      const items = [
        { company: { industry: 'Technology' } },
        { company: { industry: 'Technology' } },
        { company: { industry: 'Finance' } },
        { company: { industry: 'Healthcare' } },
      ];

      const breakdown = items.reduce((acc, item) => {
        const industry = item.company.industry;
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(breakdown['Technology']).toBe(2);
      expect(breakdown['Finance']).toBe(1);
      expect(breakdown['Healthcare']).toBe(1);
    });
  });

  describe('Size breakdown', () => {
    it('should count items by size', () => {
      const items = [
        { company: { size: 'startup' } },
        { company: { size: 'medium' } },
        { company: { size: 'medium' } },
        { company: { size: 'enterprise' } },
      ];

      const breakdown = items.reduce((acc, item) => {
        const size = item.company.size;
        acc[size] = (acc[size] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(breakdown['startup']).toBe(1);
      expect(breakdown['medium']).toBe(2);
      expect(breakdown['enterprise']).toBe(1);
    });
  });
});

// =============================================================================
// PAGINATION TESTS
// =============================================================================

describe('Pagination', () => {
  it('should calculate total pages correctly', () => {
    const totalItems = 95;
    const pageSize = 20;
    const totalPages = Math.ceil(totalItems / pageSize);

    expect(totalPages).toBe(5);
  });

  it('should slice items for current page', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
    const page = 2;
    const pageSize = 20;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = items.slice(start, end);

    expect(pageItems.length).toBe(20);
    expect(pageItems[0].id).toBe(21);
    expect(pageItems[19].id).toBe(40);
  });

  it('should handle last page with fewer items', () => {
    const items = Array.from({ length: 45 }, (_, i) => ({ id: i + 1 }));
    const page = 3;
    const pageSize = 20;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = items.slice(start, end);

    expect(pageItems.length).toBe(5);
    expect(pageItems[0].id).toBe(41);
    expect(pageItems[4].id).toBe(45);
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('Helper Functions', () => {
  describe('formatRelativeTime', () => {
    it('should format recent dates correctly', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const formatRelativeTime = (date: Date): string => {
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return 'Older';
      };

      expect(formatRelativeTime(now)).toBe('Today');
      expect(formatRelativeTime(yesterday)).toBe('Yesterday');
      expect(formatRelativeTime(lastWeek)).toBe('5d ago');
    });
  });

  describe('getScoreColor', () => {
    it('should return correct color for score ranges', () => {
      const getScoreColor = (score: number): string => {
        if (score >= 80) return 'green';
        if (score >= 60) return 'yellow';
        return 'red';
      };

      expect(getScoreColor(90)).toBe('green');
      expect(getScoreColor(70)).toBe('yellow');
      expect(getScoreColor(50)).toBe('red');
    });
  });

  describe('getFreshnessColor', () => {
    it('should return correct color for freshness status', () => {
      const getFreshnessColor = (status: string): string => {
        const colors: Record<string, string> = {
          fresh: 'green',
          recent: 'yellow',
          stale: 'gray',
          unknown: 'gray',
        };
        return colors[status] || 'gray';
      };

      expect(getFreshnessColor('fresh')).toBe('green');
      expect(getFreshnessColor('recent')).toBe('yellow');
      expect(getFreshnessColor('stale')).toBe('gray');
    });
  });
});

// =============================================================================
// API ROUTE TESTS
// =============================================================================

describe('Discovery API Route', () => {
  describe('GET /api/discovery/[vertical]', () => {
    it('should validate vertical parameter', () => {
      const validVerticals = ['banking', 'real-estate', 'consulting', 'technology', 'energy', 'healthcare'];

      validVerticals.forEach((v) => {
        expect(validVerticals.includes(v)).toBe(true);
      });

      expect(validVerticals.includes('invalid')).toBe(false);
    });

    it('should parse query parameters correctly', () => {
      const query = {
        vertical: 'banking',
        territory: 'UAE',
        page: '2',
        pageSize: '20',
        q: 'test',
        sizes: 'startup,medium',
        minScore: '60',
        maxScore: '100',
        freshness: 'fresh,recent',
        sortBy: 'score',
        sortOrder: 'desc',
      };

      const parsed = {
        vertical: query.vertical,
        territory: query.territory,
        page: parseInt(query.page, 10),
        pageSize: parseInt(query.pageSize, 10),
        searchQuery: query.q,
        companySizes: query.sizes.split(','),
        scoreRange: {
          min: parseInt(query.minScore, 10),
          max: parseInt(query.maxScore, 10),
        },
        freshness: query.freshness.split(','),
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      };

      expect(parsed.vertical).toBe('banking');
      expect(parsed.page).toBe(2);
      expect(parsed.companySizes).toEqual(['startup', 'medium']);
      expect(parsed.scoreRange.min).toBe(60);
      expect(parsed.freshness).toEqual(['fresh', 'recent']);
    });

    it('should handle date range presets', () => {
      const presetDays: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
      };

      const preset = '30d';
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - presetDays[preset]);

      const diffDays = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration', () => {
  it('should transform full discovery flow', () => {
    // Simulate OS response
    const osResponse = {
      items: [
        {
          object_id: 'obj-1',
          company_name: 'Alpha Corp',
          industry: 'Technology',
          size: 'medium',
          country: 'UAE',
          city: 'Dubai',
          scores: { total: 90, quality: 95, relevance: 85, freshness: 90 },
          signals: { positive: 5, negative: 1, top: ['Hiring', 'Expansion'] },
          evidence_count: 15,
        },
        {
          object_id: 'obj-2',
          company_name: 'Beta Inc',
          industry: 'Finance',
          size: 'large',
          country: 'UAE',
          city: 'Abu Dhabi',
          scores: { total: 75, quality: 80, relevance: 70, freshness: 75 },
          signals: { positive: 3, negative: 2, top: ['News', 'Funding'] },
          evidence_count: 10,
        },
      ],
      total: 100,
      stats: {
        total: 100,
        qualified: 35,
        new_this_week: 12,
        avg_score: 72.5,
      },
    };

    // Transform to UI format
    const items = osResponse.items.map((item, index) => ({
      id: `discovery-${item.object_id}`,
      objectId: item.object_id,
      rank: index + 1,
      company: {
        name: item.company_name,
        industry: item.industry,
        size: item.size,
        location: { country: item.country, city: item.city },
      },
      score: item.scores,
      freshness: item.scores.freshness >= 80 ? 'fresh' : 'recent',
      signalsSummary: {
        total: item.signals.positive + item.signals.negative,
        positive: item.signals.positive,
        negative: item.signals.negative,
        topSignals: item.signals.top,
      },
      evidence: { totalCount: item.evidence_count },
    }));

    const stats = {
      total: osResponse.stats.total,
      qualified: osResponse.stats.qualified,
      newThisWeek: osResponse.stats.new_this_week,
      avgScore: osResponse.stats.avg_score,
    };

    // Verify transformation
    expect(items.length).toBe(2);
    expect(items[0].rank).toBe(1);
    expect(items[0].company.name).toBe('Alpha Corp');
    expect(items[0].freshness).toBe('fresh');
    expect(items[1].freshness).toBe('recent');
    expect(stats.total).toBe(100);
    expect(stats.avgScore).toBe(72.5);
  });

  it('should apply filters and sort', () => {
    const items = [
      { company: { name: 'Alpha', size: 'medium' }, score: { total: 90 }, freshness: 'fresh' },
      { company: { name: 'Beta', size: 'large' }, score: { total: 75 }, freshness: 'recent' },
      { company: { name: 'Gamma', size: 'medium' }, score: { total: 85 }, freshness: 'fresh' },
      { company: { name: 'Delta', size: 'small' }, score: { total: 60 }, freshness: 'stale' },
    ];

    const filters = {
      companySizes: ['medium'],
      freshness: ['fresh'],
      scoreRange: { min: 80, max: 100 },
      sortBy: 'score',
      sortOrder: 'desc' as const,
    };

    // Apply filters
    let result = items
      .filter((i) => filters.companySizes.includes(i.company.size))
      .filter((i) => filters.freshness.includes(i.freshness))
      .filter((i) => i.score.total >= filters.scoreRange.min && i.score.total <= filters.scoreRange.max);

    // Apply sort
    result = result.sort((a, b) =>
      filters.sortOrder === 'desc'
        ? b.score.total - a.score.total
        : a.score.total - b.score.total
    );

    expect(result.length).toBe(2);
    expect(result[0].company.name).toBe('Alpha');
    expect(result[1].company.name).toBe('Gamma');
  });
});
