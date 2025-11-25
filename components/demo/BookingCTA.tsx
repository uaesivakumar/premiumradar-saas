/**
 * Booking CTA Component
 *
 * Modal/banner to encourage demo users to book a meeting.
 */

'use client';

import { useDemoModeStore, getLockedFeatureInfo, type LockedFeature } from '@/lib/demo';

export function BookingCTAModal() {
  const { currentCTA, dismissCTA, trackCTAClick } = useDemoModeStore();

  if (!currentCTA || currentCTA.type !== 'modal') return null;

  const handleCTAClick = () => {
    trackCTAClick();
    window.location.href = currentCTA.ctaUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={currentCTA.dismissable ? dismissCTA : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">
              {currentCTA.trigger === 'action-limit' && '⏱️'}
              {currentCTA.trigger === 'time-limit' && '⌛'}
              {currentCTA.trigger === 'feature-locked' && '🔒'}
              {currentCTA.trigger === 'export-attempt' && '📤'}
              {currentCTA.trigger === 'exit-intent' && '👋'}
              {currentCTA.trigger === 'manual' && '🚀'}
            </span>
          </div>
          <h2 className="text-2xl font-bold">{currentCTA.headline}</h2>
          <p className="mt-2 text-white/80">{currentCTA.subheadline}</p>
        </div>

        {/* Features preview */}
        <div className="px-6 py-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">
            Unlock full access to:
          </h3>
          <div className="space-y-2">
            {(['export', 'bulk-operations', 'api-access', 'custom-reports'] as LockedFeature[]).map(
              (feature) => {
                const info = getLockedFeatureInfo(feature);
                return (
                  <div key={feature} className="flex items-center gap-3">
                    <span className="text-lg">{info.icon}</span>
                    <span className="text-sm text-gray-700">{info.label}</span>
                    <span className="text-xs text-gray-400">— {info.description}</span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <button
            onClick={handleCTAClick}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            {currentCTA.ctaText}
          </button>
          {currentCTA.dismissable && (
            <button
              onClick={dismissCTA}
              className="w-full py-2 text-gray-500 text-sm hover:text-gray-700"
            >
              Continue in demo mode
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline CTA banner
export function BookingCTABanner() {
  const { currentCTA, dismissCTA, trackCTAClick } = useDemoModeStore();

  if (!currentCTA || currentCTA.type !== 'banner') return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <span className="font-medium">{currentCTA.headline}</span>
          <span className="ml-2 text-white/80">{currentCTA.subheadline}</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={currentCTA.ctaUrl}
            onClick={() => trackCTAClick()}
            className="px-4 py-1.5 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50"
          >
            {currentCTA.ctaText}
          </a>
          {currentCTA.dismissable && (
            <button
              onClick={dismissCTA}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Sidebar CTA card
export function BookingCTASidebar() {
  const { state, showCTA, trackCTAClick } = useDemoModeStore();

  if (!state?.isDemo) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-xl">📅</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Ready for more?</h3>
          <p className="text-sm text-gray-500">See the full platform</p>
        </div>
      </div>

      <ul className="space-y-2 mb-4">
        {['Unlimited domain analysis', 'Full data exports', 'API access'].map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-green-500">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <a
        href="/book-demo"
        onClick={() => trackCTAClick()}
        className="block w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg text-center hover:from-blue-700 hover:to-purple-700 transition-all"
      >
        Book a Meeting
      </a>
    </div>
  );
}
