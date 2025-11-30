/**
 * Widget System
 * Sprint S63: Smart Workspace + Performance Polish
 *
 * Config-driven workspace with:
 * - Widget types and templates
 * - Vertical-specific layouts
 * - Drag-and-drop grid
 */
import { z } from 'zod';

// =============================================================================
// WIDGET TYPES
// =============================================================================

export const WidgetTypeEnum = z.enum([
  // Analytics Widgets
  'radar_feed',
  'signal_heatmap',
  'pipeline_funnel',
  'activity_timeline',
  'score_distribution',

  // List Widgets
  'company_list',
  'contact_list',
  'task_list',
  'saved_searches',

  // Chart Widgets
  'trend_chart',
  'comparison_chart',
  'geo_distribution',

  // Action Widgets
  'quick_actions',
  'outreach_queue',
  'journey_status',

  // Info Widgets
  'notifications',
  'team_activity',
  'usage_meter',
]);
export type WidgetType = z.infer<typeof WidgetTypeEnum>;

export const WidgetSizeEnum = z.enum(['small', 'medium', 'large', 'full']);
export type WidgetSize = z.infer<typeof WidgetSizeEnum>;

// =============================================================================
// WIDGET DEFINITION
// =============================================================================

export const WidgetConfigSchema = z.record(z.string(), z.unknown());
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

export const WidgetSchema = z.object({
  id: z.string(),
  type: WidgetTypeEnum,
  title: z.string(),

  // Grid position
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1).max(12),
  height: z.number().min(1).max(12),

  // Configuration
  config: WidgetConfigSchema,

  // State
  isCollapsed: z.boolean().default(false),
  isLoading: z.boolean().default(false),
  lastRefreshed: z.date().optional(),

  // Permissions
  minPlan: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
});
export type Widget = z.infer<typeof WidgetSchema>;

// =============================================================================
// LAYOUT DEFINITION
// =============================================================================

export const LayoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),

  // Widgets
  widgets: z.array(WidgetSchema),

  // Grid settings
  columns: z.number().default(12),
  rowHeight: z.number().default(100),
  gap: z.number().default(16),

  // Metadata
  vertical: z.string().optional(),
  subVertical: z.string().optional(),
  isDefault: z.boolean().default(false),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Layout = z.infer<typeof LayoutSchema>;

// =============================================================================
// WORKSPACE TEMPLATES
// =============================================================================

export const WorkspaceTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  vertical: z.string(),
  subVertical: z.string().optional(),
  thumbnail: z.string().url().optional(),
  layout: LayoutSchema,
  isBuiltIn: z.boolean().default(false),
});
export type WorkspaceTemplate = z.infer<typeof WorkspaceTemplateSchema>;

// =============================================================================
// WIDGET TEMPLATES
// =============================================================================

export interface WidgetTemplate {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  defaultSize: { width: number; height: number };
  minPlan: 'free' | 'starter' | 'professional' | 'enterprise';
  defaultConfig: WidgetConfig;
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    type: 'radar_feed',
    title: 'Radar Feed',
    description: 'Live feed of matching companies',
    icon: '📡',
    defaultSize: { width: 4, height: 4 },
    minPlan: 'free',
    defaultConfig: { limit: 10, autoRefresh: true },
  },
  {
    type: 'signal_heatmap',
    title: 'Signal Heatmap',
    description: 'Geographic distribution of signals',
    icon: '🗺️',
    defaultSize: { width: 6, height: 4 },
    minPlan: 'starter',
    defaultConfig: { showLabels: true },
  },
  {
    type: 'pipeline_funnel',
    title: 'Pipeline Funnel',
    description: 'Sales pipeline visualization',
    icon: '📊',
    defaultSize: { width: 4, height: 3 },
    minPlan: 'starter',
    defaultConfig: { stages: ['discovered', 'enriched', 'scored', 'contacted', 'converted'] },
  },
  {
    type: 'activity_timeline',
    title: 'Activity Timeline',
    description: 'Recent activity feed',
    icon: '📅',
    defaultSize: { width: 3, height: 4 },
    minPlan: 'free',
    defaultConfig: { limit: 20 },
  },
  {
    type: 'company_list',
    title: 'Company List',
    description: 'Top companies by score',
    icon: '🏢',
    defaultSize: { width: 4, height: 4 },
    minPlan: 'free',
    defaultConfig: { sortBy: 'score', limit: 10 },
  },
  {
    type: 'quick_actions',
    title: 'Quick Actions',
    description: 'Common actions at a glance',
    icon: '⚡',
    defaultSize: { width: 2, height: 2 },
    minPlan: 'free',
    defaultConfig: {},
  },
  {
    type: 'journey_status',
    title: 'Journey Status',
    description: 'Active journey progress',
    icon: '🚀',
    defaultSize: { width: 4, height: 3 },
    minPlan: 'professional',
    defaultConfig: { showCompleted: false },
  },
  {
    type: 'usage_meter',
    title: 'Usage Meter',
    description: 'API and search usage',
    icon: '📈',
    defaultSize: { width: 2, height: 2 },
    minPlan: 'free',
    defaultConfig: {},
  },
  {
    type: 'team_activity',
    title: 'Team Activity',
    description: 'Team member actions',
    icon: '👥',
    defaultSize: { width: 3, height: 3 },
    minPlan: 'professional',
    defaultConfig: { limit: 10 },
  },
  {
    type: 'notifications',
    title: 'Notifications',
    description: 'Recent alerts and notifications',
    icon: '🔔',
    defaultSize: { width: 3, height: 3 },
    minPlan: 'free',
    defaultConfig: { showRead: false },
  },
];

