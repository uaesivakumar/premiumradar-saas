'use client';

/**
 * OnboardingFrame - Sprint S32
 * Shared container for all onboarding steps
 * Neural mesh background matching SIVA surface
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useOnboardingStore, OnboardingStep, getStepIndex } from '@/lib/stores/onboarding-store';

interface OnboardingFrameProps {
  children: ReactNode;
  step: OnboardingStep;
  showProgress?: boolean;
}

const STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  identity: 'Identity',
  workspace: 'Workspace',
  vertical: 'Industry',
  transition: 'Setup',
  complete: 'Complete',
};

export function OnboardingFrame({ children, step, showProgress = true }: OnboardingFrameProps) {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const { completedSteps } = useOnboardingStore();

  const currentIndex = getStepIndex(step);
  const totalSteps = 5; // Excluding 'complete'

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Neural Mesh Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

        {/* Primary animated orb */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ backgroundColor: `${industryConfig.primaryColor}10` }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Secondary animated orb */}
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ backgroundColor: `${industryConfig.secondaryColor}10` }}
          animate={{
            x: [0, -80, 0],
            y: [0, -40, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Accent orb */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
          style={{ backgroundColor: '#8B5CF610' }}
          animate={{
            scale: [1, 0.8, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Progress Bar */}
      {showProgress && step !== 'complete' && (
        <div className="relative z-10 px-8 pt-8">
          <div className="max-w-3xl mx-auto">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-4">
              {['welcome', 'identity', 'workspace', 'vertical', 'transition'].map((s, i) => {
                const stepKey = s as OnboardingStep;
                const isComplete = completedSteps.includes(stepKey);
                const isCurrent = step === stepKey;
                const isPast = currentIndex > i;

                return (
                  <div key={s} className="flex items-center">
                    {/* Step Circle */}
                    <motion.div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                        border-2 transition-all duration-300
                        ${isComplete || isPast
                          ? 'border-transparent text-white'
                          : isCurrent
                            ? 'border-white/50 text-white'
                            : 'border-white/20 text-white/40'
                        }
                      `}
                      style={{
                        backgroundColor: isComplete || isPast ? industryConfig.primaryColor : 'transparent',
                      }}
                      animate={{
                        scale: isCurrent ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
                    >
                      {isComplete || isPast ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </motion.div>

                    {/* Connector Line */}
                    {i < 4 && (
                      <div className="flex-1 h-0.5 mx-2 w-12 md:w-24 lg:w-32">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: isPast ? industryConfig.primaryColor : 'rgba(255,255,255,0.1)',
                          }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.1 * i, duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Labels */}
            <div className="hidden md:flex items-center justify-between">
              {['welcome', 'identity', 'workspace', 'vertical', 'transition'].map((s, i) => {
                const stepKey = s as OnboardingStep;
                const isCurrent = step === stepKey;

                return (
                  <span
                    key={s}
                    className={`text-sm transition-colors ${
                      isCurrent ? 'text-white font-medium' : 'text-white/40'
                    }`}
                    style={{ width: '80px', textAlign: i === 0 ? 'left' : i === 4 ? 'right' : 'center' }}
                  >
                    {STEP_LABELS[stepKey]}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default OnboardingFrame;
