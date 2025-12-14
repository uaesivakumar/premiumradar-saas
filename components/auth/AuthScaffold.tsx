'use client';

/**
 * AuthScaffold - Sprint S31
 * Shared auth layout with social login and form sections
 * 2030 AI-first authentication scaffold
 */

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

interface AuthScaffoldProps {
  mode: 'login' | 'signup';
  onSocialLogin?: (provider: 'google' | 'microsoft' | 'github') => Promise<void>;
  children: ReactNode;
  isLoading?: boolean;
  footerLink?: {
    text: string;
    linkText: string;
    href: string;
  };
}

export function AuthScaffold({
  mode,
  onSocialLogin,
  children,
  isLoading = false,
  footerLink,
}: AuthScaffoldProps) {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSocialClick = async (provider: 'google' | 'microsoft' | 'github') => {
    if (!onSocialLogin) return;
    setSocialLoading(provider);
    try {
      await onSocialLogin(provider);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Work Email Notice */}
      <div className="text-center text-sm text-gray-400 bg-white/5 rounded-lg px-4 py-3">
        <span className="text-blue-400">Work email required</span> — Personal email providers (Gmail, Yahoo, etc.) are not allowed.
      </div>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Footer Link */}
      {footerLink && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-gray-400 text-sm"
        >
          {footerLink.text}{' '}
          <Link
            href={footerLink.href}
            className="font-semibold hover:underline transition-colors"
            style={{ color: industryConfig.primaryColor }}
          >
            {footerLink.linkText}
          </Link>
        </motion.p>
      )}
    </div>
  );
}

// Social Login Button Component
interface SocialButtonProps {
  provider: 'google' | 'microsoft' | 'github';
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  primaryColor: string;
}

function SocialButton({ provider, onClick, isLoading, disabled, primaryColor }: SocialButtonProps) {
  const config = {
    google: {
      name: 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
    },
    microsoft: {
      name: 'Microsoft',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#00A4EF" d="M1 13h10v10H1z" />
          <path fill="#7FBA00" d="M13 1h10v10H13z" />
          <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
      ),
    },
    github: {
      name: 'GitHub',
      icon: (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const { name, icon } = config[provider];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-3
        bg-white/5 border border-white/10 rounded-xl
        text-white font-medium
        hover:bg-white/10 hover:border-white/20
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
      `}
      style={{
        borderColor: isLoading ? primaryColor : undefined,
      }}
    >
      {isLoading ? (
        <motion.div
          className="w-5 h-5 border-2 border-white/30 rounded-full"
          style={{ borderTopColor: primaryColor }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        icon
      )}
      <span>Continue with {name}</span>
    </motion.button>
  );
}

export default AuthScaffold;
