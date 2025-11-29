/**
 * Vertical Suggestion - Sprint S48 Feature 3
 * Auto-suggest vertical based on detected industry
 *
 * Flow: email → domain → industry → vertical suggestion
 */

import { VerticalId } from '@/lib/stores/onboarding-store';
import { analyzeEmail } from './domain-extractor';
import { detectIndustryFromDomain, shouldAutoSuggestVertical, getConfidenceMessage } from './industry-detector';
import { IndustryDetection, CONFIDENCE_THRESHOLDS } from './types';

export interface VerticalSuggestion {
  suggestedVertical: VerticalId | null;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low' | 'none';
  message: string;
  shouldAutoSelect: boolean;
  industry: string | null;
  domain: string;
  isPersonalEmail: boolean;
}

/**
 * Get vertical suggestion from email
 * Main function to call during onboarding
 */
export async function getVerticalSuggestionFromEmail(email: string): Promise<VerticalSuggestion> {
  const result: VerticalSuggestion = {
    suggestedVertical: null,
    confidence: 0,
    confidenceLevel: 'none',
    message: 'Please select your industry',
    shouldAutoSelect: false,
    industry: null,
    domain: '',
    isPersonalEmail: true,
  };

  // Analyze email
  const emailAnalysis = analyzeEmail(email);
  result.domain = emailAnalysis.domain;
  result.isPersonalEmail = emailAnalysis.isPersonalEmail;

  // Personal emails can't be auto-detected
  if (emailAnalysis.isPersonalEmail) {
    result.message = 'Personal email detected. Please select your industry manually.';
    return result;
  }

  // Corporate email - try to detect industry
  if (!emailAnalysis.needsEnrichment) {
    return result;
  }

  try {
    const industryDetection = await detectIndustryFromDomain(emailAnalysis.domain);

    result.suggestedVertical = industryDetection.suggestedVertical;
    result.confidence = industryDetection.confidenceScore;
    result.industry = industryDetection.detectedIndustry;
    result.message = getConfidenceMessage(industryDetection);

    // Determine confidence level
    if (industryDetection.confidenceScore >= CONFIDENCE_THRESHOLDS.HIGH) {
      result.confidenceLevel = 'high';
      result.shouldAutoSelect = true;
    } else if (industryDetection.confidenceScore >= CONFIDENCE_THRESHOLDS.MEDIUM) {
      result.confidenceLevel = 'medium';
      result.shouldAutoSelect = false; // Show as suggestion but don't auto-select
    } else if (industryDetection.confidenceScore >= CONFIDENCE_THRESHOLDS.LOW) {
      result.confidenceLevel = 'low';
      result.shouldAutoSelect = false;
    }
  } catch (error) {
    console.error('[Vertical Suggestion] Error:', error);
    result.message = 'Unable to detect industry. Please select manually.';
  }

  return result;
}

/**
 * Check if a vertical suggestion is actionable
 */
export function isSuggestionActionable(suggestion: VerticalSuggestion): boolean {
  return (
    suggestion.suggestedVertical !== null &&
    suggestion.confidence >= CONFIDENCE_THRESHOLDS.LOW
  );
}

/**
 * Get recommendation text for UI
 */
export function getSuggestionBadgeText(suggestion: VerticalSuggestion): string | null {
  if (!suggestion.suggestedVertical) return null;

  switch (suggestion.confidenceLevel) {
    case 'high':
      return 'Recommended';
    case 'medium':
      return 'Suggested';
    case 'low':
      return 'Possible match';
    default:
      return null;
  }
}

/**
 * Get badge color for UI
 */
export function getSuggestionBadgeColor(suggestion: VerticalSuggestion): string {
  switch (suggestion.confidenceLevel) {
    case 'high':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'medium':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'low':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export default {
  getVerticalSuggestionFromEmail,
  isSuggestionActionable,
  getSuggestionBadgeText,
  getSuggestionBadgeColor,
};
