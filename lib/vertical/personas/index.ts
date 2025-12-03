/**
 * Deep Vertical Persona Packs - Sprint P3
 * Deep Vertical Intelligence Packs
 *
 * Extended persona definitions with deeper industry knowledge,
 * objection handling, and sub-vertical specializations.
 */

import type { Vertical, SubVertical } from '../../intelligence/context/types';
import { getPersonaForVertical, type VerticalPersona } from '../../intelligence/persona/vertical-personas';

// =============================================================================
// EXTENDED PERSONA TYPES
// =============================================================================

export interface DeepPersona extends VerticalPersona {
  // Industry expertise
  industryKnowledge: IndustryKnowledge;

  // Conversation patterns
  conversationPatterns: ConversationPatterns;

  // Objection handling
  objectionHandling: ObjectionHandling[];

  // Success stories templates
  successStoryTemplates: string[];

  // Value propositions
  valuePropositions: ValueProposition[];

  // Sub-vertical variations
  subVerticalVariations?: Record<string, Partial<DeepPersona>>;
}

export interface IndustryKnowledge {
  keyTerms: string[];
  regulations: string[];
  competitors: string[];
  painPoints: string[];
  successMetrics: string[];
  decisionMakers: string[];
  buyingCycle: string;
  seasonality: string[];
}

export interface ConversationPatterns {
  openers: string[];
  discoveryQuestions: string[];
  transitionPhrases: string[];
  closingStatements: string[];
  followUpTemplates: string[];
}

export interface ObjectionHandling {
  objection: string;
  category: 'price' | 'timing' | 'authority' | 'need' | 'competitor' | 'trust';
  response: string;
  followUp: string;
}

export interface ValueProposition {
  headline: string;
  painPoint: string;
  solution: string;
  proof: string;
  callToAction: string;
}

// =============================================================================
// BANKING DEEP PERSONA
// =============================================================================

