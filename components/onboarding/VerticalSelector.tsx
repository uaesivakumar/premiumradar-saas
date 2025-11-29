'use client';

/**
 * VerticalSelector - Sprint S34 + S48 Enhancement
 * AI-first cinematic selection grid for industry verticals
 * SIVA explains each vertical with motion and tooltips
 *
 * S48 Enhancements:
 * - Auto-suggest vertical based on email domain
 * - Show "Recommended" badge for detected industry
 * - Lock vertical after confirmation
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Building2, Landmark, Shield, Home, Briefcase, ChevronRight, Zap } from 'lucide-react';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useOnboardingStore, VerticalId } from '@/lib/stores/onboarding-store';
import {
  getVerticalSuggestionFromEmail,
  getSuggestionBadgeText,
  getSuggestionBadgeColor,
  lockUserVertical,
  type VerticalSuggestion,
} from '@/lib/auth/identity';

interface VerticalConfig {
  id: VerticalId;
  name: string;
  icon: React.ReactNode;
  color: string;
  secondaryColor: string;
  tagline: string;
  description: string;
  signals: string[];
  sivaMessage: string;
}

const VERTICALS: VerticalConfig[] = [
  {
    id: 'banking',
    name: 'Banking',
    icon: <Landmark className="w-8 h-8" />,
    color: '#1e40af',
    secondaryColor: '#3b82f6',
    tagline: 'Digital transformation signals',
    description: 'Retail banking, corporate banking, wealth management. Track digital transformation, regulatory changes, and fintech partnerships.',
    signals: ['Core banking modernization', 'Open banking APIs', 'ESG initiatives', 'Branch transformation'],
    sivaMessage: "I'll help you identify banks ready for digital transformation and track their technology investments.",
  },
  {
    id: 'fintech',
    name: 'FinTech',
    icon: <Building2 className="w-8 h-8" />,
    color: '#7c3aed',
    secondaryColor: '#a78bfa',
    tagline: 'Innovation & funding signals',
    description: 'Payment processors, neobanks, lending platforms. Monitor funding rounds, product launches, and partnership announcements.',
    signals: ['Series funding', 'Product launches', 'Market expansion', 'Partnership deals'],
    sivaMessage: "I'll track FinTech companies by funding stage, technology stack, and growth trajectory.",
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: <Shield className="w-8 h-8" />,
    color: '#059669',
    secondaryColor: '#10b981',
    tagline: 'InsurTech & claims signals',
    description: 'Life, health, P&C insurance carriers. Track digital claims, InsurTech adoption, and customer experience initiatives.',
    signals: ['Claims automation', 'InsurTech partnerships', 'Digital distribution', 'Underwriting AI'],
    sivaMessage: "I'll identify insurers investing in digital transformation and customer experience improvements.",
  },
  {
    id: 'real_estate',
    name: 'Real Estate',
    icon: <Home className="w-8 h-8" />,
    color: '#0891b2',
    secondaryColor: '#22d3ee',
    tagline: 'PropTech & development signals',
    description: 'Commercial & residential developers, REITs, property managers. Track new developments, PropTech adoption, and sustainability initiatives.',
    signals: ['New developments', 'PropTech adoption', 'Green buildings', 'Smart property'],
    sivaMessage: "I'll track real estate companies and their technology investments across the region.",
  },
  {
    id: 'consulting',
    name: 'Consulting',
    icon: <Briefcase className="w-8 h-8" />,
    color: '#4f46e5',
    secondaryColor: '#818cf8',
    tagline: 'Advisory & transformation signals',
    description: 'Management consulting, strategy firms, system integrators. Monitor new practice areas, major wins, and digital capability building.',
    signals: ['New practice launches', 'Major client wins', 'Digital services', 'Regional expansion'],
    sivaMessage: "I'll help you understand the consulting landscape and identify key decision makers.",
  },
];

export function VerticalSelector() {
  const router = useRouter();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const { profile, setVertical, completeStep, setStep } = useOnboardingStore();

  const [selectedVertical, setSelectedVertical] = useState<VerticalId | null>(null);
  const [hoveredVertical, setHoveredVertical] = useState<VerticalId | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<VerticalSuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  // S48: Load vertical suggestion based on email
  useEffect(() => {
    async function loadSuggestion() {
      if (!profile.email) return;

      setIsLoadingSuggestion(true);
      try {
        const result = await getVerticalSuggestionFromEmail(profile.email);
        setSuggestion(result);

        // Auto-select if high confidence
        if (result.shouldAutoSelect && result.suggestedVertical) {
          setSelectedVertical(result.suggestedVertical);
        }
      } catch (error) {
        console.error('[VerticalSelector] Failed to get suggestion:', error);
      } finally {
        setIsLoadingSuggestion(false);
      }
    }

    loadSuggestion();
  }, [profile.email]);

  const activeVertical = VERTICALS.find(v => v.id === (hoveredVertical || selectedVertical));

  const handleSelect = (verticalId: VerticalId) => {
    setSelectedVertical(verticalId);
  };

  const handleContinue = async () => {
    if (!selectedVertical) return;

    setIsSubmitting(true);
    setVertical(selectedVertical);

    // S48: Lock the user to this vertical
    // In production, use actual user ID from auth
    const mockUserId = `user_${Date.now()}`;
    try {
      lockUserVertical(mockUserId, selectedVertical, 'user');
    } catch (error) {
      console.error('[VerticalSelector] Failed to lock vertical:', error);
    }

    // Simulate loading intelligence modules
    await new Promise(resolve => setTimeout(resolve, 1000));

    completeStep('vertical');
    setStep('transition');
    router.push('/onboarding/transition');
  };

  return (
    <div className="space-y-8">
      {/* SIVA Header */}
      <div className="text-center mb-8">
        <motion.div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${industryConfig.primaryColor}30, ${industryConfig.secondaryColor}30)`,
            border: `1px solid ${industryConfig.primaryColor}20`,
          }}
          animate={{
            boxShadow: [
              `0 0 30px ${industryConfig.primaryColor}20`,
              `0 0 50px ${industryConfig.primaryColor}30`,
              `0 0 30px ${industryConfig.primaryColor}20`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Choose your industry focus
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400"
        >
          {isLoadingSuggestion
            ? 'Analyzing your company...'
            : suggestion?.message || "I'll load specialized intelligence for your vertical"}
        </motion.p>

        {/* S48: Show detected industry info */}
        {suggestion && suggestion.industry && !suggestion.isPersonalEmail && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20"
          >
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">
              Detected: {suggestion.industry} ({suggestion.confidence}% confidence)
            </span>
          </motion.div>
        )}
      </div>

      {/* Vertical Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {VERTICALS.map((vertical, index) => (
          <VerticalCard
            key={vertical.id}
            vertical={vertical}
            isSelected={selectedVertical === vertical.id}
            isHovered={hoveredVertical === vertical.id}
            isRecommended={suggestion?.suggestedVertical === vertical.id}
            recommendedBadge={suggestion?.suggestedVertical === vertical.id ? getSuggestionBadgeText(suggestion) : null}
            recommendedBadgeColor={suggestion?.suggestedVertical === vertical.id ? getSuggestionBadgeColor(suggestion) : ''}
            onClick={() => handleSelect(vertical.id)}
            onHover={() => setHoveredVertical(vertical.id)}
            onLeave={() => setHoveredVertical(null)}
            delay={0.1 * index}
          />
        ))}
      </motion.div>

      {/* SIVA Explainer Panel */}
      <AnimatePresence>
        {activeVertical && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: `${activeVertical.color}10`,
                borderColor: `${activeVertical.color}30`,
              }}
            >
              {/* SIVA message */}
              <div className="flex items-start gap-4 mb-4">
                <motion.div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${activeVertical.color}, ${activeVertical.secondaryColor})`,
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <p className="text-white text-lg font-medium mb-2">{activeVertical.sivaMessage}</p>
                  <p className="text-gray-400 text-sm">{activeVertical.description}</p>
                </div>
              </div>

              {/* Intelligence signals */}
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-3">Intelligence signals I'll track:</p>
                <div className="flex flex-wrap gap-2">
                  {activeVertical.signals.map((signal) => (
                    <span
                      key={signal}
                      className="px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${activeVertical.color}20`,
                        color: activeVertical.secondaryColor,
                      }}
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue Button */}
      <AnimatePresence>
        {selectedVertical && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.button
              onClick={handleContinue}
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${VERTICALS.find(v => v.id === selectedVertical)?.color}, ${VERTICALS.find(v => v.id === selectedVertical)?.secondaryColor})`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>Loading intelligence modules...</span>
                </>
              ) : (
                <>
                  <span>Continue with {VERTICALS.find(v => v.id === selectedVertical)?.name}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Vertical Card Component
interface VerticalCardProps {
  vertical: VerticalConfig;
  isSelected: boolean;
  isHovered: boolean;
  isRecommended: boolean;
  recommendedBadge: string | null;
  recommendedBadgeColor: string;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
  delay: number;
}

function VerticalCard({
  vertical,
  isSelected,
  isHovered,
  isRecommended,
  recommendedBadge,
  recommendedBadgeColor,
  onClick,
  onHover,
  onLeave,
  delay,
}: VerticalCardProps) {
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`
        relative p-5 rounded-xl border text-left transition-all
        ${isSelected
          ? 'bg-white/10 border-transparent'
          : 'bg-white/5 border-white/10 hover:border-white/20'
        }
      `}
      style={{
        borderColor: isSelected ? vertical.color : undefined,
        boxShadow: isSelected ? `0 0 30px ${vertical.color}30` : undefined,
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Icon */}
      <motion.div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{
          backgroundColor: `${vertical.color}20`,
          color: 'white',
        }}
        animate={isSelected || isHovered ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ duration: 1.5, repeat: (isSelected || isHovered) ? Infinity : 0 }}
      >
        {vertical.icon}
      </motion.div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-white mb-1">{vertical.name}</h3>
      <p className="text-sm text-gray-400">{vertical.tagline}</p>

      {/* S48: Recommended badge */}
      {isRecommended && recommendedBadge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${recommendedBadgeColor}`}
        >
          <Zap className="w-3 h-3" />
          {recommendedBadge}
        </motion.div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: vertical.color }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </motion.div>
      )}

      {/* Hover arrow */}
      {(isHovered || isSelected) && !isSelected && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 text-gray-400"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      )}
    </motion.button>
  );
}

export default VerticalSelector;
