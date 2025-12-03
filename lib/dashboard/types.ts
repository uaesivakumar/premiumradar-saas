/**
 * Dashboard Types
 * Sprint S54: Vertical Dashboards
 *
 * Type definitions for the vertical intelligence dashboard.
 */

// =============================================================================
// VERTICALS
// =============================================================================

/**
 * P2 VERTICALISATION: Aligning VerticalId with Vertical from sales context.
 * This ensures consistent vertical types across the application.
 */
import type { Vertical } from '../intelligence/context/types';

// Re-export Vertical as VerticalId for backward compatibility
export type VerticalId = Vertical;

export interface VerticalConfig {
  id: VerticalId;
  name: string;
  icon: string;
  color: string;
  description: string;
  subVerticals: SubVertical[];
  defaultMetrics: string[];
  signalTypes: string[];
}

export interface SubVertical {
  id: string;
  name: string;
  description: string;
}

// =============================================================================
// DASHBOARD CONFIGURATION
// =============================================================================

export interface VerticalDashConfig {
  vertical: VerticalId;
  territory?: string;
  dateRange: DateRange;
  refreshInterval: number; // seconds
  widgets: WidgetConfig[];
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: { row: number; col: number };
  size: { width: number; height: number };
  title: string;
  dataSource: string;
  options?: Record<string, unknown>;
}

export type WidgetType =
  | 'kpi'
  | 'funnel'
  | 'heatmap'
  | 'trend'
  | 'ranking'
  | 'signals'
  | 'chart';

export interface DateRange {
  start: Date;
  end: Date;
  preset?: '7d' | '30d' | '90d' | 'custom';
}

// =============================================================================
// KPI & METRICS
// =============================================================================

export interface KPIBlock {
  id: string;
  label: string;
  value: number;
  unit?: string;
  change?: number; // percentage change
  changeDirection?: 'up' | 'down' | 'neutral';
  trend?: TrendPoint[];
  color?: string;
  icon?: string;
}

export interface TrendPoint {
  date: Date;
  value: number;
}

export interface TrendSeries {
  id: string;
  label: string;
  data: TrendPoint[];
  color: string;
  type: 'line' | 'bar' | 'area';
}

// =============================================================================
// FUNNEL
// =============================================================================

export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  value?: number;
  conversionRate?: number;
  avgTimeInStage?: number; // hours
  color: string;
}

export interface OutreachFunnel {
  stages: FunnelStage[];
  totalLeads: number;
  totalConverted: number;
  overallConversionRate: number;
  avgCycleTime: number; // days
}

// =============================================================================
// HEATMAP
// =============================================================================

export interface HeatmapCell {
  x: string | number;
  y: string | number;
  value: number;
  label?: string;
}

export interface HeatmapData {
  id: string;
  title: string;
  xLabels: string[];
  yLabels: string[];
  cells: HeatmapCell[];
  minValue: number;
  maxValue: number;
  colorScale: 'green' | 'blue' | 'red' | 'orange';
}

// =============================================================================
// PERSONA PERFORMANCE
// =============================================================================

export interface PersonaPerformance {
  personaId: string;
  personaName: string;
  personaType: string;
  metrics: {
    totalOutreach: number;
    responseRate: number;
    conversionRate: number;
    avgDealSize: number;
    avgCycleTime: number;
    qualityScore: number;
  };
  rank: number;
  trend: 'improving' | 'declining' | 'stable';
  topSignals: string[];
}

// =============================================================================
// INTELLIGENCE SIGNALS
// =============================================================================

