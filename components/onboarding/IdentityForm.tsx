'use client';

/**
 * IdentityForm - Sprint S32
 * AI-driven identity setup: "Who are you?"
 * Captures name, role, region with SIVA guidance
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { User, Briefcase, Globe, ArrowRight, Sparkles } from 'lucide-react';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { AnimatedInput } from '@/components/auth/AnimatedInput';

const ROLES = [
  { id: 'sales_leader', label: 'Sales Leader', icon: '📊' },
  { id: 'account_executive', label: 'Account Executive', icon: '🤝' },
  { id: 'sales_development', label: 'Sales Development', icon: '🚀' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'founder', label: 'Founder / CEO', icon: '👑' },
  { id: 'other', label: 'Other', icon: '✨' },
];

const REGIONS = [
  { id: 'uae', label: 'UAE', flag: '🇦🇪' },
  { id: 'gcc', label: 'GCC', flag: '🌍' },
  { id: 'mena', label: 'MENA', flag: '🌏' },
  { id: 'global', label: 'Global', flag: '🌐' },
];

export function IdentityForm() {
  const router = useRouter();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const { profile, updateProfile, completeStep, setStep } = useOnboardingStore();

  const [name, setName] = useState(profile.name);
  const [selectedRole, setSelectedRole] = useState(profile.role);
  const [selectedRegion, setSelectedRegion] = useState(profile.region);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim() && selectedRole && selectedRegion;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);

    // Update profile in store
    updateProfile({
      name: name.trim(),
      role: selectedRole,
      region: selectedRegion,
    });

    // Simulate API save
    await new Promise(resolve => setTimeout(resolve, 500));

    completeStep('identity');
    setStep('workspace');
    router.push('/onboarding/workspace');
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
          Tell me about yourself
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400"
        >
          This helps me personalize your experience
        </motion.p>
      </div>

      {/* Name Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatedInput
          label="What's your name?"
          type="text"
          value={name}
          onChange={setName}
          icon={<User className="w-5 h-5" />}
          autoFocus
        />
      </motion.div>

      {/* Role Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <label className="flex items-center gap-2 text-white font-medium">
          <Briefcase className="w-4 h-4 text-gray-400" />
          What's your role?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ROLES.map((role) => (
            <motion.button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`
                p-4 rounded-xl border text-left transition-all
                ${selectedRole === role.id
                  ? 'border-transparent bg-white/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }
              `}
              style={{
                borderColor: selectedRole === role.id ? industryConfig.primaryColor : undefined,
                boxShadow: selectedRole === role.id ? `0 0 20px ${industryConfig.primaryColor}30` : undefined,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-2xl mb-2 block">{role.icon}</span>
              <span className="text-white text-sm font-medium">{role.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Region Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <label className="flex items-center gap-2 text-white font-medium">
          <Globe className="w-4 h-4 text-gray-400" />
          Where do you operate?
        </label>
        <div className="flex gap-3">
          {REGIONS.map((region) => (
            <motion.button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`
                flex-1 p-4 rounded-xl border text-center transition-all
                ${selectedRegion === region.id
                  ? 'border-transparent bg-white/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }
              `}
              style={{
                borderColor: selectedRegion === region.id ? industryConfig.primaryColor : undefined,
                boxShadow: selectedRegion === region.id ? `0 0 20px ${industryConfig.primaryColor}30` : undefined,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-2xl mb-1 block">{region.flag}</span>
              <span className="text-white text-sm font-medium">{region.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Continue Button */}
      <AnimatePresence>
        {isValid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <motion.div
                  className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  <span>Continue</span>
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

export default IdentityForm;