// =============================================================================
// VERTICAL TEMPLATES
// =============================================================================

export const VERTICAL_WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: 'banking-employee',
    name: 'Banking - Employee Banking',
    description: 'Optimized for employee banking sales',
    vertical: 'banking',
    subVertical: 'employee-banking',
    isBuiltIn: true,
    layout: {
      id: 'banking-employee-default',
      name: 'Banking Employee Default',
      widgets: [
        { id: 'w1', type: 'radar_feed', title: 'Hiring Signals', x: 0, y: 0, width: 4, height: 4, config: { signalType: 'hiring' }, isCollapsed: false, isLoading: false, minPlan: 'free' },
        { id: 'w2', type: 'signal_heatmap', title: 'Regional Activity', x: 4, y: 0, width: 5, height: 4, config: {}, isCollapsed: false, isLoading: false, minPlan: 'starter' },
        { id: 'w3', type: 'pipeline_funnel', title: 'Pipeline', x: 9, y: 0, width: 3, height: 4, config: {}, isCollapsed: false, isLoading: false, minPlan: 'starter' },
        { id: 'w4', type: 'company_list', title: 'Top Companies', x: 0, y: 4, width: 4, height: 4, config: {}, isCollapsed: false, isLoading: false, minPlan: 'free' },
        { id: 'w5', type: 'journey_status', title: 'Active Journeys', x: 4, y: 4, width: 4, height: 3, config: {}, isCollapsed: false, isLoading: false, minPlan: 'professional' },
        { id: 'w6', type: 'quick_actions', title: 'Quick Actions', x: 8, y: 4, width: 2, height: 2, config: {}, isCollapsed: false, isLoading: false, minPlan: 'free' },
        { id: 'w7', type: 'usage_meter', title: 'Usage', x: 10, y: 4, width: 2, height: 2, config: {}, isCollapsed: false, isLoading: false, minPlan: 'free' },
      ],
      columns: 12,
      rowHeight: 100,
      gap: 16,
      vertical: 'banking',
      subVertical: 'employee-banking',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: 'insurance-life',
    name: 'Insurance - Life Insurance',
    description: 'Optimized for life insurance sales',
    vertical: 'insurance',
    subVertical: 'life-insurance',
    isBuiltIn: true,
    layout: {
      id: 'insurance-life-default',
      name: 'Insurance Life Default',
      widgets: [
        { id: 'w1', type: 'radar_feed', title: 'Life Events', x: 0, y: 0, width: 4, height: 4, config: { signalType: 'life-events' }, isCollapsed: false, isLoading: false, minPlan: 'free' },
        { id: 'w2', type: 'activity_timeline', title: 'Recent Activity', x: 4, y: 0, width: 4, height: 4, config: {}, isCollapsed: false, isLoading: false, minPlan: 'free' },
        { id: 'w3', type: 'score_distribution', title: 'Lead Scores', x: 8, y: 0, width: 4, height: 4, config: {}, isCollapsed: false, isLoading: false, minPlan: 'starter' },
        { id: 'w4', type: 'contact_list', title: 'Top Contacts', x: 0, y: 4, width: 4, height: 4, config: {}, isCollapsed: false, isLoading: false, minPlan: 'free' },
        { id: 'w5', type: 'outreach_queue', title: 'Outreach Queue', x: 4, y: 4, width: 4, height: 3, config: {}, isCollapsed: false, isLoading: false, minPlan: 'professional' },
      ],
      columns: 12,
      rowHeight: 100,
      gap: 16,
      vertical: 'insurance',
      subVertical: 'life-insurance',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: 'real-estate',
    name: 'Real Estate - Residential',
    description: 'Optimized for residential real estate sales',
    vertical: 'real-estate',
    subVertical: 'residential',
    isBuiltIn: true,
    layout: {
      id: 'real-estate-default',
      name: 'Real Estate Default',
      widgets: [
        { id: 'w1', type: 'radar_feed', title: 'Rental Expiries', x: 0, y: 0, width: 4, height: 4, config: { signalType: 'rental-expiry' }, isCollapsed: false, isLoading: false, minPlan: 'free' },
        { id: 'w2', type: 'geo_distribution', title: 'Property Map', x: 4, y: 0, width: 6, height: 4, config: {}, isCollapsed: false, isLoading: false, minPlan: 'starter' },
        { id: 'w3', type: 'quick_actions', title: 'Quick Actions', x: 10, y: 0, width: 2, height: 2, config: {}, isCollapsed: false, isLoading: false, minPlan: 'free' },
        { id: 'w4', type: 'contact_list', title: 'Hot Leads', x: 0, y: 4, width: 4, height: 4, config: {}, isCollapsed: false, isLoading: false, minPlan: 'free' },
        { id: 'w5', type: 'pipeline_funnel', title: 'Sales Pipeline', x: 4, y: 4, width: 4, height: 3, config: {}, isCollapsed: false, isLoading: false, minPlan: 'starter' },
      ],
      columns: 12,
      rowHeight: 100,
      gap: 16,
      vertical: 'real-estate',
      subVertical: 'residential',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
];

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

export const ShortcutActionEnum = z.enum([
  // Navigation
  'go_home',
  'go_radar',
  'go_companies',
  'go_contacts',
  'go_journeys',
  'go_settings',

  // Actions
  'new_search',
  'new_journey',
  'refresh_data',
  'export_data',
  'toggle_sidebar',

  // Selection
  'select_next',
  'select_previous',
  'select_all',
  'deselect_all',

  // View
  'toggle_fullscreen',
  'zoom_in',
  'zoom_out',
  'reset_zoom',

  // Help
  'show_shortcuts',
  'show_help',
]);
export type ShortcutAction = z.infer<typeof ShortcutActionEnum>;

export const KeyboardShortcutSchema = z.object({
  id: z.string(),
  action: ShortcutActionEnum,
  keys: z.array(z.string()),
  description: z.string(),
  category: z.enum(['navigation', 'actions', 'selection', 'view', 'help']),
  isCustom: z.boolean().default(false),
});
export type KeyboardShortcut = z.infer<typeof KeyboardShortcutSchema>;

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { id: 'nav_home', action: 'go_home', keys: ['cmd', 'h'], description: 'Go to Home', category: 'navigation', isCustom: false },
  { id: 'nav_radar', action: 'go_radar', keys: ['cmd', 'r'], description: 'Go to Radar', category: 'navigation', isCustom: false },
  { id: 'nav_journeys', action: 'go_journeys', keys: ['cmd', 'j'], description: 'Go to Journeys', category: 'navigation', isCustom: false },
  { id: 'nav_settings', action: 'go_settings', keys: ['cmd', ','], description: 'Go to Settings', category: 'navigation', isCustom: false },
  { id: 'act_search', action: 'new_search', keys: ['cmd', 'k'], description: 'New Search', category: 'actions', isCustom: false },
  { id: 'act_journey', action: 'new_journey', keys: ['cmd', 'n'], description: 'New Journey', category: 'actions', isCustom: false },
  { id: 'act_refresh', action: 'refresh_data', keys: ['cmd', 'shift', 'r'], description: 'Refresh Data', category: 'actions', isCustom: false },
  { id: 'act_sidebar', action: 'toggle_sidebar', keys: ['cmd', 'b'], description: 'Toggle Sidebar', category: 'actions', isCustom: false },
  { id: 'view_fullscreen', action: 'toggle_fullscreen', keys: ['cmd', 'f'], description: 'Toggle Fullscreen', category: 'view', isCustom: false },
  { id: 'help_shortcuts', action: 'show_shortcuts', keys: ['cmd', '/'], description: 'Show Shortcuts', category: 'help', isCustom: false },
];

// =============================================================================
// COLLABORATION PRESENCE
// =============================================================================

export const PresenceStatusEnum = z.enum(['online', 'away', 'busy', 'offline']);
export type PresenceStatus = z.infer<typeof PresenceStatusEnum>;

export const UserPresenceSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().url().optional(),
  status: PresenceStatusEnum,
  currentPage: z.string().optional(),
  lastSeen: z.date(),
  cursorPosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});
export type UserPresence = z.infer<typeof UserPresenceSchema>;

// =============================================================================
// PERFORMANCE METRICS (S63)
// =============================================================================

export const PerformanceMetricsSchema = z.object({
  lcp: z.number().optional(),
  fid: z.number().optional(),
  cls: z.number().optional(),
  fcp: z.number().optional(),
  ttfb: z.number().optional(),
  loadTime: z.number(),
  renderTime: z.number(),
  fps: z.number(),
  droppedFrames: z.number(),
  measuredAt: z.date(),
});
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
