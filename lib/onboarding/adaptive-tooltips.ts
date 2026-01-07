/**
 * Adaptive Tooltips System - Sprint S135
 *
 * Tooltips adapt based on:
 * - Vertical (banking, recruitment, real estate, etc.)
 * - Pack (intelligence pack being used)
 * - Journey stage (onboarding, first use, experienced)
 * - User role
 * - First-use awareness
 */

import type { Vertical, SubVertical } from '@/lib/intelligence/context/types';

// =============================================================================
// Types
// =============================================================================

export interface TooltipConfig {
  id: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'auto';
  delay?: number;
  persistent?: boolean;
  dismissible?: boolean;
  priority?: number;
}

export interface TooltipContext {
  vertical: Vertical;
  subVertical: SubVertical;
  regions: string[];
  journeyStage: 'onboarding' | 'first-use' | 'learning' | 'experienced';
  userRole?: string;
  packTemplate?: string;
  isFirstVisit?: boolean;
  completedTutorials?: string[];
}

export type TooltipLocation =
  // Dashboard
  | 'dashboard_hero'
  | 'dashboard_signals'
  | 'dashboard_companies'
  | 'dashboard_siva_chat'
  // Discovery
  | 'discovery_search'
  | 'discovery_filters'
  | 'discovery_results'
  // Signals
  | 'signals_feed'
  | 'signals_priority'
  | 'signals_actions'
  // SIVA
  | 'siva_input'
  | 'siva_suggestions'
  | 'siva_tools'
  // Settings
  | 'settings_vertical'
  | 'settings_regions'
  | 'settings_integrations';

// =============================================================================
// Vertical-Specific Tooltips
// =============================================================================

