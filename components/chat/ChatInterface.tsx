'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useLocaleStore } from '@/lib/stores/locale-store';
import { MessageBubble, Message } from './MessageBubble';
import { QuickIntentCards } from './QuickIntentCards';
import { TypingIndicator } from './TypingIndicator';

// Sprint 76: Use real SIVA API instead of mock
const UPR_OS_URL = process.env.NEXT_PUBLIC_UPR_OS_URL || 'https://upr-os.sivakumar.ai';

/**
 * Call SIVA Chat API for intelligent responses
 */
async function callSivaChat(message: string, context?: Record<string, unknown>): Promise<string> {
  try {
    const response = await fetch(`${UPR_OS_URL}/api/chat/nlu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Source': 'saas-chat-interface',
      },
      body: JSON.stringify({
        message,
        context: {
          vertical: 'banking',
          sub_vertical: 'employee-banking',
          region: 'UAE',
          ...context,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.response) {
      return data.response;
    }

    // Fallback to natural language response from the API
    if (data.intent && data.tools_suggested) {
      const toolsList = data.tools_suggested.join(', ');
      return `I understand you're asking about ${data.intent}. I can help with ${toolsList}. Let me analyze this for you using SIVA intelligence.`;
    }

    return data.message || 'I can help you with that. What specific information would you like?';
  } catch (error) {
    console.error('[ChatInterface] SIVA API error:', error);
    // Graceful fallback
    return 'I\'m analyzing your request. Our intelligence system is processing your query about the banking sector.';
  }
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const { detectedIndustry, detectFromInput } = useIndustryStore();
  const { locale } = useLocaleStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Detect industry from user input
    detectFromInput(text);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Sprint 76: Call real SIVA API
      const response = await callSivaChat(text, {
        industry: detectedIndustry,
        locale,
      });

      setIsTyping(false);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('[ChatInterface] Error:', error);
      setIsTyping(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an issue processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleQuickIntent = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
            style={{
              borderTop: `3px solid ${industryConfig.primaryColor}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: industryConfig.primaryColor }}
                >
                  {industryConfig.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {locale === 'ar' ? 'مساعد PremiumRadar' : 'PremiumRadar Assistant'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {detectedIndustry !== 'general'
                      ? `${industryConfig.name} ${locale === 'ar' ? 'خبير' : 'Expert'}`
                      : locale === 'ar' ? 'جاهز للمساعدة' : 'Ready to help'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-[200px] max-h-[400px]">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-4"
                    style={{ backgroundColor: `${industryConfig.primaryColor}20` }}
                  >
                    {industryConfig.icon}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {locale === 'ar' ? 'مرحباً! كيف يمكنني مساعدتك؟' : 'Hi! How can I help you today?'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-6">
                    {locale === 'ar'
                      ? 'اسألني عن تحليل المنافسين، رؤى السوق، أو أخبرني عن صناعتك'
                      : 'Ask me about competitor analysis, market insights, or tell me about your industry'}
                  </p>
                  <QuickIntentCards onSelect={handleQuickIntent} />
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={locale === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all"
                  style={{ '--tw-ring-color': industryConfig.primaryColor } as React.CSSProperties}
                  disabled={isTyping}
                />
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isTyping}
                  className="p-3 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                  style={{ backgroundColor: industryConfig.primaryColor }}
                  aria-label="Send message"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