export const BANKING_DEEP_PERSONA: DeepPersona = {
  ...getPersonaForVertical('banking'),

  industryKnowledge: {
    keyTerms: [
      'AML/KYC', 'Basel III/IV', 'SWIFT', 'IBAN', 'treasury management',
      'correspondent banking', 'trade finance', 'letter of credit',
      'working capital', 'cash pooling', 'FX hedging', 'escrow',
    ],
    regulations: [
      'Central Bank regulations', 'WPS (UAE)', 'Anti-Money Laundering',
      'Know Your Customer', 'FATCA', 'CRS', 'PCI-DSS',
    ],
    competitors: [
      'Emirates NBD', 'ADCB', 'FAB', 'Mashreq', 'RAKBANK', 'CBD',
    ],
    painPoints: [
      'Slow onboarding for corporate accounts',
      'Complex documentation requirements',
      'Limited digital banking features',
      'Poor API integration capabilities',
      'Manual payroll processing',
      'High transaction fees for cross-border',
    ],
    successMetrics: [
      'Account opening time', 'Transaction volume', 'Fee reduction',
      'Employee satisfaction', 'Compliance audit scores',
    ],
    decisionMakers: [
      'CFO', 'Treasurer', 'Finance Director', 'HR Director',
      'CEO (for SME)', 'Procurement Head',
    ],
    buyingCycle: '3-6 months for corporate banking, 1-3 months for employee banking',
    seasonality: ['Q1 budget allocation', 'Q4 contract renewals', 'Ramadan considerations'],
  },

  conversationPatterns: {
    openers: [
      'I noticed your company recently expanded operations in the region...',
      'Congratulations on the recent funding round. Many companies at your stage are evaluating their banking relationships...',
      'I understand managing payroll for a growing team can be complex...',
    ],
    discoveryQuestions: [
      'How are you currently managing payroll for your employees across different locations?',
      'What challenges do you face with your current banking relationship?',
      'How important is digital banking integration with your existing systems?',
      'What are your expansion plans for the next 12-18 months?',
    ],
    transitionPhrases: [
      'Based on what you\'ve shared, our clients in similar situations have benefited from...',
      'That challenge is exactly why we developed our...',
      'I understand. Many finance leaders express the same concern initially...',
    ],
    closingStatements: [
      'Would it be valuable to see how we\'ve helped similar companies reduce onboarding time by 60%?',
      'I\'d like to introduce you to our corporate banking specialist who can walk through the specifics...',
      'Can we schedule a 30-minute call next week to discuss your specific requirements?',
    ],
    followUpTemplates: [
      'Thank you for your time today. As discussed, I\'m attaching the case study of [Company] who reduced their payroll processing time by...',
      'Following up on our conversation about treasury management solutions...',
    ],
  },

  objectionHandling: [
    {
      objection: 'We\'re happy with our current bank',
      category: 'competitor',
      response: 'I understand, and it sounds like they\'re meeting your basic needs. Many of our clients felt the same way until they saw how our digital capabilities could save their finance team 20+ hours per month. Would you be open to a brief comparison?',
      followUp: 'What specific aspects of your current banking relationship do you value most?',
    },
    {
      objection: 'The switching cost is too high',
      category: 'price',
      response: 'That\'s a valid concern. We\'ve developed a white-glove migration service specifically to minimize disruption. Our last 10 corporate clients were fully transitioned within 4 weeks with zero business interruption.',
      followUp: 'Would it help to speak with a reference client who recently went through the transition?',
    },
    {
      objection: 'We need to focus on other priorities right now',
      category: 'timing',
      response: 'I completely understand. Many finance leaders we work with are managing competing priorities. The reason I reached out now is that companies at your growth stage often benefit from addressing banking infrastructure before scaling further. Would it make sense to have a brief call to at least understand your options?',
      followUp: 'When would be a better time to revisit this conversation?',
    },
  ],

  successStoryTemplates: [
    'A [INDUSTRY] company with [EMPLOYEE_COUNT] employees reduced their payroll processing time from 5 days to 2 hours after switching to our employee banking solution.',
    'After implementing our corporate treasury solution, [COMPANY_TYPE] saved [AMOUNT] annually in transaction fees while gaining real-time visibility into cash positions.',
  ],

  valuePropositions: [
    {
      headline: 'Streamline Employee Banking',
      painPoint: 'Manual payroll processing consuming HR resources',
      solution: 'Automated WPS-compliant payroll with same-day processing',
      proof: '95% of clients report 50%+ reduction in payroll admin time',
      callToAction: 'See a demo of our automated payroll solution',
    },
    {
      headline: 'Simplify Corporate Treasury',
      painPoint: 'Fragmented banking relationships and poor visibility',
      solution: 'Unified treasury dashboard with real-time cash positioning',
      proof: 'Clients average 30% improvement in working capital efficiency',
      callToAction: 'Review our treasury management capabilities',
    },
  ],

  subVerticalVariations: {
    'employee-banking': {
      industryKnowledge: {
        keyTerms: ['WPS', 'salary disbursement', 'payroll cycle', 'EOS calculation'],
        painPoints: ['Manual salary processing', 'WPS compliance burden', 'Limited employee self-service'],
        decisionMakers: ['HR Director', 'Finance Manager', 'CEO'],
        buyingCycle: '1-2 months',
      } as IndustryKnowledge,
    },
    'corporate-banking': {
      industryKnowledge: {
        keyTerms: ['treasury', 'cash management', 'trade finance', 'FX'],
        painPoints: ['Multiple banking relationships', 'Poor API access', 'Manual reconciliation'],
        decisionMakers: ['CFO', 'Treasurer', 'Finance Director'],
        buyingCycle: '3-6 months',
      } as IndustryKnowledge,
    },
  },
};

// =============================================================================
// INSURANCE DEEP PERSONA
// =============================================================================

