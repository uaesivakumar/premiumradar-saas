'use client';

/**
 * EBHeroSection - EB Journey Phase 3
 * Employee Banking-specific dashboard hero section
 *
 * Shows:
 * - Personalized greeting with context
 * - Quick stats relevant to Employee Banking
 * - SIVA quick actions
 */

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Users,
  Building2,
  TrendingUp,
  Target,
  ArrowRight,
  Search,
  FileText,
  Zap,
} from 'lucide-react';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { ContextBadgeInline } from './ContextBadge';

interface EBHeroSectionProps {
  className?: string;
}

export function EBHeroSection({ className = '' }: EBHeroSectionProps) {
  const router = useRouter();
  const { profile } = useOnboardingStore();
  const {
    vertical,
    subVertical,
    regions,
    subVerticalName,
    regionsDisplay,
    isValidContext,
  } = useSalesContext();

  // Color based on vertical (Banking is blue)
  const getColors = () => {
    switch (vertical) {
      case 'banking':
        return { primary: '#1e40af', secondary: '#3b82f6', gradient: 'from-blue-900 to-blue-800' };
      default:
        return { primary: '#6b7280', secondary: '#9ca3af', gradient: 'from-gray-900 to-gray-800' };
    }
  };

  const colors = getColors();
  const firstName = profile.name?.split(' ')[0] || 'there';

  // Quick stats for Employee Banking - now shows placeholder until data loaded
  // These should be populated from real dashboard stats API
  const quickStats = [
    {
      label: 'Companies Tracked',
      value: '-',  // Populated by dashboard stats
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      label: 'Hiring Signals',
      value: '-',  // Populated by signals API
      icon: <Users className="w-4 h-4" />,
      highlight: true,
    },
    {
      label: 'Hot Prospects',
      value: '-',  // Populated by scores API
      icon: <Target className="w-4 h-4" />,
    },
    {
      label: 'QTLE Avg',
      value: '-',  // Populated by scores API
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ];

  // SIVA Quick Actions for Employee Banking
  const sivaActions = [
    {
      label: 'Find Hiring Companies',
      icon: <Search className="w-4 h-4" />,
      action: () => router.push('/siva?query=Find companies hiring in ' + regions.join(' and ')),
    },
    {
      label: 'Draft Outreach',
      icon: <FileText className="w-4 h-4" />,
      action: () => router.push('/siva?query=Draft payroll pitch email'),
    },
    {
      label: 'Score My Pipeline',
      icon: <Zap className="w-4 h-4" />,
      action: () => router.push('/siva?query=Score my top prospects'),
    },
  ];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} rounded-2xl`}>
        {/* Animated orbs */}
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: colors.secondary }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: colors.primary }}
          animate={{
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Left: Greeting */}
          <div className="flex-1">
            {/* Context Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs text-white/80 mb-4">
              <Building2 className="w-3 h-3" />
              <ContextBadgeInline className="text-white/80" />
            </div>

            {/* Greeting */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold text-white mb-2"
            >
              Good {getTimeOfDay()}, {firstName}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/70 max-w-md"
            >
              {subVertical === 'employee-banking' ? (
                <>Your radar is tracking <span className="text-white font-medium">hiring signals</span> across {regionsDisplay}. Ask SIVA to discover opportunities.</>
              ) : (
                <>Your intelligence layer is ready. Here&apos;s what&apos;s happening in your territory.</>
              )}
            </motion.p>

            {/* SIVA Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2 mt-6"
            >
              {sivaActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  onClick={action.action}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  {action.icon}
                  {action.label}
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Right: Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`
                  p-4 rounded-xl backdrop-blur-sm
                  ${stat.highlight
                    ? 'bg-white/20 border border-white/30'
                    : 'bg-white/10 border border-white/10'
                  }
                `}
              >
                <div className="flex items-center gap-2 text-white/70 mb-1">
                  {stat.icon}
                  <span className="text-xs">{stat.label}</span>
                </div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* SIVA Floating Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          onClick={() => router.push('/siva')}
          className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-900 font-medium shadow-lg hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sparkles className="w-4 h-4" style={{ color: colors.primary }} />
          Ask SIVA
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default EBHeroSection;
