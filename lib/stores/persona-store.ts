/**
 * Persona Store - S47
 *
 * Zustand store for persona configuration and tone application.
 * DOES NOT modify siva-store.ts - standalone store.
 */

import { create } from 'zustand';
import type {
  PersonaConfig,
  TonePack,
  PersonalizationEntry,
  ToneType,
  OutreachToneType,
  PersonaApplicationResult,
} from '@/lib/intelligence/persona/types';
import {
  createDefaultPersona,
  applyPersona,
  getTonePack,
  getAllTonePacks,
  suggestTone,
} from '@/lib/intelligence/persona';

// =============================================================================
// Store Types
// =============================================================================

interface PersonaStore {
  // Current configuration
  activePersona: PersonaConfig;
  activeTonePack: TonePack | null;

  // Available options
  personas: Map<string, PersonaConfig>;
  tonePacks: Map<string, TonePack>;

  // Personalization
  personalization: PersonalizationEntry | null;

  // Processing state
  isApplying: boolean;
  error: string | null;

  // Actions
  setActivePersona: (personaId: string) => void;
  setActiveTone: (tone: ToneType | OutreachToneType) => void;
  createPersona: (config: Omit<PersonaConfig, 'id' | 'createdAt' | 'updatedAt'>) => PersonaConfig;
  updatePersona: (personaId: string, updates: Partial<PersonaConfig>) => void;
  deletePersona: (personaId: string) => void;

  // Content transformation
  applyToContent: (
    content: string,
    context?: {
      isOutreach?: boolean;
      agentType?: string;
      intentType?: string;
    }
  ) => PersonaApplicationResult;

  // Tone suggestion
  getSuggestedTone: (context: {
    isOutreach: boolean;
    recipientRole?: string;
    urgency?: 'low' | 'medium' | 'high';
    relationship?: 'new' | 'warm' | 'existing';
  }) => ToneType | OutreachToneType;

  // Personalization
  setPersonalization: (entry: PersonalizationEntry) => void;
  clearPersonalization: () => void;

  // Reset
  reset: () => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const usePersonaStore = create<PersonaStore>((set, get) => {
  // Initialize with defaults
  const defaultPersona = createDefaultPersona();
  const allTonePacks = getAllTonePacks();
  const tonePacksMap = new Map<string, TonePack>();
  for (const pack of allTonePacks) {
    tonePacksMap.set(pack.id, pack);
  }

  return {
    // Initial state
    activePersona: defaultPersona,
    activeTonePack: getTonePack(defaultPersona.baseTone),
    personas: new Map([[defaultPersona.id, defaultPersona]]),
    tonePacks: tonePacksMap,
    personalization: null,
    isApplying: false,
    error: null,

    // Set active persona
    setActivePersona: (personaId) => {
      const persona = get().personas.get(personaId);
      if (persona) {
        set({
          activePersona: persona,
          activeTonePack: getTonePack(persona.baseTone),
        });
      } else {
        set({ error: `Persona not found: ${personaId}` });
      }
    },

    // Set active tone
    setActiveTone: (tone) => {
      const pack = getTonePack(tone);
      if (pack) {
        set({ activeTonePack: pack });
      } else {
        set({ error: `Tone pack not found: ${tone}` });
      }
    },

    // Create new persona
    createPersona: (config) => {
      const persona: PersonaConfig = {
        ...config,
        id: `persona-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => {
        const personas = new Map(state.personas);
        personas.set(persona.id, persona);
        return { personas };
      });

      return persona;
    },

    // Update persona
    updatePersona: (personaId, updates) => {
      set((state) => {
        const personas = new Map(state.personas);
        const existing = personas.get(personaId);
        if (existing) {
          const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
          };
          personas.set(personaId, updated);

          // Update active if this is the active persona
          if (state.activePersona.id === personaId) {
            return {
              personas,
              activePersona: updated,
              activeTonePack: getTonePack(updated.baseTone),
            };
          }
        }
        return { personas };
      });
    },

    // Delete persona
    deletePersona: (personaId) => {
      set((state) => {
        // Can't delete the active persona
        if (state.activePersona.id === personaId) {
          return { error: 'Cannot delete the active persona' };
        }

        // Can't delete the default persona
        const persona = state.personas.get(personaId);
        if (persona?.isDefault) {
          return { error: 'Cannot delete the default persona' };
        }

        const personas = new Map(state.personas);
        personas.delete(personaId);
        return { personas, error: null };
      });
    },

    // Apply persona to content
    applyToContent: (content, context) => {
      set({ isApplying: true, error: null });

      try {
        const result = applyPersona(content, get().activePersona, context);
        set({ isApplying: false });
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to apply persona';
        set({ isApplying: false, error: errorMessage });
        return {
          original: content,
          modified: content,
          appliedRules: [],
          toneMetrics: {
            formality: 0.5,
            brevity: 0.5,
            warmth: 0.5,
            technicality: 0.5,
            readability: 0.5,
            wordCount: content.split(/\s+/).length,
          },
        };
      }
    },

    // Get suggested tone
    getSuggestedTone: (context) => {
      return suggestTone(context);
    },

    // Set personalization
    setPersonalization: (entry) => {
      set({ personalization: entry });
    },

    // Clear personalization
    clearPersonalization: () => {
      set({ personalization: null });
    },

    // Reset store
    reset: () => {
      const defaultPersona = createDefaultPersona();
      set({
        activePersona: defaultPersona,
        activeTonePack: getTonePack(defaultPersona.baseTone),
        personas: new Map([[defaultPersona.id, defaultPersona]]),
        personalization: null,
        isApplying: false,
        error: null,
      });
    },
  };
});

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select current tone info
 */
export const selectCurrentTone = (state: PersonaStore) => {
  return {
    baseTone: state.activePersona.baseTone,
    outreachTone: state.activePersona.outreachTone,
    personaName: state.activePersona.name,
  };
};

/**
 * Select available personas
 */
export const selectAvailablePersonas = (state: PersonaStore) => {
  return Array.from(state.personas.values()).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    isDefault: p.isDefault,
  }));
};

/**
 * Select tone pack options
 */
export const selectTonePackOptions = (state: PersonaStore) => {
  return Array.from(state.tonePacks.values()).map(p => ({
    id: p.id,
    name: p.name,
    tone: p.tone,
  }));
};
