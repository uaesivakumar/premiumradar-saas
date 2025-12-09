/**
 * SIVA Context History - Sprint S137
 *
 * CRITICAL ARCHITECTURE CONSTRAINT:
 * Chat history must be anchored in SalesContext.
 *
 * If history is naively saved as raw text:
 * - SIVA loses persona
 * - SIVA loses vertical context
 * - Responses will drift
 * - Not replayable for self-healing
 *
 * Chat history must include:
 * - vertical
 * - sub-vertical
 * - region
 * - journey stage
 * - pack version
 * - persona version
 * - signal snapshot
 *
 * This ensures ONE CONSCIOUSNESS of SIVA across all surfaces.
 */

import type { Vertical, SubVertical } from '@/lib/intelligence/context/types';

// =============================================================================
// Types
// =============================================================================

export interface SIVAMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // Context at time of message
  context: MessageContext;

  // Tool usage (if any)
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];

  // Metadata
  metadata?: {
    tokensUsed?: number;
    latencyMs?: number;
    model?: string;
    cached?: boolean;
  };
}

export interface MessageContext {
  // Core SalesContext
  vertical: Vertical;
  subVertical: SubVertical;
  regions: string[];

  // Journey state
  journeyStage: 'onboarding' | 'first-use' | 'learning' | 'experienced';

  // Pack & Persona versions (for reproducibility)
  packVersion: string;
  personaVersion: string;

  // Active signals at time of message
  signalSnapshot?: SignalSnapshot[];

  // User state
  userId?: string;
  sessionId: string;

  // Optional workspace context
  workspaceId?: string;
  tenantId?: string;
}

export interface SignalSnapshot {
  id: string;
  type: string;
  companyName: string;
  priority: string;
  timestamp: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  timestamp: Date;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
  timestamp: Date;
}

export interface ConversationThread {
  id: string;
  title: string;
  messages: SIVAMessage[];

  // Thread-level context (initial context)
  initialContext: MessageContext;

  // Thread metadata
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;

  // Status
  status: 'active' | 'archived' | 'deleted';

  // Summary for quick reference
  summary?: string;

  // Tags for categorization
  tags?: string[];
}

export interface ConversationSearchParams {
  query?: string;
  vertical?: Vertical;
  subVertical?: SubVertical;
  regions?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  limit?: number;
  offset?: number;
}

// =============================================================================
// Context History Manager
// =============================================================================

export class SIVAContextHistory {
  private threads: Map<string, ConversationThread>;
  private currentThreadId: string | null;
  private storageKey: string;

  constructor(userId: string) {
    this.threads = new Map();
    this.currentThreadId = null;
    this.storageKey = `siva_history_${userId}`;
    this.loadFromStorage();
  }

  // =============================================================================
  // Thread Management
  // =============================================================================

  /**
   * Create a new conversation thread with full context
   */
  createThread(context: MessageContext, title?: string): ConversationThread {
    const thread: ConversationThread = {
      id: generateThreadId(),
      title: title || this.generateTitle(context),
      messages: [],
      initialContext: context,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      status: 'active',
      tags: [context.vertical, context.subVertical],
    };

    this.threads.set(thread.id, thread);
    this.currentThreadId = thread.id;
    this.saveToStorage();

    return thread;
  }

  /**
   * Get current active thread
   */
  getCurrentThread(): ConversationThread | null {
    if (!this.currentThreadId) return null;
    return this.threads.get(this.currentThreadId) || null;
  }

