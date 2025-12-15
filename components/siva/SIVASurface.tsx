'use client';

/**
 * SIVA Surface - AI-Native Pageless Experience
 *
 * DESIGN PRINCIPLES (Non-Negotiable):
 * - SIVA is the product, not an assistant inside it
 * - User expresses intent, SIVA decides, UI renders
 * - No feature buttons (Discovery/Ranking/Outreach)
 * - Progressive reasoning flow, not separate tools
 * - Every response ends with smart next step
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Brain, Target, Users, Mail } from 'lucide-react';
import { useSIVAStore } from '@/lib/stores/siva-store';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useSalesContextStore, selectVertical, selectSubVertical, selectRegions } from '@/lib/stores/sales-context-store';
import { getVerticalDisplayName } from '@/lib/vertical';
import { PremiumRadarLogo } from '@/components/brand/PremiumRadarLogo';
import { SIVAInputBar } from './SIVAInputBar';
import { OutputObjectRenderer } from './OutputObjectRenderer';
import { ReasoningOverlay, ReasoningToggle } from './ReasoningOverlay';

export function SIVASurface() {
  const { messages, outputObjects, state, reasoningSteps, showReasoningOverlay, toggleReasoningOverlay, submitQuery } = useSIVAStore();
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
  }, [messages, outputObjects]);

  // Proactive SIVA - Auto-run discovery on load (only once)
  useEffect(() => {
    if (!hasRunProactive && vertical && subVertical && messages.length === 0) {
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
        if (messages.length === 0 && outputObjects.length === 0) {
          setLoadingError('Taking longer than expected. Please refresh or try again.');
        }
      }, 20000);

      return () => {
        clearTimeout(startTimer);
        clearTimeout(timeoutTimer);
      };
    }
  }, [vertical, subVertical, hasRunProactive, messages.length, outputObjects.length, submitQuery]);

  const hasContent = messages.length > 0 || outputObjects.length > 0;

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

          {/* Conversation + Output Objects */}
          {showResults && (
            <div className="space-y-6">
              {/* Messages with Reasoning Prelude */}
              {messages.map((message, idx) => (
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
                    <p className="text-white whitespace-pre-wrap">{message.content}</p>

                    {/* Smart Next Steps - Only for last SIVA message */}
                    {message.role === 'siva' && idx === messages.length - 1 && (
                      <SmartNextSteps
                        messageContent={message.content}
                        outputObjects={message.outputObjects}
                        onSelect={submitQuery}
                        color={industryConfig.primaryColor}
                      />
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Output Objects - Single Column for Focus */}
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

      {/* DEBUG OVERLAY - TEMPORARY - Remove after fix confirmed */}
      <SIVADebugPanel
        state={state}
        hasContent={hasContent}
        resultCount={outputObjects.length}
        messageCount={messages.length}
        isProactiveLoading={isProactiveLoading}
        showThinking={showThinking}
        showResults={showResults}
        showEmpty={showEmpty}
        renderMode={showThinking ? 'placeholder' : showResults ? 'results' : showEmpty ? 'empty' : 'unknown'}
      />
    </div>
  );
}

// Simple Loading State - Clean and reliable
function SIVAThinkingState({
  regions,
  primaryColor,
}: {
  regions: string[];
  primaryColor: string;
}) {
  const regionText = regions.length > 0 ? regions.join(', ') : 'UAE';

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

      {/* Simple loading dots */}
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

      {/* Anticipation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="mt-8 text-gray-400 text-sm italic"
      >
        Surfacing employers worth your time...
      </motion.p>
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

// Smart Next Steps - Context-aware suggestions
function SmartNextSteps({
  messageContent,
  outputObjects,
  onSelect,
  color,
}: {
  messageContent: string;
  outputObjects?: Array<{ type: string }>;
  onSelect: (query: string) => void;
  color: string;
}) {
  // Determine context-aware suggestions based on what was just shown
  const suggestions = getSmartSuggestions(messageContent, outputObjects);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-4 pt-4 border-t border-white/5"
    >
      <p className="text-xs text-gray-500 mb-2">What would you like to do next?</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <motion.button
            key={idx}
            onClick={() => onSelect(suggestion.query)}
            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:border-white/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {suggestion.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Generate context-aware suggestions
function getSmartSuggestions(
  messageContent: string,
  outputObjects?: Array<{ type: string }>
): Array<{ label: string; query: string }> {
  const content = messageContent.toLowerCase();
  const hasDiscovery = outputObjects?.some(o => o.type === 'discovery');
  const hasRanking = outputObjects?.some(o => o.type === 'ranking');
  const hasContacts = outputObjects?.some(o => o.type === 'contacts');
  const hasOutreach = outputObjects?.some(o => o.type === 'outreach');

  // After discovery
  if (hasDiscovery) {
    return [
      { label: 'Rank these by opportunity', query: 'Rank these employers by payroll opportunity' },
      { label: 'Find contacts at the top one', query: 'Find HR decision makers at the top employer' },
      { label: 'Exclude enterprise brands', query: 'Show employers excluding large enterprise brands' },
    ];
  }

  // After ranking
  if (hasRanking) {
    return [
      { label: 'Show me contacts for #1', query: 'Find HR decision makers at the top ranked employer' },
      { label: 'Draft outreach for the best', query: 'Draft outreach for the top ranked employer' },
      { label: 'Why is #1 ranked highest?', query: 'Explain why the top employer is ranked first' },
    ];
  }

  // After contacts
  if (hasContacts) {
    return [
      { label: 'Draft outreach', query: 'Draft outreach for this contact' },
      { label: 'Find more contacts', query: 'Find additional decision makers at this company' },
      { label: 'Show company signals', query: 'Show me the hiring signals for this company' },
    ];
  }

  // After outreach
  if (hasOutreach) {
    return [
      { label: 'Make it shorter', query: 'Make the outreach more concise' },
      { label: 'Change tone to formal', query: 'Rewrite with a more formal tone' },
      { label: 'Find next best prospect', query: 'Show me the next best employer to contact' },
    ];
  }

  // Default suggestions
  return [
    { label: 'Find new opportunities', query: 'Find employers with strong hiring signals' },
    { label: 'Show my best prospects', query: 'Rank employers by payroll opportunity' },
  ];
}

// DEBUG PANEL - TEMPORARY - Shows live state values
function SIVADebugPanel({
  state,
  hasContent,
  resultCount,
  messageCount,
  isProactiveLoading,
  showThinking,
  showResults,
  showEmpty,
  renderMode,
}: {
  state: string;
  hasContent: boolean;
  resultCount: number;
  messageCount: number;
  isProactiveLoading: boolean;
  showThinking: boolean;
  showResults: boolean;
  showEmpty: boolean;
  renderMode: string;
}) {
  return (
    <div className="fixed top-4 left-4 z-[9999] bg-black/90 border border-yellow-500 rounded-lg p-3 font-mono text-xs text-white shadow-xl">
      <div className="text-yellow-400 font-bold mb-2">DEBUG</div>
      <div className="space-y-1">
        <div>State: <span className="text-cyan-400">{state.toUpperCase()}</span></div>
        <div>HasContent: <span className={hasContent ? 'text-green-400' : 'text-red-400'}>{hasContent.toString()}</span></div>
        <div>ResultCount: <span className="text-cyan-400">{resultCount}</span></div>
        <div>MessageCount: <span className="text-cyan-400">{messageCount}</span></div>
        <div>ProactiveLoading: <span className={isProactiveLoading ? 'text-yellow-400' : 'text-gray-500'}>{isProactiveLoading.toString()}</span></div>
        <div className="border-t border-white/20 pt-1 mt-1">
          <div>showThinking: <span className={showThinking ? 'text-yellow-400' : 'text-gray-500'}>{showThinking.toString()}</span></div>
          <div>showResults: <span className={showResults ? 'text-green-400' : 'text-gray-500'}>{showResults.toString()}</span></div>
          <div>showEmpty: <span className={showEmpty ? 'text-blue-400' : 'text-gray-500'}>{showEmpty.toString()}</span></div>
        </div>
        <div className="border-t border-white/20 pt-1 mt-1">
          <div>RenderMode: <span className="text-pink-400 font-bold">{renderMode.toUpperCase()}</span></div>
        </div>
      </div>
    </div>
  );
}

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
