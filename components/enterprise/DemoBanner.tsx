'use client';

/**
 * S303: Demo Banner Component
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Frontend & UI
 *
 * Displays demo status and upgrade prompts.
 */

import React from 'react';
import { useDemo, useEnterprise } from '@/lib/providers/EnterpriseContextProvider';

interface DemoBannerProps {
  variant?: 'banner' | 'card' | 'minimal';
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export function DemoBanner({ variant = 'banner', onUpgrade, onDismiss }: DemoBannerProps) {
  const { demo, isDemoUser, isDemoExpired } = useDemo();
  const { user } = useEnterprise();

  if (!isDemoUser) {
    return null;
  }

  // Determine urgency based on days remaining
  const getUrgencyColor = () => {
    if (isDemoExpired) {
      return 'bg-red-500';
    }
    if (demo.days_remaining !== null && demo.days_remaining <= 3) {
      return 'bg-amber-500';
    }
    return 'bg-blue-500';
  };

  const getUrgencyBg = () => {
    if (isDemoExpired) {
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    }
    if (demo.days_remaining !== null && demo.days_remaining <= 3) {
      return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    }
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  };

  const getUrgencyText = () => {
    if (isDemoExpired) {
      return 'text-red-800 dark:text-red-300';
    }
    if (demo.days_remaining !== null && demo.days_remaining <= 3) {
      return 'text-amber-800 dark:text-amber-300';
    }
    return 'text-blue-800 dark:text-blue-300';
  };

  const getMessage = () => {
    if (isDemoExpired) {
      return 'Your demo has expired. Upgrade to continue using PremiumRadar.';
    }
    if (demo.days_remaining !== null) {
      if (demo.days_remaining === 0) {
        return 'Your demo expires today! Upgrade now to keep your data.';
      }
      if (demo.days_remaining === 1) {
        return 'Your demo expires tomorrow! Upgrade to continue.';
      }
      return `${demo.days_remaining} days remaining in your demo.`;
    }
    return 'You are using a demo account.';
  };

  const getDemoTypeLabel = () => {
    switch (demo.demo_type) {
      case 'SYSTEM':
        return 'System Demo';
      case 'ENTERPRISE':
        return 'Enterprise Trial';
      default:
        return 'Demo';
    }
  };

  // Minimal variant (just a small badge)
  if (variant === 'minimal') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getUrgencyBg()} ${getUrgencyText()}`}>
        {getDemoTypeLabel()}
        {demo.days_remaining !== null && !isDemoExpired && (
          <span className="ml-1 opacity-75">({demo.days_remaining}d left)</span>
        )}
      </span>
    );
  }

  // Card variant (compact card)
  if (variant === 'card') {
    return (
      <div className={`rounded-lg border p-4 ${getUrgencyBg()}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${getUrgencyColor()}`}></div>
            <div>
              <p className={`font-medium ${getUrgencyText()}`}>
                {getDemoTypeLabel()}
              </p>
              <p className={`text-sm mt-0.5 ${getUrgencyText()} opacity-80`}>
                {getMessage()}
              </p>
            </div>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Upgrade
            </button>
          )}
        </div>
      </div>
    );
  }

  // Banner variant (full width)
  return (
    <div className={`w-full ${getUrgencyBg()} border-b`}>
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center flex-1">
            <span className={`flex p-2 rounded-lg ${getUrgencyColor()}`}>
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <p className={`ml-3 font-medium ${getUrgencyText()} truncate`}>
              <span className="md:hidden">{getMessage()}</span>
              <span className="hidden md:inline">
                {getDemoTypeLabel()}: {getMessage()}
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-2 sm:mt-0 w-full sm:w-auto">
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"
              >
                Upgrade Now
              </button>
            )}
            {onDismiss && !isDemoExpired && (
              <button
                onClick={onDismiss}
                className={`p-2 rounded-md ${getUrgencyText()} hover:opacity-75`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoBanner;
