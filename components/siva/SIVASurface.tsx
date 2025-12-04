'use client';

/**
 * SIVA Surface - Sprint S26-S30
 * Full-screen AI canvas - the pageless workspace
 * With Multi-Agent Orchestration & Reasoning Overlay
 *
 * P2 VERTICALISATION: Now uses dynamic content based on sales context vertical.
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, Zap } from 'lucide-react';
import { useSIVAStore } from '@/lib/stores/siva-store';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';
import { getQuickActionsForVertical, getVerticalDisplayName } from '@/lib/vertical';
import { SIVAPersonaPanel } from './SIVAPersonaPanel';
import { SIVAInputBar } from './SIVAInputBar';
import { OutputObjectRenderer } from './OutputObjectRenderer';
import { AgentSwitcher } from './AgentSwitcher';
import { ReasoningOverlay, ReasoningToggle } from './ReasoningOverlay';

export function SIVASurface() {
  const { messages, outputObjects, state, showReasoningOverlay, toggleReasoningOverlay } = useSIVAStore();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const resultsRef = useRef<HTMLDivElement>(null);

  // P2 VERTICALISATION: Get vertical-specific quick actions
  const vertical = useSalesContextStore(selectVertical);
  const quickActions = getQuickActionsForVertical(vertical);
  const verticalName = getVerticalDisplayName(vertical);

  // Auto-scroll to latest content
  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTo({
        top: resultsRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, outputObjects]);

  const hasContent = messages.length > 0 || outputObjects.length > 0;

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950">
      {/* Neural Mesh Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: `${industryConfig.primaryColor}15` }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: `${industryConfig.secondaryColor}15` }}
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Persona Panel */}
      <SIVAPersonaPanel />

      {/* Result Surface */}
      <div
        ref={resultsRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 lg:px-16 py-8"
      >
        <div className="max-w-5xl mx-auto">
          {/* Empty State */}
          {!hasContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              {/* SIVA Orb */}
              <motion.div
                className="w-32 h-32 rounded-full flex items-center justify-center mb-8"
                style={{
                  background: `linear-gradient(135deg, ${industryConfig.primaryColor}30, ${industryConfig.secondaryColor}30)`,
                  border: `1px solid ${industryConfig.primaryColor}20`,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    `0 0 40px ${industryConfig.primaryColor}20`,
                    `0 0 60px ${industryConfig.primaryColor}30`,
                    `0 0 40px ${industryConfig.primaryColor}20`,
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-16 h-16 text-white/80" />
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Hello, I'm{' '}
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
                  }}
                >
                  SIVA
                </span>
              </h1>
              <p className="text-gray-400 text-lg mb-8 max-w-md">
                Your AI {verticalName} Sales Intelligence Assistant. Ask me to discover targets,
                rank prospects, or craft outreach messages.
              </p>

              {/* Quick Start Suggestions - P2 VERTICALISATION: Dynamic based on vertical */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                {quickActions.slice(0, 3).map((action, idx) => (
                  <QuickStartCard
                    key={action.label}
                    icon={idx === 0 ? <Zap className="w-5 h-5" /> : idx === 1 ? <MessageSquare className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    title={action.label}
                    description={action.query}
                    color={idx === 0 ? industryConfig.primaryColor : idx === 1 ? industryConfig.secondaryColor : "#8B5CF6"}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Conversation + Output Objects */}
          {hasContent && (
            <div className="space-y-6">
              {/* Messages */}
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500/20 border-blue-500/30'
                        : 'bg-slate-800/60 border-white/10'
                    } rounded-2xl border px-5 py-4`}
                  >
                    {message.role === 'siva' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
                          }}
                        >
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">SIVA</span>
                      </div>
                    )}
                    <p className="text-white">{message.content}</p>
                  </div>
                </motion.div>
              ))}

              {/* Output Objects Grid */}
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {outputObjects.map((obj) => (
                    <OutputObjectRenderer key={obj.id} object={obj} />
                  ))}
                </div>
              </AnimatePresence>

              {/* Processing Indicator */}
              {state !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-800/60 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-blue-400"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 rounded-full bg-purple-400"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                      />
                      <motion.div
                        className="w-2 h-2 rounded-full bg-pink-400"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                      />
                    </div>
                    <span className="text-gray-400 text-sm">SIVA is {state}...</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Bar with Agent Switcher */}
      <div className="flex-shrink-0 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Agent Switcher - S28 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <AgentSwitcher size="sm" />
          </motion.div>

          {/* Command Bar */}
          <SIVAInputBar />
        </div>
      </div>

      {/* Reasoning Toggle Button - S29 */}
      <ReasoningToggle />

      {/* Reasoning Overlay Panel - S29 */}
      <AnimatePresence>
        {showReasoningOverlay && (
          <ReasoningOverlay isOpen={showReasoningOverlay} onClose={toggleReasoningOverlay} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick Start Card
function QuickStartCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const { submitQuery } = useSIVAStore();

  return (
    <motion.button
      onClick={() => submitQuery(description)}
      className="p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-white/20 transition-all group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all group-hover:scale-110"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
        {description}
      </p>
    </motion.button>
  );
}

export default SIVASurface;
