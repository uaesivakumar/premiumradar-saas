/**
 * Q/T/L/E Scoring Types
 *
 * Quality: How well does the prospect match ideal customer profile?
 * Timing: Is this the right time to reach out?
 * Likelihood: What's the probability of conversion?
 * Engagement: How engaged is the prospect with your content/brand?
 */

export interface QTLEScore {
  quality: number;      // 0-100
  timing: number;       // 0-100
  likelihood: number;   // 0-100
  engagement: number;   // 0-100
  composite: number;    // Weighted average 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidence: number;   // 0-100 how confident we are in this score
}

export interface Signal {
  id: string;
  name: string;
  category: 'quality' | 'timing' | 'likelihood' | 'engagement';
  value: number;        // Raw signal value
  weight: number;       // Weight in category (0-1)
  impact: 'positive' | 'negative' | 'neutral';
  source: string;       // Where this signal came from
  timestamp: Date;
  description: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  subIndustry?: string;
  size: 'startup' | 'smb' | 'mid-market' | 'enterprise';
  region: string;
  country: string;
  signals: Signal[];
  score?: QTLEScore;
}

export interface ScoringConfig {
  weights: CategoryWeights;
  thresholds: GradeThresholds;
  regionalMultipliers: RegionalMultipliers;
  industryAdjustments: IndustryAdjustments;
}

export interface CategoryWeights {
  quality: number;      // Default: 0.30
  timing: number;       // Default: 0.25
  likelihood: number;   // Default: 0.25
  engagement: number;   // Default: 0.20
}

export interface GradeThresholds {
  A: number;  // >= 85
  B: number;  // >= 70
  C: number;  // >= 55
  D: number;  // >= 40
  // F: < 40
}

export interface RegionalMultipliers {
  [region: string]: {
    qualityBoost: number;
    timingBoost: number;
    marketMaturity: number;
  };
}

export interface IndustryAdjustments {
  [industry: string]: {
    qualitySignals: string[];
    timingSignals: string[];
    baseWeight: number;
  };
}

// Banking-specific types
export interface BankingSignal extends Signal {
  bankingCategory: 'digital-transformation' | 'regulatory' | 'competitive' | 'market' | 'technology';
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface BankingCompanyProfile extends CompanyProfile {
  bankingTier: 'tier1' | 'tier2' | 'tier3' | 'challenger' | 'fintech';
  regulatoryStatus: 'compliant' | 'transitioning' | 'at-risk';
  digitalMaturity: 'leader' | 'fast-follower' | 'mainstream' | 'laggard';
  signals: BankingSignal[];
}
