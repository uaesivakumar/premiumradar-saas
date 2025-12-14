'use client';

/**
 * SIVASignupPage - Sprint S31
 * 2030 AI-first signup page with neural background
 * Matches SIVA surface aesthetic
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { SIVAAuthFrame } from './SIVAAuthFrame';
import { AuthScaffold } from './AuthScaffold';
import { AnimatedInput } from './AnimatedInput';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

export function SIVASignupPage() {
  const router = useRouter();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // VS10.2: Real signup API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          vertical: 'banking', // Default to banking (only active vertical)
          subVertical: 'employee-banking',
          regionCountry: 'UAE',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to create account. Please try again.');
        return;
      }

      // VS12: Redirect to email verification page
      router.push(data.redirectTo || '/verify-email');
    } catch {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'microsoft' | 'github') => {
    // Social login not yet configured - show message
    setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} signup is not yet configured. Please use email/password.`);
  };

  return (
    <SIVAAuthFrame title="Create your account" subtitle="Join PremiumRadar and unlock AI-powered intelligence">
      <AuthScaffold
        mode="signup"
        onSocialLogin={handleSocialLogin}
        isLoading={isLoading}
        footerLink={{
          text: 'Already have an account?',
          linkText: 'Sign in',
          href: '/login',
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

          {/* Name Input */}
          <AnimatedInput
            label="Full name"
            type="text"
            value={name}
            onChange={setName}
            icon={<User className="w-5 h-5" />}
            required
            autoComplete="name"
          />

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
            autoComplete="new-password"
          />

          {/* Confirm Password Input */}
          <AnimatedInput
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            icon={<Lock className="w-5 h-5" />}
            required
            autoComplete="new-password"
          />

          {/* Password Requirements */}
          {password.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <p className="text-xs text-gray-500 mb-2">Password requirements:</p>
              <div className="grid grid-cols-2 gap-2">
                <PasswordCheck label="8+ characters" met={passwordChecks.length} color={industryConfig.primaryColor} />
                <PasswordCheck label="Uppercase" met={passwordChecks.uppercase} color={industryConfig.primaryColor} />
                <PasswordCheck label="Lowercase" met={passwordChecks.lowercase} color={industryConfig.primaryColor} />
                <PasswordCheck label="Number" met={passwordChecks.number} color={industryConfig.primaryColor} />
              </div>
              {confirmPassword.length > 0 && (
                <PasswordCheck label="Passwords match" met={passwordChecks.match} color={industryConfig.primaryColor} />
              )}
            </motion.div>
          )}

          {/* Terms */}
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <a href="/terms" className="text-gray-400 hover:text-white underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-gray-400 hover:text-white underline">
              Privacy Policy
            </a>
          </p>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !name || !email || !isPasswordValid}
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>
      </AuthScaffold>
    </SIVAAuthFrame>
  );
}

// Password Check Indicator
function PasswordCheck({ label, met, color }: { label: string; met: boolean; color: string }) {
  return (
    <motion.div
      className="flex items-center gap-2 text-xs"
      animate={{ opacity: met ? 1 : 0.5 }}
    >
      <motion.div
        className={`w-4 h-4 rounded-full flex items-center justify-center border ${
          met ? 'border-transparent' : 'border-white/20'
        }`}
        style={{
          backgroundColor: met ? color : 'transparent',
        }}
        animate={{ scale: met ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.2 }}
      >
        {met && <Check className="w-3 h-3 text-white" />}
      </motion.div>
      <span className={met ? 'text-white' : 'text-gray-500'}>{label}</span>
    </motion.div>
  );
}

export default SIVASignupPage;
