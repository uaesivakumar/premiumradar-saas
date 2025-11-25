'use client';

/**
 * SIVA Input Bar - Sprint S26
 * Always-visible global command bar at the bottom of the AI Surface
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Mic, Paperclip, Command } from 'lucide-react';
import { useSIVAStore, AgentType } from '@/lib/stores/siva-store';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

const QUICK_ACTIONS = [
  { label: 'Find companies', query: 'Find banking companies in UAE with digital transformation signals', agent: 'discovery' as AgentType },
  { label: 'Rank prospects', query: 'Rank my top prospects by Q/T/L/E score', agent: 'ranking' as AgentType },
  { label: 'Draft outreach', query: 'Write an outreach email for Emirates NBD', agent: 'outreach' as AgentType },
  { label: 'Show demo', query: 'Show me a demo of the discovery flow', agent: 'demo' as AgentType },
];

export function SIVAInputBar() {
  const { inputValue, setInputValue, submitQuery, state } = useSIVAStore();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isProcessing = state !== 'idle';

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = () => {
    if (!inputValue.trim() || isProcessing) return;
    submitQuery(inputValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (query: string) => {
    setInputValue(query);
    setShowQuickActions(false);
    // Auto-submit after a brief delay
    setTimeout(() => submitQuery(query), 100);
  };

  return (
    <div className="relative">
      {/* Quick Actions */}
      <AnimatePresence>
        {showQuickActions && !inputValue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 p-2"
          >
            <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/10 p-3 shadow-2xl">
              <p className="text-xs text-gray-400 mb-2 px-2">Quick actions</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.query)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-all text-left"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Container */}
      <motion.div
        className={`relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border transition-all duration-300 ${
          isFocused ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-white/10'
        }`}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
      >
        {/* Input Row */}
        <div className="flex items-end gap-3 p-3">
          {/* SIVA Icon */}
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
            }}
            animate={{
              scale: isProcessing ? [1, 1.1, 1] : 1,
            }}
            transition={{
              repeat: isProcessing ? Infinity : 0,
              duration: 1.5,
            }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                setShowQuickActions(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                setTimeout(() => setShowQuickActions(false), 200);
              }}
              placeholder="Ask SIVA anything..."
              disabled={isProcessing}
              rows={1}
              className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-base leading-relaxed py-2 disabled:opacity-50"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />

            {/* Keyboard Hint */}
            {!isFocused && !inputValue && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-500">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Attachment */}
            <button
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
              disabled={isProcessing}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Voice */}
            <button
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
              disabled={isProcessing}
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Send */}
            <motion.button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || isProcessing}
              className="p-2 rounded-xl text-white transition-all disabled:opacity-30"
              style={{
                background: inputValue.trim() && !isProcessing
                  ? `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`
                  : 'rgba(255,255,255,0.1)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Processing Indicator */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
              style={{
                background: `linear-gradient(90deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default SIVAInputBar;