const BANKING_TOOLTIPS: Record<string, Partial<Record<TooltipLocation, TooltipConfig>>> = {
  'employee-banking': {
    dashboard_hero: {
      id: 'eb-dashboard-hero',
      title: 'Your Employee Banking Dashboard',
      content: 'Start here to discover companies expanding in UAE hiring patterns. SIVA will help you identify payroll opportunities.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
    dashboard_signals: {
      id: 'eb-signals-intro',
      title: 'Expansion Signals',
      content: 'These are companies showing hiring growth signals - perfect for payroll account pitches.',
      placement: 'right',
      trigger: 'auto',
      priority: 2,
    },
    discovery_search: {
      id: 'eb-discovery-search',
      title: 'Find Companies Hiring',
      content: 'Search for companies by name, industry, or hiring patterns. Try "tech companies hiring in Dubai".',
      placement: 'bottom',
      trigger: 'hover',
    },
    siva_input: {
      id: 'eb-siva-chat',
      title: 'Ask SIVA Anything',
      content: 'Ask "Which companies are expanding their workforce?" or "Show me SMEs hiring in Abu Dhabi".',
      placement: 'top',
      trigger: 'auto',
      priority: 3,
    },
  },
  'corporate-banking': {
    dashboard_hero: {
      id: 'cb-dashboard-hero',
      title: 'Corporate Banking Intelligence',
      content: 'Discover companies with treasury needs, funding rounds, and expansion plans.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
    dashboard_signals: {
      id: 'cb-signals-intro',
      title: 'Corporate Signals',
      content: 'Track funding rounds, M&A activity, and corporate expansions for treasury opportunities.',
      placement: 'right',
      trigger: 'auto',
      priority: 2,
    },
    siva_input: {
      id: 'cb-siva-chat',
      title: 'Corporate Intelligence',
      content: 'Ask "Which companies raised funding recently?" or "Show me expanding corporates in DIFC".',
      placement: 'top',
      trigger: 'auto',
      priority: 3,
    },
  },
  'sme-banking': {
    dashboard_hero: {
      id: 'sme-dashboard-hero',
      title: 'SME Banking Dashboard',
      content: 'Find small and medium businesses with banking needs - new registrations, growth signals, and more.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
    discovery_search: {
      id: 'sme-discovery-search',
      title: 'Discover SMEs',
      content: 'Search for small businesses by industry, registration date, or growth patterns.',
      placement: 'bottom',
      trigger: 'hover',
    },
  },
};

const RECRUITMENT_TOOLTIPS: Record<string, Partial<Record<TooltipLocation, TooltipConfig>>> = {
  'tech-recruitment': {
    dashboard_hero: {
      id: 'rec-tech-dashboard',
      title: 'Tech Recruitment Intelligence',
      content: 'Start here to identify companies posting urgent openings and track talent movement.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
    dashboard_signals: {
      id: 'rec-tech-signals',
      title: 'Hiring Signals',
      content: 'Companies actively hiring tech talent - prioritized by urgency and fit.',
      placement: 'right',
      trigger: 'auto',
      priority: 2,
    },
    siva_input: {
      id: 'rec-tech-siva',
      title: 'Find Hiring Companies',
      content: 'Ask "Which startups are hiring engineers?" or "Show me companies scaling tech teams".',
      placement: 'top',
      trigger: 'auto',
      priority: 3,
    },
  },
  'executive-search': {
    dashboard_hero: {
      id: 'rec-exec-dashboard',
      title: 'Executive Search Dashboard',
      content: 'Track C-suite movements, leadership changes, and executive opportunities.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
    siva_input: {
      id: 'rec-exec-siva',
      title: 'Executive Intelligence',
      content: 'Ask "Which companies have new CEOs?" or "Show me leadership transitions in banking".',
      placement: 'top',
      trigger: 'auto',
      priority: 3,
    },
  },
};

const REAL_ESTATE_TOOLTIPS: Record<string, Partial<Record<TooltipLocation, TooltipConfig>>> = {
  'residential-sales': {
    dashboard_hero: {
      id: 're-res-dashboard',
      title: 'Residential Property Intelligence',
      content: 'Identify families ready to upgrade based on life events and job relocations.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
    dashboard_signals: {
      id: 're-res-signals',
      title: 'Buyer Signals',
      content: 'Families showing relocation signals, job changes, and upgrade patterns.',
      placement: 'right',
      trigger: 'auto',
      priority: 2,
    },
    siva_input: {
      id: 're-res-siva',
      title: 'Find Property Buyers',
      content: 'Ask "Who is relocating to Dubai?" or "Show me families upgrading from apartments".',
      placement: 'top',
      trigger: 'auto',
      priority: 3,
    },
  },
  'commercial-leasing': {
    dashboard_hero: {
      id: 're-com-dashboard',
      title: 'Commercial Property Intelligence',
      content: 'Track office expansions, new company registrations, and commercial property needs.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
  },
};

const INSURANCE_TOOLTIPS: Record<string, Partial<Record<TooltipLocation, TooltipConfig>>> = {
  'commercial-insurance': {
    dashboard_hero: {
      id: 'ins-corp-dashboard',
      title: 'Corporate Insurance Intelligence',
      content: 'Find growing companies needing expanded coverage - employee count changes, new offices.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
    siva_input: {
      id: 'ins-corp-siva',
      title: 'Find Insurance Opportunities',
      content: 'Ask "Which companies are adding employees?" or "Show me new subsidiaries needing coverage".',
      placement: 'top',
      trigger: 'auto',
      priority: 3,
    },
  },
  'health-insurance': {
    dashboard_hero: {
      id: 'ins-health-dashboard',
      title: 'Health Insurance Intelligence',
      content: 'Track companies with growing teams that need health coverage renewals or upgrades.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
  },
};

const SAAS_TOOLTIPS: Record<string, Partial<Record<TooltipLocation, TooltipConfig>>> = {
  'enterprise-sales': {
    dashboard_hero: {
      id: 'saas-ent-dashboard',
      title: 'Enterprise SaaS Intelligence',
      content: 'Identify companies with buying intent based on funding, tech stack changes, and growth.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
    dashboard_signals: {
      id: 'saas-ent-signals',
      title: 'Buying Signals',
      content: 'Companies showing purchase intent - new funding, hiring, tech evaluations.',
      placement: 'right',
      trigger: 'auto',
      priority: 2,
    },
    siva_input: {
      id: 'saas-ent-siva',
      title: 'Find Enterprise Deals',
      content: 'Ask "Which companies raised Series B?" or "Show me enterprises evaluating CRM tools".',
      placement: 'top',
      trigger: 'auto',
      priority: 3,
    },
  },
  'smb-sales': {
    dashboard_hero: {
      id: 'saas-smb-dashboard',
      title: 'SMB Sales Intelligence',
      content: 'Find fast-growing SMBs ready to adopt new tools.',
      placement: 'bottom',
      trigger: 'auto',
      priority: 1,
    },
  },
};

// =============================================================================
// Tooltip Registry
// =============================================================================

const TOOLTIP_REGISTRY: Record<Vertical, Record<string, Partial<Record<TooltipLocation, TooltipConfig>>>> = {
  'banking': BANKING_TOOLTIPS,
  'recruitment': RECRUITMENT_TOOLTIPS,
  'real-estate': REAL_ESTATE_TOOLTIPS,
  'insurance': INSURANCE_TOOLTIPS,
  'saas-sales': SAAS_TOOLTIPS,
};

// =============================================================================
// Journey Stage Modifications
// =============================================================================

function getJourneyStageModifier(stage: TooltipContext['journeyStage']): (tooltip: TooltipConfig) => TooltipConfig {
  switch (stage) {
    case 'onboarding':
      return (tooltip) => ({
        ...tooltip,
        trigger: 'auto',
        persistent: true,
        dismissible: true,
      });

    case 'first-use':
      return (tooltip) => ({
        ...tooltip,
        trigger: 'auto',
        persistent: false,
        delay: 500,
      });

    case 'learning':
      return (tooltip) => ({
        ...tooltip,
        trigger: 'hover',
        persistent: false,
      });

    case 'experienced':
      return (tooltip) => ({
        ...tooltip,
        trigger: 'hover',
        delay: 1000, // Longer delay for experienced users
      });

    default:
      return (tooltip) => tooltip;
  }
}

// =============================================================================
// Main Tooltip API
// =============================================================================

export function getTooltip(
  location: TooltipLocation,
  context: TooltipContext
): TooltipConfig | null {
  // Get vertical-specific tooltips
  const verticalTooltips = TOOLTIP_REGISTRY[context.vertical];
  if (!verticalTooltips) return null;

  // Get sub-vertical specific tooltips
  const subVerticalTooltips = verticalTooltips[context.subVertical];
  if (!subVerticalTooltips) return null;

  // Get tooltip for location
  const tooltip = subVerticalTooltips[location];
  if (!tooltip) return null;

  // Apply journey stage modifier
  const modifier = getJourneyStageModifier(context.journeyStage);
  const modifiedTooltip = modifier(tooltip);

  // Check if already dismissed
  if (isTooltipDismissed(tooltip.id)) {
    return null;
  }

  return modifiedTooltip;
}

export function getTooltipsForPage(
  page: 'dashboard' | 'discovery' | 'signals' | 'siva' | 'settings',
  context: TooltipContext
): TooltipConfig[] {
  const locationPrefixes: Record<string, string> = {
    'dashboard': 'dashboard_',
    'discovery': 'discovery_',
    'signals': 'signals_',
    'siva': 'siva_',
    'settings': 'settings_',
  };

  const prefix = locationPrefixes[page];
  const locations = Object.keys(TOOLTIP_REGISTRY[context.vertical]?.[context.subVertical] || {});

  const tooltips: TooltipConfig[] = [];

  for (const location of locations) {
    if (location.startsWith(prefix)) {
      const tooltip = getTooltip(location as TooltipLocation, context);
      if (tooltip) {
        tooltips.push(tooltip);
      }
    }
  }

  // Sort by priority
  return tooltips.sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

// =============================================================================
// Tooltip State Management
// =============================================================================

const DISMISSED_KEY = 'dismissed_tooltips';

function isTooltipDismissed(tooltipId: string): boolean {
  if (typeof window === 'undefined') return false;

  const dismissed = localStorage.getItem(DISMISSED_KEY);
  if (!dismissed) return false;

  const dismissedList: string[] = JSON.parse(dismissed);
  return dismissedList.includes(tooltipId);
}

export function dismissTooltip(tooltipId: string): void {
  if (typeof window === 'undefined') return;

  const dismissed = localStorage.getItem(DISMISSED_KEY);
  const dismissedList: string[] = dismissed ? JSON.parse(dismissed) : [];

  if (!dismissedList.includes(tooltipId)) {
    dismissedList.push(tooltipId);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedList));
  }

  // Track dismissal for analytics
  trackTooltipDismissal(tooltipId);
}

export function resetTooltips(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DISMISSED_KEY);
  }
}

// =============================================================================
// Analytics
// =============================================================================

async function trackTooltipDismissal(tooltipId: string): Promise<void> {
  try {
    await fetch('/api/analytics/tooltip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'tooltip_dismissed',
        tooltipId,
        timestamp: new Date().toISOString(),
      }),
    }).catch((error) => {
      // S352: Log analytics errors (non-blocking)
      console.warn('[Tooltip Analytics] Failed to track dismiss:', error);
    });
  } catch (error) {
    // S352: Log all errors instead of silent failure
    console.warn('[Tooltip Analytics] Failed to track dismiss:', error);
  }
}

export async function trackTooltipView(tooltipId: string): Promise<void> {
  try {
    await fetch('/api/analytics/tooltip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'tooltip_viewed',
        tooltipId,
        timestamp: new Date().toISOString(),
      }),
    }).catch((error) => {
      // S352: Log analytics errors (non-blocking)
      console.warn('[Tooltip Analytics] Failed to track view:', error);
    });
  } catch (error) {
    // S352: Log all errors instead of silent failure
    console.warn('[Tooltip Analytics] Failed to track view:', error);
  }
}

export default {
  getTooltip,
  getTooltipsForPage,
  dismissTooltip,
  resetTooltips,
  trackTooltipView,
};