export const INSURANCE_DEEP_PERSONA: DeepPersona = {
  ...getPersonaForVertical('insurance'),

  industryKnowledge: {
    keyTerms: [
      'sum assured', 'premium', 'underwriting', 'claims ratio',
      'waiting period', 'exclusions', 'rider', 'endowment',
      'term life', 'whole life', 'critical illness', 'income protection',
    ],
    regulations: [
      'Insurance Authority regulations', 'Takaful compliance',
      'IRDAI (India)', 'Policy disclosure requirements',
    ],
    competitors: [
      'ADNIC', 'Orient Insurance', 'Oman Insurance', 'AXA Gulf',
      'MetLife', 'Zurich', 'Cigna',
    ],
    painPoints: [
      'Underinsured despite high income',
      'Complex policy terms confusing customers',
      'Claim rejection anxiety',
      'Premium affordability concerns',
      'Gap in coverage during job transitions',
    ],
    successMetrics: [
      'Coverage ratio vs income', 'Family protection score',
      'Policy retention rate', 'Claim settlement time',
    ],
    decisionMakers: [
      'Individual', 'Spouse (joint decision)', 'Family head',
      'HR Director (for group)', 'Benefits Manager',
    ],
    buyingCycle: '2-4 weeks for individual, 2-3 months for group',
    seasonality: ['Tax season (Q1)', 'Open enrollment (Q4)', 'Post-Diwali/Eid'],
  },

  conversationPatterns: {
    openers: [
      'Congratulations on your recent [life event]! This is such an exciting time...',
      'I noticed you recently [job change/promotion]. How are you finding the new role?',
      'Many people in your situation find themselves thinking about protection...',
    ],
    discoveryQuestions: [
      'What would happen to your family\'s lifestyle if something unexpected occurred?',
      'Have you thought about how your coverage needs have changed since [life event]?',
      'What are your biggest financial concerns for your family\'s future?',
      'How confident are you that your current coverage would provide adequate protection?',
    ],
    transitionPhrases: [
      'What you\'ve described is exactly why many families in your situation choose to...',
      'Your concern about [X] is very common, and there are solutions designed specifically for this...',
      'Based on what you\'ve shared about your family situation...',
    ],
    closingStatements: [
      'Would you like me to prepare a personalized protection analysis based on your situation?',
      'Can we schedule a call to walk through some options that might give you peace of mind?',
      'Many people find it helpful to see the numbers. Shall I prepare a quick illustration?',
    ],
    followUpTemplates: [
      'Following up on our conversation about protecting your family. I\'ve prepared a personalized illustration...',
      'I was thinking about what you shared regarding [concern]. I wanted to share some relevant information...',
    ],
  },

  objectionHandling: [
    {
      objection: 'Insurance is too expensive',
      category: 'price',
      response: 'I understand budget is important. The good news is that life insurance is often more affordable than people expect. For someone your age, comprehensive coverage might cost less than your daily coffee. Would you be open to seeing what protection actually costs for your situation?',
      followUp: 'What would a comfortable monthly amount look like for peace of mind?',
    },
    {
      objection: 'I\'m young and healthy, I don\'t need it now',
      category: 'need',
      response: 'That\'s actually the best time to get coverage - premiums are lowest when you\'re young and healthy, and they\'re locked in for the policy term. Waiting until later often means paying significantly more. Would you like to see the difference in premiums at different ages?',
      followUp: 'Do you have any loved ones who depend on your income?',
    },
    {
      objection: 'I have coverage through work',
      category: 'need',
      response: 'That\'s great - employer coverage is valuable. However, most group policies only cover 1-2 years of salary, and they end when you leave the job. Personal coverage stays with you regardless of employment. Would it be helpful to review how your work coverage compares to your actual needs?',
      followUp: 'What happens to your family\'s protection if you change jobs?',
    },
  ],

  successStoryTemplates: [
    'A [AGE]-year-old [PROFESSION] with [FAMILY_SITUATION] secured comprehensive protection for their family at just [PREMIUM] per month, ensuring [COVERAGE_AMOUNT] in protection.',
    'When [CLIENT_TYPE] experienced [LIFE_EVENT], their policy provided [BENEFIT], allowing their family to [OUTCOME].',
  ],

  valuePropositions: [
    {
      headline: 'Protect Your Family\'s Dreams',
      painPoint: 'Worry about family\'s financial security',
      solution: 'Comprehensive life protection with income replacement',
      proof: '98% claim settlement rate, average settlement within 7 days',
      callToAction: 'Get your free protection analysis',
    },
    {
      headline: 'Lock in Your Health Advantage',
      painPoint: 'Uncertainty about future insurability',
      solution: 'Guaranteed premiums locked at your current age and health',
      proof: 'Premiums can be 40% higher if purchased 10 years later',
      callToAction: 'See your personalized premium comparison',
    },
  ],

  subVerticalVariations: {
    'life-insurance': {
      industryKnowledge: {
        keyTerms: ['term life', 'whole life', 'death benefit', 'beneficiary'],
        painPoints: ['Underinsured', 'Policy complexity', 'Premium concerns'],
      } as IndustryKnowledge,
    },
    'health-insurance': {
      industryKnowledge: {
        keyTerms: ['network hospital', 'co-pay', 'pre-existing condition', 'waiting period'],
        painPoints: ['Coverage gaps', 'Claim rejections', 'Rising premiums'],
      } as IndustryKnowledge,
    },
  },
};

