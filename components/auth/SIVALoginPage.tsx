'use client';

/**
 * SIVALoginPage - Sprint S31
 * 2030 AI-first login page with neural background
 * Matches SIVA surface aesthetic
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SIVAAuthFrame } from './SIVAAuthFrame';
import { AuthScaffold } from './AuthScaffold';
import { AnimatedInput } from './AnimatedInput';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

export function SIVALoginPage() {
  const router = useRouter();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Integrate with NextAuth signIn
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For now, redirect to onboarding or dashboard
      router.push('/onboarding/welcome');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'microsoft' | 'github') => {
    // TODO: Integrate with NextAuth signIn(provider)
    console.log('Social login:', provider);
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push('/onboarding/welcome');
  };

  return (
    <SIVAAuthFrame title="Welcome back" subtitle="Sign in to continue to your workspace">
      <AuthScaffold
        mode="login"
        onSocialLogin={handleSocialLogin}
        isLoading={isLoading}
        footerLink={{
          text: "Don't have an account?",
          linkText: 'Sign up',
          href: '/signup',
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Email Input */}
          <AnimatedInput
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            icon={<Mail className="w-5 h-5" />}
            required
            autoComplete="email"
          />

          {/* Password Input */}
          <AnimatedInput
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            icon={<Lock className="w-5 h-5" />}
            required
            autoComplete="current-password"
          />

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !email || !password}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className={`
              w-full py-3 rounded-xl text-white font-semibold
              flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300
            `}
            style={{
              background: `linear-gradient(135deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
            }}
          >
            {isLoading ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>
      </AuthScaffold>
    </SIVAAuthFrame>
  );
}

export default SIVALoginPage;
