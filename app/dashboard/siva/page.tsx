'use client';

/**
 * SIVA Page - Sprint S137
 *
 * Full-screen SIVA Surface with context-anchored chat history.
 * Every conversation is anchored to:
 * - Vertical / Sub-Vertical / Region (SalesContext)
 * - Journey stage (onboarding, first-use, learning, experienced)
 * - Pack version and Persona version
 * - Signal snapshot at time of message
 *
 * This ensures ONE CONSCIOUSNESS of SIVA across all surfaces.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SIVASurface } from '@/components/siva';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useSIVAContextHistory } from '@/lib/siva/useSIVAContextHistory';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import {
  History,
  X,
  Search,
  Download,
  MessageSquare,
  Clock,
  Filter,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function SIVAPage() {
  const { vertical, subVertical, regions, region } = useSalesContext();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const {
    currentThread,
    getAllThreads,
    switchThread,
    searchHistory,
    exportConversation,
    getCurrentContext,
  } = useSIVAContextHistory();

  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredThreads, setFilteredThreads] = useState<ReturnType<typeof getAllThreads>>([]);

  // Log context for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[SIVA] Context:', { vertical, subVertical, regions, region });
  }

  // Update filtered threads when search changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchHistory(searchQuery);
      setFilteredThreads(results);
    } else {
      setFilteredThreads(getAllThreads());
    }
  }, [searchQuery, searchHistory, getAllThreads]);

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Format context display
  const formatContext = (ctx: ReturnType<typeof getCurrentContext>) => {
    return `${ctx.subVertical?.replace(/-/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase())} | ${ctx.regions?.join(', ')}`;
  };

  // Handle export
  const handleExport = () => {
    const markdown = exportConversation();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siva-conversation-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative h-full">
      {/* Main SIVA Surface */}
      <SIVASurface />

      {/* History Toggle Button */}
      <motion.button
        onClick={() => setShowHistory(true)}
        className="fixed top-20 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <History size={18} />
        <span className="text-sm font-medium">History</span>
      </motion.button>

      {/* Context Badge */}
      <div className="fixed top-20 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: industryConfig.primaryColor }}
        />
        <span className="text-xs text-white/80">
          {formatContext(getCurrentContext())}
        </span>
      </div>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-96 z-50 bg-slate-900 border-l border-white/10 flex flex-col"
            >
              {/* Header */}
              <div className="flex-shrink-0 p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History size={20} className="text-white" />
                    <h2 className="text-lg font-semibold text-white">Chat History</h2>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    <X size={20} className="text-white/60" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Download size={14} />
                    Export
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <Filter size={14} />
                    Filter
                  </button>
                </div>
              </div>

              {/* Thread List */}
              <div className="flex-1 overflow-y-auto">
                {filteredThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                    <MessageSquare size={40} className="text-white/20 mb-4" />
                    <p className="text-white/60 text-sm">No conversations yet</p>
                    <p className="text-white/40 text-xs mt-1">
                      Start chatting with SIVA to see history here
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filteredThreads.map((thread) => (
                      <button
                        key={thread.id}
                        onClick={() => {
                          switchThread(thread.id);
                          setShowHistory(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                          currentThread?.id === thread.id ? 'bg-white/10' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${industryConfig.primaryColor}30, ${industryConfig.secondaryColor}30)`,
                            }}
                          >
                            <Sparkles size={14} className="text-white/80" />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Title */}
                            <p className="text-sm font-medium text-white truncate">
                              {thread.messages[0]?.content?.slice(0, 50) || 'New conversation'}
                              {(thread.messages[0]?.content?.length || 0) > 50 ? '...' : ''}
                            </p>

                            {/* Context */}
                            <p className="text-xs text-white/40 mt-0.5">
                              {thread.context.subVertical?.replace(/-/g, ' ')} | {thread.context.regions?.[0]}
                            </p>

                            {/* Metadata */}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="flex items-center gap-1 text-xs text-white/30">
                                <Clock size={12} />
                                {formatDate(thread.updatedAt)}
                              </span>
                              <span className="text-xs text-white/30">
                                {thread.messages.length} messages
                              </span>
                            </div>
                          </div>

                          <ChevronRight size={16} className="text-white/20 flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-4 border-t border-white/10">
                <p className="text-xs text-white/30 text-center">
                  All conversations are anchored to your sales context
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
