/**
 * SIVA Context History Hook - Sprint S137
 *
 * Bridges SIVA store with SalesContext-anchored chat history.
 * Ensures ONE CONSCIOUSNESS of SIVA across all surfaces:
 * - Every message is anchored to vertical/sub-vertical/region
 * - Context changes create new threads
 * - History is exportable and searchable
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useSIVAStore, type SIVAMessage as StoreSIVAMessage } from '@/lib/stores/siva-store';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import {
  SIVAContextHistory,
  type ConversationThread,
  type MessageContext,
  createMessageContext,
} from './context-history';

// Singleton instance of context history
let contextHistoryInstance: SIVAContextHistory | null = null;

function getContextHistory(): SIVAContextHistory {
  if (!contextHistoryInstance) {
    // Use a default userId for now - in production this would come from auth
    contextHistoryInstance = new SIVAContextHistory('default-user');
  }
  return contextHistoryInstance;
}

// Extended ConversationThread with context property for backwards compatibility
export interface ConversationThreadWithContext extends ConversationThread {
  context: MessageContext;
}

export interface SIVAContextHistoryHook {
  // Current thread
  currentThreadId: string | null;
  currentThread: ConversationThreadWithContext | null;

  // Thread management
  createNewThread: () => string;
  switchThread: (threadId: string) => void;
  getAllThreads: () => ConversationThreadWithContext[];

  // Message operations
  addMessageToHistory: (message: StoreSIVAMessage, role: 'user' | 'assistant') => void;
  getMessagesForLLM: (maxMessages?: number) => Array<{ role: string; content: string }>;

  // Search and export
  searchHistory: (query: string) => ConversationThreadWithContext[];
  exportConversation: (threadId?: string) => string;

  // Context anchoring
  getCurrentContext: () => MessageContext;
  isContextChanged: () => boolean;
}

export function useSIVAContextHistory(): SIVAContextHistoryHook {
  const { vertical, subVertical, regions } = useSalesContext();
  const { messages } = useSIVAStore();

  const currentThreadIdRef = useRef<string | null>(null);
  const lastContextRef = useRef<{ vertical: string | null; subVertical: string | null; regions: string[] }>({
    vertical: null,
    subVertical: null,
    regions: [],
  });

  const contextHistory = useMemo(() => getContextHistory(), []);

  // Build current message context
  const getCurrentContext = useCallback((): MessageContext => {
    return createMessageContext({
      vertical: vertical || 'banking',
      subVertical: subVertical || 'employee-banking',
      regions: regions && regions.length > 0 ? regions : ['UAE'],
      journeyStage: 'experienced',
    });
  }, [vertical, subVertical, regions]);

  // Check if context has changed since last message
  const isContextChanged = useCallback((): boolean => {
    const last = lastContextRef.current;
    const regionsChanged = JSON.stringify(last.regions) !== JSON.stringify(regions);
    return (
      last.vertical !== vertical ||
      last.subVertical !== subVertical ||
      regionsChanged
    );
  }, [vertical, subVertical, regions]);

  // Create a new thread for current context
  const createNewThread = useCallback((): string => {
    const context = getCurrentContext();
    const thread = contextHistory.createThread(context);
    currentThreadIdRef.current = thread.id;

    // Update last context
    lastContextRef.current = {
      vertical: vertical || null,
      subVertical: subVertical || null,
      regions: regions || [],
    };

    return thread.id;
  }, [contextHistory, getCurrentContext, vertical, subVertical, regions]);

  // Switch to an existing thread
  const switchThread = useCallback((threadId: string) => {
    contextHistory.setCurrentThread(threadId);
    currentThreadIdRef.current = threadId;
  }, [contextHistory]);

  // Get all threads with context property
  const getAllThreads = useCallback((): ConversationThreadWithContext[] => {
    const threads = contextHistory.listThreads();
    return threads.map(thread => ({
      ...thread,
      context: thread.initialContext,
    }));
  }, [contextHistory]);

  // Get current thread with context property
  const getCurrentThread = useCallback((): ConversationThreadWithContext | null => {
    const thread = contextHistory.getCurrentThread();
    if (!thread) return null;
    return {
      ...thread,
      context: thread.initialContext,
    };
  }, [contextHistory]);

  // Add message to history with context
  const addMessageToHistory = useCallback((
    message: StoreSIVAMessage,
    role: 'user' | 'assistant'
  ) => {
    // Check if we need a new thread (context changed or no thread)
    if (!currentThreadIdRef.current || isContextChanged()) {
      createNewThread();
    }

    const context = getCurrentContext();
    const sivaRole = role === 'user' ? 'user' : 'assistant';

    contextHistory.addMessage(sivaRole, message.content, context, {
      metadata: {
        model: 'siva',
      },
    });
  }, [contextHistory, getCurrentContext, isContextChanged, createNewThread]);

  // Get messages formatted for LLM
  const getMessagesForLLM = useCallback((maxMessages: number = 10): Array<{ role: string; content: string }> => {
    return contextHistory.getMessagesForLLM({ limit: maxMessages });
  }, [contextHistory]);

  // Search history - returns threads that match
  const searchHistory = useCallback((query: string): ConversationThreadWithContext[] => {
    const threads = contextHistory.listThreads({ query });
    return threads.map(thread => ({
      ...thread,
      context: thread.initialContext,
    }));
  }, [contextHistory]);

  // Export conversation
  const exportConversation = useCallback((threadId?: string): string => {
    const id = threadId || currentThreadIdRef.current;
    if (!id) return '';
    return contextHistory.exportConversation(id, 'markdown') || '';
  }, [contextHistory]);

  // Auto-create thread on context change
  useEffect(() => {
    if (vertical && subVertical && isContextChanged()) {
      createNewThread();
    }
  }, [vertical, subVertical, isContextChanged, createNewThread]);

  // Sync SIVA store messages to context history
  useEffect(() => {
    if (messages.length === 0) return;

    // Get last message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // Add to history (avoid duplicates by checking timestamp)
    const llmMessages = getMessagesForLLM(1);
    if (llmMessages.length === 0 ||
        llmMessages[llmMessages.length - 1]?.content !== lastMessage.content) {
      addMessageToHistory(lastMessage, lastMessage.role === 'user' ? 'user' : 'assistant');
    }
  }, [messages, addMessageToHistory, getMessagesForLLM]);

  return {
    currentThreadId: currentThreadIdRef.current,
    currentThread: getCurrentThread(),
    createNewThread,
    switchThread,
    getAllThreads,
    addMessageToHistory,
    getMessagesForLLM,
    searchHistory,
    exportConversation,
    getCurrentContext,
    isContextChanged,
  };
}

export default useSIVAContextHistory;
