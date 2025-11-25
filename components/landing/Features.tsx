'use client';

/**
 * Features Section - Morphs based on detected industry
 * Sprint 1: Vertical Morphing Engine
 */

import { motion } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useTranslation } from '@/lib/stores/locale-store';
import { Search, BarChart3, MessageSquare, Target, Zap, Shield } from 'lucide-react';

const FEATURE_ICONS = {
  discovery: Search,
  scoring: BarChart3,
  assistant: MessageSquare,
  targeting: Target,
  automation: Zap,
  security: Shield,
};

export function Features() {
  const { detectedIndustry } = useIndustryStore();
  const { translations, isRTL } = useTranslation();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const features = [
    {
      key: 'discovery',
      icon: FEATURE_ICONS.discovery,
      title: translations.features.discovery.title,
      description: translations.features.discovery.description,
    },
    {
      key: 'scoring',
      icon: FEATURE_ICONS.scoring,
      title: translations.features.scoring.title,
      description: translations.features.scoring.description,
    },
    {
      key: 'assistant',
      icon: FEATURE_ICONS.assistant,
      title: translations.features.assistant.title,
      description: translations.features.assistant.description,
    },
  ];

  // Industry-specific features (vertical morphing)
  const industryFeatures = detectedIndustry !== 'general' ? industryConfig.features : [];

  return (
    <section id="features" className="py-24 bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {detectedIndustry !== 'general' ? (
              <>
                Built for{' '}
                <span style={{ color: industryConfig.primaryColor }}>
                  {industryConfig.name}
                </span>
              </>
            ) : (
              'Powerful Features'
            )}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {detectedIndustry !== 'general'
              ? industryConfig.tagline
              : 'Everything you need to discover, qualify, and engage high-value prospects.'}
          </p>
        </motion.div>

        {/* Core Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${industryConfig.primaryColor}15` }}
                >
                  <Icon
                    size={24}
                    style={{ color: industryConfig.primaryColor }}
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Industry-Specific Features (Vertical Morphing) */}
        {industryFeatures.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16"
          >
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              {industryConfig.icon} Specialized for {industryConfig.name}
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {industryFeatures.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-6 py-3 rounded-full border-2"
                  style={{
                    borderColor: industryConfig.primaryColor,
                    backgroundColor: `${industryConfig.primaryColor}10`,
                  }}
                >
                  <span
                    className="font-medium"
                    style={{ color: industryConfig.primaryColor }}
                  >
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default Features;
