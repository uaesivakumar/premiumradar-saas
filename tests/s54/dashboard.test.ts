/**
 * Dashboard Tests
 * Sprint S54: Vertical Dashboards
 *
 * Comprehensive tests for the dashboard data layer and transformers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  // Types
  type VerticalId,
  type KPIBlock,
  type OutreachFunnel,
  type HeatmapData,
  type TrendSeries,
  type PersonaPerformance,
  type IntelligenceSignal,
  type DiscoveryStats,
  type OutreachStats,
  type AutonomousMetrics,
  // Constants
  VERTICAL_CONFIGS,
  // Fetchers
  getVerticalConfig,
  getAllVerticals,
  isValidVertical,
  // Transformers
  convertOSMetricsToWidgets,
  buildFunnel,
  buildCustomFunnel,
  buildPersonaRanking,
  buildHeatmap,
  buildTimeOfDayHeatmap,
  buildTrendLine,
  buildMultipleTrendLines,
  aggregateTrendByPeriod,
  transformSignals,
  wrapInWidget,
  type OSMetricsResponse,
  type FunnelInput,
  type PersonaInput,
  type HeatmapInput,
  type TrendInput,
  type RawSignal,
} from '../../lib/dashboard';

// =============================================================================
// VERTICAL CONFIG TESTS
// =============================================================================

describe('Vertical Config', () => {
  describe('VERTICAL_CONFIGS', () => {
    /**
     * P2 VERTICALISATION: Updated to use official 5 verticals
     */
    it('should have all 5 verticals defined', () => {
      const verticals: VerticalId[] = [
        'banking',
        'insurance',
        'real-estate',
        'recruitment',
        'saas-sales',
      ];

      verticals.forEach((v) => {
        expect(VERTICAL_CONFIGS[v]).toBeDefined();
        expect(VERTICAL_CONFIGS[v].id).toBe(v);
        expect(VERTICAL_CONFIGS[v].name).toBeTruthy();
        expect(VERTICAL_CONFIGS[v].icon).toBeTruthy();
        expect(VERTICAL_CONFIGS[v].color).toBeTruthy();
      });
    });

    it('should have banking config with correct structure', () => {
      const banking = VERTICAL_CONFIGS.banking;
      expect(banking.id).toBe('banking');
      expect(banking.name).toBe('Banking');
      expect(banking.icon).toBe('🏦');
      expect(banking.subVerticals.length).toBeGreaterThan(0);
      expect(banking.defaultMetrics.length).toBeGreaterThan(0);
      expect(banking.signalTypes.length).toBeGreaterThan(0);
    });

    it('should have sub-verticals for all verticals', () => {
      Object.values(VERTICAL_CONFIGS).forEach((config) => {
        expect(config.subVerticals).toBeInstanceOf(Array);
        expect(config.subVerticals.length).toBeGreaterThan(0);
        config.subVerticals.forEach((sub) => {
          expect(sub.id).toBeTruthy();
          expect(sub.name).toBeTruthy();
        });
      });
    });
  });

  describe('getVerticalConfig', () => {
    it('should return config for valid vertical', () => {
      const config = getVerticalConfig('banking');
      expect(config.id).toBe('banking');
      expect(config.name).toBe('Banking');
    });

    it('should throw for invalid vertical', () => {
      expect(() => getVerticalConfig('invalid' as VerticalId)).toThrow();
    });
  });

  describe('getAllVerticals', () => {
    /**
     * P2 VERTICALISATION: Updated to 5 official verticals
     */
    it('should return array of all vertical configs', () => {
      const verticals = getAllVerticals();
      expect(verticals).toBeInstanceOf(Array);
      expect(verticals.length).toBe(5);
    });
  });

  describe('isValidVertical', () => {
    /**
     * P2 VERTICALISATION: Updated to use official verticals
     */
    it('should return true for valid verticals', () => {
      expect(isValidVertical('banking')).toBe(true);
      expect(isValidVertical('real-estate')).toBe(true);
      expect(isValidVertical('insurance')).toBe(true);
    });

    it('should return false for invalid verticals', () => {
      expect(isValidVertical('invalid')).toBe(false);
      expect(isValidVertical('')).toBe(false);
      expect(isValidVertical('Banking')).toBe(false); // case sensitive
    });
  });
});

