'use client';

/**
 * @deprecated S371: This component is deprecated.
 * Use WorkspaceSurface from components/workspace/core instead.
 *
 * SIVASurface used chat-based message rendering which violates
 * WORKSPACE_UX_DECISION.md. The new WorkspaceSurface uses
 * card-based rendering with no conversation history.
 *
 * TODO: Delete this file in S372 after migration is complete.
 *
 * OLD DESIGN PRINCIPLES (no longer apply):
 * - SIVA is the product, not an assistant inside it
 * - User expresses intent, SIVA decides, UI renders
 * - No feature buttons (Discovery/Ranking/Outreach)
 * - Progressive reasoning flow, not separate tools
 * - Every response ends with smart next step
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// S369: Sparkles removed - was used for message bubbles
import { ArrowRight, Brain, Target, Users, Mail } from 'lucide-react';
import { useSIVAStore } from '@/lib/stores/siva-store';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useSalesContextStore, selectVertical, selectSubVertical, selectRegions } from '@/lib/stores/sales-context-store';
import { getVerticalDisplayName } from '@/lib/vertical';
import { PremiumRadarLogo } from '@/components/brand/PremiumRadarLogo';
import { SIVAInputBar } from './SIVAInputBar';
import { OutputObjectRenderer } from './OutputObjectRenderer';
import { ReasoningOverlay, ReasoningToggle } from './ReasoningOverlay';

export function SIVASurface() {
  // S369: messages REMOVED - conversation is ephemeral, cards are the only visible artifacts
  const { outputObjects, state, reasoningSteps, showReasoningOverlay, toggleReasoningOverlay, submitQuery } = useSIVAStore();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const resultsRef = useRef<HTMLDivElement>(null);

  const vertical = useSalesContextStore(selectVertical);
  const subVertical = useSalesContextStore(selectSubVertical);
  const regions = useSalesContextStore(selectRegions);
  const verticalName = getVerticalDisplayName(vertical);

  // Proactive mode state
  const [isProactiveLoading, setIsProactiveLoading] = useState(false);
  const [hasRunProactive, setHasRunProactive] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // CRITICAL: ProactiveLoading must turn OFF when SIVA completes
  // This is the bootstrap flag shutdown - it can NEVER stay true after first completion
  useEffect(() => {
    if (state === 'complete' || state === 'error' || state === 'idle') {
      if (isProactiveLoading && hasRunProactive) {
        setIsProactiveLoading(false);
      }
    }
  }, [state, isProactiveLoading, hasRunProactive]);


  // Auto-scroll to latest content
  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTo({
        top: resultsRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [outputObjects]); // S369: messages removed

  // Proactive SIVA - Auto-run discovery on load (only once)
  // S369: messages.length replaced with outputObjects.length - cards are the only artifacts
  useEffect(() => {
    if (!hasRunProactive && vertical && subVertical && outputObjects.length === 0) {
      setHasRunProactive(true);
      setIsProactiveLoading(true);
      setLoadingError(null);

      // Start discovery after brief delay
      const startTimer = setTimeout(async () => {
        setIsProactiveLoading(false);
        try {
          await submitQuery('Find employers with strong hiring signals in UAE');
        } catch (err) {
          setLoadingError('Unable to load results. Please try again.');
        }
      }, 1500);

      // Timeout - if still no content after 20s, show error
      const timeoutTimer = setTimeout(() => {
        if (outputObjects.length === 0) {
          setLoadingError('Taking longer than expected. Please refresh or try again.');
        }
      }, 20000);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(timeoutTimer);
      };
    }
  }, [vertical, subVertical, hasRunProactive, outputObjects.length, submitQuery]);

  // S369: hasContent based on outputObjects only - messages removed
  const hasContent = outputObjects.length > 0;

  // STATE-DRIVEN RENDERING (not data truthiness)
  const isActivelyWorking = state === 'thinking' || state === 'listening' || state === 'generating';
  const isComplete = state === 'complete' || state === 'idle';
  const isError = state === 'error';

  // Show thinking ONLY when actively working
  const showThinking = isActivelyWorking || isProactiveLoading;
  // Show results when complete AND has content
  const showResults = isComplete && hasContent;
  // Show empty state when idle with no content and not loading
  const showEmpty = isComplete && !hasContent && !isProactiveLoading && !loadingError;

  const currentStep = reasoningSteps.find(s => s.status === 'active');

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

      {/* Result Surface */}
      <div
        ref={resultsRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 lg:px-16 py-8"
      >
        <div className="max-w-4xl mx-auto">
          {/* Empty State - SIVA Awakening (only when truly idle) */}
          {showEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <motion.div
                className="mb-8"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <PremiumRadarLogo size="xl" color={industryConfig.primaryColor} animate />
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                I'm{' '}
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
                Your {verticalName} intelligence partner.
                <br />
                <span className="text-gray-500 text-base">
                  Tell me what you're looking for.
                </span>
              </p>

              {/* Intent Starters - Not Feature Buttons */}
              <div className="space-y-3 w-full max-w-lg">
                <IntentStarter
                  icon={<Target className="w-5 h-5" />}
                  text="Help me find strong payroll opportunities"
                  color={industryConfig.primaryColor}
                  onClick={() => submitQuery('Find employers with strong hiring signals in UAE')}
                />
                <IntentStarter
                  icon={<Users className="w-5 h-5" />}
                  text="Show me who's worth calling now"
                  color={industryConfig.secondaryColor}
                  onClick={() => submitQuery('Rank top employers by payroll opportunity')}
                />
                <IntentStarter
                  icon={<Mail className="w-5 h-5" />}
                  text="Draft an outreach for my best prospect"
                  color="#8B5CF6"
                  onClick={() => submitQuery('Draft outreach for the top employer')}
                />
              </div>
            </motion.div>
          )}

          {/* Loading Error State */}
          {loadingError && !hasContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-white text-lg mb-2">{loadingError}</p>
              <button
                onClick={() => {
                  setLoadingError(null);
                  setHasRunProactive(false);
                }}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Proactive Loading State - SIVA Thinking For You */}
          <AnimatePresence>
            {showThinking && !hasContent && !loadingError && (
              <SIVAThinkingState
                regions={regions}
                primaryColor={industryConfig.primaryColor}
              />
            )}
          </AnimatePresence>

          {/* S369: Cards Only - No Chat Messages */}
          {/* WORKSPACE UX (LOCKED): Cards are the only visible artifacts */}
          {showResults && (
            <div className="space-y-6">
              {/* Output Objects as Cards - Single Column for Focus */}
              <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                  {outputObjects.map((obj) => (
                    <OutputObjectRenderer key={obj.id} object={obj} />
                  ))}
                </div>
              </AnimatePresence>

              {/* Reasoning Prelude - Shows BEFORE results */}
              {isActivelyWorking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-800/80 border border-white/10 rounded-2xl px-5 py-4 max-w-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Brain className="w-5 h-5 text-purple-400" />
                      </motion.div>
                      <span className="text-sm font-medium text-gray-300">SIVA is thinking...</span>
                    </div>

                    {/* Live Reasoning Step */}
                    {currentStep && (
                      <motion.p
                        key={currentStep.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-gray-400 text-sm italic"
                      >
                        {currentStep.title}
                      </motion.p>
                    )}

                    {/* Progress dots */}
                    <div className="flex gap-1 mt-3">
                      {reasoningSteps.map((step, i) => (
                        <motion.div
                          key={step.id}
                          className={`w-2 h-2 rounded-full ${
                            step.status === 'complete'
                              ? 'bg-green-400'
                              : step.status === 'active'
                              ? 'bg-purple-400'
                              : 'bg-gray-600'
                          }`}
                          animate={step.status === 'active' ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 0.5, repeat: step.status === 'active' ? Infinity : 0 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Bar - No Agent Switcher */}
      <div className="flex-shrink-0 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
        <div className="max-w-3xl mx-auto">
          <SIVAInputBar />
        </div>
      </div>

      {/* Reasoning Toggle - "Open My Mind" */}
      <ReasoningToggle />

      {/* Reasoning Overlay Panel */}
      <AnimatePresence>
        {showReasoningOverlay && (
          <ReasoningOverlay isOpen={showReasoningOverlay} onClose={toggleReasoningOverlay} />
        )}
      </AnimatePresence>

      {/* SIVA Heartbeat - Always visible state indicator */}
      <SIVAHeartbeat state={state} />
    </div>
  );
}

// Engaging tips for loading state
const LOADING_TIPS = [
  { emoji: '💡', tip: 'Companies with recent funding rounds are 3x more likely to expand payroll' },
  { emoji: '📊', tip: 'DIFC-based companies typically have 40% larger average employee counts' },
  { emoji: '🎯', tip: 'HR Directors respond 2x better to personalized outreach vs templates' },
  { emoji: '⚡', tip: 'Follow up within 48 hours of a hiring signal for best conversion' },
  { emoji: '🏢', tip: 'New office openings = immediate need for local banking setup' },
  { emoji: '📈', tip: 'Companies in growth mode often consolidate payroll to one provider' },
  { emoji: '🤝', tip: 'Reference the specific hiring signal in your outreach for credibility' },
  { emoji: '🔥', tip: 'Series B+ funded companies expand payroll 60% faster than bootstrapped' },
];

// Simple Loading State with Engaging Tips
function SIVAThinkingState({
  regions,
  primaryColor,
}: {
  regions: string[];
  primaryColor: string;
}) {
  const regionText = regions.length > 0 ? regions.join(', ') : 'UAE';
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rotate tips every 4 seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 4000);

    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(tipInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const currentTip = LOADING_TIPS[tipIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      {/* Pulsing Brain Icon */}
      <motion.div
        className="mb-6"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}15)`,
            boxShadow: `0 0 40px ${primaryColor}20`,
          }}
        >
          <Brain className="w-8 h-8 text-white/90" />
        </div>
      </motion.div>

      {/* Simple status text */}
      <motion.p
        className="text-white text-lg font-medium mb-2"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Analyzing employer signals...
      </motion.p>

      <p className="text-gray-500 text-sm mb-6">
        in {regionText}
      </p>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white/40"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 font-mono">{elapsedSeconds}s</span>
      </div>

      {/* Rotating Tips - Value during wait */}
      <motion.div
        key={tipIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-md mx-auto p-4 bg-white/5 rounded-xl border border-white/10"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{currentTip.emoji}</span>
          <div className="text-left">
            <p className="text-xs text-gray-500 mb-1">Did you know?</p>
            <p className="text-sm text-gray-300">{currentTip.tip}</p>
          </div>
        </div>
      </motion.div>

      {/* Tip counter */}
      <div className="flex gap-1 mt-4">
        {LOADING_TIPS.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === tipIndex ? 'bg-white/60 w-3' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Intent Starter - Conversational, not action-like
function IntentStarter({
  icon,
  text,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-white/20 transition-all group"
      whileHover={{ scale: 1.01, x: 5 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <span className="text-gray-300 group-hover:text-white transition-colors flex-1">
        {text}
      </span>
      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
    </motion.button>
  );
}

// S369: SmartNextSteps and getSmartSuggestions REMOVED
// These were tied to chat message rendering which violates WORKSPACE_UX_DECISION.md
// Future: Implement card-based NBA suggestions via NBA Engine instead

// SIVA Heartbeat - Always visible state indicator (bottom-right)
function SIVAHeartbeat({ state }: { state: string }) {
  const colorMap: Record<string, string> = {
    idle: 'bg-green-500',
    listening: 'bg-blue-500 animate-pulse',
    thinking: 'bg-blue-500 animate-pulse',
    generating: 'bg-yellow-500 animate-pulse',
    complete: 'bg-green-400',
    error: 'bg-red-500',
  };

  const labelMap: Record<string, string> = {
    idle: 'Ready',
    listening: 'Listening...',
    thinking: 'Thinking...',
    generating: 'Generating...',
    complete: 'Done',
    error: 'Error',
  };

  const color = colorMap[state] ?? 'bg-gray-500';
  const label = labelMap[state] ?? state;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-xs shadow-lg backdrop-blur-sm z-50"
    >
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-gray-400">SIVA</span>
      <span className="text-white/70">{label}</span>
    </motion.div>
  );
}

export default SIVASurface;