// =============================================================================
// REAL ESTATE DEEP PERSONA
// =============================================================================

export const REAL_ESTATE_DEEP_PERSONA: DeepPersona = {
  ...getPersonaForVertical('real-estate'),

  industryKnowledge: {
    keyTerms: [
      'mortgage pre-approval', 'closing costs', 'escrow', 'title search',
      'inspection', 'appraisal', 'earnest money', 'contingencies',
      'listing agreement', 'MLS', 'comparative market analysis',
    ],
    regulations: [
      'Real estate registration', 'RERA (UAE)', 'Property disclosure laws',
      'Foreign ownership rules', 'Mortgage regulations',
    ],
    competitors: [
      'Emaar', 'Damac', 'Aldar', 'Betterhomes', 'Allsopp & Allsopp',
    ],
    painPoints: [
      'Finding the right property in budget',
      'Navigating mortgage approval',
      'Understanding market timing',
      'Hidden costs and fees',
      'Rental vs buy decision',
    ],
    successMetrics: [
      'Time to close', 'Listing-to-sale ratio', 'Client satisfaction',
      'Referral rate', 'Price achieved vs asking',
    ],
    decisionMakers: [
      'Individual buyer', 'Couple (joint decision)', 'Family',
      'Investor', 'Corporate relocation manager',
    ],
    buyingCycle: '2-6 months for buyers, 1-3 months for renters',
    seasonality: ['Q1 peak buying', 'Summer slowdown', 'Q4 investor activity'],
  },

  conversationPatterns: {
    openers: [
      'I understand you\'re looking for a new home in [AREA]. What\'s drawing you to that neighborhood?',
      'Congratulations on the new role! Relocating can be exciting. What areas are you considering?',
      'I noticed your lease is coming up. Have you thought about whether to renew or explore buying?',
    ],
    discoveryQuestions: [
      'What are the must-haves in your new home?',
      'Tell me about your ideal neighborhood and lifestyle.',
      'What\'s driving your timeline for the move?',
      'Have you been pre-approved for financing?',
      'What concerns do you have about the buying/selling process?',
    ],
    transitionPhrases: [
      'Based on your preferences, I have a few properties that could be perfect for you...',
      'Many buyers in your situation find that...',
      'I completely understand that concern. Here\'s how we typically address it...',
    ],
    closingStatements: [
      'Would you like to schedule viewings for this weekend?',
      'Shall I put together a personalized property shortlist for you?',
      'Would it help to connect you with our preferred mortgage partner?',
    ],
    followUpTemplates: [
      'Thank you for viewing the properties yesterday. I\'ve attached additional details on the ones you liked...',
      'A new listing just came on market that matches your criteria. Want to see it before it goes public?',
    ],
  },

  objectionHandling: [
    {
      objection: 'I\'m not ready to buy yet, just looking',
      category: 'timing',
      response: 'That\'s perfectly fine! Many of my clients start by exploring the market to understand their options. Would it be helpful if I set up a search that sends you properties matching your criteria? No pressure - just keeping you informed.',
      followUp: 'What would need to happen for you to feel ready to take the next step?',
    },
    {
      objection: 'The prices are too high right now',
      category: 'price',
      response: 'I hear that concern often. The market does vary by area and property type. Some pockets actually offer good value right now. Would you be open to exploring some areas you might not have considered?',
      followUp: 'What price range would feel comfortable for you?',
    },
    {
      objection: 'I can find properties online myself',
      category: 'need',
      response: 'Absolutely, and I encourage clients to browse online. What I bring is access to off-market listings, negotiation expertise, and guidance through the complex transaction process. My last 5 clients saved an average of [X]% off asking price. Would that kind of expertise be valuable to you?',
      followUp: 'Have you found anything interesting in your search so far?',
    },
  ],

  successStoryTemplates: [
    'A [FAMILY_TYPE] found their dream [PROPERTY_TYPE] in [AREA] after viewing just [NUMBER] properties, closing [X]% under asking price.',
    'When [CLIENT_TYPE] needed to [RELOCATE/DOWNSIZE/UPGRADE], we helped them [OUTCOME] in just [TIMEFRAME].',
  ],

  valuePropositions: [
    {
      headline: 'Find Your Perfect Home Faster',
      painPoint: 'Overwhelmed by property search',
      solution: 'Curated property matches based on your unique needs',
      proof: 'Average client finds their home after viewing just 5 properties',
      callToAction: 'Start your personalized property search',
    },
    {
      headline: 'Negotiate with Confidence',
      painPoint: 'Worried about overpaying',
      solution: 'Expert negotiation backed by market data',
      proof: 'Clients save average of 3-5% off asking price',
      callToAction: 'Get a free market analysis',
    },
  ],
};

