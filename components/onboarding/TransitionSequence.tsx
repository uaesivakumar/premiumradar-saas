'use client';

/**
 * TransitionSequence - Sprint S35
 * Full-screen cinematic transition from onboarding to SIVA workspace
 * "Configuring your intelligence layer..."
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, Brain, Database, Shield, Check } from 'lucide-react';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useOnboardingStore, VerticalId } from '@/lib/stores/onboarding-store';

interface LoadingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  duration: number;
}

/**
 * P2 VERTICALISATION: Updated to use official Vertical types
 */
const VERTICAL_STEPS: Record<VerticalId, LoadingStep[]> = {
  banking: [
    { id: 'connect', label: 'Connecting to banking intelligence network', icon: <Database className="w-5 h-5" />, duration: 1200 },
    { id: 'signals', label: 'Loading digital transformation signals', icon: <Zap className="w-5 h-5" />, duration: 1500 },
    { id: 'compliance', label: 'Configuring regulatory intelligence', icon: <Shield className="w-5 h-5" />, duration: 1000 },
    { id: 'ai', label: 'Training SIVA on banking context', icon: <Brain className="w-5 h-5" />, duration: 1800 },
  ],
  insurance: [
    { id: 'connect', label: 'Connecting to insurance intelligence', icon: <Database className="w-5 h-5" />, duration: 1200 },
    { id: 'signals', label: 'Loading life event signals', icon: <Zap className="w-5 h-5" />, duration: 1400 },
    { id: 'risk', label: 'Configuring individual profiling', icon: <Shield className="w-5 h-5" />, duration: 1300 },
    { id: 'ai', label: 'Training SIVA on insurance context', icon: <Brain className="w-5 h-5" />, duration: 1700 },
  ],
  'real-estate': [
    { id: 'connect', label: 'Connecting to real estate intelligence', icon: <Database className="w-5 h-5" />, duration: 1200 },
    { id: 'market', label: 'Loading buyer & family signals', icon: <Zap className="w-5 h-5" />, duration: 1500 },
    { id: 'proptech', label: 'Mapping territory data', icon: <Shield className="w-5 h-5" />, duration: 1100 },
    { id: 'ai', label: 'Training SIVA on real estate context', icon: <Brain className="w-5 h-5" />, duration: 1600 },
  ],
  recruitment: [
    { id: 'connect', label: 'Connecting to talent intelligence', icon: <Database className="w-5 h-5" />, duration: 1200 },
    { id: 'signals', label: 'Loading candidate signals', icon: <Zap className="w-5 h-5" />, duration: 1400 },
    { id: 'network', label: 'Mapping talent networks', icon: <Shield className="w-5 h-5" />, duration: 1300 },
    { id: 'ai', label: 'Training SIVA on recruitment context', icon: <Brain className="w-5 h-5" />, duration: 1600 },
  ],
  'saas-sales': [
    { id: 'connect', label: 'Connecting to SaaS intelligence', icon: <Database className="w-5 h-5" />, duration: 1200 },
    { id: 'funding', label: 'Loading funding & growth signals', icon: <Zap className="w-5 h-5" />, duration: 1500 },
    { id: 'tech', label: 'Mapping technology stacks', icon: <Shield className="w-5 h-5" />, duration: 1200 },
    { id: 'ai', label: 'Training SIVA on SaaS landscape', icon: <Brain className="w-5 h-5" />, duration: 1600 },
  ],
};

const VERTICAL_NAMES: Record<VerticalId, string> = {
  banking: 'Banking',
  insurance: 'Insurance',
  'real-estate': 'Real Estate',
  recruitment: 'Recruitment',
  'saas-sales': 'SaaS Sales',
};

