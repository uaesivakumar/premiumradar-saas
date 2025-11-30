/**
 * Journey Builder Store
 * Sprint S62: Journey Builder UI
 *
 * State management for the visual journey builder:
 * - Canvas state (zoom, pan, selection)
 * - Journey definition (steps, transitions)
 * - Preview mode
 * - Audit trail
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  JourneyDefinition,
  StepNode,
  Transition,
  CanvasState,
  PreviewState,
  AuditEntry,
  StepType,
  Position,
  ConditionGroup,
  AITransparency,
} from './types';
import { STEP_TEMPLATES } from './types';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface JourneyBuilderState {
  // Journey
  journey: JourneyDefinition | null;
  isDirty: boolean;

  // Canvas
  canvas: CanvasState;

  // Preview
  preview: PreviewState;

  // Audit
  auditLog: AuditEntry[];

  // AI Transparency
  aiTransparency: AITransparency | null;

  // Actions - Journey
  createJourney: (name: string, userId: string) => void;
  loadJourney: (journey: JourneyDefinition) => void;
  saveJourney: () => JourneyDefinition | null;
  clearJourney: () => void;

  // Actions - Steps
  addStep: (type: StepType, position: Position, userId: string) => string;
  updateStep: (stepId: string, updates: Partial<StepNode>, userId: string) => void;
  removeStep: (stepId: string, userId: string) => void;
  moveStep: (stepId: string, position: Position) => void;

  // Actions - Transitions
  addTransition: (fromId: string, toId: string, userId: string) => string;
  updateTransition: (transitionId: string, updates: Partial<Transition>, userId: string) => void;
  removeTransition: (transitionId: string, userId: string) => void;

  // Actions - Canvas
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  selectNode: (nodeId: string | null) => void;
  selectTransition: (transitionId: string | null) => void;
  setDragging: (isDragging: boolean) => void;
  startConnecting: (fromId: string) => void;
  endConnecting: () => void;

  // Actions - Preview
  startPreview: (mockData?: Record<string, unknown>) => void;
  stopPreview: () => void;
  advancePreview: () => void;
  setPreviewStepResult: (stepId: string, result: unknown) => void;

  // Actions - Import/Export
  exportToJSON: () => string;
  importFromJSON: (json: string, userId: string) => boolean;

  // Actions - Audit
  getAuditLog: () => AuditEntry[];
}

// =============================================================================
// HELPERS
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createAuditEntry(
  action: AuditEntry['action'],
  userId: string,
  details: Record<string, unknown>
): AuditEntry {
  return {
    id: generateId(),
    timestamp: new Date(),
    action,
    userId,
    details,
  };
}

// =============================================================================
// STORE
// =============================================================================

export const useJourneyBuilderStore = create<JourneyBuilderState>()(
  immer((set, get) => ({
    // Initial State
    journey: null,
    isDirty: false,
    canvas: {
      zoom: 1,
      panX: 0,
      panY: 0,
      selectedNodeId: null,
      selectedTransitionId: null,
      isDragging: false,
      isConnecting: false,
      connectingFromId: null,
    },
    preview: {
      isActive: false,
      currentStepId: null,
      executedSteps: [],
      stepResults: {},
      mockData: {},
    },
    auditLog: [],
    aiTransparency: null,

    // Journey Actions
    createJourney: (name, userId) => {
      set((state) => {
        const now = new Date();
        state.journey = {
          id: crypto.randomUUID(),
          name,
          version: 1,
          steps: [],
          transitions: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        };
        state.isDirty = false;
        state.auditLog.push(createAuditEntry('journey_created', userId, { name }));
      });
    },

    loadJourney: (journey) => {
      set((state) => {
        state.journey = journey;
        state.isDirty = false;
        state.canvas = {
          zoom: 1,
          panX: 0,
          panY: 0,
          selectedNodeId: null,
          selectedTransitionId: null,
          isDragging: false,
          isConnecting: false,
          connectingFromId: null,
        };
      });
    },

    saveJourney: () => {
      const { journey } = get();
      if (!journey) return null;

      set((state) => {
        if (state.journey) {
          state.journey.updatedAt = new Date();
          state.journey.version += 1;
          state.isDirty = false;
        }
      });

      return get().journey;
    },

    clearJourney: () => {
      set((state) => {
        state.journey = null;
        state.isDirty = false;
        state.canvas = {
          zoom: 1,
          panX: 0,
          panY: 0,
          selectedNodeId: null,
          selectedTransitionId: null,
          isDragging: false,
          isConnecting: false,
          connectingFromId: null,
        };
        state.preview = {
          isActive: false,
          currentStepId: null,
          executedSteps: [],
          stepResults: {},
          mockData: {},
        };
      });
    },

    // Step Actions
    addStep: (type, position, userId) => {
      const template = STEP_TEMPLATES.find((t) => t.type === type);
      if (!template) return '';

      const stepId = generateId();

      set((state) => {
        if (!state.journey) return;

        const newStep: StepNode = {
          id: stepId,
          type,
          label: template.label,
          description: template.description,
          position,
          config: { ...template.defaultConfig },
          inputs: [],
          outputs: [],
          icon: template.icon,
          color: template.color,
          isStart: state.journey.steps.length === 0,
          isEnd: false,
        };

        state.journey.steps.push(newStep);
        state.isDirty = true;
        state.auditLog.push(createAuditEntry('step_added', userId, { stepId, type }));
      });

      return stepId;
    },

    updateStep: (stepId, updates, userId) => {
      set((state) => {
        if (!state.journey) return;

        const stepIndex = state.journey.steps.findIndex((s: StepNode) => s.id === stepId);
        if (stepIndex === -1) return;

        Object.assign(state.journey.steps[stepIndex], updates);
        state.isDirty = true;
        state.auditLog.push(createAuditEntry('step_configured', userId, { stepId, updates }));
      });
    },

    removeStep: (stepId, userId) => {
      set((state) => {
        if (!state.journey) return;

        // Remove step
        state.journey.steps = state.journey.steps.filter((s: StepNode) => s.id !== stepId);

        // Remove related transitions
        state.journey.transitions = state.journey.transitions.filter(
          (t: Transition) => t.fromStepId !== stepId && t.toStepId !== stepId
        );

        // Clear selection if removed
        if (state.canvas.selectedNodeId === stepId) {
          state.canvas.selectedNodeId = null;
        }

        state.isDirty = true;
        state.auditLog.push(createAuditEntry('step_removed', userId, { stepId }));
      });
    },

    moveStep: (stepId, position) => {
      set((state) => {
        if (!state.journey) return;

        const step = state.journey.steps.find((s: StepNode) => s.id === stepId);
        if (step) {
          step.position = position;
          state.isDirty = true;
        }
      });
    },

    // Transition Actions
    addTransition: (fromId, toId, userId) => {
      const transitionId = generateId();

      set((state) => {
        if (!state.journey) return;

        // Check if transition already exists
        const exists = state.journey.transitions.some(
          (t: Transition) => t.fromStepId === fromId && t.toStepId === toId
        );
        if (exists) return;

        const newTransition: Transition = {
          id: transitionId,
          fromStepId: fromId,
          toStepId: toId,
          style: 'solid',
          priority: 0,
        };

        state.journey.transitions.push(newTransition);

        // Update step connections
        const fromStep = state.journey.steps.find((s: StepNode) => s.id === fromId);
        const toStep = state.journey.steps.find((s: StepNode) => s.id === toId);
        if (fromStep) fromStep.outputs.push(transitionId);
        if (toStep) toStep.inputs.push(transitionId);

        state.isDirty = true;
        state.auditLog.push(createAuditEntry('transition_added', userId, { fromId, toId }));
      });

      return transitionId;
    },

    updateTransition: (transitionId, updates, userId) => {
      set((state) => {
        if (!state.journey) return;

        const transition = state.journey.transitions.find((t: Transition) => t.id === transitionId);
        if (transition) {
          Object.assign(transition, updates);
          state.isDirty = true;
          state.auditLog.push(
            createAuditEntry('transition_added', userId, { transitionId, updates })
          );
        }
      });
    },

    removeTransition: (transitionId, userId) => {
      set((state) => {
        if (!state.journey) return;

        const transition = state.journey.transitions.find((t: Transition) => t.id === transitionId);
        if (!transition) return;

        // Remove from steps
        const fromStep = state.journey.steps.find((s: StepNode) => s.id === transition.fromStepId);
        const toStep = state.journey.steps.find((s: StepNode) => s.id === transition.toStepId);
        if (fromStep) {
          fromStep.outputs = fromStep.outputs.filter((id: string) => id !== transitionId);
        }
        if (toStep) {
          toStep.inputs = toStep.inputs.filter((id: string) => id !== transitionId);
        }

        // Remove transition
        state.journey.transitions = state.journey.transitions.filter(
          (t: Transition) => t.id !== transitionId
        );

        // Clear selection if removed
        if (state.canvas.selectedTransitionId === transitionId) {
          state.canvas.selectedTransitionId = null;
        }

        state.isDirty = true;
        state.auditLog.push(createAuditEntry('transition_removed', userId, { transitionId }));
      });
    },

    // Canvas Actions
    setZoom: (zoom) => {
      set((state) => {
        state.canvas.zoom = Math.max(0.1, Math.min(3, zoom));
      });
    },

    setPan: (x, y) => {
      set((state) => {
        state.canvas.panX = x;
        state.canvas.panY = y;
      });
    },

    selectNode: (nodeId) => {
      set((state) => {
        state.canvas.selectedNodeId = nodeId;
        state.canvas.selectedTransitionId = null;
      });
    },

    selectTransition: (transitionId) => {
      set((state) => {
        state.canvas.selectedTransitionId = transitionId;
        state.canvas.selectedNodeId = null;
      });
    },

    setDragging: (isDragging) => {
      set((state) => {
        state.canvas.isDragging = isDragging;
      });
    },

    startConnecting: (fromId) => {
      set((state) => {
        state.canvas.isConnecting = true;
        state.canvas.connectingFromId = fromId;
      });
    },

    endConnecting: () => {
      set((state) => {
        state.canvas.isConnecting = false;
        state.canvas.connectingFromId = null;
      });
    },

    // Preview Actions
    startPreview: (mockData = {}) => {
      set((state) => {
        if (!state.journey || state.journey.steps.length === 0) return;

        const startStep = state.journey.steps.find((s: StepNode) => s.isStart);
        state.preview = {
          isActive: true,
          currentStepId: startStep?.id || state.journey.steps[0].id,
          executedSteps: [],
          stepResults: {},
          mockData,
        };
      });
    },

    stopPreview: () => {
      set((state) => {
        state.preview = {
          isActive: false,
          currentStepId: null,
          executedSteps: [],
          stepResults: {},
          mockData: {},
        };
      });
    },

    advancePreview: () => {
      set((state) => {
        if (!state.journey || !state.preview.isActive || !state.preview.currentStepId) return;

        // Mark current step as executed
        state.preview.executedSteps.push(state.preview.currentStepId);

        // Find next step via transitions
        const outgoingTransitions = state.journey.transitions.filter(
          (t: Transition) => t.fromStepId === state.preview.currentStepId
        );

        if (outgoingTransitions.length > 0) {
          // For simplicity, take first transition (in real impl, evaluate conditions)
          state.preview.currentStepId = outgoingTransitions[0].toStepId;
        } else {
          // No more steps
          state.preview.currentStepId = null;
        }
      });
    },

    setPreviewStepResult: (stepId, result) => {
      set((state) => {
        state.preview.stepResults[stepId] = result;
      });
    },

    // Import/Export Actions
    exportToJSON: () => {
      const { journey, auditLog } = get();
      if (!journey) return '{}';

      set((state) => {
        state.auditLog.push(
          createAuditEntry('journey_exported', journey.createdBy, { journeyId: journey.id })
        );
      });

      return JSON.stringify(
        {
          journey,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        },
        null,
        2
      );
    },

    importFromJSON: (json, userId) => {
      try {
        const data = JSON.parse(json);
        if (!data.journey) return false;

        set((state) => {
          state.journey = {
            ...data.journey,
            id: crypto.randomUUID(), // New ID on import
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId,
          };
          state.isDirty = false;
          state.auditLog.push(
            createAuditEntry('journey_imported', userId, {
              originalId: data.journey.id,
              name: data.journey.name,
            })
          );
        });

        return true;
      } catch {
        return false;
      }
    },

    // Audit Actions
    getAuditLog: () => get().auditLog,
  }))
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectJourney = (state: JourneyBuilderState) => state.journey;
export const selectSteps = (state: JourneyBuilderState) => state.journey?.steps || [];
export const selectTransitions = (state: JourneyBuilderState) => state.journey?.transitions || [];
export const selectCanvas = (state: JourneyBuilderState) => state.canvas;
export const selectPreview = (state: JourneyBuilderState) => state.preview;
export const selectIsDirty = (state: JourneyBuilderState) => state.isDirty;
export const selectSelectedStep = (state: JourneyBuilderState) => {
  if (!state.journey || !state.canvas.selectedNodeId) return null;
  return state.journey.steps.find((s) => s.id === state.canvas.selectedNodeId) || null;
};
export const selectSelectedTransition = (state: JourneyBuilderState) => {
  if (!state.journey || !state.canvas.selectedTransitionId) return null;
  return state.journey.transitions.find((t) => t.id === state.canvas.selectedTransitionId) || null;
};
