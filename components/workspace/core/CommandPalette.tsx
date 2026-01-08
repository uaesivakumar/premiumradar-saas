'use client';

/**
 * CommandPalette - S373: Command Palette (Non-Chat)
 *
 * Bottom command input that resolves to cards, not chat messages.
 *
 * WORKSPACE UX (LOCKED):
 * - Input resolves to cards, not chat bubbles
 * - No scrolling transcript
 * - No conversation history
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { useCardStore } from '@/lib/stores/card-store';
import { createSystemCard } from '@/lib/workspace/card-state';
import { getExpiryTime } from '@/lib/workspace/ttl-engine';
import { resolveCommand } from '@/lib/workspace/command-resolver';
import { CommandHints } from './CommandHints';

interface CommandPaletteProps {
  placeholder?: string;
}

export function CommandPalette({
  placeholder = "Ask about a company or type 'what should I do next?'",
}: CommandPaletteProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addCard } = useCardStore();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const query = input.trim();
      if (!query || isProcessing) return;

      setIsProcessing(true);
      setInput('');
      setError(null);

      try {
        console.log('[CommandPalette] Resolving command:', query);

        // S373: Use command resolver for intent → card resolution
        // S382: Query is stored in discovery context for inline display (like ChatGPT)
        const result = await resolveCommand(query);

        if (!result.success) {
          setError(result.error || 'Failed to process command');
          // Still add an error card
          addCard(
            createSystemCard({
              title: 'Error',
              summary: result.error || 'Failed to process your request.',
              expiresAt: getExpiryTime('system'),
            })
          );
        } else {
          // Add all resolved cards
          for (const cardData of result.cards) {
            addCard(cardData);
          }
        }
      } catch (err) {
        console.error('[CommandPalette] Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsProcessing(false);
      }
    },
    [input, isProcessing, addCard]
  );

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isProcessing}
            className={`w-full px-5 py-4 bg-white/5 border rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all pr-14 ${
              error
                ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                : 'border-white/10 focus:border-white/20 focus:ring-white/20'
            }`}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-3 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 left-0 right-0 flex items-center justify-center gap-2 text-xs text-red-400"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </motion.div>
        )}
      </form>

      {/* Smart Hints - Context-aware */}
      <CommandHints visible={!isProcessing && !error} />
    </div>
  );
}

export default CommandPalette;
