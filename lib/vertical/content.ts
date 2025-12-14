/**
 * Vertical-Specific Content Library
 * Sprint P2: Full Verticalisation Layer
 *
 * Provides vertical-aware content for SIVA, Discovery, and all UI surfaces.
 * This is the SINGLE source of truth for vertical-specific strings.
 */

import type { Vertical } from '../intelligence/context/types';

// =============================================================================
// VERTICAL DISPLAY NAMES
// =============================================================================

export const VERTICAL_DISPLAY_NAMES: Record<Vertical, string> = {
  'banking': 'Banking',
  'insurance': 'Insurance',
  'real-estate': 'Real Estate',
  'recruitment': 'Recruitment',
  'saas-sales': 'SaaS Sales',
};

export function getVerticalDisplayName(vertical: Vertical): string {
  return VERTICAL_DISPLAY_NAMES[vertical] || vertical;
}

// =============================================================================
// SIVA QUICK ACTIONS (for SIVAInputBar)
// =============================================================================

export interface QuickAction {
  label: string;
  query: string;
  agent: 'discovery' | 'ranking' | 'outreach' | 'demo' | 'intelligence';
}

// AI-Native Quick Actions: Conversational intents, not feature buttons
const VERTICAL_QUICK_ACTIONS: Record<Vertical, QuickAction[]> = {
  'banking': [
    { label: 'Help me find strong opportunities', query: 'Find employers in UAE with hiring expansion signals', agent: 'discovery' },
    { label: 'Show me who\'s worth calling now', query: 'Rank employers by payroll acquisition potential', agent: 'ranking' },
    { label: 'Draft outreach for my best prospect', query: 'Write a payroll-focused outreach for top hiring employers', agent: 'outreach' },
    { label: 'Explain what I\'m seeing', query: 'Prioritize employers based on headcount growth and hiring signals', agent: 'intelligence' },
  ],
  'insurance': [
    { label: 'Help me find prospects', query: 'Find insurance prospects with life event signals', agent: 'discovery' },
    { label: 'Show me my best leads', query: 'Rank my top insurance leads by likelihood score', agent: 'ranking' },
    { label: 'Draft a personalized message', query: 'Write a personalized outreach for a life insurance prospect', agent: 'outreach' },
    { label: 'Coming soon...', query: 'Show me a demo of the insurance prospecting flow', agent: 'demo' },
  ],
  'real-estate': [
    { label: 'Help me find buyers', query: 'Find property buyers with relocation or family growth signals', agent: 'discovery' },
    { label: 'Show me ready-to-buy prospects', query: 'Rank my top real estate prospects by timing score', agent: 'ranking' },
    { label: 'Draft outreach for a buyer', query: 'Write an outreach email for a first-time home buyer', agent: 'outreach' },
    { label: 'Coming soon...', query: 'Show me a demo of the real estate prospecting flow', agent: 'demo' },
  ],
  'recruitment': [
    { label: 'Help me find candidates', query: 'Find candidates with job change signals in tech sector', agent: 'discovery' },
    { label: 'Show me top talent', query: 'Rank my top candidates by quality and engagement', agent: 'ranking' },
    { label: 'Draft a recruiting message', query: 'Write a recruiting outreach for a senior engineer', agent: 'outreach' },
    { label: 'Coming soon...', query: 'Show me a demo of the talent discovery flow', agent: 'demo' },
  ],
  'saas-sales': [
    { label: 'Help me find target accounts', query: 'Find SaaS companies with growth signals and funding rounds', agent: 'discovery' },
    { label: 'Show me best accounts', query: 'Rank my top SaaS accounts by expansion potential', agent: 'ranking' },
    { label: 'Draft a solution pitch', query: 'Write a solution-focused outreach for a SaaS prospect', agent: 'outreach' },
    { label: 'Coming soon...', query: 'Show me a demo of the SaaS sales discovery flow', agent: 'demo' },
  ],
};

export function getQuickActionsForVertical(vertical: Vertical): QuickAction[] {
  return VERTICAL_QUICK_ACTIONS[vertical] || VERTICAL_QUICK_ACTIONS['banking'];
}

// =============================================================================
// SIVA EXAMPLE PROMPTS (for QuickIntentCards)
// =============================================================================

export interface VerticalPrompts {
  en: string[];
  ar: string[];
}