  /**
   * Set current active thread
   */
  setCurrentThread(threadId: string): boolean {
    if (this.threads.has(threadId)) {
      this.currentThreadId = threadId;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Get thread by ID
   */
  getThread(threadId: string): ConversationThread | null {
    return this.threads.get(threadId) || null;
  }

  /**
   * List all threads with optional filtering
   */
  listThreads(params?: ConversationSearchParams): ConversationThread[] {
    let threads = Array.from(this.threads.values())
      .filter(t => t.status !== 'deleted');

    // Apply filters
    if (params?.vertical) {
      threads = threads.filter(t => t.initialContext.vertical === params.vertical);
    }

    if (params?.subVertical) {
      threads = threads.filter(t => t.initialContext.subVertical === params.subVertical);
    }

    if (params?.regions && params.regions.length > 0) {
      threads = threads.filter(t =>
        params.regions!.some(r => t.initialContext.regions.includes(r))
      );
    }

    if (params?.dateRange) {
      threads = threads.filter(t => {
        const created = new Date(t.createdAt);
        return created >= params.dateRange!.start && created <= params.dateRange!.end;
      });
    }

    if (params?.tags && params.tags.length > 0) {
      threads = threads.filter(t =>
        t.tags?.some(tag => params.tags!.includes(tag))
      );
    }

    if (params?.query) {
      const query = params.query.toLowerCase();
      threads = threads.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.summary?.toLowerCase().includes(query) ||
        t.messages.some(m => m.content.toLowerCase().includes(query))
      );
    }

    // Sort by most recent
    threads.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Apply pagination
    if (params?.offset) {
      threads = threads.slice(params.offset);
    }
    if (params?.limit) {
      threads = threads.slice(0, params.limit);
    }

    return threads;
  }

  /**
   * Archive a thread
   */
  archiveThread(threadId: string): boolean {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.status = 'archived';
      thread.updatedAt = new Date();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Delete a thread (soft delete)
   */
  deleteThread(threadId: string): boolean {
    const thread = this.threads.get(threadId);
    if (thread) {
      thread.status = 'deleted';
      thread.updatedAt = new Date();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // =============================================================================
  // Message Management
  // =============================================================================

  /**
   * Add a message to the current thread with full context
   */
  addMessage(
    role: SIVAMessage['role'],
    content: string,
    context: MessageContext,
    options?: {
      toolCalls?: ToolCall[];
      toolResults?: ToolResult[];
      metadata?: SIVAMessage['metadata'];
    }
  ): SIVAMessage | null {
    const thread = this.getCurrentThread();
    if (!thread) return null;

    const message: SIVAMessage = {
      id: generateMessageId(),
      role,
      content,
      timestamp: new Date(),
      context,
      toolCalls: options?.toolCalls,
      toolResults: options?.toolResults,
      metadata: options?.metadata,
    };

    thread.messages.push(message);
    thread.messageCount = thread.messages.length;
    thread.updatedAt = new Date();

    // Update summary after significant messages
    if (thread.messageCount % 10 === 0) {
      thread.summary = this.generateSummary(thread);
    }

    this.saveToStorage();
    return message;
  }

  /**
   * Get messages from current thread
   */
  getMessages(options?: { limit?: number; beforeId?: string }): SIVAMessage[] {
    const thread = this.getCurrentThread();
    if (!thread) return [];

    let messages = [...thread.messages];

    if (options?.beforeId) {
      const index = messages.findIndex(m => m.id === options.beforeId);
      if (index > 0) {
        messages = messages.slice(0, index);
      }
    }

    if (options?.limit) {
      messages = messages.slice(-options.limit);
    }

    return messages;
  }

  /**
   * Get messages formatted for LLM context
   * Includes context metadata for persona consistency
   */
  getMessagesForLLM(options?: {
    limit?: number;
    includeSystemPrompt?: boolean;
  }): Array<{ role: string; content: string }> {
    const messages = this.getMessages({ limit: options?.limit });
    const thread = this.getCurrentThread();

    const llmMessages: Array<{ role: string; content: string }> = [];

    // Add context-aware system prompt if requested
    if (options?.includeSystemPrompt && thread) {
      llmMessages.push({
        role: 'system',
        content: this.buildContextSystemPrompt(thread.initialContext),
      });
    }

    // Add messages with context annotations for important transitions
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prevMsg = i > 0 ? messages[i - 1] : null;

      // Check for context drift
      if (prevMsg && this.hasContextChanged(prevMsg.context, msg.context)) {
        llmMessages.push({
          role: 'system',
          content: `[Context Update: ${this.describeContextChange(prevMsg.context, msg.context)}]`,
        });
      }

      llmMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return llmMessages;
  }

  // =============================================================================
  // Context Helpers
  // =============================================================================

  /**
   * Build system prompt with context
   */
  private buildContextSystemPrompt(context: MessageContext): string {
    return `You are SIVA, an AI Sales Intelligence Assistant.

Current Context:
- Vertical: ${context.vertical}
- Sub-Vertical: ${context.subVertical}
- Regions: ${context.regions.join(', ')}
- Journey Stage: ${context.journeyStage}
- Pack Version: ${context.packVersion}
- Persona Version: ${context.personaVersion}

${context.signalSnapshot && context.signalSnapshot.length > 0
  ? `Active Signals: ${context.signalSnapshot.length} signals available for reference.`
  : 'No active signals in current context.'}

Maintain persona consistency throughout the conversation. Respond appropriately for the ${context.vertical}/${context.subVertical} context.`;
  }

  /**
   * Check if context has changed between messages
   */
  private hasContextChanged(prev: MessageContext, curr: MessageContext): boolean {
    return (
      prev.vertical !== curr.vertical ||
      prev.subVertical !== curr.subVertical ||
      prev.journeyStage !== curr.journeyStage ||
      JSON.stringify(prev.regions) !== JSON.stringify(curr.regions)
    );
  }

  /**
   * Describe context change for system message
   */
  private describeContextChange(prev: MessageContext, curr: MessageContext): string {
    const changes: string[] = [];

    if (prev.vertical !== curr.vertical) {
      changes.push(`vertical changed from ${prev.vertical} to ${curr.vertical}`);
    }
    if (prev.subVertical !== curr.subVertical) {
      changes.push(`sub-vertical changed from ${prev.subVertical} to ${curr.subVertical}`);
    }
    if (prev.journeyStage !== curr.journeyStage) {
      changes.push(`journey stage changed from ${prev.journeyStage} to ${curr.journeyStage}`);
    }

    return changes.join(', ');
  }

  /**
   * Generate thread title from context
   */
  private generateTitle(context: MessageContext): string {
    const date = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${context.subVertical} - ${context.regions[0] || 'Global'} - ${date}`;
  }

  /**
   * Generate thread summary
   */
  private generateSummary(thread: ConversationThread): string {
    const userMessages = thread.messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return '';

    // Take first few user messages for summary
    const firstMessages = userMessages.slice(0, 3).map(m => m.content);
    const combined = firstMessages.join(' ').substring(0, 200);

    return combined + (combined.length >= 200 ? '...' : '');
  }

  // =============================================================================
  // Search & Export
  // =============================================================================

  /**
   * Search messages across threads
   */
  searchMessages(query: string, params?: ConversationSearchParams): SIVAMessage[] {
    const threads = this.listThreads(params);
    const queryLower = query.toLowerCase();

    const results: SIVAMessage[] = [];

    for (const thread of threads) {
      for (const message of thread.messages) {
        if (message.content.toLowerCase().includes(queryLower)) {
          results.push(message);
        }
      }
    }

    return results.slice(0, params?.limit || 50);
  }

  /**
   * Export thread for backup/analysis
   */
  exportThread(threadId: string): string | null {
    const thread = this.getThread(threadId);
    if (!thread) return null;

    return JSON.stringify({
      ...thread,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }

  /**
   * Export conversation for sharing
   */
  exportConversation(threadId: string, format: 'json' | 'markdown' = 'markdown'): string | null {
    const thread = this.getThread(threadId);
    if (!thread) return null;

    if (format === 'json') {
      return this.exportThread(threadId);
    }

    // Markdown format
    let markdown = `# ${thread.title}\n\n`;
    markdown += `**Context:** ${thread.initialContext.vertical} / ${thread.initialContext.subVertical}\n`;
    markdown += `**Regions:** ${thread.initialContext.regions.join(', ')}\n`;
    markdown += `**Created:** ${new Date(thread.createdAt).toLocaleString()}\n\n`;
    markdown += '---\n\n';

    for (const msg of thread.messages) {
      const role = msg.role === 'user' ? '**You**' : '**SIVA**';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      markdown += `${role} (${time}):\n\n${msg.content}\n\n`;
    }

    return markdown;
  }

  // =============================================================================
  // Storage
  // =============================================================================

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    const data = {
      threads: Array.from(this.threads.entries()),
      currentThreadId: this.currentThreadId,
      version: '1.0',
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[SIVAContextHistory] Failed to save to storage:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.threads = new Map(data.threads || []);
        this.currentThreadId = data.currentThreadId || null;
      }
    } catch (error) {
      console.warn('[SIVAContextHistory] Failed to load from storage:', error);
    }
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.threads.clear();
    this.currentThreadId = null;
    this.saveToStorage();
  }

  /**
   * Get storage usage
   */
  getStorageUsage(): { threads: number; messages: number; sizeKb: number } {
    let totalMessages = 0;
    for (const thread of this.threads.values()) {
      totalMessages += thread.messageCount;
    }

    const stored = localStorage.getItem(this.storageKey) || '';
    const sizeKb = Math.round((stored.length * 2) / 1024); // Approximate UTF-16 size

    return {
      threads: this.threads.size,
      messages: totalMessages,
      sizeKb,
    };
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

function generateThreadId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// Factory & Hooks
// =============================================================================

let historyInstance: SIVAContextHistory | null = null;

export function getSIVAContextHistory(userId: string): SIVAContextHistory {
  if (!historyInstance || typeof window === 'undefined') {
    historyInstance = new SIVAContextHistory(userId);
  }
  return historyInstance;
}

/**
 * Create a fresh context from current state
 */
export function createMessageContext(params: {
  vertical: Vertical;
  subVertical: SubVertical;
  regions: string[];
  journeyStage?: MessageContext['journeyStage'];
  userId?: string;
  sessionId?: string;
  signals?: SignalSnapshot[];
}): MessageContext {
  return {
    vertical: params.vertical,
    subVertical: params.subVertical,
    regions: params.regions,
    journeyStage: params.journeyStage || 'learning',
    packVersion: `${params.vertical}-${params.subVertical}-v1`,
    personaVersion: `${params.subVertical}-standard-v1`,
    signalSnapshot: params.signals,
    userId: params.userId,
    sessionId: params.sessionId || `session_${Date.now()}`,
  };
}

export default SIVAContextHistory;