export function TransitionSequence() {
  const router = useRouter();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const { selectedVertical, profile, completeOnboarding } = useOnboardingStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);
  const [showReadyPrompt, setShowReadyPrompt] = useState(false);

  const steps = selectedVertical ? VERTICAL_STEPS[selectedVertical] : VERTICAL_STEPS.banking;
  const verticalName = selectedVertical ? VERTICAL_NAMES[selectedVertical] : 'General';

  // Run loading sequence
  useEffect(() => {
    const runSequence = async () => {
      // Initial delay
      await new Promise(resolve => setTimeout(resolve, 800));

      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i);
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      }

      // Complete
      setIsComplete(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowReadyPrompt(true);
    };

    runSequence();
  }, [steps]);

  const handleBegin = () => {
    completeOnboarding();
    router.push('/dashboard');
  };

  const overallProgress = isComplete ? 100 : Math.max(0, ((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

        {/* Pulsing orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{ backgroundColor: `${industryConfig.primaryColor}08` }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ backgroundColor: `${industryConfig.secondaryColor}08` }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />

        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Content */}
      <div className="text-center max-w-2xl mx-auto px-8">
        {/* SIVA Orb */}
        <motion.div
          className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center relative"
          animate={{
            scale: isComplete ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.5 }}
        >
          {/* Glow rings */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${industryConfig.primaryColor}30, ${industryConfig.secondaryColor}30)`,
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0.1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <motion.div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${industryConfig.primaryColor}40, ${industryConfig.secondaryColor}40)`,
              border: `1px solid ${industryConfig.primaryColor}30`,
            }}
            animate={{
              boxShadow: [
                `0 0 40px ${industryConfig.primaryColor}30`,
                `0 0 80px ${industryConfig.primaryColor}50`,
                `0 0 40px ${industryConfig.primaryColor}30`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {isComplete ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>
            ) : (
              <Sparkles className="w-12 h-12 text-white" />
            )}
          </motion.div>
        </motion.div>

        {/* Title */}
        <AnimatePresence mode="wait">
          {!showReadyPrompt ? (
            <motion.div key="loading">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Configuring your intelligence layer
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-400 mb-12"
              >
                Setting up {verticalName} intelligence for {profile.name || 'your workspace'}
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-bold text-white mb-2">
                Your workspace is ready
              </h1>
              <p className="text-gray-400 mb-12">
                SIVA is configured and ready to assist you
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Steps */}
        {!showReadyPrompt && (
          <div className="space-y-4 mb-8">
            {steps.map((step, index) => {
              const isActive = currentStepIndex === index;
              const isCompleted = currentStepIndex > index;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl transition-all
                    ${isActive ? 'bg-white/10 border border-white/20' : 'bg-white/5'}
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                      transition-colors
                    `}
                    style={{
                      backgroundColor: isCompleted || isActive
                        ? `${industryConfig.primaryColor}30`
                        : 'rgba(255,255,255,0.05)',
                      color: isCompleted || isActive ? industryConfig.primaryColor : '#6b7280',
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : isActive ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        {step.icon}
                      </motion.div>
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      text-left flex-1 transition-colors
                      ${isCompleted ? 'text-gray-400' : isActive ? 'text-white' : 'text-gray-500'}
                    `}
                  >
                    {step.label}
                  </span>

                  {/* Progress indicator */}
                  {isActive && (
                    <motion.div
                      className="w-16 h-1 bg-white/10 rounded-full overflow-hidden"
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: industryConfig.primaryColor }}
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: step.duration / 1000 }}
                      />
                    </motion.div>
                  )}

                  {/* Completed check */}
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ color: industryConfig.primaryColor }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Overall Progress Bar */}
        {!showReadyPrompt && (
          <div className="mb-8">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: industryConfig.primaryColor }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(overallProgress)}% complete</p>
          </div>
        )}

        {/* Ready Prompt */}
        <AnimatePresence>
          {showReadyPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <motion.button
                onClick={handleBegin}
                className="px-12 py-4 rounded-xl text-white font-semibold text-lg"
                style={{
                  background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    `0 0 20px ${industryConfig.primaryColor}30`,
                    `0 0 40px ${industryConfig.primaryColor}50`,
                    `0 0 20px ${industryConfig.primaryColor}30`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Ready to begin
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-500 text-sm"
              >
                Press Enter or click to start
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TransitionSequence;
