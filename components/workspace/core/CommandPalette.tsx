'use client';

/**
 * CommandPalette - S371: Pageless Core Surface
 *
 * Bottom command input that resolves to cards, not chat messages.
 *
 * WORKSPACE UX (LOCKED):
 * - Input resolves to cards, not chat bubbles
 * - No scrolling transcript
 * - No conversation history
 *
 * Full command resolution logic will be added in S373.
 * This is the UI shell.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useCardStore } from '@/lib/stores/card-store';
import { createSignalCard } from '@/lib/workspace/card-state';
import { getExpiryTime } from '@/lib/workspace/ttl-engine';

interface CommandPaletteProps {
  placeholder?: string;
}

export function CommandPalette({
  placeholder = "Ask about a company or type 'what should I do next?'",
}: CommandPaletteProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addCard } = useCardStore();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const query = input.trim();
      if (!query || isProcessing) return;

      setIsProcessing(true);
      setInput('');

      try {
        // S371: Temporary - create a placeholder signal card
        // S373 will implement full command resolution with OS/SIVA integration
        console.log('[CommandPalette] Query submitted:', query);

        // TODO: Replace with CommandResolver.resolveCommand(query) in S373
        // For now, create a simple signal card to demonstrate the flow
        const card = createSignalCard({
          title: `Query: ${query.slice(0, 50)}${query.length > 50 ? '...' : ''}`,
          summary: 'Processing your request. Command resolution pending S373.',
          expiresAt: getExpiryTime('signal'),
        });

        addCard(card);
      } catch (error) {
        console.error('[CommandPalette] Error:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [input, isProcessing, addCard]
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isProcessing}
          className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all pr-14"
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

      {/* Smart Hint - Context-aware (placeholder for S373) */}
      <p className="text-center text-xs text-gray-600 mt-2">
        Cards appear above. No chat history.
      </p>
    </form>
  );
}

export default CommandPalette;