const VERTICAL_EXAMPLE_PROMPTS: Record<Vertical, VerticalPrompts> = {
  'banking': {
    en: [
      'Find employers with hiring expansion signals in UAE',
      'Show me top companies for payroll acquisition',
      'Rank employers by headcount growth',
    ],
    ar: [
      'ابحث عن شركات توظف في الإمارات',
      'أظهر لي أفضل الشركات لخدمات الرواتب',
      'صنف الشركات حسب نمو عدد الموظفين',
    ],
  },
  'insurance': {
    en: [
      'Find prospects with life event signals',
      'Show me leads with recent job changes',
      'Analyze family growth opportunities',
    ],
    ar: [
      'ابحث عن عملاء محتملين مع إشارات أحداث الحياة',
      'أظهر لي العملاء المحتملين مع تغييرات وظيفية حديثة',
      'تحليل فرص نمو الأسرة',
    ],
  },
  'real-estate': {
    en: [
      'Find buyers with relocation signals',
      'Show me leads with lease expiring soon',
      'Analyze family growth housing needs',
    ],
    ar: [
      'ابحث عن مشترين مع إشارات الانتقال',
      'أظهر لي العملاء مع عقود إيجار تنتهي قريباً',
      'تحليل احتياجات السكن لنمو الأسرة',
    ],
  },
  'recruitment': {
    en: [
      'Find candidates with job change signals',
      'Show me top talent in tech sector',
      'Analyze hiring trends in my industry',
    ],
    ar: [
      'ابحث عن مرشحين مع إشارات تغيير الوظيفة',
      'أظهر لي أفضل المواهب في قطاع التقنية',
      'تحليل اتجاهات التوظيف في صناعتي',
    ],
  },
  'saas-sales': {
    en: [
      'Find companies with growth signals',
      'Show me accounts with recent funding',
      'Analyze tech stack fit opportunities',
    ],
    ar: [
      'ابحث عن شركات مع إشارات النمو',
      'أظهر لي الحسابات مع تمويل حديث',
      'تحليل فرص توافق المنصة التقنية',
    ],
  },
};

export function getExamplePromptsForVertical(vertical: Vertical, locale: 'en' | 'ar' = 'en'): string[] {
  const prompts = VERTICAL_EXAMPLE_PROMPTS[vertical] || VERTICAL_EXAMPLE_PROMPTS['banking'];
  return prompts[locale];
}

// =============================================================================
// SIGNAL LIBRARIES (for Discovery)
// =============================================================================

export interface SignalType {
  id: string;
  name: string;
  description: string;
  category: 'intent' | 'timing' | 'engagement' | 'quality';
  weight: number;
}

