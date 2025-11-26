/**
 * Output Object Types - S46
 *
 * Type definitions for Live Objects, Object Threads, and Object Inspector.
 */

import type { OutputObject, AgentType } from '@/lib/stores/siva-store';
import type { Evidence } from '../evidence/types';
import type { ReasoningChain } from '../evidence/types';

// =============================================================================
// Live Object Types
// =============================================================================

/**
 * Live Object - Extends OutputObject with real-time capabilities
 */
export interface LiveObject extends OutputObject {
  /** Whether this object receives real-time updates */
  isLive: boolean;

  /** Last update timestamp */
  lastUpdate: Date;

  /** Update frequency in ms (0 = manual only) */
  updateFrequency: number;

  /** Linked objects (related entities) */
  linkedObjects: ObjectLink[];

  /** Conversation threads attached to this object */
  threads: ObjectThread[];

  /** Inspector data for detailed view */
  inspectorData: ObjectInspectorData;

  /** Object state */
  state: ObjectState;
}

/**
 * Object state for lifecycle management
 */
export type ObjectState =
  | 'active'      // Currently being used/viewed
  | 'stale'       // Data may be outdated
  | 'archived'    // No longer active
  | 'updating';   // Currently refreshing data

/**
 * Link between objects
 */
export interface ObjectLink {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: ObjectRelationship;
  strength: number; // 0-1
  createdAt: Date;
}

/**
 * Types of relationships between objects
 */
export type ObjectRelationship =
  | 'derived_from'    // This object was created from another
  | 'related_to'      // General relationship
  | 'child_of'        // Parent-child hierarchy
  | 'sibling_of'      // Same level in hierarchy
  | 'references'      // References data from another
  | 'updates';        // Updates/supersedes another

// =============================================================================
// Object Thread Types
// =============================================================================

/**
 * Conversation thread attached to an object
 */
export interface ObjectThread {
  id: string;
  objectId: string;
  title: string;
  messages: ThreadMessage[];
  participants: ThreadParticipant[];
  status: ThreadStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message in an object thread
 */
export interface ThreadMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Participant in a thread
 */
export interface ThreadParticipant {
  type: 'user' | 'agent';
  name: string;
  agentType?: AgentType;
}

/**
 * Thread status
 */
export type ThreadStatus = 'active' | 'resolved' | 'archived';

// =============================================================================
// Object Inspector Types
// =============================================================================

/**
 * Inspector data for detailed object view
 */
export interface ObjectInspectorData {
  /** Raw metadata from object */
  metadata: Record<string, unknown>;

  /** Signals that contributed to this object */
  signals: Evidence[];

  /** Reasoning chain used to generate */
  reasoning: {
    steps: {
      stage: string;
      output: string;
      evidence: Evidence[];
    }[];
    conclusion: string;
    confidence: number;
    duration: number;
  };

  /** History of object changes */
  history: ObjectHistoryEntry[];

  /** Source attribution */
  sources: SourceAttribution[];
}

/**
 * History entry for object changes
 */
export interface ObjectHistoryEntry {
  id?: string;
  action: ObjectAction;
  timestamp: Date;
  details: string;
  previousValue?: unknown;
  newValue?: unknown;
}

/**
 * Types of object actions
 */
export type ObjectAction =
  | 'created'
  | 'updated'
  | 'enriched'
  | 'linked'
  | 'unlinked'
  | 'archived'
  | 'restored'
  | 'refreshed';

/**
 * Source attribution for data
 */
export interface SourceAttribution {
  name: string;
  type: 'api' | 'database' | 'user' | 'ai' | 'external';
  url?: string;
  timestamp: Date;
  confidence: number;
}

// =============================================================================
// Object Session Types
// =============================================================================

/**
 * Session tracking for object interactions
 */
export interface ObjectSession {
  id: string;
  objectId: string;
  startedAt: Date;
  endedAt?: Date;
  interactions: SessionInteraction[];
  insights: SessionInsight[];
}

/**
 * Interaction within a session
 */
export interface SessionInteraction {
  id: string;
  type: 'view' | 'edit' | 'query' | 'export' | 'share';
  timestamp: Date;
  details?: Record<string, unknown>;
}

/**
 * Insight generated during session
 */
export interface SessionInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'suggestion' | 'warning';
  message: string;
  confidence: number;
  timestamp: Date;
}

// =============================================================================
// Object Store Types
// =============================================================================

/**
 * Object store state
 */
export interface ObjectStoreState {
  /** All live objects */
  objects: Map<string, LiveObject>;

  /** Active threads */
  threads: Map<string, ObjectThread>;

  /** Current session */
  currentSession: ObjectSession | null;

  /** Selected object for detail view */
  selectedObjectId: string | null;

  /** Processing state */
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// Object Factory Types
// =============================================================================

/**
 * Options for creating a live object
 */
export interface CreateLiveObjectOptions {
  baseObject: OutputObject;
  isLive?: boolean;
  updateFrequency?: number;
  linkedObjectIds?: string[];
  initialThread?: Omit<ObjectThread, 'id' | 'objectId' | 'createdAt' | 'updatedAt'>;
}

/**
 * Options for object thread creation
 */
export interface CreateThreadOptions {
  objectId: string;
  title: string;
  initialMessage?: string;
  participants?: ThreadParticipant[];
}
