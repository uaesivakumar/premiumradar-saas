'use client';

/**
 * SIVAGreeting - Sprint S32
 * SIVA animated greeting on first signup
 * "Hello, I'm SIVA. Welcome to PremiumRadar."
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';

interface SIVAGreetingProps {
  userName?: string;
}

export function SIVAGreeting({ userName }: SIVAGreetingProps) {
  const router = useRouter();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const { completeStep, setStep } = useOnboardingStore();

  const [phase, setPhase] = useState(0);
  const [displayText, setDisplayText] = useState('');

  // Greeting messages
  const messages = [
    'Hello',
    userName ? `Hello, ${userName}` : 'Hello there',
    "I'm SIVA",
    'Your AI Intelligence Partner',
    "Let's set up your workspace",
  ];

  // Typewriter effect
  useEffect(() => {
    if (phase >= messages.length) return;

    const text = messages[phase];
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(typeInterval);
        // Wait, then move to next phase
        setTimeout(() => {
          setPhase(prev => prev + 1);
        }, 1000);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [phase, userName]);

  const handleContinue = () => {
    completeStep('welcome');
    setStep('identity');
    router.push('/onboarding/welcome?step=identity');
  };

  const isComplete = phase >= messages.length;

  return (
    <div className="text-center">
      {/* SIVA Orb */}
      <motion.div
        className="w-32 h-32 mx-auto mb-12 rounded-full flex items-center justify-center relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Glow rings */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${industryConfig.primaryColor}30, ${industryConfig.secondaryColor}30)`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${industryConfig.primaryColor}40`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />

        {/* Core orb */}
        <motion.div
          className="w-full h-full rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${industryConfig.primaryColor}40, ${industryConfig.secondaryColor}40)`,
            border: `1px solid ${industryConfig.primaryColor}30`,
          }}
          animate={{
            boxShadow: [
              `0 0 60px ${industryConfig.primaryColor}30`,
              `0 0 100px ${industryConfig.primaryColor}50`,
              `0 0 60px ${industryConfig.primaryColor}30`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-16 h-16 text-white" />
        </motion.div>
      </motion.div>

      {/* Animated Text Display */}
      <div className="h-24 flex items-center justify-center mb-8">
        <AnimatePresence mode="wait">
          <motion.h1
            key={phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-4xl md:text-5xl font-bold text-white"
          >
            {displayText}
            {!isComplete && phase < messages.length && (
              <motion.span
                className="inline-block w-1 h-10 ml-1 bg-white"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </motion.h1>
        </AnimatePresence>
      </div>

      {/* SIVA Subtitle */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <p className="text-xl text-gray-400 max-w-md mx-auto">
              I'll guide you through setting up your personalized intelligence workspace.
              It only takes a minute.
            </p>

            {/* Continue Button */}
            <motion.button
              onClick={handleContinue}
              className="px-8 py-4 rounded-xl text-white font-semibold text-lg flex items-center gap-3 mx-auto"
              style={{
                background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span>Let's begin</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Skip link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-500 text-sm"
            >
              <button
                onClick={() => router.push('/dashboard')}
                className="hover:text-gray-300 underline transition-colors"
              >
                Skip for now
              </button>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SIVAGreeting;