// =============================================================================
// TRANSFORMER TESTS
// =============================================================================

describe('Transformers', () => {
  describe('convertOSMetricsToWidgets', () => {
    it('should convert discovery metrics to KPI blocks', () => {
      const metrics: OSMetricsResponse = {
        discovery: {
          total: 1000,
          qualified: 250,
          newThisWeek: 50,
          avgScore: 75.5,
        },
      };

      const widgets = convertOSMetricsToWidgets(metrics);

      expect(widgets.length).toBe(3);
      expect(widgets.find((w) => w.id === 'total-leads')).toBeDefined();
      expect(widgets.find((w) => w.id === 'qualified-leads')).toBeDefined();
      expect(widgets.find((w) => w.id === 'quality-score')).toBeDefined();
    });

    it('should convert outreach metrics to KPI blocks', () => {
      const metrics: OSMetricsResponse = {
        outreach: {
          sent: 500,
          delivered: 450,
          opened: 200,
          replied: 50,
          converted: 10,
        },
      };

      const widgets = convertOSMetricsToWidgets(metrics);

      expect(widgets.length).toBe(3);
      expect(widgets.find((w) => w.id === 'outreach-sent')).toBeDefined();
      expect(widgets.find((w) => w.id === 'open-rate')).toBeDefined();
      expect(widgets.find((w) => w.id === 'reply-rate')).toBeDefined();
    });

    it('should convert performance metrics to KPI blocks', () => {
      const metrics: OSMetricsResponse = {
        performance: {
          responseRate: 18.5,
          conversionRate: 6.2,
          avgCycleTime: 12,
        },
      };

      const widgets = convertOSMetricsToWidgets(metrics);

      expect(widgets.length).toBe(3);
      expect(widgets.find((w) => w.id === 'response-rate')).toBeDefined();
      expect(widgets.find((w) => w.id === 'conversion-rate')).toBeDefined();
      expect(widgets.find((w) => w.id === 'cycle-time')).toBeDefined();
    });

    it('should handle empty metrics', () => {
      const widgets = convertOSMetricsToWidgets({});
      expect(widgets.length).toBe(0);
    });
  });

  describe('buildFunnel', () => {
    it('should create funnel with correct stages', () => {
      const input: FunnelInput = {
        discovered: 1000,
        contacted: 800,
        responded: 200,
        qualified: 100,
        converted: 20,
        avgCycleTime: 14,
      };

      const funnel = buildFunnel(input);

      expect(funnel.stages.length).toBe(5);
      expect(funnel.totalLeads).toBe(1000);
      expect(funnel.totalConverted).toBe(20);
      expect(funnel.avgCycleTime).toBe(14);
      expect(funnel.overallConversionRate).toBe(2); // 20/1000 * 100
    });

    it('should calculate conversion rates between stages', () => {
      const input: FunnelInput = {
        discovered: 100,
        contacted: 80,
        responded: 40,
        qualified: 20,
        converted: 10,
      };

      const funnel = buildFunnel(input);

      expect(funnel.stages[0].conversionRate).toBe(100); // discovered
      expect(funnel.stages[1].conversionRate).toBe(80);  // contacted: 80/100
      expect(funnel.stages[2].conversionRate).toBe(50);  // responded: 40/80
      expect(funnel.stages[3].conversionRate).toBe(50);  // qualified: 20/40
      expect(funnel.stages[4].conversionRate).toBe(50);  // converted: 10/20
    });

    it('should handle zero values', () => {
      const input: FunnelInput = {
        discovered: 0,
        contacted: 0,
        responded: 0,
        qualified: 0,
        converted: 0,
      };

      const funnel = buildFunnel(input);
      expect(funnel.overallConversionRate).toBe(0);
    });
  });

  describe('buildCustomFunnel', () => {
    it('should create funnel with custom stages', () => {
      const stages = [
        { id: 'awareness', name: 'Awareness', count: 500 },
        { id: 'interest', name: 'Interest', count: 300 },
        { id: 'decision', name: 'Decision', count: 100 },
        { id: 'action', name: 'Action', count: 25 },
      ];

      const funnel = buildCustomFunnel(stages);

      expect(funnel.stages.length).toBe(4);
      expect(funnel.totalLeads).toBe(500);
      expect(funnel.totalConverted).toBe(25);
      expect(funnel.overallConversionRate).toBe(5); // 25/500 * 100
    });
  });

  describe('buildPersonaRanking', () => {
    it('should rank personas by quality score', () => {
      const personas: PersonaInput[] = [
        {
          id: 'p1',
          name: 'CFO',
          type: 'executive',
          outreach: 100,
          responses: 30,
          conversions: 10,
          avgDealSize: 50000,
          avgCycleTime: 10,
        },
        {
          id: 'p2',
          name: 'Finance Manager',
          type: 'manager',
          outreach: 200,
          responses: 40,
          conversions: 8,
          avgDealSize: 20000,
          avgCycleTime: 20,
        },
      ];

      const ranked = buildPersonaRanking(personas);

      expect(ranked.length).toBe(2);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
      expect(ranked[0].metrics.qualityScore).toBeGreaterThan(ranked[1].metrics.qualityScore);
    });

    it('should calculate correct metrics', () => {
      const personas: PersonaInput[] = [
        {
          id: 'p1',
          name: 'Test',
          type: 'test',
          outreach: 100,
          responses: 25,
          conversions: 5,
        },
      ];

      const ranked = buildPersonaRanking(personas);

      expect(ranked[0].metrics.totalOutreach).toBe(100);
      expect(ranked[0].metrics.responseRate).toBe(25); // 25/100 * 100
      expect(ranked[0].metrics.conversionRate).toBe(20); // 5/25 * 100
    });
  });

  describe('buildHeatmap', () => {
    it('should create heatmap with correct structure', () => {
      const input: HeatmapInput = {
        type: 'time-of-day',
        data: [
          { x: '9AM', y: 'Mon', value: 15 },
          { x: '10AM', y: 'Mon', value: 25 },
          { x: '9AM', y: 'Tue', value: 20 },
          { x: '10AM', y: 'Tue', value: 30 },
        ],
      };

      const heatmap = buildHeatmap(input);

      expect(heatmap.id).toBe('heatmap-time-of-day');
      expect(heatmap.xLabels).toContain('9AM');
      expect(heatmap.xLabels).toContain('10AM');
      expect(heatmap.yLabels).toContain('Mon');
      expect(heatmap.yLabels).toContain('Tue');
      expect(heatmap.cells.length).toBe(4);
      expect(heatmap.minValue).toBe(0);
      expect(heatmap.maxValue).toBe(100);
    });

    it('should use correct color scale based on type', () => {
      expect(buildHeatmap({ type: 'time-of-day', data: [] }).colorScale).toBe('green');
      expect(buildHeatmap({ type: 'persona', data: [] }).colorScale).toBe('blue');
      expect(buildHeatmap({ type: 'industry', data: [] }).colorScale).toBe('orange');
    });
  });

  describe('buildTimeOfDayHeatmap', () => {
    it('should format hours correctly', () => {
      const data = [
        { day: 'Mon', hour: 9, responseRate: 15 },
        { day: 'Mon', hour: 12, responseRate: 20 },
        { day: 'Mon', hour: 15, responseRate: 18 },
      ];

      const heatmap = buildTimeOfDayHeatmap(data);

      expect(heatmap.xLabels).toContain('9AM');
      expect(heatmap.xLabels).toContain('12PM');
      expect(heatmap.xLabels).toContain('3PM');
    });
  });

  describe('buildTrendLine', () => {
    it('should create trend line with correct structure', () => {
      const input: TrendInput = {
        id: 'leads',
        label: 'Total Leads',
        data: [
          { date: '2024-01-01', value: 100 },
          { date: '2024-01-02', value: 120 },
          { date: '2024-01-03', value: 115 },
        ],
        color: '#3b82f6',
      };

      const trend = buildTrendLine(input);

      expect(trend.id).toBe('leads');
      expect(trend.label).toBe('Total Leads');
      expect(trend.data.length).toBe(3);
      expect(trend.color).toBe('#3b82f6');
      expect(trend.type).toBe('line');
    });

    it('should convert string dates to Date objects', () => {
      const input: TrendInput = {
        id: 'test',
        label: 'Test',
        data: [{ date: '2024-01-15', value: 50 }],
      };

      const trend = buildTrendLine(input);

      expect(trend.data[0].date).toBeInstanceOf(Date);
    });
  });

  describe('buildMultipleTrendLines', () => {
    it('should create multiple trend lines with default colors', () => {
      const inputs: TrendInput[] = [
        { id: 'line1', label: 'Line 1', data: [{ date: '2024-01-01', value: 10 }] },
        { id: 'line2', label: 'Line 2', data: [{ date: '2024-01-01', value: 20 }] },
      ];

      const trends = buildMultipleTrendLines(inputs);

      expect(trends.length).toBe(2);
      expect(trends[0].color).toBeTruthy();
      expect(trends[1].color).toBeTruthy();
      expect(trends[0].color).not.toBe(trends[1].color);
    });
  });

  describe('aggregateTrendByPeriod', () => {
    it('should aggregate by day', () => {
      const data = [
        { date: new Date('2024-01-01T09:00:00'), value: 10 },
        { date: new Date('2024-01-01T15:00:00'), value: 20 },
        { date: new Date('2024-01-02T10:00:00'), value: 30 },
      ];

      const aggregated = aggregateTrendByPeriod(data, 'day');

      expect(aggregated.length).toBe(2);
      expect(aggregated[0].value).toBe(15); // (10 + 20) / 2
      expect(aggregated[1].value).toBe(30);
    });

    it('should aggregate by week', () => {
      const data = [
        { date: new Date('2024-01-01'), value: 10 },
        { date: new Date('2024-01-03'), value: 20 },
        { date: new Date('2024-01-08'), value: 30 },
      ];

      const aggregated = aggregateTrendByPeriod(data, 'week');

      expect(aggregated.length).toBe(2);
    });

    it('should aggregate by month', () => {
      const data = [
        { date: new Date('2024-01-05'), value: 10 },
        { date: new Date('2024-01-25'), value: 20 },
        { date: new Date('2024-02-15'), value: 30 },
      ];

      const aggregated = aggregateTrendByPeriod(data, 'month');

      expect(aggregated.length).toBe(2);
    });
  });

  describe('transformSignals', () => {
    it('should transform raw signals correctly', () => {
      const rawSignals: RawSignal[] = [
        {
          id: 's1',
          type: 'hiring',
          title: 'Company Hiring 50+',
          description: 'Major expansion detected',
          confidence: 0.85,
          timestamp: new Date('2024-01-15'),
          source: 'linkedin',
        },
      ];

      const signals = transformSignals(rawSignals);

      expect(signals.length).toBe(1);
      expect(signals[0].id).toBe('s1');
      expect(signals[0].category).toBe('opportunity');
      expect(signals[0].actionable).toBe(true);
      expect(signals[0].priority).toBe('medium');
    });

    it('should categorize signals correctly', () => {
      const rawSignals: RawSignal[] = [
        { id: '1', type: 'hiring', title: '', confidence: 0.5, timestamp: new Date() },
        { id: '2', type: 'layoff', title: '', confidence: 0.5, timestamp: new Date() },
        { id: '3', type: 'meeting-scheduled', title: '', confidence: 0.5, timestamp: new Date() },
        { id: '4', type: 'unknown', title: '', confidence: 0.5, timestamp: new Date() },
      ];

      const signals = transformSignals(rawSignals);

      expect(signals[0].category).toBe('opportunity');
      expect(signals[1].category).toBe('risk');
      expect(signals[2].category).toBe('action');
      expect(signals[3].category).toBe('insight');
    });

    it('should determine priority based on confidence', () => {
      const rawSignals: RawSignal[] = [
        { id: '1', type: 'hiring', title: '', confidence: 0.9, timestamp: new Date() },
        { id: '2', type: 'hiring', title: '', confidence: 0.7, timestamp: new Date() },
        { id: '3', type: 'hiring', title: '', confidence: 0.4, timestamp: new Date() },
      ];

      const signals = transformSignals(rawSignals);

      expect(signals[0].priority).toBe('high');
      expect(signals[1].priority).toBe('medium');
      expect(signals[2].priority).toBe('low');
    });

    it('should mark signals as actionable above threshold', () => {
      const rawSignals: RawSignal[] = [
        { id: '1', type: 'hiring', title: '', confidence: 0.8, timestamp: new Date() },
        { id: '2', type: 'hiring', title: '', confidence: 0.6, timestamp: new Date() },
      ];

      const signals = transformSignals(rawSignals);

      expect(signals[0].actionable).toBe(true);
      expect(signals[1].actionable).toBe(false);
    });
  });

  describe('wrapInWidget', () => {
    it('should wrap data in widget structure', () => {
      const data = { test: 'value' };
      const widget = wrapInWidget('test-id', 'kpi', 'Test Widget', data);

      expect(widget.id).toBe('test-id');
      expect(widget.type).toBe('kpi');
      expect(widget.title).toBe('Test Widget');
      expect(widget.data).toEqual(data);
      expect(widget.loading).toBe(false);
      expect(widget.lastUpdated).toBeInstanceOf(Date);
    });

    it('should include error when provided', () => {
      const widget = wrapInWidget('test', 'kpi', 'Test', {}, false, 'Error message');
      expect(widget.error).toBe('Error message');
    });
  });
});