const VERTICAL_SIGNAL_TYPES: Record<Vertical, SignalType[]> = {
  'banking': [
    { id: 'digital-transformation', name: 'Digital Transformation', description: 'Company investing in digital banking', category: 'intent', weight: 0.9 },
    { id: 'hiring-expansion', name: 'Hiring Expansion', description: 'Company expanding workforce', category: 'timing', weight: 0.85 },
    { id: 'office-opening', name: 'Office Opening', description: 'New office or branch opening', category: 'timing', weight: 0.8 },
    { id: 'funding-round', name: 'Funding Round', description: 'Company raised capital', category: 'quality', weight: 0.9 },
    { id: 'regulatory-deadline', name: 'Regulatory Deadline', description: 'Compliance deadline approaching', category: 'timing', weight: 0.85 },
    { id: 'core-banking-renewal', name: 'Core Banking Renewal', description: 'Core banking system renewal cycle', category: 'timing', weight: 0.9 },
  ],
  'insurance': [
    { id: 'life-event', name: 'Life Event', description: 'Marriage, birth, or retirement', category: 'intent', weight: 0.95 },
    { id: 'salary-change', name: 'Salary Change', description: 'Promotion or income increase', category: 'quality', weight: 0.8 },
    { id: 'job-change', name: 'Job Change', description: 'New job or role change', category: 'timing', weight: 0.85 },
    { id: 'family-growth', name: 'Family Growth', description: 'New child or dependent', category: 'intent', weight: 0.9 },
    { id: 'health-indicator', name: 'Health Indicator', description: 'Health awareness signals', category: 'engagement', weight: 0.7 },
    { id: 'policy-expiry', name: 'Policy Expiry', description: 'Existing policy expiring', category: 'timing', weight: 0.95 },
  ],
  'real-estate': [
    { id: 'relocation', name: 'Relocation Signal', description: 'Job relocation or move planned', category: 'intent', weight: 0.95 },
    { id: 'rental-expiry', name: 'Rental Expiry', description: 'Lease ending soon', category: 'timing', weight: 0.9 },
    { id: 'family-growth', name: 'Family Growth', description: 'New baby or family expansion', category: 'intent', weight: 0.85 },
    { id: 'income-increase', name: 'Income Increase', description: 'Salary or income growth', category: 'quality', weight: 0.8 },
    { id: 'area-search', name: 'Area Search', description: 'Searching for properties in area', category: 'engagement', weight: 0.75 },
    { id: 'mortgage-preapproval', name: 'Mortgage Pre-approval', description: 'Got mortgage pre-approval', category: 'quality', weight: 0.95 },
  ],
  'recruitment': [
    { id: 'job-search', name: 'Job Search Activity', description: 'Active job searching', category: 'intent', weight: 0.9 },
    { id: 'profile-update', name: 'Profile Update', description: 'Updated LinkedIn or resume', category: 'engagement', weight: 0.8 },
    { id: 'skill-certification', name: 'Skill Certification', description: 'New certification obtained', category: 'quality', weight: 0.85 },
    { id: 'company-layoffs', name: 'Company Layoffs', description: 'Company had layoffs', category: 'timing', weight: 0.9 },
    { id: 'contract-ending', name: 'Contract Ending', description: 'Current contract ending', category: 'timing', weight: 0.85 },
    { id: 'relocation-willing', name: 'Relocation Willing', description: 'Open to relocation', category: 'quality', weight: 0.7 },
  ],
  'saas-sales': [
    { id: 'funding-round', name: 'Funding Round', description: 'Company raised capital', category: 'quality', weight: 0.95 },
    { id: 'hiring-expansion', name: 'Hiring Expansion', description: 'Rapid team growth', category: 'intent', weight: 0.9 },
    { id: 'tech-stack-change', name: 'Tech Stack Change', description: 'Technology migration', category: 'intent', weight: 0.85 },
    { id: 'contract-renewal', name: 'Contract Renewal', description: 'Competitor contract renewing', category: 'timing', weight: 0.9 },
    { id: 'market-expansion', name: 'Market Expansion', description: 'Entering new markets', category: 'intent', weight: 0.8 },
    { id: 'leadership-change', name: 'Leadership Change', description: 'New CTO or tech leadership', category: 'timing', weight: 0.75 },
  ],
};

export function getSignalTypesForVertical(vertical: Vertical): SignalType[] {
  return VERTICAL_SIGNAL_TYPES[vertical] || VERTICAL_SIGNAL_TYPES['banking'];
}

// =============================================================================
// SCORING WEIGHTS (for Discovery Engine)
// =============================================================================

export interface ScoringWeights {
  quality: number;
  timing: number;
  likelihood: number;
  engagement: number;
}

const VERTICAL_SCORING_WEIGHTS: Record<Vertical, ScoringWeights> = {
  'banking': { quality: 0.25, timing: 0.30, likelihood: 0.25, engagement: 0.20 },
  'insurance': { quality: 0.30, timing: 0.25, likelihood: 0.25, engagement: 0.20 },
  'real-estate': { quality: 0.20, timing: 0.35, likelihood: 0.25, engagement: 0.20 },
  'recruitment': { quality: 0.25, timing: 0.25, likelihood: 0.30, engagement: 0.20 },
  'saas-sales': { quality: 0.25, timing: 0.25, likelihood: 0.25, engagement: 0.25 },
};

export function getScoringWeightsForVertical(vertical: Vertical): ScoringWeights {
  return VERTICAL_SCORING_WEIGHTS[vertical] || VERTICAL_SCORING_WEIGHTS['banking'];
}

// =============================================================================
// UI LABELS (for Dashboard)
// =============================================================================

export interface UILabels {
  dashboardTitle: string;
  dashboardSubtitle: string;
  discoveryTitle: string;
  discoverySubtitle: string;
  targetLabel: string;
  signalLabel: string;
}

