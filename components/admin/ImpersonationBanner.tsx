/**
 * Impersonation Banner Component
 *
 * Banner displayed when admin is impersonating a tenant.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  useImpersonationStore,
  selectIsImpersonating,
  selectImpersonationSession,
  formatSessionTimeRemaining,
  isSessionExpiringSoon,
  endImpersonation,
  getImpersonationRestrictions,
} from '@/lib/admin';

export function ImpersonationBanner() {
  const isImpersonating = useImpersonationStore(selectIsImpersonating);
  const session = useImpersonationStore(selectImpersonationSession);
  const endSession = useImpersonationStore((s) => s.endImpersonation);
  const extendSession = useImpersonationStore((s) => s.extendSession);
  const isValid = useImpersonationStore((s) => s.isSessionValid);

  const [timeRemaining, setTimeRemaining] = useState('');
  const [showRestrictions, setShowRestrictions] = useState(false);

  useEffect(() => {
    if (!isImpersonating || !session) return;

    const interval = setInterval(() => {
      if (!isValid()) {
        handleEndSession();
      } else {
        setTimeRemaining(formatSessionTimeRemaining(session.expiresAt));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isImpersonating, session]);

  async function handleEndSession() {
    if (session) {
      await endImpersonation(session);
    }
    endSession();
  }

  function handleExtendSession() {
    extendSession(15); // Extend by 15 minutes
  }

  if (!isImpersonating || !session) {
    return null;
  }

  const expiringSoon = session ? isSessionExpiringSoon(session.expiresAt) : false;

  return (
    <>
      {/* Fixed banner at top */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 ${
          expiringSoon ? 'bg-red-600' : 'bg-orange-500'
        } text-white shadow-lg`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">👁️</span>
                <span className="font-medium">Impersonating:</span>
                <span className="font-bold">{session.targetTenantName}</span>
              </div>

              <div className="text-sm opacity-90">
                Time remaining:{' '}
                <span className={`font-mono ${expiringSoon ? 'font-bold' : ''}`}>
                  {timeRemaining}
                </span>
              </div>

              <button
                onClick={() => setShowRestrictions(!showRestrictions)}
                className="text-sm underline opacity-90 hover:opacity-100"
              >
                {showRestrictions ? 'Hide' : 'Show'} restrictions
              </button>
            </div>

            <div className="flex items-center gap-3">
              {expiringSoon && (
                <button
                  onClick={handleExtendSession}
                  className="px-3 py-1 text-sm bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  +15 min
                </button>
              )}

              <button
                onClick={handleEndSession}
                className="px-4 py-1.5 text-sm bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium"
              >
                End Session
              </button>
            </div>
          </div>

          {/* Restrictions panel */}
          {showRestrictions && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <div className="text-sm opacity-90">
                <span className="font-medium">Restrictions during impersonation:</span>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {getImpersonationRestrictions().map((restriction, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span>•</span>
                      <span>{restriction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spacer to push content down */}
      <div className={`h-${showRestrictions ? '20' : '12'}`} />
    </>
  );
}

export default ImpersonationBanner;