// =============================================================================
// RECRUITMENT DEEP PERSONA
// =============================================================================

export const RECRUITMENT_DEEP_PERSONA: DeepPersona = {
  ...getPersonaForVertical('recruitment'),

  industryKnowledge: {
    keyTerms: [
      'headcount', 'requisition', 'job description', 'sourcing',
      'screening', 'assessment', 'offer', 'onboarding', 'retention',
      'employer brand', 'talent pipeline', 'passive candidate',
    ],
    regulations: [
      'Labor law compliance', 'Equal opportunity', 'Work visa requirements',
      'Probation terms', 'Notice period regulations',
    ],
    competitors: [
      'Michael Page', 'Robert Half', 'Hays', 'BAC', 'Charterhouse',
    ],
    painPoints: [
      'Time-to-fill too long',
      'Quality of candidates',
      'Offer rejection rate',
      'Candidate ghosting',
      'Retaining top talent',
      'Hiring manager alignment',
    ],
    successMetrics: [
      'Time-to-fill', 'Offer acceptance rate', 'Quality of hire',
      'Retention at 12 months', 'Hiring manager satisfaction',
    ],
    decisionMakers: [
      'HR Director', 'Talent Acquisition Lead', 'Hiring Manager',
      'CEO (for startups)', 'Department Head',
    ],
    buyingCycle: 'Immediate for urgent roles, ongoing for retained search',
    seasonality: ['Q1 hiring surge', 'Q3 pre-Q4 push', 'Slow August'],
  },

  conversationPatterns: {
    openers: [
      'I noticed you\'ve been growing your [DEPARTMENT] team. How\'s the search going?',
      'Congratulations on the funding! Scaling the team quickly must be a priority...',
      'I came across your profile and was impressed by your experience at [COMPANY]...',
    ],
    discoveryQuestions: [
      'What\'s making this role difficult to fill?',
      'What does success look like in this position at 6 and 12 months?',
      'What makes your company culture unique?',
      'What\'s your timeline for having someone in place?',
      'What\'s driven the need for this hire?',
    ],
    transitionPhrases: [
      'What you\'re describing is exactly the type of challenge we specialize in...',
      'I\'ve placed similar profiles at companies facing the same situation...',
      'Many hiring managers tell us the same thing. Here\'s how we approach it...',
    ],
    closingStatements: [
      'I have a few candidates who might be a strong fit. Would you like to see their profiles?',
      'Can we schedule a brief call to discuss the role in more detail?',
      'Would it be valuable to start with a market mapping exercise?',
    ],
    followUpTemplates: [
      'Following up on our discussion about the [ROLE] position. I\'ve identified [NUMBER] potential candidates...',
      'I wanted to share an update on the candidates we discussed...',
    ],
  },

  objectionHandling: [
    {
      objection: 'Your fees are too high',
      category: 'price',
      response: 'I understand fee is a consideration. What I\'d invite you to consider is the cost of a bad hire or a prolonged vacancy. Our placement success rate is [X]% and our candidates stay an average of [Y] years. Would you like to see how that translates to ROI?',
      followUp: 'What is the cost to your business of this role remaining unfilled?',
    },
    {
      objection: 'We prefer to recruit internally',
      category: 'need',
      response: 'Internal recruitment is valuable for many roles. Where we add most value is for specialized or senior roles where your team might not have the network or time. Would it make sense to partner on just the hardest-to-fill roles?',
      followUp: 'Which roles are proving most challenging for your internal team?',
    },
    {
      objection: 'We\'ve had bad experiences with recruiters',
      category: 'trust',
      response: 'I\'m sorry to hear that - unfortunately, our industry has its share of practitioners who don\'t do it right. What sets us apart is [DIFFERENTIATOR]. Would you be open to trying a small engagement to experience the difference?',
      followUp: 'What would make working with a recruiter valuable for you?',
    },
  ],

  successStoryTemplates: [
    'We filled a [LEVEL] [FUNCTION] role for [COMPANY_TYPE] in [TIMEFRAME], with the hire still thriving [MONTHS] later.',
    'When [COMPANY] needed to scale their [TEAM] from [X] to [Y] in [TIMEFRAME], we delivered [NUMBER] quality hires.',
  ],

  valuePropositions: [
    {
      headline: 'Fill Critical Roles Faster',
      painPoint: 'Vacant positions impacting business',
      solution: 'Pre-vetted talent pipeline ready to interview',
      proof: 'Average time-to-fill of 21 days vs industry average of 45',
      callToAction: 'See candidates for your open role',
    },
    {
      headline: 'Hire Quality That Stays',
      painPoint: 'High turnover in recent hires',
      solution: 'Rigorous culture-fit and skill assessment',
      proof: '93% of placements retained at 12 months',
      callToAction: 'Learn about our assessment process',
    },
  ],
};

