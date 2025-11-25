/**
 * Locked Feature Component
 *
 * Display locked feature overlay and upgrade prompts.
 */

'use client';

import { useDemoModeStore, getLockedFeatureInfo, type LockedFeature } from '@/lib/demo';

interface LockedFeatureOverlayProps {
  feature: LockedFeature;
  children: React.ReactNode;
}

export function LockedFeatureOverlay({ feature, children }: LockedFeatureOverlayProps) {
  const { isFeatureLocked, attemptLockedFeature } = useDemoModeStore();

  if (!isFeatureLocked(feature)) {
    return <>{children}</>;
  }

  const info = getLockedFeatureInfo(feature);

  const handleClick = () => {
    attemptLockedFeature(feature);
  };

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none opacity-50">
        {children}
      </div>

      {/* Locked overlay */}
      <div
        onClick={handleClick}
        className="absolute inset-0 flex items-center justify-center cursor-pointer group"
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 p-6 text-center max-w-sm shadow-lg group-hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{info.label}</h3>
          <p className="text-sm text-gray-500 mb-4">{info.description}</p>
          <div className="flex flex-col gap-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                info.tier === 'Pro'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {info.tier} Feature
            </span>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Click to upgrade →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Locked button that shows upgrade prompt on click
interface LockedButtonProps {
  feature: LockedFeature;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function LockedButton({
  feature,
  children,
  className = '',
  onClick,
}: LockedButtonProps) {
  const { isFeatureLocked, attemptLockedFeature } = useDemoModeStore();

  const handleClick = () => {
    if (isFeatureLocked(feature)) {
      attemptLockedFeature(feature);
    } else {
      onClick?.();
    }
  };

  const info = getLockedFeatureInfo(feature);
  const isLocked = isFeatureLocked(feature);

  return (
    <button
      onClick={handleClick}
      className={`relative ${className} ${isLocked ? 'opacity-75' : ''}`}
    >
      {children}
      {isLocked && (
        <span className="ml-2 inline-flex items-center gap-1">
          <span className="text-xs">🔒</span>
          <span className="text-xs opacity-75">{info.tier}</span>
        </span>
      )}
    </button>
  );
}

// Locked badge indicator
interface LockedBadgeProps {
  feature: LockedFeature;
  showLabel?: boolean;
}

export function LockedBadge({ feature, showLabel = true }: LockedBadgeProps) {
  const { isFeatureLocked, attemptLockedFeature } = useDemoModeStore();

  if (!isFeatureLocked(feature)) return null;

  const info = getLockedFeatureInfo(feature);

  return (
    <button
      onClick={() => attemptLockedFeature(feature)}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        info.tier === 'Pro'
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      } transition-colors`}
    >
      🔒 {showLabel && info.tier}
    </button>
  );
}

// Feature gate wrapper
interface FeatureGateProps {
  feature: LockedFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { isFeatureLocked } = useDemoModeStore();

  if (isFeatureLocked(feature)) {
    return fallback ? <>{fallback}</> : <LockedFeaturePlaceholder feature={feature} />;
  }

  return <>{children}</>;
}

// Placeholder for locked features
function LockedFeaturePlaceholder({ feature }: { feature: LockedFeature }) {
  const { attemptLockedFeature } = useDemoModeStore();
  const info = getLockedFeatureInfo(feature);

  return (
    <div
      onClick={() => attemptLockedFeature(feature)}
      className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">{info.icon}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{info.label}</h3>
      <p className="text-sm text-gray-500 mb-4">{info.description}</p>
      <span
        className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
          info.tier === 'Pro'
            ? 'bg-blue-600 text-white'
            : 'bg-purple-600 text-white'
        }`}
      >
        Upgrade to {info.tier}
      </span>
    </div>
  );
}

// Locked features list
export function LockedFeaturesList() {
  const { state, attemptLockedFeature } = useDemoModeStore();

  if (!state?.isDemo) return null;

  const features = state.lockedFeatures;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">
        Features available in paid plans
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature) => {
          const info = getLockedFeatureInfo(feature);
          return (
            <button
              key={feature}
              onClick={() => attemptLockedFeature(feature)}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors text-left"
            >
              <span className="text-xl">{info.icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {info.label}
                </div>
                <div className="text-xs text-gray-500">{info.tier}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
