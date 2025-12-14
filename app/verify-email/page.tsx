'use client';

/**
 * VS12: Email Verification Page
 * User enters the 6-digit code received via email
 */

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { SIVAAuthFrame } from '@/components/auth/SIVAAuthFrame';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams?.get('userId') ?? null;
  const email = searchParams?.get('email') ?? null;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(null);

    // Move to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (digit && index === 5 && newCode.every((d) => d !== '')) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (codeString?: string) => {
    const verificationCode = codeString || code.join('');

    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!userId) {
      setError('Invalid verification session. Please sign up again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Invalid or expired code. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccess(true);

      // Redirect to onboarding after short delay
      setTimeout(() => {
        router.push('/onboarding/welcome');
      }, 1500);
    } catch {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !userId) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to resend code.');
        return;
      }

      setResendCooldown(60); // 60 second cooldown
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!userId) {
    return (
      <SIVAAuthFrame title="Verification Error" subtitle="Invalid verification session">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">No user ID found. Please sign up again.</p>
          <button
            onClick={() => router.push('/signup')}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Go to Signup
          </button>
        </div>
      </SIVAAuthFrame>
    );
  }

  return (
    <SIVAAuthFrame title="Verify your email" subtitle="Enter the 6-digit code we sent you">
      <div className="space-y-6">
        {/* Email display */}
        {email && (
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Mail className="w-4 h-4" />
            <span>Code sent to {email}</span>
          </div>
        )}

        {/* Success message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-center"
          >
            Email verified successfully! Redirecting...
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Code input */}
        {!success && (
          <>
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                  className={`
                    w-12 h-14 text-center text-2xl font-bold rounded-lg
                    bg-white/5 border-2 text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    disabled:opacity-50 transition-all
                    ${digit ? 'border-blue-500/50' : 'border-white/10'}
                  `}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                />
              ))}
            </div>

            {/* Verify button */}
            <motion.button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isLoading || code.some((d) => d === '')}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="
                w-full py-3 rounded-xl text-white font-semibold
                flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300
                bg-gradient-to-r from-blue-600 to-purple-600
              "
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Email</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {/* Resend code */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending || resendCooldown > 0}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive the code? Resend"}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">The code will expire in 15 minutes.</p>
          </>
        )}
      </div>
    </SIVAAuthFrame>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <SIVAAuthFrame title="Loading..." subtitle="Please wait">
          <div className="flex justify-center py-8">
            <motion.div
              className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </SIVAAuthFrame>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
