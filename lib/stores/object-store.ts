/**
 * Object Store - S46
 *
 * Zustand store for Live Objects, threads, and sessions.
 * DOES NOT modify siva-store.ts - standalone store.
 */

import { create } from 'zustand';
import type { OutputObject } from '@/lib/stores/siva-store';
import type {
  LiveObject,
  ObjectThread,
  ObjectSession,
  CreateLiveObjectOptions,
  CreateThreadOptions,
} from '@/lib/intelligence/objects/types';
import {
  createLiveObject,
  updateObjectState,
  enrichLiveObject,
  linkObjects,
  unlinkObjects,
  refreshObject,
  createThread,
  addThreadToObject,
  addUserMessage,
  addAssistantMessage,
} from '@/lib/intelligence/objects';

// =============================================================================
// Store Types
// =============================================================================

interface ObjectStore {
  // State
  objects: Map<string, LiveObject>;
  threads: Map<string, ObjectThread>;
  currentSession: ObjectSession | null;
  selectedObjectId: string | null;
  isLoading: boolean;
  error: string | null;

  // Object Actions
  createObject: (options: CreateLiveObjectOptions) => LiveObject;
  convertToLiveObject: (outputObject: OutputObject) => LiveObject;
  updateObject: (objectId: string, updates: Partial<LiveObject>) => void;
  enrichObject: (
    objectId: string,
    enrichment: Parameters<typeof enrichLiveObject>[1]
  ) => void;
  linkTwoObjects: (sourceId: string, targetId: string) => void;
  unlinkTwoObjects: (sourceId: string, targetId: string) => void;
  archiveObject: (objectId: string) => void;
  deleteObject: (objectId: string) => void;

  // Thread Actions
  createObjectThread: (options: CreateThreadOptions) => ObjectThread;
  addMessageToThread: (
    threadId: string,
    role: 'user' | 'assistant',
    content: string
  ) => void;
  resolveObjectThread: (threadId: string) => void;

  // Selection
  selectObject: (objectId: string | null) => void;
  getSelectedObject: () => LiveObject | null;

  // Session
  startSession: (objectId: string) => void;
  endSession: () => void;

  // Queries
  getObject: (objectId: string) => LiveObject | undefined;
  getObjectsByType: (type: string) => LiveObject[];
  getObjectThreads: (objectId: string) => ObjectThread[];
  getStaleObjects: () => LiveObject[];

  // Bulk operations
  refreshStaleObjects: () => Promise<void>;
  clearArchived: () => void;

