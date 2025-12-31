/**
 * S348-F2: Demo Conversion Hook
 * Sprint: S348 - PLG Proof Pack
 *
 * Hook to handle demo → real user conversion.
 * Provides explicit conversion action (not auto-upgrade).
 */

'use client';

import { useState, useCallback } from 'react';

interface ConversionState {
  canConvert: boolean;
  reason?: string;
  isDemo: boolean;
  isLoading: boolean;
}

interface ConversionResult {
  success: boolean;
  converted?: {
    userId: string;
    previouslyDemo: boolean;
    convertedAt: string;
  };
  error?: string;
}

interface UseDemoConversionReturn {
  // State
  state: ConversionState | null;
  isConverting: boolean;
  conversionResult: ConversionResult | null;

  // Actions
  checkConversionStatus: () => Promise<void>;
  convertToReal: (options?: {
    conversionReason?: 'trial_complete' | 'feature_unlock' | 'manual_request';
    attributionSource?: string;
  }) => Promise<ConversionResult>;
  resetResult: () => void;
}

export function useDemoConversion(): UseDemoConversionReturn {
  const [state, setState] = useState<ConversionState | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  // Check if user can convert (GET /api/onboarding/convert)
  const checkConversionStatus = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true } as ConversionState));

    try {
      const response = await fetch('/api/onboarding/convert', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setState({
          canConvert: data.canConvert,
          reason: data.reason,
          isDemo: data.currentState?.isDemo ?? false,
          isLoading: false,
        });
      } else {
        setState({
          canConvert: false,
          reason: data.error || 'Failed to check conversion status',
          isDemo: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('[useDemoConversion] Check status error:', error);
      setState({
        canConvert: false,
        reason: 'Network error',
        isDemo: false,
        isLoading: false,
      });
    }
  }, []);

  // Convert demo to real (POST /api/onboarding/convert)
  const convertToReal = useCallback(
    async (options?: {
      conversionReason?: 'trial_complete' | 'feature_unlock' | 'manual_request';
      attributionSource?: string;
    }): Promise<ConversionResult> => {
      setIsConverting(true);
      setConversionResult(null);

      try {
        const response = await fetch('/api/onboarding/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversionReason: options?.conversionReason || 'manual_request',
            attributionSource: options?.attributionSource,
          }),
        });

        const data = await response.json();

        const result: ConversionResult = {
          success: data.success,
          converted: data.converted,
          error: data.error,
        };

        setConversionResult(result);

        // Update state if conversion succeeded
        if (data.success) {
          setState((prev) => ({
            ...prev,
            canConvert: false,
            isDemo: false,
            reason: 'Already converted',
          } as ConversionState));
        }

        return result;
      } catch (error) {
        console.error('[useDemoConversion] Conversion error:', error);
        const result: ConversionResult = {
          success: false,
          error: 'Network error during conversion',
        };
        setConversionResult(result);
        return result;
      } finally {
        setIsConverting(false);
      }
    },
    []
  );

  const resetResult = useCallback(() => {
    setConversionResult(null);
  }, []);

  return {
    state,
    isConverting,
    conversionResult,
    checkConversionStatus,
    convertToReal,
    resetResult,
  };
}

export default useDemoConversion;
