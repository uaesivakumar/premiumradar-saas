'use client';

/**
 * PremiumRadar - Stealth Mode Landing
 *
 * Private beta showcase for invited viewers.
 * Cinematic, mysterious, impressive.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Lock, Sparkles, ChevronRight, Mail } from 'lucide-react';

// Particle effect for background
function ParticleField() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-blue-500/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Neural network grid animation
function NeuralGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Scanning line effect */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Pulsing orb component
function PulsingOrb() {
  return (
    <div className="relative">
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-500/20"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        style={{ width: 160, height: 160, marginLeft: -30, marginTop: -30 }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-purple-500/20"
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.2, 0, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeOut',
          delay: 0.5,
        }}
        style={{ width: 160, height: 160, marginLeft: -30, marginTop: -30 }}
      />

      {/* Main orb */}
      <motion.div
        className="relative w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.5), 0 0 120px rgba(59, 130, 246, 0.3)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Radar className="w-10 h-10 text-white" />
        </motion.div>
      </motion.div>
    </div>
  );
}

// Typewriter effect for the main message
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= text.length) {
          setDisplayedText(text.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
          // Keep cursor blinking
        }
      }, 50);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span>
      {displayedText}
      <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>|</span>
    </span>
  );
}

// Floating badges
function FloatingBadges() {
  const badges = [
    { text: 'AI-Powered', delay: 0, x: -120, y: -80 },
    { text: 'Enterprise', delay: 0.5, x: 100, y: -60 },
    { text: 'Sales Intelligence', delay: 1, x: -100, y: 80 },
    { text: 'UAE Market', delay: 1.5, x: 110, y: 70 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {badges.map((badge, i) => (
        <motion.div
          key={badge.text}
          className="absolute left-1/2 top-1/2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.6, 0.6, 0],
            scale: [0.5, 1, 1, 0.8],
            x: badge.x,
            y: badge.y,
          }}
          transition={{
            duration: 8,
            delay: badge.delay + 3,
            repeat: Infinity,
            repeatDelay: 4,
          }}
        >
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-gray-400 border border-white/10 backdrop-blur-sm">
            {badge.text}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export default function StealthLanding() {
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'main'>('loading');
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    // Phase transitions
    const timer1 = setTimeout(() => setPhase('reveal'), 1500);
    const timer2 = setTimeout(() => setPhase('main'), 2500);
    const timer3 = setTimeout(() => setShowEmail(true), 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        {/* Deep gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a0a1a] to-slate-950" />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

        <NeuralGrid />
        <ParticleField />
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Lock className="w-8 h-8 text-blue-500/50" />
            </motion.div>
          </motion.div>
        )}

        {(phase === 'reveal' || phase === 'main') && (
          <motion.div
            key="main"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative z-10 text-center px-6 max-w-2xl mx-auto"
          >
            {/* Floating badges */}
            <FloatingBadges />

            {/* Logo orb */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex justify-center mb-10"
            >
              <PulsingOrb />
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mb-3"
            >
              <span className="text-sm font-medium tracking-[0.3em] text-gray-500 uppercase">
                PremiumRadar
              </span>
            </motion.div>

            {/* Main greeting */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              <span className="text-white">Hello, </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Friend
              </span>
              <span className="text-white">.</span>
            </motion.h1>

            {/* Typewriter message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mb-8"
            >
              <p className="text-xl md:text-2xl text-gray-400 leading-relaxed">
                <TypewriterText
                  text="This experience is by invitation only."
                  delay={1500}
                />
              </p>
            </motion.div>

            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.5, duration: 0.5 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm">
                <motion.span
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm text-gray-300">Private Beta</span>
                <span className="text-gray-600 mx-2">|</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-400">Coming to Production Soon</span>
              </div>
            </motion.div>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4, duration: 0.5 }}
              className="text-gray-500 text-sm mb-10 max-w-md mx-auto"
            >
              We're building something extraordinary. The future of AI-powered sales intelligence
              for the UAE market is almost ready.
            </motion.p>

            {/* Email signup teaser */}
            <AnimatePresence>
              {showEmail && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col items-center gap-4"
                >
                  <button
                    className="group flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                    onClick={() => window.location.href = 'mailto:siva@sivakumar.ai?subject=PremiumRadar%20Early%20Access'}
                  >
                    <Mail className="w-5 h-5" />
                    <span>Request Early Access</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <p className="text-gray-600 text-xs">
                    Limited to select partners
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer signature */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5, duration: 0.5 }}
              className="absolute bottom-8 left-0 right-0 text-center"
            >
              <p className="text-gray-700 text-xs">
                Crafted with SIVA Intelligence
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}