export interface IntelligenceSignal {
  id: string;
  type: string;
  category: 'opportunity' | 'risk' | 'insight' | 'action';
  title: string;
  description: string;
  confidence: number;
  timestamp: Date;
  source: string;
  metadata?: Record<string, unknown>;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

// =============================================================================
// DISCOVERY STATS
// =============================================================================

export interface DiscoveryStats {
  totalCompanies: number;
  newThisWeek: number;
  qualifiedLeads: number;
  avgQualityScore: number;
  byIndustry: IndustryBreakdown[];
  bySize: SizeBreakdown[];
  byRegion: RegionBreakdown[];
  topSignals: SignalBreakdown[];
}

export interface IndustryBreakdown {
  industry: string;
  count: number;
  percentage: number;
}

export interface SizeBreakdown {
  size: string;
  count: number;
  percentage: number;
}

export interface RegionBreakdown {
  region: string;
  count: number;
  percentage: number;
}

export interface SignalBreakdown {
  signal: string;
  count: number;
  avgConfidence: number;
}

// =============================================================================
// OUTREACH STATS
// =============================================================================

export interface OutreachStats {
  totalSent: number;
  delivered: number;
  opened: number;
  replied: number;
  converted: number;
  avgResponseTime: number; // hours
  bestPerformingTemplate: string;
  byChannel: ChannelBreakdown[];
  byDayOfWeek: DayBreakdown[];
  byTimeOfDay: TimeBreakdown[];
}

export interface ChannelBreakdown {
  channel: string;
  sent: number;
  responseRate: number;
}

export interface DayBreakdown {
  day: string;
  sent: number;
  responseRate: number;
}

export interface TimeBreakdown {
  hour: number;
  sent: number;
  responseRate: number;
}

// =============================================================================
// AUTONOMOUS METRICS
// =============================================================================

export interface AutonomousMetrics {
  totalActions: number;
  successRate: number;
  avgLatency: number; // ms
  costSavings: number;
  automationRate: number;
  byActionType: ActionTypeBreakdown[];
  errorRate: number;
  lastUpdated: Date;
}

export interface ActionTypeBreakdown {
  type: string;
  count: number;
  successRate: number;
  avgDuration: number;
}

// =============================================================================
// DASHBOARD WIDGET
// =============================================================================

export interface DashboardWidget<T = unknown> {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  data: T;
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}

// =============================================================================
// DASHBOARD STATE
// =============================================================================

export interface DashboardState {
  vertical: VerticalId;
  territory?: string;
  dateRange: DateRange;
  isLoading: boolean;
  error?: string;
  widgets: {
    kpis: DashboardWidget<KPIBlock[]>;
    funnel: DashboardWidget<OutreachFunnel>;
    personas: DashboardWidget<PersonaPerformance[]>;
    heatmap: DashboardWidget<HeatmapData>;
    trends: DashboardWidget<TrendSeries[]>;
    signals: DashboardWidget<IntelligenceSignal[]>;
    discovery: DashboardWidget<DiscoveryStats>;
    outreach: DashboardWidget<OutreachStats>;
    autonomous: DashboardWidget<AutonomousMetrics>;
  };
  lastRefresh: Date;
}

// =============================================================================
// API RESPONSE
// =============================================================================

export interface DashboardAPIResponse {
  success: boolean;
  data?: {
    vertical: VerticalId;
    territory?: string;
    dateRange: DateRange;
    kpis: KPIBlock[];
    funnel: OutreachFunnel;
    personas: PersonaPerformance[];
    heatmap: HeatmapData;
    trends: TrendSeries[];
    signals: IntelligenceSignal[];
    discovery: DiscoveryStats;
    outreach: OutreachStats;
    autonomous: AutonomousMetrics;
    generatedAt: Date;
  };
  error?: string;
}

// =============================================================================
// VERTICAL CONFIGS
// =============================================================================

/**
 * P2 VERTICALISATION: Updated configs to match Vertical type from sales context.
 * Uses the official verticals: banking, insurance, real-estate, recruitment, saas-sales
 */
export const VERTICAL_CONFIGS: Record<VerticalId, VerticalConfig> = {
  banking: {
    id: 'banking',
    name: 'Banking',
    icon: '🏦',
    color: '#1e40af',
    description: 'Banking and financial services intelligence',
    subVerticals: [
      { id: 'employee-banking', name: 'Employee Banking', description: 'Payroll, salary accounts' },
      { id: 'corporate-banking', name: 'Corporate Banking', description: 'Treasury, trade finance' },
      { id: 'sme-banking', name: 'SME Banking', description: 'Small business accounts' },
      { id: 'retail-banking', name: 'Retail Banking', description: 'Personal accounts, mortgages' },
      { id: 'wealth-management', name: 'Wealth Management', description: 'Private banking, investments' },
    ],
    defaultMetrics: ['hiring-expansion', 'headcount-jump', 'office-opening', 'funding-round'],
    signalTypes: ['hiring', 'expansion', 'funding', 'market-entry', 'project-award'],
  },
  insurance: {
    id: 'insurance',
    name: 'Insurance',
    icon: '🛡️',
    color: '#059669',
    description: 'Insurance and life coverage intelligence',
    subVerticals: [
      { id: 'life-insurance', name: 'Life Insurance', description: 'Individual life policies' },
      { id: 'group-insurance', name: 'Group Insurance', description: 'Corporate employee benefits' },
      { id: 'health-insurance', name: 'Health Insurance', description: 'Medical coverage' },
    ],
    defaultMetrics: ['life-event', 'salary-change', 'job-change', 'family-event'],
    signalTypes: ['life-event', 'salary-change', 'job-change', 'policy-expiry'],
  },
  'real-estate': {
    id: 'real-estate',
    name: 'Real Estate',
    icon: '🏠',
    color: '#7c3aed',
    description: 'Real estate and property intelligence',
    subVerticals: [
      { id: 'residential-sales', name: 'Residential Sales', description: 'Home sales to families' },
      { id: 'commercial-leasing', name: 'Commercial Leasing', description: 'Office/retail space' },
      { id: 'property-management', name: 'Property Management', description: 'Rental management' },
    ],
    defaultMetrics: ['rental-expiry', 'relocation', 'family-growth', 'job-relocation'],
    signalTypes: ['rental-expiry', 'relocation', 'family-growth', 'property-search'],
  },
  recruitment: {
    id: 'recruitment',
    name: 'Recruitment',
    icon: '👤',
    color: '#0891b2',
    description: 'Talent acquisition and recruitment intelligence',
    subVerticals: [
      { id: 'executive-search', name: 'Executive Search', description: 'C-level recruitment' },
      { id: 'tech-recruitment', name: 'Tech Recruitment', description: 'IT and tech roles' },
      { id: 'mass-recruitment', name: 'Mass Recruitment', description: 'Volume hiring' },
    ],
    defaultMetrics: ['job-posting', 'layoff-announcement', 'skill-trending', 'hiring-expansion'],
    signalTypes: ['job-posting', 'layoff-announcement', 'skill-trending', 'company-growth'],
  },
  'saas-sales': {
    id: 'saas-sales',
    name: 'SaaS Sales',
    icon: '💻',
    color: '#ea580c',
    description: 'SaaS and software sales intelligence',
    subVerticals: [
      { id: 'enterprise-sales', name: 'Enterprise Sales', description: 'Large enterprise deals' },
      { id: 'mid-market-sales', name: 'Mid-Market Sales', description: 'Mid-sized companies' },
      { id: 'smb-sales', name: 'SMB Sales', description: 'Small business' },
    ],
    defaultMetrics: ['tech-stack-change', 'funding-round', 'hiring-expansion', 'product-launch'],
    signalTypes: ['tech-stack-change', 'funding', 'product-launch', 'partnership'],
  },
};