const VERTICAL_UI_LABELS: Record<Vertical, UILabels> = {
  'banking': {
    dashboardTitle: 'Employee Banking Intelligence',
    dashboardSubtitle: 'Track hiring signals and payroll opportunities across UAE employers',
    discoveryTitle: 'Employer Discovery',
    discoverySubtitle: 'Find companies with hiring expansion and payroll potential',
    targetLabel: 'Employers',
    signalLabel: 'Hiring Signals',
  },
  'insurance': {
    dashboardTitle: 'Insurance Intelligence',
    dashboardSubtitle: 'Track individual prospects and life event signals',
    discoveryTitle: 'Insurance Prospecting',
    discoverySubtitle: 'Find individuals with insurance needs',
    targetLabel: 'Prospects',
    signalLabel: 'Life Event Signals',
  },
  'real-estate': {
    dashboardTitle: 'Real Estate Intelligence',
    dashboardSubtitle: 'Track buyers and renters with property signals',
    discoveryTitle: 'Property Prospecting',
    discoverySubtitle: 'Find buyers and families with housing needs',
    targetLabel: 'Buyers',
    signalLabel: 'Property Signals',
  },
  'recruitment': {
    dashboardTitle: 'Talent Intelligence',
    dashboardSubtitle: 'Track candidates and job market signals',
    discoveryTitle: 'Talent Discovery',
    discoverySubtitle: 'Find candidates with career change signals',
    targetLabel: 'Candidates',
    signalLabel: 'Career Signals',
  },
  'saas-sales': {
    dashboardTitle: 'SaaS Intelligence',
    dashboardSubtitle: 'Track companies with software buying signals',
    discoveryTitle: 'Account Discovery',
    discoverySubtitle: 'Find companies with SaaS buying potential',
    targetLabel: 'Accounts',
    signalLabel: 'Tech Signals',
  },
};

export function getUILabelsForVertical(vertical: Vertical): UILabels {
  return VERTICAL_UI_LABELS[vertical] || VERTICAL_UI_LABELS['banking'];
}

// =============================================================================
// PROMPT TEMPLATES (for SIVA)
// =============================================================================

export interface PromptTemplate {
  discovery: string;
  ranking: string;
  outreach: string;
  intelligence: string;
}

const VERTICAL_PROMPT_TEMPLATES: Record<Vertical, PromptTemplate> = {
  'banking': {
    discovery: 'Find employers with {signal} signals in {region}. Focus on companies with hiring expansion and payroll acquisition potential.',
    ranking: 'Rank these employers by payroll opportunity score. Prioritize companies with high headcount growth and hiring signals.',
    outreach: 'Write a payroll-focused outreach email for {company} HR Director. Reference their hiring signals: {signals}. Focus on employee banking solutions.',
    intelligence: 'Analyze employer hiring trends in {region}. Identify high-growth companies and payroll conversion opportunities.',
  },
  'insurance': {
    discovery: 'Find individuals with {signal} signals in {region}. Focus on life insurance and health coverage needs.',
    ranking: 'Rank these insurance prospects by likelihood score. Prioritize those with recent life events.',
    outreach: 'Write a personalized outreach for {prospect} focusing on their insurance needs. Reference their recent {event}.',
    intelligence: 'Analyze insurance market trends in {region}. Identify underserved segments and opportunities.',
  },
  'real-estate': {
    discovery: 'Find buyers with {signal} signals in {region}. Focus on first-time buyers and families.',
    ranking: 'Rank these property prospects by timing score. Prioritize those with urgent housing needs.',
    outreach: 'Write a helpful outreach for {prospect} about properties in {area}. Reference their {signal}.',
    intelligence: 'Analyze the property market in {region}. Identify pricing trends and buyer demographics.',
  },
  'recruitment': {
    discovery: 'Find candidates with {signal} signals in {sector}. Focus on senior and specialized roles.',
    ranking: 'Rank these candidates by quality and engagement. Prioritize passive candidates.',
    outreach: 'Write a recruiting outreach for {candidate} about the {role} opportunity. Highlight relevant experience.',
    intelligence: 'Analyze talent market in {sector}. Identify skill gaps and compensation trends.',
  },
  'saas-sales': {
    discovery: 'Find companies with {signal} signals in {region}. Focus on growth-stage and enterprise accounts.',
    ranking: 'Rank these SaaS accounts by expansion potential. Prioritize those with tech stack fit.',
    outreach: 'Write a solution-focused outreach for {company}. Reference their {pain_point} and how we solve it.',
    intelligence: 'Analyze the SaaS market in {sector}. Identify trends, competitors, and opportunities.',
  },
};

export function getPromptTemplatesForVertical(vertical: Vertical): PromptTemplate {
  return VERTICAL_PROMPT_TEMPLATES[vertical] || VERTICAL_PROMPT_TEMPLATES['banking'];
}
