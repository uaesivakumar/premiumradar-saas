'use client';

/**
 * PremiumRadar Landing Page - Stream 10 Complete
 *
 * Fully integrated premium landing with:
 * - S21: Motion Engine + Animation Framework
 * - S22: 3D AI Orb + Neural Mesh Engine
 * - S23: Dynamic Vertical Landing Engine
 * - S24: Micro-Demo Cinematic Experience
 * - S25: Premium SaaS Polish & Branding
 */

import { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DynamicOrb } from '@/components/ai-orb/DynamicOrb';
import {
  VerticalLanding,
  VerticalSection,
  ScrollProgressBar,
  AnimatedCounter,
  StickyTextReveal,
} from '@/components/landing/VerticalLanding';
import { MicroDemo } from '@/components/demo/MicroDemo';
import { PremiumCard, FeatureCard, PricingCard, StatCard } from '@/components/premium/PremiumCard';
import { PremiumButton, FAB } from '@/components/premium/PremiumButton';
import { AnimatedSection } from '@/components/motion/AnimatedSection';
import { MotionDebugOverlay } from '@/components/motion/MotionDebugOverlay';
import {
  heroTitleTransition,
  heroSubtitleTransition,
  heroCtaTransition,
} from '@/lib/motion/transitions';
import { springs } from '@/lib/motion/timing';
import { staggerContainer, staggerItem, rise } from '@/lib/motion/presets';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import {
  Zap,
  Shield,
  BarChart3,
  Globe,
  Brain,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';

// ============================================
// NEURAL MESH BACKGROUND
// ============================================

function NeuralMeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl"
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

      {/* Grid pattern overlay */}
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
// HERO SECTION WITH 3D ORB
// ============================================

function HeroSection() {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const [orbState, setOrbState] = useState<'idle' | 'active'>('idle');

  return (
    <VerticalSection
      id="section-0"
      background="transparent"
      animationType="none"
      className="relative min-h-screen flex items-center justify-center"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Intelligence Platform
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={heroTitleTransition}
          initial="hidden"
          animate="visible"
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6"
        >
          Premium
          <motion.span
            className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% 200%' }}
          >
            Radar
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={heroSubtitleTransition}
          initial="hidden"
          animate="visible"
          className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto"
        >
          Transform your business intelligence with our AI-first platform.
          Real-time insights, predictive analytics, and automated decisions.
        </motion.p>

        {/* 3D Neural Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-12 flex justify-center"
          onMouseEnter={() => setOrbState('active')}
          onMouseLeave={() => setOrbState('idle')}
        >
          <Suspense
            fallback={
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/50 to-purple-500/50 animate-pulse" />
            }
          >
            <DynamicOrb
              primaryColor={industryConfig.primaryColor}
              secondaryColor={industryConfig.secondaryColor}
              size="lg"
              state={orbState}
              showParticles={true}
              showConnections={true}
              icon={<Brain className="w-12 h-12" />}
            />
          </Suspense>
        </motion.div>

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
            Start Free Trial
          </PremiumButton>
          <PremiumButton
            variant="outline"
            size="lg"
            className="border-white/20 text-white hover:bg-white/10"
            leftIcon={<Play className="w-5 h-5" />}
            onClick={() => document.getElementById('section-3')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Watch Demo
          </PremiumButton>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm">SOC2 Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">99.9% Uptime</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-500" />
            <span className="text-sm">Global CDN</span>
          </div>
        </motion.div>
      </div>
    </VerticalSection>
  );
}

// ============================================
// STATS SECTION
// ============================================

function StatsSection() {
  return (
    <VerticalSection
      id="section-1"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="rise" className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join thousands of companies transforming their operations with AI-powered insights
          </p>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          <motion.div variants={staggerItem}>
            <PremiumCard variant="glass" hover="glow" className="text-center py-8">
              <div className="text-4xl font-bold text-white mb-2">
                <AnimatedCounter target={500} suffix="+" />
              </div>
              <p className="text-gray-400">Enterprise Clients</p>
            </PremiumCard>
          </motion.div>

          <motion.div variants={staggerItem}>
            <PremiumCard variant="glass" hover="glow" className="text-center py-8">
              <div className="text-4xl font-bold text-white mb-2">
                <AnimatedCounter target={2} suffix="M+" />
              </div>
              <p className="text-gray-400">API Calls/Day</p>
            </PremiumCard>
          </motion.div>

          <motion.div variants={staggerItem}>
            <PremiumCard variant="glass" hover="glow" className="text-center py-8">
              <div className="text-4xl font-bold text-white mb-2">
                <AnimatedCounter target={99} suffix="%" />
              </div>
              <p className="text-gray-400">Accuracy Rate</p>
            </PremiumCard>
          </motion.div>

          <motion.div variants={staggerItem}>
            <PremiumCard variant="glass" hover="glow" className="text-center py-8">
              <div className="text-4xl font-bold text-white mb-2">
                <AnimatedCounter target={50} suffix="ms" />
              </div>
              <p className="text-gray-400">Avg Response</p>
            </PremiumCard>
          </motion.div>
        </motion.div>
      </div>
    </VerticalSection>
  );
}

// ============================================
// FEATURES SECTION
// ============================================

function FeaturesSection() {
  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Analytics',
      description:
        'Advanced machine learning models that learn from your data and provide actionable insights.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-Time Processing',
      description:
        'Sub-millisecond data processing with our distributed computing infrastructure.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Enterprise Security',
      description:
        'Bank-grade encryption, SOC2 compliance, and comprehensive audit trails.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Predictive Forecasting',
      description:
        'Accurate predictions using historical patterns and market signals.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Scale',
      description:
        'Deploy across regions with automatic failover and load balancing.',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Natural Language',
      description:
        'Query your data using plain English - no SQL or technical knowledge required.',
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A comprehensive suite of tools designed for modern enterprises
          </p>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={staggerItem}>
              <PremiumCard variant="glass" hover="tilt" className="h-full">
                <div className="flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 flex-grow">{feature.description}</p>
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
// MICRO-DEMO SECTION
// ============================================

function DemoSection() {
  const demoSteps = [
    {
      id: 'connect',
      title: 'Connect Your Data',
      description: 'Securely connect to any data source in minutes',
      duration: 4000,
      content: (
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-8 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">Data Sources</p>
                <p className="text-gray-400 text-sm">15 integrations available</p>
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'analyze',
      title: 'AI Analyzes Patterns',
      description: 'Our AI identifies trends and anomalies automatically',
      duration: 4000,
      content: (
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl p-8 border border-white/10"
          >
            <div className="space-y-3">
              {[85, 92, 78].map((value, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ delay: i * 0.2, duration: 0.8 }}
                    />
                  </div>
                  <span className="text-white text-sm">{value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: 'insights',
      title: 'Get Actionable Insights',
      description: 'Receive clear recommendations and predictions',
      duration: 4000,
      content: (
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-cyan-500/20 to-green-500/20 rounded-2xl p-8 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
              <div className="text-left">
                <p className="text-white font-semibold">Revenue Forecast</p>
                <p className="text-green-400 text-2xl font-bold">+24%</p>
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
  ];

  return (
    <VerticalSection
      id="section-3"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="rise" className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            See It In Action
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Watch how PremiumRadar transforms raw data into business intelligence
          </p>
        </AnimatedSection>

        <MicroDemo
          steps={demoSteps}
          autoPlay={false}
          defaultStepDuration={4000}
          className="shadow-2xl shadow-blue-500/10"
        />
      </div>
    </VerticalSection>
  );
}

// ============================================
// PRICING SECTION
// ============================================

function PricingSection() {
  return (
    <VerticalSection
      id="section-4"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="rise" className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Scale as you grow.
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
              name="Starter"
              price="$99"
              description="Perfect for small teams getting started"
              features={[
                '10,000 API calls/month',
                '5 team members',
                'Basic analytics',
                'Email support',
              ]}
              ctaText="Start Free Trial"
              onCta={() => (window.location.href = '/register')}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <PricingCard
              name="Professional"
              price="$299"
              description="For growing businesses with advanced needs"
              features={[
                '100,000 API calls/month',
                'Unlimited team members',
                'Advanced analytics',
                'Priority support',
                'Custom integrations',
              ]}
              ctaText="Start Free Trial"
              isPopular
              onCta={() => (window.location.href = '/register')}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <PricingCard
              name="Enterprise"
              price="Custom"
              period=""
              description="For large organizations with custom requirements"
              features={[
                'Unlimited API calls',
                'Dedicated infrastructure',
                'Custom AI models',
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
// CTA SECTION
// ============================================

function CTASection() {
  return (
    <VerticalSection
      id="section-5"
      background="transparent"
      className="py-24"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection animation="scale">
          <PremiumCard
            variant="gradient"
            gradientFrom="#3B82F6"
            gradientTo="#8B5CF6"
            className="py-16 px-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of companies using PremiumRadar to make smarter decisions.
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
// MAIN PAGE COMPONENT
// ============================================

export default function Home() {
  const sections = ['Hero', 'Stats', 'Features', 'Demo', 'Pricing', 'CTA'];

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
          <HeroSection />
          <StatsSection />
          <FeaturesSection />
          <DemoSection />
          <PricingSection />
          <CTASection />
        </main>
      </VerticalLanding>

      <Footer />

      {/* Motion Debug Overlay (dev only) */}
      <MotionDebugOverlay />
    </>
  );
}
