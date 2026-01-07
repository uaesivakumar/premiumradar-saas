'use client';

/**
 * LeftRail - S372: Dynamic Left Rail
 *
 * WORKSPACE UX (LOCKED):
 * - Sections appear/disappear based on state
 * - Clicking FILTERS the main surface (no navigation)
 * - No empty sections ever visible
 * - No disabled items
 *
 * Sections:
 * - TODAY: Always visible
 * - SAVED LEADS: Show if count > 0
 * - FOLLOW-UPS: Show if count > 0
 * - REPORTS: Show if count > 0
 * - PREFERENCES: Always at bottom
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Bookmark,
  Clock,
  FileText,
  Settings,
} from 'lucide-react';
import { useCardStore, CardFilter } from '@/lib/stores/card-store';
import { useLeftRailStore, LeftRailSection as SectionType } from '@/lib/stores/left-rail-store';
import { LeftRailSection } from './LeftRailSection';
import { LeftRailItem } from './LeftRailItem';

export function LeftRail() {
  const { activeFilter, setFilter, cards } = useCardStore();
  const { counts, getSectionVisibility, getSectionCount } = useLeftRailStore();
  const visibility = getSectionVisibility();

  // Helper to check if a section is active
  const isActive = (filterType: CardFilter['type']) => activeFilter.type === filterType;

  // Handle section click - filter cards, don't navigate
  const handleSectionClick = (section: SectionType, filterType: CardFilter['type']) => {
    setFilter({ type: filterType } as CardFilter);
  };

  return (
    <nav className="flex flex-col h-full py-2">
      {/* Main Sections */}
      <div className="flex-1 space-y-4 px-2">
        {/* TODAY - Always visible */}
        <LeftRailSection visible={visibility.today}>
          <LeftRailItem
            icon={Calendar}
            label="Today"
            isActive={isActive('today')}
            onClick={() => handleSectionClick('today', 'today')}
          />
        </LeftRailSection>

        {/* SAVED LEADS - Show if count > 0 */}
        <LeftRailSection visible={visibility['saved-leads']}>
          <LeftRailItem
            icon={Bookmark}
            label="Saved Leads"
            count={getSectionCount('saved-leads')}
            isActive={isActive('saved-leads')}
            onClick={() => handleSectionClick('saved-leads', 'saved-leads')}
          />
        </LeftRailSection>

        {/* FOLLOW-UPS - Show if count > 0 */}
        <LeftRailSection visible={visibility['follow-ups']}>
          <LeftRailItem
            icon={Clock}
            label="Follow-ups"
            count={getSectionCount('follow-ups')}
            isActive={isActive('follow-ups')}
            onClick={() => handleSectionClick('follow-ups', 'follow-ups')}
          />
        </LeftRailSection>

        {/* REPORTS - Show if count > 0 */}
        <LeftRailSection visible={visibility.reports}>
          <LeftRailItem
            icon={FileText}
            label="Reports"
            count={getSectionCount('reports')}
            isActive={isActive('reports')}
            onClick={() => handleSectionClick('reports', 'reports')}
          />
        </LeftRailSection>
      </div>

      {/* Spacer */}
      <div className="flex-shrink-0 border-t border-white/5 my-2" />

      {/* PREFERENCES - Always at bottom */}
      <div className="flex-shrink-0 px-2">
        <LeftRailSection visible={visibility.preferences}>
          <LeftRailItem
            icon={Settings}
            label="Preferences"
            isActive={false} // Preferences doesn't filter cards
            onClick={() => {
              // S376: Will open preferences surface
              console.log('[LeftRail] Preferences clicked - pending S376');
            }}
          />
        </LeftRailSection>
      </div>
    </nav>
  );
}

export default LeftRail;
