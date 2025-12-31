'use client';

/**
 * WorkspaceCreator - Sprint S33
 * 2030 UI for workspace setup with SIVA-driven prompts
 * "What shall we name your workspace?"
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Building2, User, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { AnimatedInput } from '@/components/auth/AnimatedInput';

type WorkspaceType = 'personal' | 'organization';

export function WorkspaceCreator() {
  const router = useRouter();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const { profile, setWorkspace, completeStep, setStep } = useOnboardingStore();

  const [phase, setPhase] = useState<'type' | 'name'>('type');
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-suggest workspace name based on profile
  useEffect(() => {
    if (workspaceType === 'personal' && profile.name) {
      setWorkspaceName(`${profile.name}'s Workspace`);
    }
  }, [workspaceType, profile.name]);

  const handleTypeSelect = (type: WorkspaceType) => {
    setWorkspaceType(type);
    setTimeout(() => setPhase('name'), 300);
  };

  const handleSubmit = async () => {
    if (!workspaceName.trim() || !workspaceType) return;

    setIsSubmitting(true);

    try {
      // S348-F3: Call real workspace binding API
      const response = await fetch('/api/onboarding/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceName: workspaceName.trim(),
          workspaceType,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('[WorkspaceCreator] Binding failed:', result.error);
        setIsSubmitting(false);
        // TODO: Show error to user
        return;
      }

      // Update local store with real workspace data
      const workspace = {
        id: result.workspace.workspaceId,
        name: result.workspace.workspaceName,
        type: workspaceType,
        enterpriseId: result.workspace.enterpriseId,
        enterpriseName: result.workspace.enterpriseName,
        createdAt: new Date().toISOString(),
      };

      setWorkspace(workspace);

      console.log('[S348-F3] Workspace bound successfully:', workspace);

      completeStep('workspace');
      setStep('vertical');
      router.push('/onboarding/vertical');
    } catch (error) {
      console.error('[WorkspaceCreator] Error:', error);
      setIsSubmitting(false);
    }
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
          <Layers className="w-8 h-8 text-white" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              {phase === 'type' ? 'Create your workspace' : 'What shall we name it?'}
            </h2>
            <p className="text-gray-400">
              {phase === 'type'
                ? 'Your workspace is where your intelligence lives'
                : 'Choose a name that represents your work'
              }
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {/* Phase 1: Workspace Type Selection */}
        {phase === 'type' && (
          <motion.div
            key="type-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <WorkspaceTypeCard
              type="personal"
              icon={<User className="w-8 h-8" />}
              title="Personal"
              description="For individual use. Perfect for solo sales reps and freelancers."
              selected={workspaceType === 'personal'}
              onClick={() => handleTypeSelect('personal')}
              color={industryConfig.primaryColor}
            />
            <WorkspaceTypeCard
              type="organization"
              icon={<Building2 className="w-8 h-8" />}
              title="Organization"
              description="For teams. Invite colleagues and share intelligence across your company."
              selected={workspaceType === 'organization'}
              onClick={() => handleTypeSelect('organization')}
              color={industryConfig.secondaryColor}
            />
          </motion.div>
        )}

        {/* Phase 2: Workspace Name */}
        {phase === 'name' && (
          <motion.div
            key="name-input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Selected type indicator */}
            <motion.div
              className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${industryConfig.primaryColor}20` }}
              >
                {workspaceType === 'personal' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Building2 className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-left">
                <p className="text-white font-medium">
                  {workspaceType === 'personal' ? 'Personal Workspace' : 'Organization Workspace'}
                </p>
                <button
                  onClick={() => setPhase('type')}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Change type
                </button>
              </div>
            </motion.div>

            {/* Name Input */}
            <div className="relative">
              <AnimatedInput
                label="Workspace name"
                type="text"
                value={workspaceName}
                onChange={setWorkspaceName}
                icon={<Sparkles className="w-5 h-5" />}
                autoFocus
              />

              {/* SIVA suggestion */}
              {workspaceType === 'organization' && !workspaceName && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center gap-2 text-sm text-gray-400"
                >
                  <Sparkles className="w-4 h-4" style={{ color: industryConfig.primaryColor }} />
                  <span>Try your company name or team name</span>
                </motion.div>
              )}
            </div>

            {/* Continue Button */}
            <AnimatePresence>
              {workspaceName.trim() && (
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
                      <>
                        <motion.div
                          className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        <span>Creating workspace...</span>
                      </>
                    ) : (
                      <>
                        <span>Create workspace</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Workspace Type Card Component
interface WorkspaceTypeCardProps {
  type: WorkspaceType;
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  color: string;
}

function WorkspaceTypeCard({
  icon,
  title,
  description,
  selected,
  onClick,
  color,
}: WorkspaceTypeCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        p-6 rounded-2xl border text-left transition-all
        ${selected
          ? 'bg-white/10 border-transparent'
          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
        }
      `}
      style={{
        borderColor: selected ? color : undefined,
        boxShadow: selected ? `0 0 30px ${color}30` : undefined,
      }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
        style={{
          backgroundColor: `${color}20`,
          color: 'white',
        }}
        animate={selected ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ duration: 1, repeat: selected ? Infinity : 0 }}
      >
        {icon}
      </motion.div>

      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>

      {/* Selection indicator */}
      <motion.div
        className="mt-4 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: selected ? 1 : 0 }}
      >
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-medium" style={{ color }}>Selected</span>
      </motion.div>
    </motion.button>
  );
}

export default WorkspaceCreator;
