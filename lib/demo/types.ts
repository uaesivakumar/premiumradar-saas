/**
 * Demo Mode Types
 *
 * Core types for demo mode functionality.
 */

// ============================================================
// DEMO MODE STATE
// ============================================================

export interface DemoModeState {
  isDemo: boolean;
  userId: string;
  sessionId: string;
  startedAt: Date;
  expiresAt: Date;
  actionsPerformed: number;
  maxActions: number;
  lockedFeatures: LockedFeature[];
  bookingCTAShown: boolean;
  bookingCTADismissed: boolean;
}

export type LockedFeature =
  | 'export'
  | 'bulk-operations'
  | 'integrations'
  | 'api-access'
  | 'advanced-filters'
  | 'custom-reports'
  | 'team-features'
  | 'white-label';

export interface DemoLimits {
  maxActions: number;
  maxDomains: number;
  maxSearchResults: number;
  maxOutreachMessages: number;
  sessionDurationMinutes: number;
}

// ============================================================
// FAKE DATA
// ============================================================

export interface FakeDomain {
  id: string;
  name: string;
  tld: string;
  fullDomain: string;
  status: 'available' | 'registered' | 'premium' | 'aftermarket';
  price: number;
  estimatedValue: number;
  trafficScore: number;
  seoScore: number;
  brandScore: number;
  overallScore: number;
  age: number;
  backlinks: number;
  monthlyTraffic: number;
  vertical: string;
  keywords: string[];
  isWatched: boolean;
  isPinned: boolean;
}

export interface FakeCompany {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  employeeCount: string;
  revenue: string;
  founded: number;
  headquarters: string;
  description: string;
  website: string;
  linkedin?: string;
  contacts: FakeContact[];
}

export interface FakeContact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
  linkedin?: string;
  isPrimary: boolean;
}

export interface FakePipelineDeal {
  id: string;
  domain: FakeDomain;
  stage: PipelineStage;
  value: number;
  probability: number;
  addedAt: Date;
  updatedAt: Date;
  notes: string;
  nextAction?: string;
  nextActionDate?: Date;
  owner: string;
}

export type PipelineStage =
  | 'discovery'
  | 'contacted'
  | 'negotiating'
  | 'offer-made'
  | 'due-diligence'
  | 'won'
  | 'lost';

// ============================================================
// SAFE DEMO SCORING
// ============================================================

export interface DemoScoreResult {
  domain: string;
  scores: {
    quality: number;
    traffic: number;
    liquidity: number;
    endUser: number;
    composite: number;
  };
  tier: 'excellent' | 'good' | 'fair' | 'poor';
  isDemo: true;
  disclaimer: string;
}

export interface DemoAnalysisResult {
  domain: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendedPrice: number;
  isDemo: true;
  disclaimer: string;
}

// ============================================================
// BOOKING CTA
// ============================================================

export interface BookingCTA {
  id: string;
  type: 'modal' | 'banner' | 'inline' | 'sidebar';
  trigger: BookingCTATrigger;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaUrl: string;
  dismissable: boolean;
  showAfterActions?: number;
  showAfterMinutes?: number;
}

export type BookingCTATrigger =
  | 'action-limit'
  | 'time-limit'
  | 'feature-locked'
  | 'export-attempt'
  | 'manual'
  | 'exit-intent';

// ============================================================
// DEMO ANALYTICS
// ============================================================

export interface DemoSession {
  sessionId: string;
  startedAt: Date;
  endedAt?: Date;
  actionsPerformed: number;
  pagesVisited: string[];
  featuresAttempted: LockedFeature[];
  bookingCTAsShown: number;
  bookingCTAsClicked: number;
  converted: boolean;
  conversionAction?: 'booked-meeting' | 'started-trial' | 'contacted-sales';
}

export interface DemoMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  averageActionsPerSession: number;
  conversionRate: number;
  topFeatureAttempts: { feature: LockedFeature; count: number }[];
  topCTATriggers: { trigger: BookingCTATrigger; count: number }[];
}
