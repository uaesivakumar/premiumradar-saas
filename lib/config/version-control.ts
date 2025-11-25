/**
 * Version Control
 *
 * Track and manage application versions, release notes,
 * and version history.
 */

import { create } from 'zustand';
import type { AppVersion, VersionHistory, VersionComparison } from './types';

// ============================================================
// CURRENT VERSION
// ============================================================

export const CURRENT_VERSION: AppVersion = {
  version: '0.5.0',
  releasedAt: new Date('2025-11-25'),
  releaseNotes: 'Stream 5: Admin & Configuration features',
  features: [
    'Tenant Impersonation Mode',
    'User Management (Ban/Delete/Disable)',
    'All Tenants Viewer',
    'Tenant Table Component',
    'Version Control System',
    'Feature Flag Toggles',
    'Global OS Settings',
    'Global Scoring Parameters',
    'Vertical Registry',
  ],
  breaking: false,
};

// ============================================================
// VERSION HISTORY
// ============================================================

const VERSION_HISTORY: AppVersion[] = [
  {
    version: '0.4.0',
    releasedAt: new Date('2025-11-24'),
    releaseNotes: 'Stream 4: Billing & Subscriptions',
    features: [
      'Stripe Integration',
      'Checkout Flow',
      'Billing Portal',
      'Webhooks',
      'Metered Usage',
      'Seat-Based Billing',
      'Dunning Emails',
    ],
    breaking: false,
  },
  {
    version: '0.3.0',
    releasedAt: new Date('2025-11-23'),
    releaseNotes: 'Stream 3: Multi-Tenant Architecture',
    features: [
      'Workspace Management',
      'Team Management',
      'RBAC System',
      'Tenant Isolation',
      'API Key Management',
      'Rate Limiting',
      'Activity Boundaries',
    ],
    breaking: false,
  },
  {
    version: '0.2.0',
    releasedAt: new Date('2025-11-22'),
    releaseNotes: 'Stream 2: Discovery & Analysis',
    features: [
      'Domain Analysis',
      'Bulk Analysis',
      'Portfolio Management',
      'Alerts System',
      'Export Functions',
    ],
    breaking: false,
  },
  {
    version: '0.1.0',
    releasedAt: new Date('2025-11-21'),
    releaseNotes: 'Stream 1: Foundation & Security',
    features: [
      'Core UI Shell',
      'Authentication',
      'Security Sprints S1-S6',
      'Prompt Injection Firewall',
      'WAF Integration',
    ],
    breaking: false,
  },
];

// ============================================================
// VERSION STORE
// ============================================================

interface VersionStore {
  current: AppVersion;
  history: AppVersion[];
  isUpdateAvailable: boolean;
  latestAvailable: AppVersion | null;

  checkForUpdates: () => Promise<void>;
  getVersionHistory: () => AppVersion[];
  compareVersions: (from: string, to: string) => VersionComparison | null;
}

export const useVersionStore = create<VersionStore>((set, get) => ({
  current: CURRENT_VERSION,
  history: VERSION_HISTORY,
  isUpdateAvailable: false,
  latestAvailable: null,

  checkForUpdates: async () => {
    // In production, this would call the API to check for updates
    // For now, simulate no updates available
    set({ isUpdateAvailable: false, latestAvailable: null });
  },

  getVersionHistory: () => {
    return [get().current, ...get().history];
  },

  compareVersions: (from, to) => {
    const all = [get().current, ...get().history];
    const fromVersion = all.find((v) => v.version === from);
    const toVersion = all.find((v) => v.version === to);

    if (!fromVersion || !toVersion) return null;

    // Find versions between from and to
    const fromIndex = all.findIndex((v) => v.version === from);
    const toIndex = all.findIndex((v) => v.version === to);

    const minIndex = Math.min(fromIndex, toIndex);
    const maxIndex = Math.max(fromIndex, toIndex);

    const versionsInRange = all.slice(minIndex, maxIndex + 1);

    const allFeatures = versionsInRange.flatMap((v) => v.features);
    const breakingChanges = versionsInRange
      .filter((v) => v.breaking)
      .map((v) => `Version ${v.version}: ${v.releaseNotes}`);

    return {
      from,
      to,
      changesCount: allFeatures.length,
      features: allFeatures,
      fixes: [],
      breaking: breakingChanges,
    };
  },
}));

// ============================================================
// VERSION UTILITIES
// ============================================================

/**
 * Parse semantic version string
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major: major || 0, minor: minor || 0, patch: patch || 0 };
}

/**
 * Compare two versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersionStrings(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vA.major < vB.major ? -1 : 1;
  if (vA.minor !== vB.minor) return vA.minor < vB.minor ? -1 : 1;
  if (vA.patch !== vB.patch) return vA.patch < vB.patch ? -1 : 1;
  return 0;
}

/**
 * Check if version A is greater than version B
 */
export function isNewerVersion(a: string, b: string): boolean {
  return compareVersionStrings(a, b) > 0;
}

/**
 * Check if version is compatible with minimum required version
 */
export function isCompatibleVersion(version: string, minRequired: string): boolean {
  return compareVersionStrings(version, minRequired) >= 0;
}

/**
 * Format version for display
 */
export function formatVersion(version: AppVersion): string {
  return `v${version.version} (${version.releasedAt.toLocaleDateString()})`;
}

/**
 * Get version badge color based on recency
 */
export function getVersionBadgeColor(version: AppVersion): string {
  const daysSinceRelease = Math.floor(
    (Date.now() - version.releasedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceRelease <= 7) return 'green';
  if (daysSinceRelease <= 30) return 'blue';
  if (daysSinceRelease <= 90) return 'yellow';
  return 'gray';
}

/**
 * Generate changelog markdown
 */
export function generateChangelog(versions: AppVersion[]): string {
  return versions
    .map((v) => {
      const features = v.features.map((f) => `- ${f}`).join('\n');
      const breaking = v.breaking ? '\n\n**BREAKING CHANGES**' : '';

      return `## ${v.version} (${v.releasedAt.toISOString().split('T')[0]})\n\n${v.releaseNotes}\n\n### Features\n\n${features}${breaking}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Get release notes summary
 */
export function getReleaseNotesSummary(version: AppVersion): string {
  const featureCount = version.features.length;
  return `${version.releaseNotes} (${featureCount} feature${featureCount !== 1 ? 's' : ''})`;
}
