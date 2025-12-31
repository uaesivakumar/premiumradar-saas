'use client';

/**
 * SubVerticalSelector - EB Journey Phase 2
 * Selects the salesperson's role within their vertical
 *
 * For Banking:
 * - Employee Banking (payroll, salary accounts)
 * - Corporate Banking (treasury, trade finance)
 * - SME Banking (small business)
 * - Retail Banking (personal accounts)
 * - Wealth Management (private banking)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  Users,
  Building2,
  Store,
  CreditCard,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { getSubVerticalsForVertical, getSubVerticalDisplayName } from '@/lib/intelligence/context/SalesContextProvider';
import type { SubVertical, BankingSubVertical, Vertical } from '@/lib/intelligence/context/types';

interface SubVerticalConfig {
  id: SubVertical;
  name: string;
  icon: React.ReactNode;
  description: string;
  targets: string;
  signals: string[];
}

// Sub-vertical configurations for Banking
const BANKING_SUB_VERTICALS: SubVerticalConfig[] = [
  {
    id: 'employee-banking',
    name: 'Employee Banking',
    icon: <Users className="w-6 h-6" />,
    description: 'Sell payroll solutions, salary accounts, and employee benefits to companies.',
    targets: 'Companies with growing headcount',
    signals: ['Hiring expansion', 'Office opening', 'Headcount jump', 'New subsidiary'],
  },
  {
    id: 'corporate-banking',
    name: 'Corporate Banking',
    icon: <Building2 className="w-6 h-6" />,
    description: 'Treasury management, trade finance, and corporate loans for large enterprises.',
    targets: 'Large corporations and MNCs',
    signals: ['M&A activity', 'Expansion plans', 'Funding rounds', 'International trade'],
  },
  {
    id: 'sme-banking',
    name: 'SME Banking',
    icon: <Store className="w-6 h-6" />,
    description: 'Business accounts, working capital, and SME loans for small businesses.',
    targets: 'Growing small and medium businesses',
    signals: ['Business registration', 'Growth signals', 'Working capital needs'],
  },
  {
    id: 'retail-banking',
    name: 'Retail Banking',
    icon: <CreditCard className="w-6 h-6" />,
    description: 'Personal accounts, mortgages, and credit cards for individuals.',
    targets: 'Individuals and consumers',
    signals: ['Salary changes', 'Life events', 'Credit needs'],
  },
  {
    id: 'wealth-management',
    name: 'Wealth Management',
    icon: <TrendingUp className="w-6 h-6" />,
    description: 'Private banking, investment advisory, and wealth planning for HNWIs.',
    targets: 'High-net-worth individuals',
    signals: ['Wealth events', 'Investment opportunities', 'Estate planning'],
  },
];

// Map vertical to sub-vertical configs (only Banking is fully configured)
const SUB_VERTICAL_CONFIGS: Partial<Record<Vertical, SubVerticalConfig[]>> = {
  banking: BANKING_SUB_VERTICALS,
  // Other verticals will show "Coming Soon"
};

export function SubVerticalSelector() {
  const router = useRouter();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const {
    selectedVertical,
    setSubVertical,
    completeStep,
    setStep,
  } = useOnboardingStore();

  const [selected, setSelected] = useState<SubVertical | null>(null);
  const [hovered, setHovered] = useState<SubVertical | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available sub-verticals for the selected vertical
  const subVerticalConfigs = selectedVertical
    ? SUB_VERTICAL_CONFIGS[selectedVertical]
    : null;

  // If no configs (non-banking), show coming soon
  if (!subVerticalConfigs || subVerticalConfigs.length === 0) {
    return (
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            {selectedVertical
              ? `${getSubVerticalDisplayName(selectedVertical as SubVertical)} configurations are being prepared. Banking Employee Banking is currently available.`
              : 'Please go back and select a vertical first.'}
          </p>
          <button
            onClick={() => router.push('/onboarding/vertical')}
            className="mt-6 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  const activeConfig = subVerticalConfigs.find(sv => sv.id === (hovered || selected));

  const handleContinue = async () => {
    if (!selected) return;

    setIsSubmitting(true);
    setSubVertical(selected);

    // S348-F4: Update context via API (emits USER_UPDATED event)
    try {
      const contextResponse = await fetch('/api/onboarding/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subVertical: selected,
          step: 'region',
        }),
      });

      if (!contextResponse.ok) {
        const data = await contextResponse.json();
        console.error('[SubVerticalSelector] Failed to update context:', data.error);
      } else {
        console.log('[S348-F4] Sub-vertical context updated with event');
      }
    } catch (error) {
      console.error('[SubVerticalSelector] Failed to update context:', error);
    }

    completeStep('subVertical');
    setStep('regions');
    router.push('/onboarding/regions');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
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
          What&apos;s your role?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400"
        >
          This helps me show you the right signals and intelligence
        </motion.p>
      </div>

      {/* Sub-Vertical Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {subVerticalConfigs.map((config, index) => (
          <SubVerticalCard
            key={config.id}
            config={config}
            isSelected={selected === config.id}
            isHovered={hovered === config.id}
            primaryColor={industryConfig.primaryColor}
            onClick={() => setSelected(config.id)}
            onHover={() => setHovered(config.id)}
            onLeave={() => setHovered(null)}
            delay={0.05 * index}
          />
        ))}
      </motion.div>

      {/* Detail Panel */}
      <AnimatePresence>
        {activeConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: `${industryConfig.primaryColor}10`,
                borderColor: `${industryConfig.primaryColor}30`,
              }}
            >
              <div className="flex items-start gap-4">
                <motion.div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
                  }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <p className="text-white text-lg font-medium mb-1">{activeConfig.description}</p>
                  <p className="text-gray-400 text-sm">
                    <span className="text-gray-300">Targets:</span> {activeConfig.targets}
                  </p>
                </div>
              </div>

              {/* Signals */}
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Signals I&apos;ll track for you:</p>
                <div className="flex flex-wrap gap-2">
                  {activeConfig.signals.map((signal) => (
                    <span
                      key={signal}
                      className="px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${industryConfig.primaryColor}20`,
                        color: industryConfig.secondaryColor,
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
        {selected && (
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
                background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
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
                  <span>Preparing your dashboard...</span>
                </>
              ) : (
                <>
                  <span>Continue as {subVerticalConfigs.find(sv => sv.id === selected)?.name}</span>
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

// Sub-Vertical Card Component
interface SubVerticalCardProps {
  config: SubVerticalConfig;
  isSelected: boolean;
  isHovered: boolean;
  primaryColor: string;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
  delay: number;
}

function SubVerticalCard({
  config,
  isSelected,
  isHovered,
  primaryColor,
  onClick,
  onHover,
  onLeave,
  delay,
}: SubVerticalCardProps) {
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`
        w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4
        ${isSelected
          ? 'bg-white/10 border-transparent'
          : 'bg-white/5 border-white/10 hover:border-white/20'
        }
      `}
      style={{
        borderColor: isSelected ? primaryColor : undefined,
        boxShadow: isSelected ? `0 0 20px ${primaryColor}30` : undefined,
      }}
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Icon */}
      <motion.div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isSelected ? `${primaryColor}30` : `${primaryColor}15`,
          color: 'white',
        }}
        animate={isSelected || isHovered ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.5, repeat: (isSelected || isHovered) ? Infinity : 0 }}
      >
        {config.icon}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-white">{config.name}</h3>
        <p className="text-sm text-gray-400 truncate">{config.targets}</p>
      </div>

      {/* Selection indicator */}
      <div className="flex-shrink-0">
        {isSelected ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <CheckCircle2 className="w-6 h-6" style={{ color: primaryColor }} />
          </motion.div>
        ) : (
          <ChevronRight className={`w-5 h-5 ${isHovered ? 'text-white' : 'text-gray-500'}`} />
        )}
      </div>
    </motion.button>
  );
}

export default SubVerticalSelector;
