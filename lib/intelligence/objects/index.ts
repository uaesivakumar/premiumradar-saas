/**
 * Output Object Engine v2 - S46
 *
 * Live Objects, Object Threads, and Object Inspector.
 * Enables object-centric interactions and follow-up conversations.
 */

// Types
export type {
  LiveObject,
  ObjectState,
  ObjectLink,
  ObjectRelationship,
  ObjectThread,
  ThreadMessage,
  ThreadParticipant,
  ThreadStatus,
  ObjectInspectorData,
  ObjectHistoryEntry,
  ObjectAction,
  SourceAttribution,
  ObjectSession,
  SessionInteraction,
  SessionInsight,
  ObjectStoreState,
  CreateLiveObjectOptions,
  CreateThreadOptions,
} from './types';

// Live Object Factory
export {
  createLiveObject,
  updateObjectState,
  enrichLiveObject,
  linkObjects,
  unlinkObjects,
  refreshObject,
  isObjectStale,
  getObjectAge,
} from './LiveObjectFactory';

// Thread Manager
export {
  createThread,
  addThreadToObject,
  addMessage,
  addUserMessage,
  addAssistantMessage,
  addSystemMessage,
  updateThreadStatus,
  resolveThread,
  archiveThread,
  reopenThread,
  addParticipant,
  addAgentParticipant,
  getActiveThreads,
  getThreadById,
  getLatestThread,
  getMessageCount,
  getUnreadCount,
  searchMessages,
  getThreadSummary,
  exportThreadAsText,
} from './ThreadManager';

// Object Inspector
export {
  getInspectorOverview,
  getSignalsView,
  getReasoningView,
  getHistoryView,
  getSourcesView,
  searchInspectorData,
  getConfidenceBreakdown,
  getDataFreshness,
  exportInspectorData,
  generateInspectorSummary,
} from './ObjectInspector';
