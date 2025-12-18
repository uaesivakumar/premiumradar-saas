/**
 * Thread Manager - S46
 *
 * Manages conversation threads attached to objects.
 * Enables object-centric follow-up conversations.
 */

import type { AgentType } from '@/lib/stores/siva-store';
import type {
  LiveObject,
  ObjectThread,
  ThreadMessage,
  ThreadParticipant,
  ThreadStatus,
  CreateThreadOptions,
  ObjectHistoryEntry,
} from './types';

// =============================================================================
// Thread Creation
// =============================================================================

/**
 * Create a new thread on an object
 */
export function createThread(options: CreateThreadOptions): ObjectThread {
  const {
    objectId,
    title,
    initialMessage,
    participants = [],
  } = options;

  const now = new Date();
  const threadId = `thread-${objectId}-${Date.now()}`;

  // Create initial message if provided
  const messages: ThreadMessage[] = [];
  if (initialMessage) {
    messages.push({
      id: `msg-${threadId}-0`,
      threadId,
      role: 'user',
      content: initialMessage,
      timestamp: now,
    });
  }

  // Ensure we have at least a user participant
  const finalParticipants: ThreadParticipant[] = participants.length > 0
    ? participants
    : [{ type: 'user', name: 'User' }];

  return {
    id: threadId,
    objectId,
    title,
    messages,
    participants: finalParticipants,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Add a thread to a live object
 */
export function addThreadToObject(
  object: LiveObject,
  thread: ObjectThread
): LiveObject {
  const now = new Date();

  // Check if thread already exists
  const existingIndex = object.threads.findIndex(t => t.id === thread.id);
  if (existingIndex >= 0) {
    // Update existing thread
    const updatedThreads = [...object.threads];
    updatedThreads[existingIndex] = thread;
    return {
      ...object,
      threads: updatedThreads,
      lastUpdate: now,
    };
  }

  return {
    ...object,
    threads: [...object.threads, thread],
    lastUpdate: now,
  };
}

// =============================================================================
// Message Management
// =============================================================================

/**
 * Add a message to a thread
 */
export function addMessage(
  thread: ObjectThread,
  message: Omit<ThreadMessage, 'id' | 'threadId' | 'timestamp'>
): ObjectThread {
  const now = new Date();
  const messageId = `msg-${thread.id}-${thread.messages.length}`;

  const newMessage: ThreadMessage = {
    ...message,
    id: messageId,
    threadId: thread.id,
    timestamp: now,
  };

  return {
    ...thread,
    messages: [...thread.messages, newMessage],
    updatedAt: now,
  };
}

/**
 * Add a user message to a thread
 */
export function addUserMessage(thread: ObjectThread, content: string): ObjectThread {
  return addMessage(thread, {
    role: 'user',
    content,
  });
}

/**
 * Add an assistant message to a thread
 */
export function addAssistantMessage(
  thread: ObjectThread,
  content: string,
  metadata?: Record<string, unknown>
): ObjectThread {
  return addMessage(thread, {
    role: 'assistant',
    content,
    metadata,
  });
}

/**
 * Add a system message to a thread
 */
export function addSystemMessage(thread: ObjectThread, content: string): ObjectThread {
  return addMessage(thread, {
    role: 'system',
    content,
  });
}

// =============================================================================
// Thread Status Management
// =============================================================================

/**
 * Update thread status
 */
export function updateThreadStatus(
  thread: ObjectThread,
  status: ThreadStatus
): ObjectThread {
  return {
    ...thread,
    status,
    updatedAt: new Date(),
  };
}

/**
 * Resolve a thread (mark as complete)
 */
export function resolveThread(thread: ObjectThread): ObjectThread {
  return addSystemMessage(
    updateThreadStatus(thread, 'resolved'),
    'Thread resolved'
  );
}

/**
 * Archive a thread
 */
export function archiveThread(thread: ObjectThread): ObjectThread {
  return addSystemMessage(
    updateThreadStatus(thread, 'archived'),
    'Thread archived'
  );
}

/**
 * Reopen a resolved/archived thread
 */
export function reopenThread(thread: ObjectThread): ObjectThread {
  return addSystemMessage(
    updateThreadStatus(thread, 'active'),
    'Thread reopened'
  );
}

// =============================================================================
// Participant Management
// =============================================================================

/**
 * Add a participant to a thread
 */
export function addParticipant(
  thread: ObjectThread,
  participant: ThreadParticipant
): ObjectThread {
  // Check if participant already exists
  const exists = thread.participants.some(
    p => p.type === participant.type && p.name === participant.name
  );

  if (exists) return thread;

  return {
    ...thread,
    participants: [...thread.participants, participant],
    updatedAt: new Date(),
  };
}

/**
 * Add an agent participant to a thread
 */
export function addAgentParticipant(
  thread: ObjectThread,
  agentType: AgentType
): ObjectThread {
  const agentNames: Record<AgentType, string> = {
    discovery: 'Discovery Agent',
    ranking: 'Ranking Agent',
    outreach: 'Outreach Agent',
    enrichment: 'Enrichment Agent',
    demo: 'Demo Agent',
    'deal-evaluation': 'Deal Evaluator',
  };

  return addParticipant(thread, {
    type: 'agent',
    name: agentNames[agentType],
    agentType,
  });
}

// =============================================================================
// Thread Queries
// =============================================================================

/**
 * Get active threads for an object
 */
export function getActiveThreads(object: LiveObject): ObjectThread[] {
  return object.threads.filter(t => t.status === 'active');
}

/**
 * Get thread by ID
 */
export function getThreadById(
  object: LiveObject,
  threadId: string
): ObjectThread | undefined {
  return object.threads.find(t => t.id === threadId);
}

/**
 * Get latest thread for an object
 */
export function getLatestThread(object: LiveObject): ObjectThread | undefined {
  if (object.threads.length === 0) return undefined;

  return [...object.threads].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  )[0];
}

/**
 * Count messages in a thread
 */
export function getMessageCount(thread: ObjectThread): number {
  return thread.messages.length;
}

/**
 * Get unread message count (messages since last user message)
 */
export function getUnreadCount(thread: ObjectThread): number {
  // Find last user message index
  let lastUserIndex = -1;
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    if (thread.messages[i].role === 'user') {
      lastUserIndex = i;
      break;
    }
  }

  // Count non-user messages after last user message
  return thread.messages
    .slice(lastUserIndex + 1)
    .filter(m => m.role !== 'user').length;
}