// =============================================================================
// TYPE TESTS
// =============================================================================

describe('Type Definitions', () => {
  it('should have correct KPIBlock structure', () => {
    const kpi: KPIBlock = {
      id: 'test',
      label: 'Test KPI',
      value: 100,
      unit: '%',
      change: 5.5,
      changeDirection: 'up',
      color: '#3b82f6',
      icon: '📊',
    };

    expect(kpi.id).toBe('test');
    expect(kpi.value).toBe(100);
    expect(kpi.changeDirection).toBe('up');
  });

  it('should have correct OutreachFunnel structure', () => {
    const funnel: OutreachFunnel = {
      stages: [
        { id: 'stage1', name: 'Stage 1', count: 100, color: '#000' },
      ],
      totalLeads: 100,
      totalConverted: 10,
      overallConversionRate: 10,
      avgCycleTime: 14,
    };

    expect(funnel.stages.length).toBe(1);
    expect(funnel.totalLeads).toBe(100);
  });

  it('should have correct IntelligenceSignal structure', () => {
    const signal: IntelligenceSignal = {
      id: 'sig1',
      type: 'hiring',
      category: 'opportunity',
      title: 'Test Signal',
      description: 'Description',
      confidence: 0.85,
      timestamp: new Date(),
      source: 'linkedin',
      actionable: true,
      priority: 'high',
    };

    expect(signal.category).toBe('opportunity');
    expect(signal.actionable).toBe(true);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration', () => {
  it('should transform OS metrics to KPI grid data', () => {
    const osResponse: OSMetricsResponse = {
      discovery: {
        total: 5000,
        qualified: 1500,
        newThisWeek: 250,
        avgScore: 72.5,
      },
      outreach: {
        sent: 2000,
        delivered: 1800,
        opened: 900,
        replied: 200,
        converted: 50,
      },
      performance: {
        responseRate: 22.5,
        conversionRate: 8.2,
        avgCycleTime: 11,
      },
    };

    const widgets = convertOSMetricsToWidgets(osResponse);

    expect(widgets.length).toBe(9); // 3 discovery + 3 outreach + 3 performance

    // Verify specific calculations
    const totalLeads = widgets.find((w) => w.id === 'total-leads');
    expect(totalLeads?.value).toBe(5000);

    const openRate = widgets.find((w) => w.id === 'open-rate');
    expect(openRate?.value).toBe(50); // 900/1800 * 100
  });

  it('should build complete dashboard data flow', () => {
    // 1. Build funnel from input
    const funnelInput: FunnelInput = {
      discovered: 1000,
      contacted: 800,
      responded: 200,
      qualified: 100,
      converted: 20,
    };
    const funnel = buildFunnel(funnelInput);

    // 2. Build persona ranking
    const personas: PersonaInput[] = [
      { id: 'p1', name: 'CFO', type: 'exec', outreach: 100, responses: 30, conversions: 10 },
      { id: 'p2', name: 'Manager', type: 'mid', outreach: 200, responses: 40, conversions: 8 },
    ];
    const ranking = buildPersonaRanking(personas);

    // 3. Transform signals
    const rawSignals: RawSignal[] = [
      { id: 's1', type: 'hiring', title: 'Expansion', confidence: 0.9, timestamp: new Date() },
    ];
    const signals = transformSignals(rawSignals);

    // Verify all data is properly structured
    expect(funnel.overallConversionRate).toBe(2);
    expect(ranking[0].rank).toBe(1);
    expect(signals[0].category).toBe('opportunity');
  });
});
