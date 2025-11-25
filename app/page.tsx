'use client';

/**
 * PremiumRadar Landing Page - AI-First 2030 Experience
 *
 * Full vertical-adaptive, cinematic landing with:
 * - SIVA AI Persona greeting
 * - Vertical-aware pitch (Banking → first vertical)
 * - Cognitive Engine showcase (Discovery/Enrichment/Ranking/Outreach)
 * - Q/T/L/E Scoring visualization
 * - MicroDemo cinematic experience
 * - Premium UI components
 *
 * SSR-Safe: Uses 2D orb only (Three.js disabled)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

// Dynamic imports (SSR-safe)
const DynamicOrb = dynamic(
  () => import('@/components/ai-orb/DynamicOrb').then(mod => mod.DynamicOrb),
  {
    ssr: false,
    loading: () => (
      <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 animate-pulse" />
    )
  }
);

import {
  VerticalLanding,
  VerticalSection,
  ScrollProgressBar,
  AnimatedCounter,
} from '@/components/landing/VerticalLanding';
import { MicroDemo } from '@/components/demo/MicroDemo';
import { PremiumCard, PricingCard } from '@/components/premium/PremiumCard';
import { PremiumButton } from '@/components/premium/PremiumButton';
import { AnimatedSection } from '@/components/motion/AnimatedSection';

import {
  heroTitleTransition,
  heroSubtitleTransition,
  heroCtaTransition,
} from '@/lib/motion/transitions';
import { staggerContainer, staggerItem } from '@/lib/motion/presets';
import { useIndustryStore, getIndustryConfig, type Industry, INDUSTRY_CONFIGS } from '@/lib/stores/industry-store';
import {
  Brain,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle,
  Search,
  Database,
  BarChart3,
  Send,
  Target,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  Users,
  Building2,
  Cpu,
  Network,
  Radar,
  MessageSquare,
} from 'lucide-react';

// Dynamic import for debug overlay (dev only)
const MotionDebugOverlay = dynamic(
  () => import('@/components/motion/MotionDebugOverlay').then(mod => mod.MotionDebugOverlay),
  { ssr: false }
);

// ============================================
// NEURAL MESH BACKGROUND
// ============================================

function NeuralMeshBackground() {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ backgroundColor: `${industryConfig.primaryColor}20` }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{ backgroundColor: `${industryConfig.secondaryColor}20` }}
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -40, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// ============================================
// SECTION A: AI GREETING LAYER (SIVA PERSONA)
// ============================================

function AIGreetingSection() {
  const { detectedIndustry, setDetectedIndustry, setSelectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'thinking' | 'responding'>('idle');
  const [greeting, setGreeting] = useState("I'm SIVA, your AI Sales Intelligence Agent");
  const [showVerticalPicker, setShowVerticalPicker] = useState(false);

  // Simulate SIVA responding
  useEffect(() => {
    const sequence = async () => {
      await new Promise(r => setTimeout(r, 1500));
      setOrbState('thinking');
      await new Promise(r => setTimeout(r, 1000));
      setOrbState('responding');
      setGreeting(`I'm SIVA, your AI ${industryConfig.name} Intelligence Agent`);
      await new Promise(r => setTimeout(r, 2000));
      setOrbState('idle');
    };
    sequence();
  }, [industryConfig.name]);

  const handleVerticalSelect = useCallback((industry: Industry) => {
    setOrbState('thinking');
    setTimeout(() => {
      setDetectedIndustry(industry, 0.95);
      setSelectedIndustry(industry);
      setOrbState('responding');
      setGreeting(`I'm SIVA, your AI ${INDUSTRY_CONFIGS[industry].name} Intelligence Agent`);
      setShowVerticalPicker(false);
      setTimeout(() => setOrbState('idle'), 1500);
    }, 800);
  }, [setDetectedIndustry, setSelectedIndustry]);

  return (
    <VerticalSection
      id="section-0"
      background="transparent"
      animationType="none"
      className="relative min-h-screen flex items-center justify-center"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* AI Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30">
            <Cpu className="w-4 h-4 mr-2" />
            Autonomous Sales Intelligence OS
          </span>
        </motion.div>

        {/* SIVA Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-8 flex justify-center"
        >
          <DynamicOrb
            primaryColor={industryConfig.primaryColor}
            secondaryColor={industryConfig.secondaryColor}
            size="xl"
            state={orbState}
            showParticles={true}
            showConnections={true}
            icon={<Radar className="w-16 h-16" />}
            onClick={() => setShowVerticalPicker(!showVerticalPicker)}
          />
        </motion.div>

        {/* SIVA Greeting */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={greeting}
            variants={heroTitleTransition}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4"
          >
            {greeting}
          </motion.h1>
        </AnimatePresence>

        {/* Value Proposition */}
        <motion.p
          variants={heroSubtitleTransition}
          initial="hidden"
          animate="visible"
          className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto"
        >
          Discover, score, and engage high-value {industryConfig.name.toLowerCase()} prospects with
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold"> cognitive AI reasoning</span>.
        </motion.p>

        {/* Vertical Picker */}
        <AnimatePresence>
          {showVerticalPicker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-8 flex flex-wrap justify-center gap-3"
            >
              {Object.values(INDUSTRY_CONFIGS).filter(c => c.id !== 'general').map((config) => (
                <button
                  key={config.id}
                  onClick={() => handleVerticalSelect(config.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    detectedIndustry === config.id
                      ? 'bg-white text-slate-900'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {config.icon} {config.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Buttons */}
        <motion.div
          variants={heroCtaTransition}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <PremiumButton
            variant="gradient"
            size="lg"
            magnetic
            glow
            rightIcon={<ArrowRight className="w-5 h-5" />}
            onClick={() => (window.location.href = '/register')}
          >
            Start Discovery
          </PremiumButton>
          <PremiumButton
            variant="outline"
            size="lg"
            className="border-white/20 text-white hover:bg-white/10"
            leftIcon={<Play className="w-5 h-5" />}
            onClick={() => document.getElementById('section-4')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Watch SIVA Demo
          </PremiumButton>
        </motion.div>

        {/* Vertical Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              borderColor: `${industryConfig.primaryColor}50`,
              backgroundColor: `${industryConfig.primaryColor}10`
            }}
          >
            <span className="text-2xl">{industryConfig.icon}</span>
            <span className="text-gray-300">{industryConfig.tagline}</span>
          </div>
        </motion.div>
      </div>
    </VerticalSection>
  );
}

// ============================================
// SECTION B: COGNITIVE ENGINE SHOWCASE
// ============================================

function CognitiveEngineSection() {
  const engines = [
    {
      id: 'discovery',
      name: 'Discovery Engine',
      icon: <Search className="w-8 h-8" />,
      description: 'AI-powered prospect discovery across UAE company registries, news signals, and market data.',
      capabilities: ['Company Registry Crawling', 'News Signal Detection', 'Market Event Tracking'],
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'enrichment',
      name: 'Enrichment Engine',
      icon: <Database className="w-8 h-8" />,
      description: 'Deep data enrichment with firmographic, technographic, and intent signals.',
      capabilities: ['Firmographic Data', 'Decision Maker Mapping', 'Tech Stack Detection'],
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'ranking',
      name: 'Ranking Engine',
      icon: <BarChart3 className="w-8 h-8" />,
      description: 'Q/T/L/E scoring algorithm ranks prospects by Qualification, Timing, Likelihood, and Effort.',
      capabilities: ['Q/T/L/E Scoring', 'Priority Ranking', 'Win Probability'],
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'outreach',
      name: 'Outreach Engine',
      icon: <Send className="w-8 h-8" />,
      description: 'Autonomous multi-channel outreach with AI-personalized messaging.',
      capabilities: ['Email Sequences', 'LinkedIn Automation', 'Call Scripts'],
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <VerticalSection
      id="section-1"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="rise" className="text-center mb-16">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-4">
            <Network className="w-3 h-3 mr-1" />
            COGNITIVE ARCHITECTURE
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Four Autonomous Engines.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              One Intelligence Layer.
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            PremiumRadar's cognitive pipeline transforms raw market data into qualified, ranked, and engaged opportunities.
          </p>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6"
        >
          {engines.map((engine, index) => (
            <motion.div key={engine.id} variants={staggerItem}>
              <PremiumCard variant="glass" hover="tilt" className="h-full">
                <div className="flex flex-col h-full">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${engine.color} flex items-center justify-center text-white mb-4`}>
                    {engine.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{engine.name}</h3>
                  <p className="text-gray-400 mb-4">{engine.description}</p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {engine.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </VerticalSection>
  );
}

// ============================================
// SECTION C: Q/T/L/E SCORING SHOWCASE
// ============================================

function ScoringSection() {
  const scores = [
    {
      letter: 'Q',
      name: 'Qualification',
      description: 'Does the prospect match your ideal customer profile?',
      factors: ['Company Size', 'Industry Fit', 'Budget Signals', 'Decision Authority'],
      color: 'from-blue-500 to-blue-600',
      score: 87,
    },
    {
      letter: 'T',
      name: 'Timing',
      description: 'Is now the right time to engage this prospect?',
      factors: ['Buying Signals', 'Budget Cycle', 'Contract Renewals', 'Growth Events'],
      color: 'from-purple-500 to-purple-600',
      score: 92,
    },
    {
      letter: 'L',
      name: 'Likelihood',
      description: 'What is the probability of successful conversion?',
      factors: ['Engagement History', 'Competitor Presence', 'Champion Access', 'Pain Urgency'],
      color: 'from-amber-500 to-amber-600',
      score: 78,
    },
    {
      letter: 'E',
      name: 'Effort',
      description: 'How much effort is required to close this deal?',
      factors: ['Sales Cycle Length', 'Stakeholder Count', 'Procurement Complexity', 'Technical Validation'],
      color: 'from-green-500 to-green-600',
      score: 65,
    },
  ];

  return (
    <VerticalSection
      id="section-2"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="rise" className="text-center mb-16">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4">
            <Target className="w-3 h-3 mr-1" />
            INTELLIGENT SCORING
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Q/T/L/E: The Four Dimensions
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              of Prospect Intelligence
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Every prospect is scored across four critical dimensions. SIVA prioritizes your pipeline automatically.
          </p>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {scores.map((score) => (
            <motion.div key={score.letter} variants={staggerItem}>
              <PremiumCard variant="glass" hover="glow" className="h-full text-center">
                <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${score.color} flex items-center justify-center mb-4`}>
                  <span className="text-4xl font-black text-white">{score.letter}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{score.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{score.description}</p>

                {/* Score Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Score</span>
                    <span className="text-white font-bold">{score.score}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${score.color}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${score.score}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {score.factors.map((factor) => (
                    <div key={factor} className="text-xs text-gray-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {factor}
                    </div>
                  ))}
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </VerticalSection>
  );
}

// ============================================
// SECTION D: INTELLIGENCE LAYER
// ============================================

function IntelligenceSection() {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Autonomous Reasoning',
      description: 'SIVA reasons through complex sales scenarios, identifying optimal engagement strategies.',
    },
    {
      icon: <Radar className="w-6 h-6" />,
      title: 'Signal Detection',
      description: 'Continuous monitoring of 50+ buying signals across news, filings, and social activity.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Decision Maker Mapping',
      description: 'AI-powered org chart reconstruction and champion identification.',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Personalized Messaging',
      description: 'Context-aware outreach crafted for each prospect\'s unique situation.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Pipeline Forecasting',
      description: 'Predictive analytics on deal velocity, win rates, and revenue timing.',
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: 'Vertical Expertise',
      description: `Deep ${industryConfig.name.toLowerCase()} domain knowledge baked into every recommendation.`,
    },
  ];

  return (
    <VerticalSection
      id="section-3"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="rise" className="text-center mb-16">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-4">
            <Cpu className="w-3 h-3 mr-1" />
            AI INTELLIGENCE LAYER
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Not Just Data.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Cognitive Sales Intelligence.
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            SIVA doesn't just aggregate data — it reasons, predicts, and acts like your best sales strategist.
          </p>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={staggerItem}>
              <PremiumCard variant="glass" hover="tilt" className="h-full">
                <div className="flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </VerticalSection>
  );
}

// ============================================
// SECTION E: MICRO-DEMO (CINEMATIC)
// ============================================

function MicroDemoSection() {
  const demoSteps = [
    {
      id: 'discover',
      title: 'SIVA Discovers Prospects',
      description: 'AI scans UAE company registries and news for high-intent signals',
      duration: 5000,
      content: (
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-8 border border-white/10 max-w-md"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">Discovery Engine</p>
                <p className="text-gray-400 text-sm">Scanning UAE markets...</p>
              </div>
            </div>
            <div className="space-y-2">
              {['Emirates NBD expansion', 'ADNOC tech initiative', 'Etisalat digital transformation'].map((signal, i) => (
                <motion.div
                  key={signal}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.3 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-gray-300">{signal}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'score',
      title: 'Q/T/L/E Scoring',
      description: 'Each prospect receives a multi-dimensional intelligence score',
      duration: 5000,
      content: (
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-8 border border-white/10"
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                { letter: 'Q', score: 92, color: 'bg-blue-500' },
                { letter: 'T', score: 87, color: 'bg-purple-500' },
                { letter: 'L', score: 78, color: 'bg-amber-500' },
                { letter: 'E', score: 65, color: 'bg-green-500' },
              ].map((item, i) => (
                <motion.div
                  key={item.letter}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center"
                >
                  <div className={`w-16 h-16 mx-auto ${item.color} rounded-xl flex items-center justify-center mb-2`}>
                    <span className="text-2xl font-black text-white">{item.letter}</span>
                  </div>
                  <motion.span
                    className="text-2xl font-bold text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    {item.score}%
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'engage',
      title: 'Autonomous Outreach',
      description: 'SIVA crafts and sends personalized multi-channel sequences',
      duration: 5000,
      content: (
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-8 border border-white/10 max-w-md"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">Outreach Sent</p>
                <p className="text-green-400 text-sm">Multi-channel sequence active</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { channel: 'Email', status: 'Delivered', icon: '📧' },
                { channel: 'LinkedIn', status: 'Connection sent', icon: '💼' },
                { channel: 'Follow-up', status: 'Scheduled +3 days', icon: '📅' },
              ].map((item, i) => (
                <motion.div
                  key={item.channel}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.3 }}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                >
                  <span className="text-gray-300 flex items-center gap-2">
                    <span>{item.icon}</span>
                    {item.channel}
                  </span>
                  <span className="text-green-400 text-sm">{item.status}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      ),
    },
  ];

  return (
    <VerticalSection
      id="section-4"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="rise" className="text-center mb-12">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 mb-4">
            <Play className="w-3 h-3 mr-1" />
            LIVE DEMO
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            See SIVA in Action
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Watch how SIVA discovers, scores, and engages prospects autonomously.
          </p>
        </AnimatedSection>

        <MicroDemo
          steps={demoSteps}
          autoPlay={true}
          defaultStepDuration={5000}
          className="shadow-2xl shadow-blue-500/10"
        />
      </div>
    </VerticalSection>
  );
}

// ============================================
// SECTION F: STATS / SOCIAL PROOF
// ============================================

function StatsSection() {
  return (
    <VerticalSection
      id="section-5"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="rise" className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by UAE Enterprise Sales Teams
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join leading organizations transforming their sales intelligence with SIVA.
          </p>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: 50000, suffix: '+', label: 'UAE Companies Indexed' },
            { value: 2, suffix: 'M+', label: 'Signals Processed Daily' },
            { value: 94, suffix: '%', label: 'Q/T/L/E Accuracy' },
            { value: 3, suffix: 'x', label: 'Pipeline Velocity' },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <PremiumCard variant="glass" hover="glow" className="text-center py-8">
                <div className="text-4xl font-bold text-white mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-gray-400">{stat.label}</p>
              </PremiumCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </VerticalSection>
  );
}

// ============================================
// SECTION G: PRICING
// ============================================

function PricingSection() {
  return (
    <VerticalSection
      id="section-6"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="rise" className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Start with discovery. Scale with intelligence.
          </p>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          <motion.div variants={staggerItem}>
            <PricingCard
              name="Discovery"
              price="$299"
              description="AI-powered prospect discovery for growing teams"
              features={[
                '5,000 prospect discoveries/month',
                'Q/T/L/E scoring',
                'Basic enrichment',
                'Email support',
              ]}
              ctaText="Start Discovery"
              onCta={() => (window.location.href = '/register')}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <PricingCard
              name="Intelligence"
              price="$799"
              description="Full cognitive sales OS for enterprise teams"
              features={[
                '25,000 discoveries/month',
                'Advanced Q/T/L/E + AI reasoning',
                'Full enrichment suite',
                'Multi-channel outreach',
                'Priority support',
              ]}
              ctaText="Start Intelligence"
              isPopular
              onCta={() => (window.location.href = '/register')}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <PricingCard
              name="Enterprise"
              price="Custom"
              period=""
              description="Dedicated intelligence layer for large organizations"
              features={[
                'Unlimited discoveries',
                'Custom AI models',
                'Dedicated vertical tuning',
                'API access',
                '24/7 phone support',
                'SLA guarantee',
              ]}
              ctaText="Contact Sales"
              isEnterprise
              onCta={() => (window.location.href = '/contact')}
            />
          </motion.div>
        </motion.div>
      </div>
    </VerticalSection>
  );
}

// ============================================
// SECTION H: FINAL CTA
// ============================================

function FinalCTASection() {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const [orbState, setOrbState] = useState<'idle' | 'active'>('idle');

  return (
    <VerticalSection
      id="section-7"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection animation="scale">
          <PremiumCard
            variant="gradient"
            gradientFrom={industryConfig.primaryColor}
            gradientTo={industryConfig.secondaryColor}
            className="py-16 px-8"
          >
            {/* Mini Orb */}
            <motion.div
              className="mb-8 flex justify-center"
              onMouseEnter={() => setOrbState('active')}
              onMouseLeave={() => setOrbState('idle')}
            >
              <DynamicOrb
                primaryColor="#ffffff"
                secondaryColor="#ffffff"
                size="md"
                state={orbState}
                icon={<Radar className="w-8 h-8" />}
              />
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Sales Intelligence?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Let SIVA discover your next 100 high-value {industryConfig.name.toLowerCase()} prospects.
              Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumButton
                variant="secondary"
                size="lg"
                onClick={() => (window.location.href = '/register')}
              >
                Start Free Trial
              </PremiumButton>
              <PremiumButton
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/10"
                onClick={() => (window.location.href = '/contact')}
              >
                Talk to Sales
              </PremiumButton>
            </div>
          </PremiumCard>
        </AnimatedSection>
      </div>
    </VerticalSection>
  );
}

// ============================================
// SSR LOADING FALLBACK
// ============================================

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/50 to-purple-500/50 animate-pulse" />
        <p className="text-gray-400">Initializing SIVA...</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function Home() {
  const sections = ['SIVA', 'Engines', 'Q/T/L/E', 'Intelligence', 'Demo', 'Results', 'Pricing', 'Start'];
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <LoadingFallback />;
  }

  return (
    <>
      <NeuralMeshBackground />
      <ScrollProgressBar color="#3B82F6" />
      <Header />

      <VerticalLanding
        sections={sections}
        showProgress={false}
        showNav={true}
        showScrollIndicator={true}
      >
        <main>
          <AIGreetingSection />
          <CognitiveEngineSection />
          <ScoringSection />
          <IntelligenceSection />
          <MicroDemoSection />
          <StatsSection />
          <PricingSection />
          <FinalCTASection />
        </main>
      </VerticalLanding>

      <Footer />
      <MotionDebugOverlay />
    </>
  );
}