/**
 * Search messages in a thread
 */
export function searchMessages(
  thread: ObjectThread,
  query: string
): ThreadMessage[] {
  const queryLower = query.toLowerCase();
  return thread.messages.filter(m =>
    m.content.toLowerCase().includes(queryLower)
  );
}

// =============================================================================
// Thread Serialization
// =============================================================================

/**
 * Get thread summary for display
 */
export function getThreadSummary(thread: ObjectThread): {
  id: string;
  title: string;
  messageCount: number;
  lastMessage: string;
  lastUpdated: Date;
  status: ThreadStatus;
} {
  const lastMessage = thread.messages[thread.messages.length - 1];

  return {
    id: thread.id,
    title: thread.title,
    messageCount: thread.messages.length,
    lastMessage: lastMessage?.content.slice(0, 100) || '',
    lastUpdated: thread.updatedAt,
    status: thread.status,
  };
}

/**
 * Export thread as text
 */
export function exportThreadAsText(thread: ObjectThread): string {
  const lines: string[] = [
    `Thread: ${thread.title}`,
    `Status: ${thread.status}`,
    `Created: ${thread.createdAt.toISOString()}`,
    '---',
  ];

  for (const message of thread.messages) {
    const roleLabel = message.role === 'user' ? 'User' : message.role === 'assistant' ? 'Assistant' : 'System';
    lines.push(`[${message.timestamp.toISOString()}] ${roleLabel}:`);
    lines.push(message.content);
    lines.push('');
  }

  return lines.join('\n');
}