  // Reset
  reset: () => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useObjectStore = create<ObjectStore>((set, get) => ({
  // Initial state
  objects: new Map(),
  threads: new Map(),
  currentSession: null,
  selectedObjectId: null,
  isLoading: false,
  error: null,

  // Create a live object
  createObject: (options) => {
    const liveObject = createLiveObject(options);

    set((state) => {
      const objects = new Map(state.objects);
      objects.set(liveObject.id, liveObject);

      // Also store any threads
      const threads = new Map(state.threads);
      for (const thread of liveObject.threads) {
        threads.set(thread.id, thread);
      }

      return { objects, threads };
    });

    return liveObject;
  },

  // Convert OutputObject to LiveObject
  convertToLiveObject: (outputObject) => {
    return get().createObject({ baseObject: outputObject });
  },

  // Update an object
  updateObject: (objectId, updates) => {
    set((state) => {
      const objects = new Map(state.objects);
      const existing = objects.get(objectId);
      if (existing) {
        objects.set(objectId, { ...existing, ...updates, lastUpdate: new Date() });
      }
      return { objects };
    });
  },

  // Enrich an object with signals/reasoning
  enrichObject: (objectId, enrichment) => {
    set((state) => {
      const objects = new Map(state.objects);
      const existing = objects.get(objectId);
      if (existing) {
        const enriched = enrichLiveObject(existing, enrichment);
        objects.set(objectId, enriched);
      }
      return { objects };
    });
  },

  // Link two objects
  linkTwoObjects: (sourceId, targetId) => {
    set((state) => {
      const objects = new Map(state.objects);
      const source = objects.get(sourceId);
      if (source) {
        const linked = linkObjects(source, targetId);
        objects.set(sourceId, linked);
      }
      return { objects };
    });
  },

  // Unlink two objects
  unlinkTwoObjects: (sourceId, targetId) => {
    set((state) => {
      const objects = new Map(state.objects);
      const source = objects.get(sourceId);
      if (source) {
        const unlinked = unlinkObjects(source, targetId);
        objects.set(sourceId, unlinked);
      }
      return { objects };
    });
  },

  // Archive an object
  archiveObject: (objectId) => {
    set((state) => {
      const objects = new Map(state.objects);
      const existing = objects.get(objectId);
      if (existing) {
        const archived = updateObjectState(existing, 'archived', 'User archived object');
        objects.set(objectId, archived);
      }
      return { objects };
    });
  },

  // Delete an object
  deleteObject: (objectId) => {
    set((state) => {
      const objects = new Map(state.objects);
      const threads = new Map(state.threads);

      // Remove object
      const removed = objects.get(objectId);
      objects.delete(objectId);

      // Remove associated threads
      if (removed) {
        for (const thread of removed.threads) {
          threads.delete(thread.id);
        }
      }

      // Clear selection if needed
      const selectedObjectId = state.selectedObjectId === objectId
        ? null
        : state.selectedObjectId;

      return { objects, threads, selectedObjectId };
    });
  },

  // Create a thread on an object
  createObjectThread: (options) => {
    const thread = createThread(options);

    set((state) => {
      const threads = new Map(state.threads);
      threads.set(thread.id, thread);

      // Add thread to object
      const objects = new Map(state.objects);
      const object = objects.get(options.objectId);
      if (object) {
        const updated = addThreadToObject(object, thread);
        objects.set(object.id, updated);
      }

      return { objects, threads };
    });

    return thread;
  },

  // Add message to thread
  addMessageToThread: (threadId, role, content) => {
    set((state) => {
      const threads = new Map(state.threads);
      const thread = threads.get(threadId);
      if (!thread) return state;

      const updated = role === 'user'
        ? addUserMessage(thread, content)
        : addAssistantMessage(thread, content);

      threads.set(threadId, updated);

      // Also update the thread in its parent object
      const objects = new Map(state.objects);
      const object = objects.get(thread.objectId);
      if (object) {
        const objectWithThread = addThreadToObject(object, updated);
        objects.set(object.id, objectWithThread);
      }

      return { objects, threads };
    });
  },

  // Resolve a thread
  resolveObjectThread: (threadId) => {
    set((state) => {
      const threads = new Map(state.threads);
      const thread = threads.get(threadId);
      if (!thread) return state;

      const resolved = { ...thread, status: 'resolved' as const, updatedAt: new Date() };
      threads.set(threadId, resolved);

      return { threads };
    });
  },

  // Select an object
  selectObject: (objectId) => {
    set({ selectedObjectId: objectId });
  },

  // Get selected object
  getSelectedObject: () => {
    const { objects, selectedObjectId } = get();
    return selectedObjectId ? objects.get(selectedObjectId) || null : null;
  },

  // Start a session
  startSession: (objectId) => {
    const session: ObjectSession = {
      id: `session-${Date.now()}`,
      objectId,
      startedAt: new Date(),
      interactions: [],
      insights: [],
    };
    set({ currentSession: session, selectedObjectId: objectId });
  },

  // End current session
  endSession: () => {
    set((state) => {
      if (!state.currentSession) return state;

      return {
        currentSession: {
          ...state.currentSession,
          endedAt: new Date(),
        },
      };
    });
  },

  // Get object by ID
  getObject: (objectId) => {
    return get().objects.get(objectId);
  },

  // Get objects by type
  getObjectsByType: (type) => {
    return Array.from(get().objects.values()).filter(o => o.type === type);
  },

  // Get threads for an object
  getObjectThreads: (objectId) => {
    const object = get().objects.get(objectId);
    return object?.threads || [];
  },

  // Get stale objects
  getStaleObjects: () => {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    return Array.from(get().objects.values()).filter(o => {
      if (!o.isLive || o.state === 'archived') return false;
      return now - o.lastUpdate.getTime() > maxAge;
    });
  },

  // Refresh stale objects
  refreshStaleObjects: async () => {
    const stale = get().getStaleObjects();
    set({ isLoading: true });

    try {
      // Mark as updating
      for (const obj of stale) {
        get().updateObject(obj.id, { state: 'updating' });
      }

      // In real implementation, would fetch fresh data here
      // For now, just update timestamps
      for (const obj of stale) {
        const refreshed = refreshObject(obj, {});
        set((state) => {
          const objects = new Map(state.objects);
          objects.set(obj.id, refreshed);
          return { objects };
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear archived objects
  clearArchived: () => {
    set((state) => {
      const objects = new Map(state.objects);
      const threads = new Map(state.threads);

      for (const [id, obj] of objects) {
        if (obj.state === 'archived') {
          objects.delete(id);
          for (const thread of obj.threads) {
            threads.delete(thread.id);
          }
        }
      }

      return { objects, threads };
    });
  },

  // Reset store
  reset: () => {
    set({
      objects: new Map(),
      threads: new Map(),
      currentSession: null,
      selectedObjectId: null,
      isLoading: false,
      error: null,
    });
  },
}));

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select all active objects
 */
export const selectActiveObjects = (state: ObjectStore) => {
  return Array.from(state.objects.values()).filter(o => o.state === 'active');
};

/**
 * Select object count by type
 */
export const selectObjectCountByType = (state: ObjectStore) => {
  const counts: Record<string, number> = {};
  for (const obj of state.objects.values()) {
    counts[obj.type] = (counts[obj.type] || 0) + 1;
  }
  return counts;
};

/**
 * Select active threads count
 */
export const selectActiveThreadsCount = (state: ObjectStore) => {
  return Array.from(state.threads.values()).filter(t => t.status === 'active').length;
};
