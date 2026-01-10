'use client';

/**
 * LeftRail - S390: Static Sidebar Structure
 *
 * SIDEBAR INVARIANT (LOCKED):
 * - Sidebar structure is STATIC
 * - Menu items NEVER disappear
 * - Counts are DYNAMIC
 * - If count = 0 → show (0), never hide
 *
 * Sections (ALWAYS VISIBLE):
 * - COMPANIES: Saved, Actioned, Ignored, Unactioned
 * - LEADS: Saved, Actioned, Ignored, Unactioned
 * - REPORTS: Performance, Conversion, Pipeline
 * - ACTIVITIES: Today, Yesterday, This Week, Last Week, This Month, Custom
 *
 * S390 CRITICAL: Users must ALWAYS know where their data lives.
 * Empty states are better than disappearing menus.
 */

import React, { useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  Activity,
  Bookmark,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  GitBranch,
  Calendar,
  CalendarDays,
  Settings,
  Trash2,
} from 'lucide-react';
import { useCardStore } from '@/lib/stores/card-store';
import { useDiscoveryContextStore } from '@/lib/workspace/discovery-context';
import {
  useLeftRailStore,
  SIDEBAR_SCHEMA,
  SidebarSection,
} from '@/lib/stores/left-rail-store';
import { LeftRailSection } from './LeftRailSection';
import { LeftRailItem } from './LeftRailItem';

// =============================================================================
// ITEM LABELS AND ICONS
// =============================================================================

import type { LucideIcon } from 'lucide-react';

const ITEM_CONFIG: Record<string, { label: string; icon?: LucideIcon }> = {
  // Companies / Leads items
  saved: { label: 'Saved', icon: Bookmark },
  actioned: { label: 'Actioned', icon: CheckCircle },
  ignored: { label: 'Skipped', icon: XCircle },  // S390: Renamed from Ignored
  unactioned: { label: 'Unactioned', icon: Clock },
  // Reports items
  performance: { label: 'Performance', icon: TrendingUp },
  conversion: { label: 'Conversion', icon: BarChart3 },
  pipeline: { label: 'Pipeline', icon: GitBranch },
  // Activities items
  today: { label: 'Today', icon: Calendar },
  yesterday: { label: 'Yesterday', icon: CalendarDays },
  this_week: { label: 'This Week', icon: CalendarDays },
  last_week: { label: 'Last Week', icon: CalendarDays },
  this_month: { label: 'This Month', icon: CalendarDays },
  custom: { label: 'Custom', icon: CalendarDays },
};

const SECTION_ICONS: Record<SidebarSection, LucideIcon> = {
  companies: Building2,
  leads: Users,
  reports: FileText,
  activities: Activity,
};

// =============================================================================
// COMPONENT
// =============================================================================

export function LeftRail() {
  const { setActiveFilter, getCount, isActive, updateCounts } = useLeftRailStore();
  const cards = useCardStore((s) => s.cards);
  const { clear: clearCards } = useCardStore();
  const resetDiscovery = useDiscoveryContextStore((s) => s.reset);

  // S390: Sync counts from CardStore
  // This derives counts from actual card data
  useEffect(() => {
    // Count leads by status
    const signalCards = cards.filter((c) => c.type === 'signal');
    const savedCount = signalCards.filter((c) => c.status === 'saved').length;
    const actionedCount = signalCards.filter((c) => c.status === 'evaluating').length;
    const ignoredCount = signalCards.filter((c) => c.status === 'dismissed').length;
    const unactionedCount = signalCards.filter((c) => c.status === 'active').length;

    // Update leads counts
    updateCounts('leads', {
      saved: savedCount,
      actioned: actionedCount,
      ignored: ignoredCount,
      unactioned: unactionedCount,
    });

    // For now, companies mirrors leads (same entities)
    updateCounts('companies', {
      saved: savedCount,
      actioned: actionedCount,
      ignored: ignoredCount,
      unactioned: unactionedCount,
    });

    // Count activities by time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const getCardDate = (c: typeof cards[0]) => {
      return c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
    };

    updateCounts('activities', {
      today: signalCards.filter((c) => getCardDate(c) >= today).length,
      yesterday: signalCards.filter((c) => {
        const d = getCardDate(c);
        return d >= yesterday && d < today;
      }).length,
      this_week: signalCards.filter((c) => getCardDate(c) >= thisWeekStart).length,
      last_week: signalCards.filter((c) => {
        const d = getCardDate(c);
        return d >= lastWeekStart && d < thisWeekStart;
      }).length,
      this_month: signalCards.filter((c) => getCardDate(c) >= thisMonthStart).length,
      custom: 0,
    });

    // Reports - placeholder counts
    updateCounts('reports', {
      performance: 0,
      conversion: 0,
      pipeline: savedCount, // Pipeline is saved leads
    });
  }, [cards, updateCounts]);

  // Handle item click - filters the workspace
  const handleItemClick = (section: SidebarSection, item: string) => {
    setActiveFilter({ section, item } as any);
  };

  // S381: Handle clear workspace
  const handleClearWorkspace = () => {
    clearCards();
    resetDiscovery();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('card-store');
    }
    console.log('[LeftRail] Workspace cleared');
  };

  return (
    <nav className="flex flex-col h-full py-2 overflow-y-auto">
      {/* Main Sections - ALWAYS VISIBLE */}
      <div className="flex-1 space-y-3 px-2">
        {/* S390: Iterate over STATIC schema - sections never disappear */}
        {(Object.keys(SIDEBAR_SCHEMA) as SidebarSection[]).map((sectionKey) => {
          const section = SIDEBAR_SCHEMA[sectionKey];
          const SectionIcon = SECTION_ICONS[sectionKey];

          return (
            <LeftRailSection key={sectionKey} title={section.label}>
              {section.items.map((item) => {
                const config = ITEM_CONFIG[item] || { label: item };
                const count = getCount(sectionKey, item);
                const active = isActive(sectionKey, item);

                return (
                  <LeftRailItem
                    key={item}
                    icon={config.icon}
                    label={config.label}
                    count={count}
                    isActive={active}
                    isZero={count === 0}
                    onClick={() => handleItemClick(sectionKey, item)}
                  />
                );
              })}
            </LeftRailSection>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-shrink-0 border-t border-white/5 my-2" />

      {/* Bottom Actions - ALWAYS VISIBLE */}
      <div className="flex-shrink-0 px-2 space-y-1">
        <LeftRailItem
          icon={Settings}
          label="Preferences"
          isActive={false}
          onClick={() => {
            console.log('[LeftRail] Preferences clicked');
          }}
        />
        <LeftRailItem
          icon={Trash2}
          label="Clear"
          isActive={false}
          onClick={handleClearWorkspace}
        />
      </div>
    </nav>
  );
}

export default LeftRail;
