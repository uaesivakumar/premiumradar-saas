/**
 * Recruitment Vertical - Deep Signal Library
 * Sprint P3: Deep Vertical Intelligence Packs
 *
 * 30+ premium-grade signals for Recruitment/Staffing professionals.
 * Targets: CANDIDATES (job seekers) & COMPANIES (hiring companies)
 */

import type { Vertical } from '../../intelligence/context/types';
import type { DeepSignal } from './banking';

// =============================================================================
// RECRUITMENT SIGNAL DEFINITIONS
// =============================================================================

export const RECRUITMENT_SIGNALS: DeepSignal[] = [
  // =============================================================================
  // CANDIDATE AVAILABILITY SIGNALS
  // =============================================================================
  {
    id: 'rec-open-to-work',
    name: 'Open to Work',
    description: 'Candidate has indicated they are open to new opportunities',
    category: 'intent',
    subcategory: 'candidate-availability',
    weight: 0.95,
    relevanceFactors: ['LinkedIn status', 'job board activity', 'profile updates'],
    dataSources: ['LinkedIn', 'Job boards', 'Candidate databases'],
    decayDays: 30,
    confidenceThreshold: 0.9,
  },
  {
    id: 'rec-profile-refresh',
    name: 'Profile Refresh',
    description: 'Candidate recently updated their professional profile',
    category: 'engagement',
    subcategory: 'candidate-availability',
    weight: 0.78,
    relevanceFactors: ['profile updates', 'new skills added', 'headline changes'],
    dataSources: ['LinkedIn', 'Resume databases', 'GitHub'],
    decayDays: 45,
    confidenceThreshold: 0.7,
  },
  {
    id: 'rec-resume-upload',
    name: 'Resume Upload Activity',
    description: 'Candidate uploaded resume to job boards recently',
    category: 'intent',
    subcategory: 'candidate-availability',
    weight: 0.88,
    relevanceFactors: ['job board activity', 'resume updates', 'application activity'],
    dataSources: ['Job boards', 'ATS systems', 'Resume databases'],
    decayDays: 30,
    confidenceThreshold: 0.8,
  },
  {
    id: 'rec-passive-candidate',
    name: 'Passive Candidate',
    description: 'Employed but showing subtle signs of openness',
    category: 'engagement',
    subcategory: 'candidate-availability',
    weight: 0.70,
    relevanceFactors: ['content engagement', 'connection growth', 'industry activity'],
    dataSources: ['LinkedIn', 'Social signals', 'Event attendance'],
    decayDays: 60,
    confidenceThreshold: 0.6,
  },
  {
    id: 'rec-recent-layoff',
    name: 'Recent Layoff',
    description: 'Candidate was recently laid off and actively seeking',
    category: 'timing',
    subcategory: 'candidate-availability',
    weight: 0.92,
    relevanceFactors: ['LinkedIn updates', 'company announcements', 'news coverage'],
    dataSources: ['LinkedIn', 'News', 'Company announcements'],
    decayDays: 90,
    confidenceThreshold: 0.85,
  },
  {
    id: 'rec-contract-ending',
    name: 'Contract Ending',
    description: 'Contractor/consultant with contract ending soon',
    category: 'timing',
    subcategory: 'candidate-availability',
    weight: 0.90,
    relevanceFactors: ['contract duration', 'project timelines', 'company data'],
    dataSources: ['LinkedIn', 'Company data', 'Network intelligence'],
    decayDays: 60,
    confidenceThreshold: 0.75,
  },

  // =============================================================================
  // CAREER TRANSITION SIGNALS
  // =============================================================================
  {
    id: 'rec-career-change',
    name: 'Career Change Interest',
    description: 'Candidate showing interest in career change or pivot',
    category: 'intent',
    subcategory: 'career-transition',
    weight: 0.82,
    relevanceFactors: ['learning activity', 'certification pursuit', 'content engagement'],
    dataSources: ['LinkedIn Learning', 'Certification bodies', 'Course platforms'],
    decayDays: 90,
    confidenceThreshold: 0.65,
  },
  {
    id: 'rec-new-certification',
    name: 'New Certification',
    description: 'Candidate recently obtained relevant certification',
    category: 'quality',
    subcategory: 'career-transition',
    weight: 0.75,
    relevanceFactors: ['certification announcements', 'profile updates', 'skills additions'],
    dataSources: ['LinkedIn', 'Certification databases', 'Course platforms'],
    decayDays: 90,
    confidenceThreshold: 0.8,
  },
  {
    id: 'rec-education-complete',
    name: 'Education Completion',
    description: 'Candidate recently completed degree or program',
    category: 'timing',
    subcategory: 'career-transition',
    weight: 0.86,
    relevanceFactors: ['graduation date', 'profile updates', 'school announcements'],
    dataSources: ['LinkedIn', 'University databases', 'Social media'],
    decayDays: 120,
    confidenceThreshold: 0.85,
  },
  {
    id: 'rec-relocation-willing',
    name: 'Relocation Willing',
    description: 'Candidate expressed willingness to relocate',
    category: 'intent',
    subcategory: 'career-transition',
    weight: 0.80,
    relevanceFactors: ['location preferences', 'profile settings', 'application patterns'],
    dataSources: ['LinkedIn', 'Job boards', 'ATS data'],
    decayDays: 60,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // COMPANY HIRING SIGNALS
  // =============================================================================
  {
    id: 'rec-mass-hiring',
    name: 'Mass Hiring Initiative',
    description: 'Company launched major hiring initiative',
    category: 'intent',
    subcategory: 'company-hiring',
    weight: 0.95,
    relevanceFactors: ['job posting surge', 'hiring announcements', 'recruiter activity'],
    dataSources: ['LinkedIn', 'Job boards', 'News'],
    decayDays: 60,
    confidenceThreshold: 0.85,
  },
  {
    id: 'rec-new-office',
    name: 'New Office/Location',
    description: 'Company opening new office requiring local hiring',
    category: 'intent',
    subcategory: 'company-hiring',
    weight: 0.92,
    relevanceFactors: ['office announcements', 'real estate activity', 'job locations'],
    dataSources: ['News', 'Press releases', 'LinkedIn'],
    decayDays: 90,
    confidenceThreshold: 0.8,
  },
  {
    id: 'rec-funding-round',
    name: 'Recent Funding',
    description: 'Company raised funding and likely expanding team',
    category: 'quality',
    subcategory: 'company-hiring',
    weight: 0.93,
    relevanceFactors: ['funding announcements', 'investor activity', 'growth plans'],
    dataSources: ['Crunchbase', 'News', 'Press releases'],
    decayDays: 120,
    confidenceThreshold: 0.85,
  },
  {
    id: 'rec-contract-win',
    name: 'Major Contract Win',
    description: 'Company won major contract requiring additional staff',
    category: 'intent',
    subcategory: 'company-hiring',
    weight: 0.90,
    relevanceFactors: ['press releases', 'government filings', 'industry news'],
    dataSources: ['News', 'Government databases', 'Press releases'],
    decayDays: 90,
    confidenceThreshold: 0.75,
  },
  {
    id: 'rec-seasonal-surge',
    name: 'Seasonal Hiring',
    description: 'Company approaching seasonal hiring period',
    category: 'timing',
    subcategory: 'company-hiring',
    weight: 0.85,
    relevanceFactors: ['historical patterns', 'industry cycles', 'hiring trends'],
    dataSources: ['Job posting history', 'Industry data', 'Company data'],
    decayDays: 45,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // ATTRITION & REPLACEMENT SIGNALS
  // =============================================================================
  {
    id: 'rec-executive-departure',
    name: 'Executive Departure',
    description: 'Key executive leaving, replacement needed',
    category: 'timing',
    subcategory: 'attrition',
    weight: 0.94,
    relevanceFactors: ['LinkedIn updates', 'news coverage', 'company announcements'],
    dataSources: ['LinkedIn', 'News', 'Company filings'],
    decayDays: 60,
    confidenceThreshold: 0.85,
  },
  {
    id: 'rec-team-exodus',
    name: 'Team Attrition',
    description: 'Multiple departures from team indicating replacement needs',
    category: 'timing',
    subcategory: 'attrition',
    weight: 0.88,
    relevanceFactors: ['LinkedIn movements', 'job postings', 'team size changes'],
    dataSources: ['LinkedIn', 'Job boards', 'Company data'],
    decayDays: 45,
    confidenceThreshold: 0.75,
  },
  {
    id: 'rec-backfill-posting',
    name: 'Backfill Position',
    description: 'Company posting for position recently vacated',
    category: 'timing',
    subcategory: 'attrition',
    weight: 0.91,
    relevanceFactors: ['job posting', 'departure timing', 'role similarity'],
    dataSources: ['LinkedIn', 'Job boards', 'Company websites'],
    decayDays: 30,
    confidenceThreshold: 0.8,
  },
  {
    id: 'rec-restructuring',
    name: 'Restructuring Activity',
    description: 'Company restructuring creating new roles',
    category: 'timing',
    subcategory: 'attrition',
    weight: 0.82,
    relevanceFactors: ['org changes', 'title changes', 'reporting changes'],
    dataSources: ['LinkedIn', 'News', 'Company announcements'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },

  // =============================================================================
  // SKILLS & TALENT SIGNALS
  // =============================================================================
  {
    id: 'rec-skill-match',
    name: 'High Skill Match',
    description: 'Candidate has strong skill match for open role',
    category: 'quality',
    subcategory: 'skills',
    weight: 0.89,
    relevanceFactors: ['skill keywords', 'experience level', 'industry match'],
    dataSources: ['LinkedIn', 'Resume databases', 'Skills assessments'],
    decayDays: 180,
    confidenceThreshold: 0.75,
  },
  {
    id: 'rec-top-performer',
    name: 'Top Performer Indicators',
    description: 'Candidate shows signs of being top performer',
    category: 'quality',
    subcategory: 'skills',
    weight: 0.85,
    relevanceFactors: ['promotions', 'recommendations', 'achievement mentions'],
    dataSources: ['LinkedIn', 'References', 'Company data'],
    decayDays: 365,
    confidenceThreshold: 0.7,
  },
  {
    id: 'rec-rare-skill',
    name: 'Rare/In-Demand Skill',
    description: 'Candidate possesses rare or highly in-demand skills',
    category: 'quality',
    subcategory: 'skills',
    weight: 0.92,
    relevanceFactors: ['skill rarity', 'market demand', 'job posting analysis'],
    dataSources: ['LinkedIn', 'Job market data', 'Skills databases'],
    decayDays: 180,
    confidenceThreshold: 0.75,
  },
  {
    id: 'rec-competitor-talent',
    name: 'Competitor Talent',
    description: 'Candidate works at key competitor company',
    category: 'quality',
    subcategory: 'skills',
    weight: 0.87,
    relevanceFactors: ['current employer', 'competitor mapping', 'role similarity'],
    dataSources: ['LinkedIn', 'Company databases', 'Market intelligence'],
    decayDays: 180,
    confidenceThreshold: 0.8,
  },

  // =============================================================================
  // ENGAGEMENT & OUTREACH SIGNALS
  // =============================================================================
  {
    id: 'rec-inmail-responsive',
    name: 'InMail Responsive',
    description: 'Candidate has high response rate to recruiter outreach',
    category: 'engagement',
    subcategory: 'outreach',
    weight: 0.80,
    relevanceFactors: ['response rate', 'engagement patterns', 'activity level'],
    dataSources: ['LinkedIn', 'ATS data', 'CRM data'],
    decayDays: 90,
    confidenceThreshold: 0.7,
  },
  {
    id: 'rec-content-engaged',
    name: 'Content Engaged',
    description: 'Candidate engaging with company/industry content',
    category: 'engagement',
    subcategory: 'outreach',
    weight: 0.68,
    relevanceFactors: ['likes', 'comments', 'shares', 'follows'],
    dataSources: ['LinkedIn', 'Social media', 'Website analytics'],
    decayDays: 30,
    confidenceThreshold: 0.6,
  },
  {
    id: 'rec-event-attendee',
    name: 'Industry Event Attendee',
    description: 'Candidate attended relevant industry events',
    category: 'engagement',
    subcategory: 'outreach',
    weight: 0.72,
    relevanceFactors: ['event registration', 'social check-ins', 'speaker activity'],
    dataSources: ['Event platforms', 'LinkedIn', 'Social media'],
    decayDays: 60,
    confidenceThreshold: 0.65,
  },
  {
    id: 'rec-referral-available',
    name: 'Referral Connection',
    description: 'Candidate connected to existing employee for referral',
    category: 'quality',
    subcategory: 'outreach',
    weight: 0.84,
    relevanceFactors: ['connection mapping', 'employee network', 'referral history'],
    dataSources: ['LinkedIn', 'ATS data', 'HRIS data'],
    decayDays: 365,
    confidenceThreshold: 0.75,
  },

  // =============================================================================
  // URGENCY & TIMING SIGNALS
  // =============================================================================
  {
    id: 'rec-urgent-hire',
    name: 'Urgent Hiring Need',
    description: 'Company has urgent/critical hiring need',
    category: 'timing',
    subcategory: 'urgency',
    weight: 0.94,
    relevanceFactors: ['job posting urgency', 'multiple postings', 'recruiter activity'],
    dataSources: ['Job boards', 'LinkedIn', 'Direct communication'],
    decayDays: 21,
    confidenceThreshold: 0.8,
  },
  {
    id: 'rec-start-date-critical',
    name: 'Critical Start Date',
    description: 'Role has critical start date requirement',
    category: 'timing',
    subcategory: 'urgency',
    weight: 0.88,
    relevanceFactors: ['project timelines', 'job posting details', 'client requirements'],
    dataSources: ['Job postings', 'Client data', 'ATS data'],
    decayDays: 30,
    confidenceThreshold: 0.75,
  },
  {
    id: 'rec-offer-pending',
    name: 'Competing Offer',
    description: 'Candidate has competing offer pending decision',
    category: 'timing',
    subcategory: 'urgency',
    weight: 0.96,
    relevanceFactors: ['candidate communication', 'interview activity', 'timeline pressure'],
    dataSources: ['ATS data', 'CRM data', 'Candidate feedback'],
    decayDays: 14,
    confidenceThreshold: 0.85,
  },

  // =============================================================================
  // RISK & NEGATIVE SIGNALS
  // =============================================================================
  {
    id: 'rec-job-hopper',
    name: 'Frequent Job Changes',
    description: 'Candidate has pattern of short tenures',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.35,
    relevanceFactors: ['job tenure', 'career pattern', 'industry context'],
    dataSources: ['LinkedIn', 'Resume analysis', 'Reference checks'],
    decayDays: 365,
    confidenceThreshold: 0.75,
  },
  {
    id: 'rec-overqualified',
    name: 'Overqualified Risk',
    description: 'Candidate appears overqualified for role',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.25,
    relevanceFactors: ['experience level', 'salary expectations', 'role level mismatch'],
    dataSources: ['LinkedIn', 'Resume analysis', 'Interview feedback'],
    decayDays: 180,
    confidenceThreshold: 0.7,
  },
  {
    id: 'rec-hiring-freeze',
    name: 'Hiring Freeze',
    description: 'Company has active hiring freeze',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.70,
    relevanceFactors: ['job posting removal', 'company announcements', 'industry signals'],
    dataSources: ['News', 'LinkedIn', 'Company data'],
    decayDays: 90,
    confidenceThreshold: 0.8,
  },
  {
    id: 'rec-budget-cut',
    name: 'Budget Constraints',
    description: 'Company showing signs of budget constraints',
    category: 'risk',
    subcategory: 'negative',
    weight: -0.50,
    relevanceFactors: ['layoff news', 'earnings reports', 'hiring slowdown'],
    dataSources: ['News', 'Financial data', 'Industry intelligence'],
    decayDays: 120,
    confidenceThreshold: 0.75,
  },
];

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

export interface RecruitmentScoringConfig {
  weights: {
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
    skillMatch: number;
  };
  thresholds: {
    hot: number;
    warm: number;
    cold: number;
  };
  boosts: {
    multiSignal: number;
    recentActivity: number;
    highConfidence: number;
    urgentNeed: number;
    referral: number;
  };
}

export const RECRUITMENT_SCORING_CONFIG: RecruitmentScoringConfig = {
  weights: {
    quality: 0.25,      // Candidate/company quality indicators
    timing: 0.25,       // Time-sensitive opportunities
    likelihood: 0.20,   // Likelihood to engage/hire
    engagement: 0.15,   // Prior engagement signals
    skillMatch: 0.15,   // Skill and experience match
  },
  thresholds: {
    hot: 68,            // Score >= 68 is hot
    warm: 42,           // Score 42-67 is warm
    cold: 0,            // Score < 42 is cold
  },
  boosts: {
    multiSignal: 1.15,      // 15% boost for 3+ signals
    recentActivity: 1.18,   // 18% boost for activity in last 7 days
    highConfidence: 1.08,   // 8% boost for high confidence signals
    urgentNeed: 1.25,       // 25% boost for urgent hiring needs
    referral: 1.20,         // 20% boost for referral connections
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getRecruitmentSignals(): DeepSignal[] {
  return RECRUITMENT_SIGNALS;
}

export function getRecruitmentSignalById(id: string): DeepSignal | undefined {
  return RECRUITMENT_SIGNALS.find(s => s.id === id);
}

export function getRecruitmentSignalsByCategory(category: DeepSignal['category']): DeepSignal[] {
  return RECRUITMENT_SIGNALS.filter(s => s.category === category);
}

export function getRecruitmentSignalsBySubcategory(subcategory: string): DeepSignal[] {
  return RECRUITMENT_SIGNALS.filter(s => s.subcategory === subcategory);
}

export function getRecruitmentScoringConfig(): RecruitmentScoringConfig {
  return RECRUITMENT_SCORING_CONFIG;
}

export const RECRUITMENT_VERTICAL: Vertical = 'recruitment';