// =============================================================================
// SAAS SALES DEEP PERSONA
// =============================================================================

export const SAAS_SALES_DEEP_PERSONA: DeepPersona = {
  ...getPersonaForVertical('saas-sales'),

  industryKnowledge: {
    keyTerms: [
      'ARR', 'MRR', 'churn', 'LTV', 'CAC', 'NRR', 'expansion revenue',
      'product-led growth', 'freemium', 'enterprise', 'mid-market',
      'implementation', 'integration', 'API', 'SSO', 'SOC2',
    ],
    regulations: [
      'GDPR', 'SOC2 compliance', 'HIPAA (healthcare)', 'PCI-DSS',
      'Data residency requirements', 'Privacy regulations',
    ],
    competitors: [
      'Varies by category - identify top 3-5 for specific product',
    ],
    painPoints: [
      'Tool fragmentation',
      'Poor adoption post-purchase',
      'Integration challenges',
      'Data silos',
      'Proving ROI to leadership',
      'Vendor lock-in concerns',
    ],
    successMetrics: [
      'Time-to-value', 'User adoption rate', 'Efficiency gains',
      'Cost savings', 'Revenue impact', 'User satisfaction (NPS)',
    ],
    decisionMakers: [
      'VP/Director of [Function]', 'CTO/CIO', 'CFO', 'CEO (SMB)',
      'Procurement', 'IT Security',
    ],
    buyingCycle: '1-2 months SMB, 3-6 months mid-market, 6-12 months enterprise',
    seasonality: ['Q4 budget flush', 'Q1 new budget', 'Fiscal year-end varies'],
  },

  conversationPatterns: {
    openers: [
      'I noticed your team has been growing rapidly. How are you scaling your [FUNCTION] operations?',
      'Congratulations on the recent funding! Many companies at your stage start evaluating their tech stack...',
      'I saw your company is using [COMPETITOR/RELATED TOOL]. How\'s that working for you?',
    ],
    discoveryQuestions: [
      'What\'s your biggest operational challenge right now?',
      'How are you currently handling [USE CASE]?',
      'What would success look like if you solved this problem?',
      'Who else would need to be involved in evaluating a solution?',
      'What\'s your timeline for making a change?',
    ],
    transitionPhrases: [
      'What you\'re describing is exactly what we help companies like yours solve...',
      'That challenge is common at your growth stage. Here\'s how others have addressed it...',
      'I\'d like to show you how [CUSTOMER] tackled a similar situation...',
    ],
    closingStatements: [
      'Would you be open to a 15-minute demo to see how this could work for your team?',
      'Can I set up a trial account so your team can experience it firsthand?',
      'Would it make sense to include [OTHER STAKEHOLDER] in our next conversation?',
    ],
    followUpTemplates: [
      'Thanks for the conversation today. As discussed, here\'s the case study on [COMPANY] who achieved [OUTCOME]...',
      'Following up on your trial - I noticed your team has been exploring [FEATURE]. Would it help to schedule a walkthrough?',
    ],
  },

  objectionHandling: [
    {
      objection: 'We don\'t have budget for this right now',
      category: 'price',
      response: 'I understand budget constraints. Many of our customers actually found budget by demonstrating the ROI impact. Companies like yours typically see [X]% efficiency gains that easily justify the investment. Would it help if I put together a simple ROI analysis for your leadership?',
      followUp: 'When does your next budget cycle start?',
    },
    {
      objection: 'We\'re already using [competitor]',
      category: 'competitor',
      response: 'That\'s helpful to know. Many of our customers actually started there too. What typically drives them to explore alternatives is [KEY DIFFERENTIATOR]. Is [COMPETITOR] fully meeting your needs, or are there gaps?',
      followUp: 'What would it take for you to consider an alternative?',
    },
    {
      objection: 'We don\'t have time to implement something new',
      category: 'timing',
      response: 'Implementation time is a fair concern. What if I told you our average customer is fully up and running in [TIMEFRAME]? We\'ve designed our onboarding specifically to minimize disruption. Would a quick demo to see the simplicity help?',
      followUp: 'What\'s consuming most of your team\'s time right now?',
    },
  ],

  successStoryTemplates: [
    '[COMPANY_TYPE] reduced their [METRIC] by [X]% within [TIMEFRAME] of implementing our solution.',
    'After switching from [COMPETITOR], [COMPANY] saw [X]% improvement in [METRIC] and saved [HOURS/AMOUNT] per week.',
  ],

  valuePropositions: [
    {
      headline: 'Scale Without Adding Headcount',
      painPoint: 'Manual processes limiting growth',
      solution: 'Automation that handles [X] without human intervention',
      proof: 'Customers save average of 20 hours per week',
      callToAction: 'Calculate your time savings',
    },
    {
      headline: 'See Results in Days, Not Months',
      painPoint: 'Long implementation times',
      solution: 'Self-serve setup with guided onboarding',
      proof: '85% of customers see value within first week',
      callToAction: 'Start your free trial today',
    },
  ],
};

