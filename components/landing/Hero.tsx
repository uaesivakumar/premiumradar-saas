'use client';

/**
 * Hero Section - AI-First Landing Experience
 * Sprint 1: AI Orb + Vertical Morphing + Responsive
 * Sprint S21: Premium Motion Engine Integration
 * S369: Chat Interface removed per WORKSPACE_UX_DECISION.md
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AIOrb } from '@/components/ai-orb/AIOrb';
// S369: ChatInterface removed - chat UI forbidden per WORKSPACE_UX_DECISION.md
import { useIndustryStore, getIndustryConfig, Industry } from '@/lib/stores/industry-store';
import { useTranslation } from '@/lib/stores/locale-store';
import {
  heroTitleTransition,
  heroSubtitleTransition,
  heroCtaTransition,
  heroOrbTransition,
} from '@/lib/motion/transitions';
import { springs, easings, durations } from '@/lib/motion/timing';
import { useReducedMotion } from '@/lib/motion/hooks';

export function Hero() {
  const { detectedIndustry, setSelectedIndustry } = useIndustryStore();
  const { translations, isRTL } = useTranslation();
  // S369: isChatOpen removed - chat UI forbidden per WORKSPACE_UX_DECISION.md
  const industryConfig = getIndustryConfig(detectedIndustry);
  const prefersReducedMotion = useReducedMotion();

  const handleIndustryDetected = (industry: Industry) => {
    setSelectedIndustry(industry);
  };

  // S369: handleOrbClick now navigates to workspace instead of opening chat
  const handleOrbClick = () => {
    // Future: Navigate to /workspace
    console.log('[Hero] Orb clicked - workspace navigation pending S369 completion');
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Gradient - Morphs with industry */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          background: `linear-gradient(135deg, ${industryConfig.primaryColor}08 0%, ${industryConfig.secondaryColor}08 50%, white 100%)`,
        }}
        transition={{ duration: 1 }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <span
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${industryConfig.primaryColor}15`,
                color: industryConfig.primaryColor,
              }}
            >
              {industryConfig.icon} {isRTL ? industryConfig.taglineAr : industryConfig.tagline}
            </span>
          </motion.div>

          {/* Main Title - S21 Enhanced */}
          <motion.h1
            variants={heroTitleTransition}
            initial="hidden"
            animate="visible"
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
          >
            {translations.hero.title.split('Radar')[0]}
            <motion.span
              style={{ color: industryConfig.primaryColor }}
              animate={prefersReducedMotion ? {} : {
                textShadow: [
                  `0 0 20px ${industryConfig.primaryColor}00`,
                  `0 0 30px ${industryConfig.primaryColor}40`,
                  `0 0 20px ${industryConfig.primaryColor}00`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              Radar
            </motion.span>
          </motion.h1>

          {/* Subtitle - S21 Enhanced */}
          <motion.p
            variants={heroSubtitleTransition}
            initial="hidden"
            animate="visible"
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl"
          >
            {translations.hero.description}
          </motion.p>

          {/* AI Orb - S21 Premium Animation */}
          <motion.div
            variants={heroOrbTransition}
            initial="hidden"
            animate="visible"
            className="mb-12"
          >
            <AIOrb
              size="lg"
              onIndustryDetected={handleIndustryDetected}
              onClick={handleOrbClick}
            />
          </motion.div>

          {/* S369: ChatInterface removed - chat UI forbidden per WORKSPACE_UX_DECISION.md */}

          {/* CTA Buttons - S21 Enhanced */}
          <motion.div
            variants={heroCtaTransition}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.a
              href="/signup"
              whileHover={prefersReducedMotion ? {} : {
                scale: 1.03,
                boxShadow: `0 20px 40px -10px ${industryConfig.primaryColor}40`,
              }}
              whileTap={{ scale: 0.97 }}
              transition={springs.snappy}
              className="px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg transition-shadow"
              style={{
                background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
              }}
            >
              {translations.hero.cta.primary}
            </motion.a>
            <motion.a
              href="#demo"
              whileHover={prefersReducedMotion ? {} : {
                scale: 1.03,
                backgroundColor: `${industryConfig.primaryColor}10`,
              }}
              whileTap={{ scale: 0.97 }}
              transition={springs.snappy}
              className="px-8 py-4 rounded-xl border-2 font-semibold text-lg transition-colors"
              style={{
                borderColor: industryConfig.primaryColor,
                color: industryConfig.primaryColor,
              }}
            >
              {translations.hero.cta.secondary}
            </motion.a>
          </motion.div>

          {/* Powered by Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
              Powered by UPR OS v1.0.0
            </span>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex flex-wrap justify-center gap-8 text-gray-400"
          >
            <div className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span className="text-sm">SOC2 Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span className="text-sm">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span className="text-sm">99.9% Uptime</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
