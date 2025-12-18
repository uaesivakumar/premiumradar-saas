'use client';

/**
 * Beta Waitlist Page
 * US SaaS Edition - Private Beta
 *
 * Shows when user doesn't have beta access
 */

import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Mail, CheckCircle2, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function BetaPageContent() {
  const searchParams = useSearchParams();
  const feature = searchParams?.get('feature') || null;
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to a waitlist API
    console.log('[Beta Waitlist] Request access for:', email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Main Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-purple-500/20 via-blue-500/10 to-transparent border-b border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">US SaaS Edition</h1>
                <p className="text-sm text-gray-400">Private Beta</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  You're on the list!
                </h2>
                <p className="text-gray-400 text-sm">
                  We'll reach out when your beta access is ready.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Feature Info */}
                {feature && (
                  <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-sm text-amber-400">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      You're trying to access <strong>Deal Evaluation</strong> - a beta feature
                    </p>
                  </div>
                )}

                {/* Description */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white mb-2">
                    Get Early Access
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    The US SaaS Edition helps founders, CFOs, and VP Sales make confident
                    deal decisions with AI-powered risk analysis and GO/NO-GO verdicts.
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {[
                    'Skeptical CFO lens for deal evaluation',
                    'GO / HIGH_RISK / NO_GO verdicts',
                    'Risk factors with severity ratings',
                    'Decisive next-step recommendations',
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Price Preview */}
                <div className="mb-6 p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Beta Pricing</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">$199</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Locked in for early adopters
                  </p>
                </div>

                {/* Waitlist Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-400 hover:to-blue-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Rocket className="w-5 h-5" />
                    Request Early Access
                  </button>
                </form>

                <p className="text-center text-xs text-gray-500 mt-4">
                  Already have access?{' '}
                  <Link href="/login" className="text-purple-400 hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          PremiumRadar US SaaS Edition
        </p>
      </motion.div>
    </div>
  );
}

// Loading fallback
function BetaPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
    </div>
  );
}

// Main export with Suspense boundary
export default function BetaPage() {
  return (
    <Suspense fallback={<BetaPageLoading />}>
      <BetaPageContent />
    </Suspense>
  );
}