// =============================================================================
// ACCESS FUNCTIONS
// =============================================================================

/**
 * Get deep persona for a vertical
 */
export function getDeepPersona(vertical: Vertical): DeepPersona {
  switch (vertical) {
    case 'banking':
      return BANKING_DEEP_PERSONA;
    case 'insurance':
      return INSURANCE_DEEP_PERSONA;
    case 'real-estate':
      return REAL_ESTATE_DEEP_PERSONA;
    case 'recruitment':
      return RECRUITMENT_DEEP_PERSONA;
    case 'saas-sales':
      return SAAS_SALES_DEEP_PERSONA;
    default:
      // Return SaaS as default since it's most generic
      return SAAS_SALES_DEEP_PERSONA;
  }
}

/**
 * Get objection handling for a specific objection type
 */
export function getObjectionHandling(
  vertical: Vertical,
  category: ObjectionHandling['category']
): ObjectionHandling | undefined {
  const persona = getDeepPersona(vertical);
  return persona.objectionHandling.find(o => o.category === category);
}

/**
 * Get conversation opener based on context
 */
export function getConversationOpener(
  vertical: Vertical,
  context?: { lifeEvent?: string; trigger?: string }
): string {
  const persona = getDeepPersona(vertical);
  const openers = persona.conversationPatterns.openers;

  // Return random opener if no context
  if (!context) {
    return openers[Math.floor(Math.random() * openers.length)];
  }

  // Try to find contextually relevant opener
  if (context.lifeEvent) {
    const lifeEventOpener = openers.find(o =>
      o.toLowerCase().includes('life event') ||
      o.toLowerCase().includes('congratulations')
    );
    if (lifeEventOpener) {
      return lifeEventOpener.replace('[life event]', context.lifeEvent);
    }
  }

  return openers[0];
}

/**
 * Get value propositions for a vertical
 */
export function getValuePropositions(vertical: Vertical): ValueProposition[] {
  return getDeepPersona(vertical).valuePropositions;
}

/**
 * Get industry knowledge for a vertical
 */
export function getIndustryKnowledge(vertical: Vertical): IndustryKnowledge {
  return getDeepPersona(vertical).industryKnowledge;
}

// =============================================================================
// METADATA
// =============================================================================

export const DEEP_PERSONA_METADATA = {
  version: '1.0.0',
  lastUpdated: '2024-12-03',
  verticals: ['banking', 'insurance', 'real-estate', 'recruitment', 'saas-sales'],
  features: [
    'Industry knowledge',
    'Conversation patterns',
    'Objection handling',
    'Value propositions',
    'Success story templates',
  ],
} as const;
