'use client';

/**
 * Hero Section - AI-First Landing Experience
 * Sprint 1: AI Orb + Vertical Morphing + Responsive
 * Sprint 2: Chat Interface Integration
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AIOrb } from '@/components/ai-orb/AIOrb';
import { ChatInterface } from '@/components/chat';
import { useIndustryStore, getIndustryConfig, Industry } from '@/lib/stores/industry-store';
import { useTranslation } from '@/lib/stores/locale-store';

export function Hero() {
  const { detectedIndustry, setSelectedIndustry } = useIndustryStore();
  const { translations, isRTL } = useTranslation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const industryConfig = getIndustryConfig(detectedIndustry);

  const handleIndustryDetected = (industry: Industry) => {
    setSelectedIndustry(industry);
  };

  const handleOrbClick = () => {
    setIsChatOpen(true);
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

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
          >
            {translations.hero.title.split('Radar')[0]}
            <span style={{ color: industryConfig.primaryColor }}>Radar</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl"
          >
            {translations.hero.description}
          </motion.p>

          {/* AI Orb */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-12"
          >
            <AIOrb
              size="lg"
              onIndustryDetected={handleIndustryDetected}
              onClick={handleOrbClick}
            />
          </motion.div>

          {/* Chat Interface - Sprint 2 */}
          <ChatInterface
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.a
              href="/signup"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
              style={{
                background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
              }}
            >
              {translations.hero.cta.primary}
            </motion.a>
            <motion.a
              href="#demo"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
