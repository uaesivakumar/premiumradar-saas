'use client';

/**
 * AI Command Bar - Phase 1: Query Plane Only
 *
 * Core Principle: AI may recommend. Humans must act.
 * SIVA suggests where and what — never does.
 *
 * Capabilities:
 * - Query stats, logs, costs
 * - Correlate and explain
 * - Recommend actions (navigation_only)
 *
 * Forbidden:
 * - Create, update, delete anything
 * - Trigger jobs or automations
 * - Auto-heal or mutate state
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Loader2,
  Sparkles,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronRight,
  Clock,
  Database,
  FileText,
} from 'lucide-react';

// Response types
interface DataSource {
  type: 'stats' | 'logs' | 'config' | 'costs' | 'users' | 'tenants';
  endpoint: string;
  timestamp: string;
}

interface ProposedAction {
  label: string;
  confidence: number;
  reason: string;
  ui_target: {
    page: string;
    field?: string;
    highlight?: string;
  };
  recommended_value?: string | number;
  impact_preview?: {
    [key: string]: string;
  };
  action_type: 'navigation_only'; // Phase 1: ALWAYS navigation_only
}

interface AIResponse {
  message: string;
  evidence?: Array<{
    source: string;
    summary: string;
    count?: number;
    time_range?: string;
  }>;
  data_sources: DataSource[];
  proposed_action?: ProposedAction;
  confidence: number;
  query_id: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: AIResponse;
  timestamp: Date;
  isLoading?: boolean;
}

export default function AICommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/superadmin/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: result.data.message,
                response: result.data,
                isLoading: false,
              }
            : msg
        ));
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: result.error || 'Failed to process query',
                isLoading: false,
              }
            : msg
        ));
      }
    } catch (error) {
      setMessages(prev => prev.map(msg =>
        msg.id === loadingMessage.id
          ? {
              ...msg,
              content: 'Connection error. Please try again.',
              isLoading: false,
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading]);

  const handleNavigate = (action: ProposedAction) => {
    setIsOpen(false);
    router.push(action.ui_target.page);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-lg text-sm text-neutral-400 hover:text-white transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Ask SIVA</span>
        <kbd className="ml-2 px-1.5 py-0.5 bg-neutral-900 rounded text-[10px] text-neutral-500">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[640px] max-h-[70vh] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-white">SIVA Admin</span>
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded">Query Mode</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm mb-2">Ask anything about your system</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "What's my burn rate?",
                  "Show recent errors",
                  "Why did discovery fail?",
                  "Compare costs this week",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-xs rounded transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-[80%] px-3 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-white">{msg.content}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Analyzing...</span>
                      </div>
                    ) : (
                      <>
                        {/* Main response */}
                        <div className="px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg">
                          <p className="text-sm text-neutral-200 whitespace-pre-wrap">{msg.content}</p>
                        </div>

                        {/* Evidence */}
                        {msg.response?.evidence && msg.response.evidence.length > 0 && (
                          <div className="px-3 py-2 bg-neutral-800/30 border border-neutral-800 rounded-lg">
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wide mb-2">Evidence</p>
                            <div className="space-y-1.5">
                              {msg.response.evidence.map((ev, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <Database className="w-3 h-3 text-neutral-600 mt-0.5" />
                                  <div>
                                    <span className="text-neutral-400">{ev.source}:</span>
                                    <span className="text-neutral-300 ml-1">{ev.summary}</span>
                                    {ev.count && <span className="text-neutral-500 ml-1">({ev.count} records)</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Proposed Action */}
                        {msg.response?.proposed_action && (
                          <div className="px-3 py-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                            <div className="flex items-start gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-violet-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-violet-300">Suggested Action</p>
                                <p className="text-sm text-white mt-0.5">{msg.response.proposed_action.label}</p>
                              </div>
                              <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] rounded">
                                {Math.round(msg.response.proposed_action.confidence * 100)}% confident
                              </span>
                            </div>

                            <p className="text-xs text-neutral-400 mb-2">
                              {msg.response.proposed_action.reason}
                            </p>

                            {msg.response.proposed_action.impact_preview && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {Object.entries(msg.response.proposed_action.impact_preview).map(([key, value]) => (
                                  <span key={key} className="px-2 py-0.5 bg-neutral-800 text-neutral-300 text-[10px] rounded">
                                    {key.replace(/_/g, ' ')}: {value}
                                  </span>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() => handleNavigate(msg.response!.proposed_action!)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded transition-colors"
                            >
                              Review in Settings
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Data Sources */}
                        {msg.response?.data_sources && msg.response.data_sources.length > 0 && (
                          <div className="flex items-center gap-2 text-[10px] text-neutral-600">
                            <FileText className="w-3 h-3" />
                            <span>Sources: {msg.response.data_sources.map(s => s.type).join(', ')}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{new Date(msg.response.timestamp).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about stats, costs, logs, failures..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white text-sm rounded-lg transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
            </button>
          </div>
          <p className="text-[10px] text-neutral-600 mt-2 text-center">
            Query mode only. AI recommends, you decide.
          </p>
        </form>
      </div>
    </>
  );
}
