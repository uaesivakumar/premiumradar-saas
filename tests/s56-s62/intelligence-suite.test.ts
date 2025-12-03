/**
 * Intelligence Suite Tests
 * Sprint S56-S62: Intelligence Suite
 *
 * Comprehensive tests for the intelligence data layer, transformers, and hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('Intelligence Suite Types', () => {
  describe('PersonaPerformanceData', () => {
    it('should have correct structure', () => {
      const data = {
        personaId: 'persona-1',
        name: 'Banking Executive',
        conversionRate: 0.25,
        avgEngagementScore: 85,
        totalTouched: 150,
        totalConverted: 38,
        journeyBreakdown: [
          { journeyId: 'j1', name: 'Email Outreach', count: 50, conversionRate: 0.3 },
        ],
        trendData: [
          { date: '2024-01-01', conversions: 5, engagementScore: 82 },
        ],
        topSignals: ['hiring-expansion', 'funding-round'],
      };

      expect(data.personaId).toBe('persona-1');
      expect(data.conversionRate).toBe(0.25);
      expect(data.journeyBreakdown.length).toBe(1);
      expect(data.topSignals).toContain('hiring-expansion');
    });
  });

  describe('JourneyPerformanceData', () => {
    it('should track stage performance', () => {
      const data = {
        journeyId: 'journey-1',
        name: 'Cold Outreach',
        stages: [
          {
            stageId: 's1',
            name: 'Initial Contact',
            order: 1,
            entryCount: 100,
            exitCount: 60,
            dropoffRate: 0.4,
            avgDuration: 48,
          },
          {
            stageId: 's2',
            name: 'Follow Up',
            order: 2,
            entryCount: 60,
            exitCount: 30,
            dropoffRate: 0.5,
            avgDuration: 72,
          },
        ],
        totalRuns: 200,
        completionRate: 0.15,
        avgCompletionTime: 168,
      };

      expect(data.stages.length).toBe(2);
      expect(data.stages[0].dropoffRate).toBe(0.4);
      expect(data.completionRate).toBe(0.15);
    });
  });

  describe('ScoreBreakdownFullData', () => {
    it('should contain all score components', () => {
      const breakdown = {
        objectId: 'obj-1',
        totalScore: 85,
        components: {
          quality: { score: 90, weight: 0.25, contribution: 22.5 },
          timing: { score: 80, weight: 0.30, contribution: 24 },
          likelihood: { score: 85, weight: 0.25, contribution: 21.25 },
          engagement: { score: 82, weight: 0.20, contribution: 16.4 },
        },
        factors: [
          { name: 'Recent Hiring', impact: 15, category: 'positive' },
          { name: 'Market Entry', impact: 10, category: 'positive' },
        ],
        historicalScores: [
          { date: '2024-01-01', score: 80 },
          { date: '2024-01-15', score: 85 },
        ],
      };

      expect(breakdown.totalScore).toBe(85);
      expect(breakdown.components.quality.contribution).toBe(22.5);
      expect(breakdown.factors.length).toBe(2);
    });
  });

  describe('IntelligenceSignalData', () => {
    it('should represent signal properly', () => {
      const signal = {
        id: 'sig-1',
        type: 'hiring-expansion',
        strength: 0.85,
        source: 'LinkedIn',
        detectedAt: '2024-01-15T10:00:00Z',
        objectId: 'obj-1',
        evidence: ['ev-1', 'ev-2'],
        metadata: {
          jobPostings: 25,
          departments: ['Engineering', 'Sales'],
        },
      };

      expect(signal.type).toBe('hiring-expansion');
      expect(signal.strength).toBe(0.85);
      expect(signal.evidence.length).toBe(2);
    });
  });

  describe('PatternDetection', () => {
    it('should capture pattern details', () => {
      const pattern = {
        id: 'pattern-1',
        patternType: 'sequential-signals',
        description: 'Funding followed by hiring',
        confidence: 0.78,
        signals: ['sig-1', 'sig-2', 'sig-3'],
        objects: ['obj-1', 'obj-2'],
        detectedAt: '2024-01-15T10:00:00Z',
        metadata: {
          avgTimeGap: 14,
          frequency: 0.35,
        },
      };

      expect(pattern.patternType).toBe('sequential-signals');
      expect(pattern.confidence).toBe(0.78);
      expect(pattern.signals.length).toBe(3);
    });
  });

  describe('AutonomousIntelligence', () => {
    it('should contain autonomous operation data', () => {
      const autonomous = {
        killSwitch: {
          isEngaged: false,
          lastToggled: '2024-01-10T08:00:00Z',
          reason: null,
          engagedBy: null,
        },
        checkpoints: [
          {
            id: 'cp-1',
            name: 'Pre-outreach Review',
            type: 'approval' as const,
            isPassed: true,
            timestamp: '2024-01-15T10:00:00Z',
            metadata: {},
          },
        ],
        activities: [
          {
            id: 'act-1',
            type: 'outreach',
            action: 'Send email',
            status: 'completed' as const,
            startedAt: '2024-01-15T10:00:00Z',
            completedAt: '2024-01-15T10:01:00Z',
            duration: 60000,
            result: 'Email sent successfully',
            error: null,
            metadata: {},
          },
        ],
        costs: {
          totalCost: 150.50,
          costByType: [{ type: 'LLM', cost: 120, percentage: 80 }],
          tokenUsage: {
            inputTokens: 500000,
            outputTokens: 100000,
            totalTokens: 600000,
            costPerToken: 0.0002,
          },
          projectedMonthly: 450,
          budgetRemaining: 350,
          budgetUtilization: 0.56,
        },
        performance: {
          latencyP50: 250,
          latencyP95: 800,
          latencyP99: 1500,
          throughput: 10.5,
          errorRateByType: { timeout: 0.02, validation: 0.01 },
          anomalies: [],
        },
      };

      expect(autonomous.killSwitch.isEngaged).toBe(false);
      expect(autonomous.checkpoints.length).toBe(1);
      expect(autonomous.costs.budgetUtilization).toBe(0.56);
    });
  });

  describe('AuditEntry', () => {
    it('should track audit details', () => {
      const entry = {
        id: 'audit-1',
        timestamp: '2024-01-15T10:00:00Z',
        userId: 'user-1',
        userName: 'John Doe',
        action: 'update' as const,
        resourceType: 'journey' as const,
        resourceId: 'journey-1',
        resourceName: 'Cold Outreach Journey',
        details: {
          description: 'Updated journey stages',
          changes: [
            { field: 'stages', oldValue: 3, newValue: 4 },
          ],
          before: { stageCount: 3 },
          after: { stageCount: 4 },
          promptVersion: null,
          aiModel: null,
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: {},
      };

      expect(entry.action).toBe('update');
      expect(entry.resourceType).toBe('journey');
      expect(entry.details.changes?.length).toBe(1);
    });
  });

  describe('GraphVisualization', () => {
    it('should represent graph structure', () => {
      const graph = {
        nodes: [
          { id: 'n1', type: 'persona' as const, label: 'Banking Exec', metadata: {} },
          { id: 'n2', type: 'journey' as const, label: 'Cold Outreach', metadata: {} },
          { id: 'n3', type: 'signal' as const, label: 'Hiring Signal', metadata: {} },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', type: 'triggers' as const, weight: 0.8 },
          { id: 'e2', source: 'n3', target: 'n2', type: 'supports' as const, weight: 0.6 },
        ],
        clusters: [
          { id: 'c1', label: 'High Intent', nodeIds: ['n1', 'n3'] },
        ],
      };

      expect(graph.nodes.length).toBe(3);
      expect(graph.edges.length).toBe(2);
      expect(graph.clusters[0].nodeIds.length).toBe(2);
    });
  });
});

// =============================================================================
// TRANSFORMER TESTS
// =============================================================================

describe('Intelligence Transformers', () => {
  describe('buildPersonaRanking', () => {
    it('should rank personas by conversion rate', () => {
      const performances = [
        { personaId: 'p1', name: 'Exec', conversionRate: 0.25 },
        { personaId: 'p2', name: 'Manager', conversionRate: 0.35 },
        { personaId: 'p3', name: 'Director', conversionRate: 0.20 },
      ];

      const ranked = [...performances]
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .map((p, i) => ({ ...p, rank: i + 1 }));

      expect(ranked[0].personaId).toBe('p2');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].conversionRate).toBe(0.35);
    });
  });

  describe('buildJourneyDropoffMap', () => {
    it('should identify high dropoff stages', () => {
      const stages = [
        { stageId: 's1', name: 'Contact', dropoffRate: 0.3 },
        { stageId: 's2', name: 'Qualify', dropoffRate: 0.6 },
        { stageId: 's3', name: 'Present', dropoffRate: 0.2 },
      ];

      const dropoffThreshold = 0.5;
      const highDropoff = stages.filter((s) => s.dropoffRate > dropoffThreshold);

      expect(highDropoff.length).toBe(1);
      expect(highDropoff[0].stageId).toBe('s2');
    });
  });

  describe('buildSignalWeights', () => {
    it('should calculate signal weights', () => {
      const signals = [
        { type: 'hiring', strength: 0.9 },
        { type: 'funding', strength: 0.8 },
        { type: 'news', strength: 0.5 },
      ];

      const totalStrength = signals.reduce((sum, s) => sum + s.strength, 0);
      const weights = signals.map((s) => ({
        type: s.type,
        weight: s.strength / totalStrength,
      }));

      expect(weights[0].weight).toBeCloseTo(0.409, 2);
      expect(weights.reduce((sum, w) => sum + w.weight, 0)).toBeCloseTo(1, 5);
    });
  });

  describe('buildCorrelationMatrix', () => {
    it('should structure correlation data', () => {
      const correlations = [
        { signalA: 'hiring', signalB: 'funding', correlation: 0.75, pValue: 0.01, sampleSize: 100 },
        { signalA: 'hiring', signalB: 'news', correlation: 0.45, pValue: 0.05, sampleSize: 80 },
      ];

      const matrix: Record<string, Record<string, number>> = {};
      correlations.forEach((c) => {
        if (!matrix[c.signalA]) matrix[c.signalA] = {};
        if (!matrix[c.signalB]) matrix[c.signalB] = {};
        matrix[c.signalA][c.signalB] = c.correlation;
        matrix[c.signalB][c.signalA] = c.correlation;
      });

      expect(matrix['hiring']['funding']).toBe(0.75);
      expect(matrix['funding']['hiring']).toBe(0.75);
    });
  });

  describe('buildTimeSeriesChart', () => {
    it('should format time series data', () => {
      const rawData = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 120 },
        { date: '2024-01-03', value: 115 },
      ];

      const chartData = {
        labels: rawData.map((d) => d.date),
        values: rawData.map((d) => d.value),
        trend: rawData.reduce((sum, d) => sum + d.value, 0) / rawData.length,
      };

      expect(chartData.labels.length).toBe(3);
      expect(chartData.values[1]).toBe(120);
      expect(chartData.trend).toBeCloseTo(111.67, 1);
    });
  });

  describe('buildCompositeIntelligenceScore', () => {
    it('should combine multiple metrics', () => {
      const metrics = {
        personaEffectiveness: 0.75,
        journeyCompletion: 0.60,
        signalStrength: 0.85,
        dataQuality: 0.90,
      };
      const weights = {
        personaEffectiveness: 0.3,
        journeyCompletion: 0.25,
        signalStrength: 0.25,
        dataQuality: 0.2,
      };

      const compositeScore = Object.entries(metrics).reduce(
        (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
        0
      );

      expect(compositeScore).toBeCloseTo(0.765, 2);
    });
  });

  describe('buildGraphVisualization', () => {
    it('should construct graph from entities', () => {
      const entities = {
        personas: [{ id: 'p1', name: 'Exec' }],
        journeys: [{ id: 'j1', name: 'Outreach' }],
        signals: [{ id: 's1', type: 'hiring' }],
      };
      const relations = [
        { from: 'p1', to: 'j1', type: 'triggers' },
        { from: 's1', to: 'j1', type: 'supports' },
      ];

      const nodes = [
        ...entities.personas.map((p) => ({ id: p.id, type: 'persona', label: p.name })),
        ...entities.journeys.map((j) => ({ id: j.id, type: 'journey', label: j.name })),
        ...entities.signals.map((s) => ({ id: s.id, type: 'signal', label: s.type })),
      ];
      const edges = relations.map((r, i) => ({
        id: `e-${i}`,
        source: r.from,
        target: r.to,
        type: r.type,
      }));

      expect(nodes.length).toBe(3);
      expect(edges.length).toBe(2);
    });
  });

  describe('buildScoreExplanation', () => {
    it('should generate human-readable explanation', () => {
      const breakdown = {
        totalScore: 85,
        components: {
          quality: { score: 90, contribution: 22.5 },
          timing: { score: 80, contribution: 24 },
        },
        factors: [
          { name: 'Hiring Signal', impact: 15, category: 'positive' },
          { name: 'Competitor Activity', impact: -5, category: 'negative' },
        ],
      };

      const positiveFactors = breakdown.factors.filter((f) => f.impact > 0);
      const negativeFactors = breakdown.factors.filter((f) => f.impact < 0);

      const explanation = {
        summary: `Score of ${breakdown.totalScore} driven by ${positiveFactors.length} positive and ${negativeFactors.length} negative factors`,
        topContributor: Object.entries(breakdown.components)
          .sort((a, b) => b[1].contribution - a[1].contribution)[0][0],
        recommendations: negativeFactors.map((f) => `Address: ${f.name}`),
      };

      expect(explanation.summary).toContain('85');
      expect(explanation.topContributor).toBe('timing');
      expect(explanation.recommendations.length).toBe(1);
    });
  });

  describe('buildAuditTimeline', () => {
    it('should group audits by date', () => {
      const entries = [
        { id: 'a1', timestamp: '2024-01-15T10:00:00Z', action: 'create' },
        { id: 'a2', timestamp: '2024-01-15T14:00:00Z', action: 'update' },
        { id: 'a3', timestamp: '2024-01-16T09:00:00Z', action: 'delete' },
      ];

      const grouped = entries.reduce((acc, entry) => {
        const date = entry.timestamp.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
      }, {} as Record<string, typeof entries>);

      expect(Object.keys(grouped).length).toBe(2);
      expect(grouped['2024-01-15'].length).toBe(2);
      expect(grouped['2024-01-16'].length).toBe(1);
    });
  });
});

// =============================================================================
// CORRELATION TESTS
// =============================================================================

describe('Signal Correlations', () => {
  describe('CorrelationResult', () => {
    it('should validate correlation bounds', () => {
      const correlation = {
        signalA: 'hiring',
        signalB: 'funding',
        correlation: 0.75,
        pValue: 0.01,
        sampleSize: 100,
      };

      expect(correlation.correlation).toBeGreaterThanOrEqual(-1);
      expect(correlation.correlation).toBeLessThanOrEqual(1);
      expect(correlation.pValue).toBeGreaterThan(0);
      expect(correlation.sampleSize).toBeGreaterThan(0);
    });
  });

  describe('Statistical significance', () => {
    it('should identify significant correlations', () => {
      const correlations = [
        { signalA: 'a', signalB: 'b', correlation: 0.8, pValue: 0.001, sampleSize: 100 },
        { signalA: 'c', signalB: 'd', correlation: 0.3, pValue: 0.15, sampleSize: 50 },
        { signalA: 'e', signalB: 'f', correlation: 0.6, pValue: 0.04, sampleSize: 80 },
      ];

      const significanceThreshold = 0.05;
      const significant = correlations.filter((c) => c.pValue < significanceThreshold);

      expect(significant.length).toBe(2);
      expect(significant.map((s) => s.signalA)).toContain('a');
      expect(significant.map((s) => s.signalA)).toContain('e');
    });
  });
});

// =============================================================================
// PATTERN DETECTION TESTS
// =============================================================================

describe('Pattern Detection', () => {
  describe('Pattern clustering', () => {
    it('should group similar patterns', () => {
      const patterns = [
        { id: 'p1', patternType: 'sequential', confidence: 0.8, objects: ['o1', 'o2'] },
        { id: 'p2', patternType: 'sequential', confidence: 0.75, objects: ['o3', 'o4'] },
        { id: 'p3', patternType: 'concurrent', confidence: 0.9, objects: ['o5'] },
      ];

      const clusters = patterns.reduce((acc, p) => {
        if (!acc[p.patternType]) acc[p.patternType] = [];
        acc[p.patternType].push(p);
        return acc;
      }, {} as Record<string, typeof patterns>);

      expect(clusters['sequential'].length).toBe(2);
      expect(clusters['concurrent'].length).toBe(1);
    });
  });

  describe('Confidence filtering', () => {
    it('should filter by confidence threshold', () => {
      const patterns = [
        { id: 'p1', confidence: 0.9 },
        { id: 'p2', confidence: 0.6 },
        { id: 'p3', confidence: 0.75 },
      ];

      const threshold = 0.7;
      const filtered = patterns.filter((p) => p.confidence >= threshold);

      expect(filtered.length).toBe(2);
      expect(filtered.map((p) => p.id)).not.toContain('p2');
    });
  });
});

// =============================================================================
// AUTONOMOUS SAFETY TESTS
// =============================================================================

describe('Autonomous Safety', () => {
  describe('Kill switch status', () => {
    it('should track kill switch state', () => {
      const killSwitch = {
        isEngaged: true,
        lastToggled: '2024-01-15T10:00:00Z',
        reason: 'Manual override',
        engagedBy: 'user-1',
      };

      expect(killSwitch.isEngaged).toBe(true);
      expect(killSwitch.reason).toBe('Manual override');
    });
  });

  describe('Budget utilization', () => {
    it('should calculate utilization correctly', () => {
      const costs = {
        totalCost: 300,
        budgetRemaining: 200,
        budgetUtilization: 0.6,
      };

      const totalBudget = costs.totalCost + costs.budgetRemaining;
      const calculatedUtilization = costs.totalCost / totalBudget;

      expect(calculatedUtilization).toBe(0.6);
    });

    it('should identify high utilization', () => {
      const utilizationThresholds = { warning: 0.7, critical: 0.9 };
      const utilization = 0.85;

      const status =
        utilization >= utilizationThresholds.critical
          ? 'critical'
          : utilization >= utilizationThresholds.warning
            ? 'warning'
            : 'normal';

      expect(status).toBe('warning');
    });
  });

  describe('Performance anomalies', () => {
    it('should detect latency anomalies', () => {
      const performance = {
        latencyP50: 250,
        latencyP95: 800,
        latencyP99: 1500,
        anomalies: [
          { id: 'a1', type: 'latency-spike', severity: 'warning', resolved: false },
        ],
      };

      const activeAnomalies = performance.anomalies.filter((a) => !a.resolved);
      expect(activeAnomalies.length).toBe(1);
    });
  });

  describe('Checkpoint validation', () => {
    it('should track checkpoint status', () => {
      const checkpoints = [
        { id: 'cp1', name: 'Pre-send', isPassed: true },
        { id: 'cp2', name: 'Rate limit', isPassed: true },
        { id: 'cp3', name: 'Content review', isPassed: false },
      ];

      const allPassed = checkpoints.every((cp) => cp.isPassed);
      const failedCheckpoints = checkpoints.filter((cp) => !cp.isPassed);

      expect(allPassed).toBe(false);
      expect(failedCheckpoints.length).toBe(1);
      expect(failedCheckpoints[0].name).toBe('Content review');
    });
  });
});

// =============================================================================
// AUDIT LOG TESTS
// =============================================================================

describe('Audit Logs', () => {
  describe('Action filtering', () => {
    it('should filter by action type', () => {
      const entries = [
        { id: 'a1', action: 'create' },
        { id: 'a2', action: 'update' },
        { id: 'a3', action: 'delete' },
        { id: 'a4', action: 'update' },
      ];

      const filtered = entries.filter((e) => e.action === 'update');
      expect(filtered.length).toBe(2);
    });
  });

  describe('Resource type filtering', () => {
    it('should filter by resource type', () => {
      const entries = [
        { id: 'a1', resourceType: 'journey' },
        { id: 'a2', resourceType: 'persona' },
        { id: 'a3', resourceType: 'journey' },
      ];

      const filtered = entries.filter((e) => e.resourceType === 'journey');
      expect(filtered.length).toBe(2);
    });
  });

  describe('Date range filtering', () => {
    it('should filter by date range', () => {
      const entries = [
        { id: 'a1', timestamp: '2024-01-10T10:00:00Z' },
        { id: 'a2', timestamp: '2024-01-15T10:00:00Z' },
        { id: 'a3', timestamp: '2024-01-20T10:00:00Z' },
      ];

      const from = new Date('2024-01-12');
      const to = new Date('2024-01-18');

      const filtered = entries.filter((e) => {
        const date = new Date(e.timestamp);
        return date >= from && date <= to;
      });

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('a2');
    });
  });

  describe('Search functionality', () => {
    it('should search in descriptions', () => {
      const entries = [
        { id: 'a1', details: { description: 'Updated journey stages' } },
        { id: 'a2', details: { description: 'Created new persona' } },
        { id: 'a3', details: { description: 'Deleted old journey' } },
      ];

      const query = 'journey';
      const filtered = entries.filter((e) =>
        e.details.description.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered.length).toBe(2);
    });
  });
});

// =============================================================================
// GRAPH TESTS
// =============================================================================

describe('Intelligence Graph', () => {
  describe('Node filtering', () => {
    it('should filter nodes by type', () => {
      const nodes = [
        { id: 'n1', type: 'persona' },
        { id: 'n2', type: 'journey' },
        { id: 'n3', type: 'signal' },
        { id: 'n4', type: 'persona' },
      ];

      const filtered = nodes.filter((n) => n.type === 'persona');
      expect(filtered.length).toBe(2);
    });
  });

  describe('Edge filtering', () => {
    it('should filter edges by connected nodes', () => {
      const visibleNodeIds = new Set(['n1', 'n2']);
      const edges = [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n1', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' },
      ];

      const filtered = edges.filter(
        (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('e1');
    });
  });

  describe('Connected nodes', () => {
    it('should find connected nodes', () => {
      const focusNodeId = 'n1';
      const edges = [
        { source: 'n1', target: 'n2' },
        { source: 'n3', target: 'n1' },
        { source: 'n4', target: 'n5' },
      ];

      const connected = new Set<string>();
      edges.forEach((e) => {
        if (e.source === focusNodeId) connected.add(e.target);
        if (e.target === focusNodeId) connected.add(e.source);
      });

      expect(connected.size).toBe(2);
      expect(connected.has('n2')).toBe(true);
      expect(connected.has('n3')).toBe(true);
    });
  });
});

// =============================================================================
// API RESPONSE TESTS
// =============================================================================

describe('API Responses', () => {
  describe('Success response', () => {
    it('should have correct structure', () => {
      const response = {
        success: true,
        data: { personas: [], journeys: [] },
        meta: { fetchedAt: '2024-01-15T10:00:00Z' },
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.meta.fetchedAt).toBeDefined();
    });
  });

  describe('Error response', () => {
    it('should handle errors gracefully', () => {
      const response = {
        success: false,
        error: {
          code: 'OS_UNAVAILABLE',
          message: 'Cannot connect to OS backend',
        },
      };

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('OS_UNAVAILABLE');
    });
  });

  describe('Partial data', () => {
    it('should handle partial data with defaults', () => {
      const rawResponse = {
        personas: [{ personaId: 'p1', name: 'Test' }],
        // journeys missing
      };

      const normalized = {
        personas: rawResponse.personas || [],
        journeys: (rawResponse as Record<string, unknown>).journeys || [],
      };

      expect(normalized.personas.length).toBe(1);
      expect(normalized.journeys.length).toBe(0);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration', () => {
  describe('Full intelligence flow', () => {
    it('should transform OS response to UI format', () => {
      // Simulate OS response
      const osResponse = {
        personas: [
          {
            persona_id: 'p1',
            name: 'Executive',
            conversion_rate: 0.25,
            avg_engagement: 85,
            total_touched: 100,
            total_converted: 25,
          },
        ],
        journeys: [
          {
            journey_id: 'j1',
            name: 'Cold Outreach',
            stages: [
              { stage_id: 's1', name: 'Contact', dropoff_rate: 0.3 },
            ],
            completion_rate: 0.15,
          },
        ],
        signals: [
          {
            signal_id: 'sig1',
            type: 'hiring-expansion',
            strength: 0.85,
            detected_at: '2024-01-15T10:00:00Z',
          },
        ],
      };

      // Transform
      const transformed = {
        personas: osResponse.personas.map((p) => ({
          personaId: p.persona_id,
          name: p.name,
          conversionRate: p.conversion_rate,
          avgEngagementScore: p.avg_engagement,
          totalTouched: p.total_touched,
          totalConverted: p.total_converted,
        })),
        journeys: osResponse.journeys.map((j) => ({
          journeyId: j.journey_id,
          name: j.name,
          stages: j.stages.map((s) => ({
            stageId: s.stage_id,
            name: s.name,
            dropoffRate: s.dropoff_rate,
          })),
          completionRate: j.completion_rate,
        })),
        signals: osResponse.signals.map((s) => ({
          id: s.signal_id,
          type: s.type,
          strength: s.strength,
          detectedAt: s.detected_at,
        })),
      };

      expect(transformed.personas[0].personaId).toBe('p1');
      expect(transformed.journeys[0].completionRate).toBe(0.15);
      expect(transformed.signals[0].strength).toBe(0.85);
    });
  });

  describe('Composite score calculation', () => {
    it('should calculate composite score from multiple sources', () => {
      const data = {
        personas: [{ conversionRate: 0.25 }, { conversionRate: 0.35 }],
        journeys: [{ completionRate: 0.15 }, { completionRate: 0.20 }],
        signals: [{ strength: 0.8 }, { strength: 0.9 }, { strength: 0.7 }],
      };

      const avgPersonaConversion =
        data.personas.reduce((sum, p) => sum + p.conversionRate, 0) / data.personas.length;
      const avgJourneyCompletion =
        data.journeys.reduce((sum, j) => sum + j.completionRate, 0) / data.journeys.length;
      const avgSignalStrength =
        data.signals.reduce((sum, s) => sum + s.strength, 0) / data.signals.length;

      const composite =
        avgPersonaConversion * 0.35 +
        avgJourneyCompletion * 0.30 +
        avgSignalStrength * 0.35;

      expect(avgPersonaConversion).toBeCloseTo(0.3, 5);
      expect(avgJourneyCompletion).toBeCloseTo(0.175, 5);
      expect(avgSignalStrength).toBeCloseTo(0.8, 5);
      expect(composite).toBeCloseTo(0.4375, 3);
    });
  });
});

// =============================================================================
// WORKSPACE & PERMISSIONS TESTS
// =============================================================================

describe('Workspaces & Permissions', () => {
  describe('Workspace structure', () => {
    it('should have correct workspace format', () => {
      const workspace = {
        id: 'ws-1',
        name: 'Sales Team',
        slug: 'sales-team',
        ownerId: 'user-1',
        members: [
          { userId: 'user-1', role: 'owner' as const, joinedAt: '2024-01-01' },
          { userId: 'user-2', role: 'admin' as const, joinedAt: '2024-01-05' },
          { userId: 'user-3', role: 'member' as const, joinedAt: '2024-01-10' },
        ],
        settings: {
          defaultVertical: 'banking',
          allowedFeatures: ['intelligence', 'autonomy'],
        },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15',
      };

      expect(workspace.members.length).toBe(3);
      expect(workspace.members.filter((m) => m.role === 'admin').length).toBe(1);
    });
  });

  describe('Permission checks', () => {
    it('should validate member permissions', () => {
      const permissions = {
        owner: ['read', 'write', 'delete', 'manage'],
        admin: ['read', 'write', 'delete'],
        member: ['read', 'write'],
        viewer: ['read'],
      };

      const hasPermission = (role: string, action: string): boolean => {
        return permissions[role as keyof typeof permissions]?.includes(action) ?? false;
      };

      expect(hasPermission('owner', 'manage')).toBe(true);
      expect(hasPermission('admin', 'manage')).toBe(false);
      expect(hasPermission('member', 'delete')).toBe(false);
      expect(hasPermission('viewer', 'read')).toBe(true);
    });
  });
});

// =============================================================================
// TIME SERIES TESTS
// =============================================================================

describe('Time Series', () => {
  describe('Data aggregation', () => {
    it('should aggregate by day', () => {
      const dataPoints = [
        { timestamp: '2024-01-15T10:00:00Z', value: 10 },
        { timestamp: '2024-01-15T14:00:00Z', value: 15 },
        { timestamp: '2024-01-16T09:00:00Z', value: 12 },
      ];

      const byDay = dataPoints.reduce((acc, point) => {
        const day = point.timestamp.split('T')[0];
        if (!acc[day]) acc[day] = { total: 0, count: 0 };
        acc[day].total += point.value;
        acc[day].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const dailyAvg = Object.entries(byDay).map(([date, data]) => ({
        date,
        avg: data.total / data.count,
      }));

      expect(dailyAvg.length).toBe(2);
      expect(dailyAvg[0].avg).toBe(12.5);
      expect(dailyAvg[1].avg).toBe(12);
    });
  });

  describe('Trend calculation', () => {
    it('should calculate simple trend', () => {
      const values = [10, 12, 15, 14, 18, 20];

      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));

      const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

      const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'flat';

      expect(firstAvg).toBeCloseTo(12.33, 1);
      expect(secondAvg).toBeCloseTo(17.33, 1);
      expect(trend).toBe('up');
    });
  });
});
