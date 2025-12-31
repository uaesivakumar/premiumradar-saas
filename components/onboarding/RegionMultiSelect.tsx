'use client';

/**
 * RegionMultiSelect - EB Journey Phase 2
 * Multi-select UAE regions for the salesperson's territory
 *
 * Regions:
 * - Dubai
 * - Abu Dhabi
 * - Sharjah
 * - Northern Emirates
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Globe,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { UAE_REGIONS, ALL_UAE_REGIONS } from '@/lib/intelligence/context/types';
import { REGION_DISPLAY_NAMES } from '@/lib/intelligence/context/SalesContextProvider';

interface RegionConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const REGION_CONFIGS: RegionConfig[] = [
  {
    id: 'dubai',
    name: 'Dubai',
    description: 'Dubai, DIFC, Dubai South, JLT, Business Bay',
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    id: 'abu-dhabi',
    name: 'Abu Dhabi',
    description: 'Abu Dhabi, Al Ain, ADGM, Mussafah',
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    id: 'sharjah',
    name: 'Sharjah',
    description: 'Sharjah, Sharjah Airport Free Zone',
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    id: 'northern-emirates',
    name: 'Northern Emirates',
    description: 'Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain',
    icon: <MapPin className="w-5 h-5" />,
  },
];

export function RegionMultiSelect() {
  const router = useRouter();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const {
    selectedRegions,
    toggleRegion,
    setRegions,
    completeStep,
    setStep,
    canProceedToTransition,
    selectedSubVertical,
  } = useOnboardingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectAllHovered, setSelectAllHovered] = useState(false);

  const isAllSelected = selectedRegions.length === UAE_REGIONS.length;
  const hasSelection = selectedRegions.length > 0;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setRegions([]);
    } else {
      setRegions([...ALL_UAE_REGIONS]);
    }
  };

  const handleContinue = async () => {
    if (!hasSelection) return;

    setIsSubmitting(true);

    // S348-F4: Update context via API (emits USER_UPDATED event)
    try {
      // For region, we use the primary region (first selected) or 'UAE' for all
      const regionCountry = isAllSelected ? 'UAE' : (selectedRegions[0] || 'UAE');

      const contextResponse = await fetch('/api/onboarding/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionCountry,
          step: 'complete',
        }),
      });

      if (!contextResponse.ok) {
        const data = await contextResponse.json();
        console.error('[RegionMultiSelect] Failed to update context:', data.error);
      } else {
        console.log('[S348-F4] Region context updated with event');
      }
    } catch (error) {
      console.error('[RegionMultiSelect] Failed to update context:', error);
    }

    completeStep('regions');
    setStep('transition');
    router.push('/onboarding/transition');
  };

  const getSelectionSummary = () => {
    if (selectedRegions.length === 0) return null;
    if (selectedRegions.length === UAE_REGIONS.length) return 'All UAE';
    if (selectedRegions.length === 1) {
      return REGION_DISPLAY_NAMES[selectedRegions[0]] || selectedRegions[0];
    }
    return `${selectedRegions.length} regions selected`;
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
          <Globe className="w-8 h-8 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Select your territory
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400"
        >
          Choose the regions where you operate. You can select multiple.
        </motion.p>
      </div>

      {/* Select All Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <motion.button
          onClick={handleToggleAll}
          onMouseEnter={() => setSelectAllHovered(true)}
          onMouseLeave={() => setSelectAllHovered(false)}
          className={`
            w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4
            ${isAllSelected
              ? 'bg-white/10 border-transparent'
              : 'bg-white/5 border-white/10 hover:border-white/20'
            }
          `}
          style={{
            borderColor: isAllSelected ? industryConfig.primaryColor : undefined,
            boxShadow: isAllSelected ? `0 0 20px ${industryConfig.primaryColor}30` : undefined,
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: isAllSelected ? `${industryConfig.primaryColor}30` : `${industryConfig.primaryColor}15`,
              color: 'white',
            }}
            animate={isAllSelected || selectAllHovered ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: (isAllSelected || selectAllHovered) ? Infinity : 0 }}
          >
            <Globe className="w-6 h-6" />
          </motion.div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">All UAE</h3>
            <p className="text-sm text-gray-400">Cover all regions across the Emirates</p>
          </div>

          <div className="flex-shrink-0">
            {isAllSelected ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="w-6 h-6" style={{ color: industryConfig.primaryColor }} />
              </motion.div>
            ) : (
              <Circle className={`w-6 h-6 ${selectAllHovered ? 'text-white/50' : 'text-gray-600'}`} />
            )}
          </div>
        </motion.button>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-sm text-gray-500">or select specific regions</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Region Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {REGION_CONFIGS.map((region, index) => (
          <RegionCard
            key={region.id}
            region={region}
            isSelected={selectedRegions.includes(region.id)}
            primaryColor={industryConfig.primaryColor}
            onClick={() => toggleRegion(region.id)}
            delay={0.05 * index}
          />
        ))}
      </motion.div>

      {/* Selection Summary */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-sm text-gray-400">
              <span className="font-medium text-white">{getSelectionSummary()}</span>
              {' '}selected
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue Button */}
      <AnimatePresence>
        {hasSelection && (
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
                  <span>Setting up your radar...</span>
                </>
              ) : (
                <>
                  <span>Continue with {getSelectionSummary()}</span>
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

// Region Card Component
interface RegionCardProps {
  region: RegionConfig;
  isSelected: boolean;
  primaryColor: string;
  onClick: () => void;
  delay: number;
}

function RegionCard({
  region,
  isSelected,
  primaryColor,
  onClick,
  delay,
}: RegionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`
        p-4 rounded-xl border text-left transition-all flex items-center gap-3
        ${isSelected
          ? 'bg-white/10 border-transparent'
          : 'bg-white/5 border-white/10 hover:border-white/20'
        }
      `}
      style={{
        borderColor: isSelected ? primaryColor : undefined,
        boxShadow: isSelected ? `0 0 15px ${primaryColor}20` : undefined,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        {isSelected ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        ) : (
          <div
            className={`w-6 h-6 rounded-md border-2 transition-colors ${
              isHovered ? 'border-white/40' : 'border-white/20'
            }`}
          />
        )}
      </div>

      {/* Icon */}
      <motion.div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isSelected ? `${primaryColor}30` : `${primaryColor}10`,
          color: 'white',
        }}
      >
        {region.icon}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-white">{region.name}</h3>
        <p className="text-xs text-gray-400 truncate">{region.description}</p>
      </div>
    </motion.button>
  );
}

export default RegionMultiSelect;
