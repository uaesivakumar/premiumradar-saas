'use client';

/**
 * Super Admin Login Page
 *
 * Secure login for founder-only Super Admin access.
 * Features:
 * - Email + Secret code authentication
 * - Rate limiting feedback
 * - No visible branding (stealth)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, AlertTriangle, Loader2 } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/superadmin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secretCode })
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Super Admin dashboard
        router.push('/superadmin');
      } else {
        setError(data.error || 'Authentication failed');
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        if (data.lockoutMinutes) {
          setLockoutMinutes(data.lockoutMinutes);
        }
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Minimal Header - No branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-200">Restricted Access</h1>
          <p className="text-sm text-gray-500 mt-1">Authorized personnel only</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-900 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm">{error}</p>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="text-red-500/70 text-xs mt-1">
                    {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                  </p>
                )}
                {lockoutMinutes && lockoutMinutes > 0 && (
                  <p className="text-red-500/70 text-xs mt-1">
                    Locked for {lockoutMinutes} minute{lockoutMinutes !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
              placeholder="admin@example.com"
              disabled={isLoading || Boolean(lockoutMinutes && lockoutMinutes > 0)}
            />
          </div>

          {/* Secret Code Field */}
          <div className="mb-6">
            <label htmlFor="secretCode" className="block text-sm font-medium text-gray-400 mb-2">
              Access Code
            </label>
            <div className="relative">
              <input
                id="secretCode"
                type="password"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all pr-12"
                placeholder="Enter access code"
                disabled={isLoading || Boolean(lockoutMinutes && lockoutMinutes > 0)}
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || (lockoutMinutes && lockoutMinutes > 0) || !email || !secretCode}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Access System'
            )}
          </button>
        </form>

        {/* Security Notice */}
        <p className="text-center text-gray-600 text-xs mt-6">
          All access attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
}
