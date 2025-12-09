'use client';

/**
 * PremiumRadar - Stealth Mode Landing (S133)
 *
 * Private beta showcase with:
 * - Waitlist signup for early access
 * - Beta access code verification
 * - Cinematic, mysterious, impressive design
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Radar,
  Lock,
  Sparkles,
  ChevronRight,
  Mail,
  Check,
  AlertCircle,
  Loader2,
  Key,
  Users,
  Building2,
  Zap,
} from 'lucide-react';

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
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// Pulsing orb component
function PulsingOrb() {
  return (
    <div className="relative">
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-500/20"
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
        style={{ width: 160, height: 160, marginLeft: -30, marginTop: -30 }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-purple-500/20"
        animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
        style={{ width: 160, height: 160, marginLeft: -30, marginTop: -30 }}
      />
      <motion.div
        className="relative w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.5), 0 0 120px rgba(59, 130, 246, 0.3)',
        }}
        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
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

// Typewriter effect
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
        }
      }, 50);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  useEffect(() => {
    const cursorInterval = setInterval(() => setShowCursor(prev => !prev), 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span>
      {displayedText}
      <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>|</span>
    </span>
  );
}

// Waitlist Stats Display
function WaitlistStats({ stats }: { stats: { totalSignups: number; corporateSignups: number } }) {
  if (stats.totalSignups === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-6 text-sm text-gray-500 mt-4"
    >
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4" />
        <span>{stats.totalSignups} on waitlist</span>
      </div>
      {stats.corporateSignups > 0 && (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <span>{stats.corporateSignups} companies</span>
        </div>
      )}
    </motion.div>
  );
}

// Waitlist Form Component
function WaitlistForm({ onSuccess }: { onSuccess: (position: number) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNameField, setShowNameField] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to join waitlist');
        return;
      }

      onSuccess(data.data?.position || data.position || 1);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      {/* Email Input */}
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (e.target.value.includes('@') && !showNameField) {
              setShowNameField(true);
            }
          }}
          placeholder="Enter your work email"
          className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          required
        />
      </div>

      {/* Name Input (appears after email) */}
      <AnimatePresence>
        {showNameField && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !email}
        className="group w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Join the Waitlist</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
}

// Beta Access Form Component
function BetaAccessForm({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/beta-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!data.success || !data.valid) {
        setError(data.message || 'Invalid access code');
        return;
      }

      onSuccess();
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm mx-auto">
      <div className="relative">
        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter access code"
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono tracking-widest"
          required
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-red-400 text-sm justify-center"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </motion.div>
      )}

      <button
        type="submit"
        disabled={loading || !code}
        className="group w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/20 text-white font-medium transition-all hover:bg-white/10 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Verify Access</span>
          </>
        )}
      </button>
    </form>
  );
}

// Success Message Component
function WaitlistSuccess({ position }: { position: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-4"
    >
      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
        <Check className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white">You're In!</h3>
      <p className="text-gray-400">
        You're <span className="text-blue-400 font-semibold">#{position}</span> on the waitlist
      </p>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">
        We'll send you an exclusive access code when we're ready to welcome you to PremiumRadar.
      </p>
      <div className="pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Priority access for UAE sales professionals</span>
        </div>
      </div>
    </motion.div>
  );
}

// Main Landing Component
export default function StealthLanding() {
  const router = useRouter();
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'main'>('loading');
  const [view, setView] = useState<'waitlist' | 'access' | 'success'>('waitlist');
  const [waitlistPosition, setWaitlistPosition] = useState(0);
  const [stats, setStats] = useState({ totalSignups: 0, corporateSignups: 0 });

  // Fetch waitlist stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/waitlist');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch {
      // Silent fail for stats
    }
  }, []);

  useEffect(() => {
    // Phase transitions
    const timer1 = setTimeout(() => setPhase('reveal'), 1500);
    const timer2 = setTimeout(() => setPhase('main'), 2500);

    // Fetch stats
    fetchStats();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [fetchStats]);

  const handleWaitlistSuccess = (position: number) => {
    setWaitlistPosition(position);
    setView('success');
    fetchStats();
  };

  const handleBetaAccess = () => {
    // Store beta access in session
    sessionStorage.setItem('betaAccess', 'true');
    router.push('/onboarding/welcome');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a0a1a] to-slate-950" />
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
            className="relative z-10 text-center px-6 max-w-2xl mx-auto py-12"
          >
            {/* Logo orb */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex justify-center mb-8"
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
              <span className="text-white">AI-Powered </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Sales Intelligence
              </span>
            </motion.h1>

            {/* Typewriter message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mb-6"
            >
              <p className="text-xl md:text-2xl text-gray-400 leading-relaxed">
                <TypewriterText
                  text="Your cognitive sales OS for the UAE market."
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
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm text-gray-300">Private Beta</span>
                <span className="text-gray-600 mx-2">|</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-400">Banking Vertical Active</span>
              </div>
            </motion.div>

            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4, duration: 0.5 }}
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                {view === 'waitlist' && (
                  <motion.div
                    key="waitlist"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <WaitlistForm onSuccess={handleWaitlistSuccess} />
                    <WaitlistStats stats={stats} />

                    {/* Toggle to access code */}
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <button
                        onClick={() => setView('access')}
                        className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
                      >
                        Already have an access code?{' '}
                        <span className="text-blue-400 hover:text-blue-300">Enter here</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {view === 'access' && (
                  <motion.div
                    key="access"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <p className="text-gray-400 text-sm mb-4">
                      Enter your exclusive access code to begin
                    </p>
                    <BetaAccessForm onSuccess={handleBetaAccess} />

                    {/* Toggle back to waitlist */}
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <button
                        onClick={() => setView('waitlist')}
                        className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
                      >
                        Don't have a code?{' '}
                        <span className="text-blue-400 hover:text-blue-300">Join the waitlist</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {view === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <WaitlistSuccess position={waitlistPosition} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Footer signature */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5, duration: 0.5 }}
              className="mt-12 text-center"
            >
              <p className="text-gray-700 text-xs">
                Powered by SIVA Intelligence
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
