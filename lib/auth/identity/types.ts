/**
 * Identity Intelligence Types - Sprint S48
 * Types for email domain extraction, industry detection, and vertical lock
 */

import { VerticalId } from '@/lib/stores/onboarding-store';

// Domain extraction result
export interface DomainInfo {
  email: string;
  domain: string;
  isPersonalEmail: boolean;
  isCorporateEmail: boolean;
  companyName: string | null;
  extractedAt: string;
}

// MX verification result
export interface MXVerificationResult {
  domain: string;
  hasMX: boolean;
  mxRecords: string[];
  isValid: boolean;
  provider: string | null; // Google Workspace, Microsoft 365, etc.
  verifiedAt: string;
}

// Industry detection result
export interface IndustryDetection {
  domain: string;
  detectedIndustry: string | null;
  suggestedVertical: VerticalId | null;
  confidenceScore: number; // 0-100
  sources: IndustrySource[];
  detectedAt: string;
}

export interface IndustrySource {
  name: string;
  industry: string;
  confidence: number;
}

// Vertical lock state
export interface VerticalLockState {
  userId: string;
  vertical: VerticalId;
  isLocked: boolean;
  lockedAt: string | null;
  lockedBy: 'user' | 'admin' | 'system';
  isConsultingMode: boolean;
  allowedVerticals: VerticalId[]; // For consulting mode
  lastModifiedAt: string;
  lastModifiedBy: string;
}

// Vertical override request
export interface VerticalOverrideRequest {
  userId: string;
  newVertical: VerticalId;
  reason: string;
  requestedBy: string;
  requiresMfa: boolean;
  mfaVerified?: boolean;
}

// Session validation
export interface VerticalSession {
  sessionId: string;
  userId: string;
  vertical: VerticalId;
  isValid: boolean;
  validatedAt: string;
  expiresAt: string;
}

// Personal email domains (common providers)
export const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'fastmail.com',
  'tutanota.com',
] as const;

/**
 * P2 VERTICALISATION: Updated to use official Vertical types
 * Maps detected industry strings to the 5 official verticals
 */
export const INDUSTRY_TO_VERTICAL: Record<string, VerticalId> = {
  // Banking
  'banking': 'banking',
  'commercial banking': 'banking',
  'retail banking': 'banking',
  'investment banking': 'banking',
  'wealth management': 'banking',
  'private banking': 'banking',
  'corporate banking': 'banking',

  // SaaS Sales (FinTech and tech companies)
  'fintech': 'saas-sales',
  'financial technology': 'saas-sales',
  'payments': 'saas-sales',
  'digital payments': 'saas-sales',
  'neobank': 'saas-sales',
  'software': 'saas-sales',
  'saas': 'saas-sales',
  'technology': 'saas-sales',
  'enterprise software': 'saas-sales',

  // Insurance
  'insurance': 'insurance',
  'life insurance': 'insurance',
  'health insurance': 'insurance',
  'property insurance': 'insurance',
  'insurtech': 'insurance',
  'reinsurance': 'insurance',

  // Real Estate
  'real estate': 'real-estate',
  'property': 'real-estate',
  'commercial real estate': 'real-estate',
  'residential real estate': 'real-estate',
  'proptech': 'real-estate',
  'property management': 'real-estate',
  'reit': 'real-estate',

  // Recruitment (Consulting and staffing)
  'consulting': 'recruitment',
  'management consulting': 'recruitment',
  'staffing': 'recruitment',
  'recruiting': 'recruitment',
  'human resources': 'recruitment',
  'talent acquisition': 'recruitment',
  'headhunting': 'recruitment',
  'executive search': 'recruitment',
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,    // Auto-suggest with high confidence
  MEDIUM: 50,  // Suggest but ask for confirmation
  LOW: 30,     // Show as option but not recommended
} as const;

// MFA requirement thresholds
export const MFA_REQUIREMENTS = {
  VERTICAL_OVERRIDE: true,
  ADMIN_OVERRIDE: true,
  CONSULTING_MODE_ENABLE: true,
} as const;
