/**
 * Dashboard Types
 * Sprint S54: Vertical Dashboards
 *
 * Type definitions for the vertical intelligence dashboard.
 */

// =============================================================================
// VERTICALS
// =============================================================================

export type VerticalId =
  | 'banking'
  | 'real-estate'
  | 'consulting'
  | 'technology'
  | 'energy'
  | 'healthcare';

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
  'real-estate': {
    id: 'real-estate',
    name: 'Real Estate',
    icon: '🏠',
    color: '#059669',
    description: 'Real estate and property intelligence',
    subVerticals: [
      { id: 'residential-sales', name: 'Residential Sales', description: 'Home sales to families' },
      { id: 'commercial-leasing', name: 'Commercial Leasing', description: 'Office/retail space' },
      { id: 'property-management', name: 'Property Management', description: 'Rental management' },
    ],
    defaultMetrics: ['rental-expiry', 'relocation', 'family-growth', 'job-relocation'],
    signalTypes: ['rental-expiry', 'relocation', 'family-growth', 'property-search'],
  },
  consulting: {
    id: 'consulting',
    name: 'Consulting',
    icon: '💼',
    color: '#7c3aed',
    description: 'Professional services and consulting intelligence',
    subVerticals: [
      { id: 'management-consulting', name: 'Management Consulting', description: 'Strategy, operations' },
      { id: 'it-consulting', name: 'IT Consulting', description: 'Technology advisory' },
      { id: 'hr-consulting', name: 'HR Consulting', description: 'Talent, organizational' },
    ],
    defaultMetrics: ['project-award', 'transformation', 'leadership-change', 'expansion'],
    signalTypes: ['project-award', 'digital-transformation', 'leadership-change', 'restructuring'],
  },
  technology: {
    id: 'technology',
    name: 'Technology',
    icon: '💻',
    color: '#0891b2',
    description: 'Technology and software intelligence',
    subVerticals: [
      { id: 'saas-sales', name: 'SaaS Sales', description: 'Software subscriptions' },
      { id: 'enterprise-software', name: 'Enterprise Software', description: 'Large-scale deployments' },
      { id: 'cloud-services', name: 'Cloud Services', description: 'Infrastructure, platforms' },
    ],
    defaultMetrics: ['tech-stack-change', 'funding-round', 'hiring-expansion', 'product-launch'],
    signalTypes: ['tech-stack-change', 'funding', 'product-launch', 'partnership'],
  },
  energy: {
    id: 'energy',
    name: 'Energy',
    icon: '⚡',
    color: '#ea580c',
    description: 'Energy and utilities intelligence',
    subVerticals: [
      { id: 'oil-gas', name: 'Oil & Gas', description: 'Upstream, downstream' },
      { id: 'renewables', name: 'Renewables', description: 'Solar, wind, hydro' },
      { id: 'utilities', name: 'Utilities', description: 'Power, water, gas distribution' },
    ],
    defaultMetrics: ['project-award', 'expansion', 'regulatory-change', 'sustainability-initiative'],
    signalTypes: ['project-award', 'regulatory', 'sustainability', 'infrastructure'],
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    color: '#dc2626',
    description: 'Healthcare and life sciences intelligence',
    subVerticals: [
      { id: 'hospitals', name: 'Hospitals', description: 'Hospital systems, clinics' },
      { id: 'pharma', name: 'Pharmaceuticals', description: 'Drug manufacturers' },
      { id: 'medtech', name: 'MedTech', description: 'Medical devices, diagnostics' },
    ],
    defaultMetrics: ['facility-expansion', 'leadership-change', 'funding-round', 'clinical-trial'],
    signalTypes: ['facility-expansion', 'clinical-trial', 'regulatory-approval', 'partnership'],
  },
};
