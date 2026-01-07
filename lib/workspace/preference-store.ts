/**
 * Preference Store - S377: Silence, TTL, Rehydration
 *
 * Persists user preferences from NL parsing (S376).
 *
 * WORKSPACE UX (LOCKED):
 * - Preferences are NL-driven, not toggle-based
 * - Accept/reject flow with explicit feedback
 * - No Settings page (preferences live in workspace)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PreferenceCategory } from './preference-parser';

// =============================================================================
// TYPES
// =============================================================================

export interface StoredPreference {
  key: string;
  value: unknown;
  category: PreferenceCategory;
  originalText: string;
  updatedAt: Date;
}

interface PreferenceStore {
  // State
  preferences: Record<string, StoredPreference>;

  // Actions
  setPreference: (
    key: string,
    value: unknown,
    category: PreferenceCategory,
    originalText: string
  ) => void;
  removePreference: (key: string) => void;

  // Queries
  getPreference: <T = unknown>(key: string) => T | undefined;
  getPreferencesByCategory: (category: PreferenceCategory) => StoredPreference[];
  getAllPreferences: () => StoredPreference[];

  // Lifecycle
  clear: () => void;
}

// =============================================================================
// DEFAULT PREFERENCES
// =============================================================================

const DEFAULT_PREFERENCES: Record<string, StoredPreference> = {
  email_frequency: {
    key: 'email_frequency',
    value: 'weekly',
    category: 'notification',
    originalText: 'System default',
    updatedAt: new Date(),
  },
  email_enabled: {
    key: 'email_enabled',
    value: true,
    category: 'notification',
    originalText: 'System default',
    updatedAt: new Date(),
  },
  theme: {
    key: 'theme',
    value: 'light',
    category: 'display',
    originalText: 'System default',
    updatedAt: new Date(),
  },
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const usePreferenceStore = create<PreferenceStore>()(
  devtools(
    persist(
      (set, get) => ({
        preferences: { ...DEFAULT_PREFERENCES },

        // =============================================================================
        // ACTIONS
        // =============================================================================

        setPreference: (key, value, category, originalText) => {
          const preference: StoredPreference = {
            key,
            value,
            category,
            originalText,
            updatedAt: new Date(),
          };

          set(state => ({
            preferences: {
              ...state.preferences,
              [key]: preference,
            },
          }));

          console.log('[PreferenceStore] Preference set:', key, '=', value);
        },

        removePreference: (key) => {
          set(state => {
            const { [key]: removed, ...remaining } = state.preferences;
            return { preferences: remaining };
          });
          console.log('[PreferenceStore] Preference removed:', key);
        },

        // =============================================================================
        // QUERIES
        // =============================================================================

        getPreference: <T = unknown>(key: string): T | undefined => {
          const pref = get().preferences[key];
          return pref?.value as T | undefined;
        },

        getPreferencesByCategory: (category) => {
          return Object.values(get().preferences).filter(
            p => p.category === category
          );
        },

        getAllPreferences: () => {
          return Object.values(get().preferences);
        },

        // =============================================================================
        // LIFECYCLE
        // =============================================================================

        clear: () => {
          set({ preferences: { ...DEFAULT_PREFERENCES } });
        },
      }),
      {
        name: 'preference-store',
        // Serialize/deserialize dates
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const data = JSON.parse(str);
            // Convert date strings back to Date objects
            if (data.state?.preferences) {
              for (const key of Object.keys(data.state.preferences)) {
                data.state.preferences[key].updatedAt = new Date(
                  data.state.preferences[key].updatedAt
                );
              }
            }
            return data;
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    { name: 'PreferenceStore' }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectAllPreferences = (state: PreferenceStore) =>
  state.getAllPreferences();

export const selectPreferenceCount = (state: PreferenceStore) =>
  Object.keys(state.preferences).length;

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Get a specific preference with type safety
 */
export function usePreference<T = unknown>(key: string): T | undefined {
  return usePreferenceStore((state) => state.preferences[key]?.value as T | undefined);
}

/**
 * Get email preferences
 */
export function useEmailPreferences() {
  const frequency = usePreferenceStore((state) =>
    state.preferences['email_frequency']?.value as string | undefined
  );
  const enabled = usePreferenceStore((state) =>
    state.preferences['email_enabled']?.value as boolean | undefined
  );

  return {
    frequency: frequency ?? 'weekly',
    enabled: enabled ?? true,
  };
}

/**
 * Get display preferences
 */
export function useDisplayPreferences() {
  const theme = usePreferenceStore((state) =>
    state.preferences['theme']?.value as string | undefined
  );

  return {
    theme: theme ?? 'light',
  };
}

/**
 * Get lead filter preferences
 */
export function useLeadFilterPreferences() {
  const minConfidence = usePreferenceStore((state) =>
    state.preferences['min_confidence']?.value as number | undefined
  );
  const regionFilter = usePreferenceStore((state) =>
    state.preferences['region_filter']?.value as string | undefined
  );

  return {
    minConfidence: minConfidence ?? 0,
    regionFilter: regionFilter ?? null,
  };
}
