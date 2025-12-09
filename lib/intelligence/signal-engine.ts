/**
 * Signal Engine - Sprint S138
 *
 * CRITICAL ARCHITECTURE CONSTRAINT:
 * Signal filtering must derive from Intelligence Packs, NOT hardcoded UI logic.
 *
 * This engine converts Intelligence Pack definitions to UI-ready signals.
 * Different verticals have different signal importance:
 *
 * Employee Banking: Hiring bursts, branch openings, leadership changes, headcount expansion
 * Corporate Banking: Funding rounds, M&A, contract awards
 * Insurance: Demographic personal events
 * Recruitment: Job openings
 * Real Estate: Relocation, family growth
 *
 * The engine ensures signals are context-consistent with SIVA's reasoning.
 */

import type { Vertical, SubVertical, SalesSignalType } from './context/types';

// =============================================================================
// Types
// =============================================================================

export interface SignalDefinition {
  type: SalesSignalType;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  scoreWeight: number;
  timingRelevance: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  actionableWindow: number; // Days
}

export interface SignalInstance {
  id: string;
  type: SalesSignalType;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  relevance: number;
  source: string;
  detectedAt: Date;
  expiresAt: Date;
  metadata: Record<string, unknown>;

  // QTLE contribution
  qtleContribution: {
    quality: number;
    timing: number;
    likelihood: number;
    engagement: number;
  };

  // Evidence chain for transparency
  evidence: SignalEvidence[];
}

export interface SignalEvidence {
  sourceType: 'news' | 'job_posting' | 'company_filing' | 'social' | 'enrichment';
  sourceUrl?: string;
  extractedAt: Date;
  confidence: number;
  rawData?: string;
}

export interface SignalFilter {
  vertical: Vertical;
  subVertical: SubVertical;
  regions: string[];
  signalTypes?: SalesSignalType[];
  minConfidence?: number;
  minRelevance?: number;
  priority?: ('critical' | 'high' | 'medium' | 'low')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface PackSignalConfig {
  allowedTypes: SalesSignalType[];
  priorityWeights: Record<SalesSignalType, number>;
  categoryMappings: Record<SalesSignalType, string>;
  timingRules: Record<SalesSignalType, {
    relevance: SignalDefinition['timingRelevance'];
    window: number;
  }>;
}

// =============================================================================
// Pack-Based Signal Configurations
// =============================================================================

const BANKING_EMPLOYEE_SIGNALS: PackSignalConfig = {
  allowedTypes: [
    'hiring-expansion',
    'headcount-jump',
    'office-opening',
    'market-entry',
    'leadership-hiring',
    'subsidiary-creation',
  ],
  priorityWeights: {
    'hiring-expansion': 1.0,
    'headcount-jump': 0.95,
    'office-opening': 0.8,
    'market-entry': 0.85,
    'leadership-hiring': 0.7,
    'subsidiary-creation': 0.75,
    // Default values for other types
    'funding-round': 0.6,
    'project-award': 0.65,
    'merger-acquisition': 0.5,
    'expansion-announcement': 0.6,
    'life-event': 0,
    'salary-change': 0,
    'job-change': 0,
    'family-event': 0,
    'rental-expiry': 0,
    'relocation': 0,
    'family-growth': 0,
    'job-posting': 0.3,
    'layoff-announcement': 0.4,
    'skill-trending': 0,
  },
  categoryMappings: {
    'hiring-expansion': 'Growth',
    'headcount-jump': 'Growth',
    'office-opening': 'Expansion',
    'market-entry': 'Expansion',
    'leadership-hiring': 'Leadership',
    'subsidiary-creation': 'Corporate',
    'funding-round': 'Finance',
    'project-award': 'Business',
    'merger-acquisition': 'Corporate',
    'expansion-announcement': 'Expansion',
    'life-event': 'Personal',
    'salary-change': 'Personal',
    'job-change': 'Career',
    'family-event': 'Personal',
    'rental-expiry': 'Housing',
    'relocation': 'Housing',
    'family-growth': 'Personal',
    'job-posting': 'Hiring',
    'layoff-announcement': 'Workforce',
    'skill-trending': 'Skills',
  },
  timingRules: {
    'hiring-expansion': { relevance: 'immediate', window: 30 },
    'headcount-jump': { relevance: 'short-term', window: 45 },
    'office-opening': { relevance: 'medium-term', window: 90 },
    'market-entry': { relevance: 'short-term', window: 60 },
    'leadership-hiring': { relevance: 'short-term', window: 60 },
    'subsidiary-creation': { relevance: 'medium-term', window: 90 },
    'funding-round': { relevance: 'short-term', window: 60 },
    'project-award': { relevance: 'short-term', window: 45 },
    'merger-acquisition': { relevance: 'long-term', window: 180 },
    'expansion-announcement': { relevance: 'medium-term', window: 90 },
    'life-event': { relevance: 'immediate', window: 30 },
    'salary-change': { relevance: 'immediate', window: 14 },
    'job-change': { relevance: 'immediate', window: 21 },
    'family-event': { relevance: 'short-term', window: 60 },
    'rental-expiry': { relevance: 'short-term', window: 60 },
    'relocation': { relevance: 'immediate', window: 30 },
    'family-growth': { relevance: 'short-term', window: 45 },
    'job-posting': { relevance: 'immediate', window: 21 },
    'layoff-announcement': { relevance: 'immediate', window: 14 },
    'skill-trending': { relevance: 'long-term', window: 90 },
  },
};

const BANKING_CORPORATE_SIGNALS: PackSignalConfig = {
  allowedTypes: [
    'funding-round',
    'merger-acquisition',
    'project-award',
    'expansion-announcement',
    'subsidiary-creation',
    'market-entry',
  ],
  priorityWeights: {
    'funding-round': 1.0,
    'merger-acquisition': 0.95,
    'project-award': 0.85,
    'expansion-announcement': 0.8,
    'subsidiary-creation': 0.9,
    'market-entry': 0.85,
    'hiring-expansion': 0.5,
    'headcount-jump': 0.4,
    'office-opening': 0.6,
    'leadership-hiring': 0.7,
    'life-event': 0,
    'salary-change': 0,
    'job-change': 0,
    'family-event': 0,
    'rental-expiry': 0,
    'relocation': 0,
    'family-growth': 0,
    'job-posting': 0.2,
    'layoff-announcement': 0.3,
    'skill-trending': 0,
  },
  categoryMappings: BANKING_EMPLOYEE_SIGNALS.categoryMappings,
  timingRules: BANKING_EMPLOYEE_SIGNALS.timingRules,
};

const RECRUITMENT_SIGNALS: PackSignalConfig = {
  allowedTypes: [
    'job-posting',
    'hiring-expansion',
    'layoff-announcement',
    'leadership-hiring',
    'skill-trending',
  ],
  priorityWeights: {
    'job-posting': 1.0,
    'hiring-expansion': 0.95,
    'layoff-announcement': 0.8,
    'leadership-hiring': 0.85,
    'skill-trending': 0.7,
    'funding-round': 0.6,
    'merger-acquisition': 0.5,
    'project-award': 0.4,
    'expansion-announcement': 0.6,
    'subsidiary-creation': 0.4,
    'market-entry': 0.5,
    'headcount-jump': 0.8,
    'office-opening': 0.5,
    'life-event': 0,
    'salary-change': 0,
    'job-change': 0,
    'family-event': 0,
    'rental-expiry': 0,
    'relocation': 0,
    'family-growth': 0,
  },
  categoryMappings: BANKING_EMPLOYEE_SIGNALS.categoryMappings,
  timingRules: {
    ...BANKING_EMPLOYEE_SIGNALS.timingRules,
    'job-posting': { relevance: 'immediate', window: 14 },
    'layoff-announcement': { relevance: 'immediate', window: 7 },
  },
};

const INSURANCE_SIGNALS: PackSignalConfig = {
  allowedTypes: [
    'hiring-expansion',
    'subsidiary-creation',
    'expansion-announcement',
    'headcount-jump',
  ],
  priorityWeights: {
    'hiring-expansion': 0.9,
    'subsidiary-creation': 0.85,
    'expansion-announcement': 0.8,
    'headcount-jump': 0.95,
    'funding-round': 0.6,
    'merger-acquisition': 0.5,
    'project-award': 0.5,
    'market-entry': 0.6,
    'leadership-hiring': 0.5,
    'office-opening': 0.6,
    'life-event': 0,
    'salary-change': 0,
    'job-change': 0,
    'family-event': 0,
    'rental-expiry': 0,
    'relocation': 0,
    'family-growth': 0,
    'job-posting': 0.3,
    'layoff-announcement': 0.3,
    'skill-trending': 0,
  },
  categoryMappings: BANKING_EMPLOYEE_SIGNALS.categoryMappings,
  timingRules: BANKING_EMPLOYEE_SIGNALS.timingRules,
};

const REAL_ESTATE_SIGNALS: PackSignalConfig = {
  allowedTypes: [
    'relocation',
    'family-growth',
    'office-opening',
    'expansion-announcement',
    'market-entry',
  ],
  priorityWeights: {
    'relocation': 1.0,
    'family-growth': 0.95,
    'office-opening': 0.85,
    'expansion-announcement': 0.8,
    'market-entry': 0.75,
    'hiring-expansion': 0.5,
    'headcount-jump': 0.4,
    'funding-round': 0.4,
    'merger-acquisition': 0.3,
    'project-award': 0.4,
    'subsidiary-creation': 0.5,
    'leadership-hiring': 0.3,
    'life-event': 0.6,
    'salary-change': 0.5,
    'job-change': 0.7,
    'family-event': 0.8,
    'rental-expiry': 0.9,
    'job-posting': 0.2,
    'layoff-announcement': 0.2,
    'skill-trending': 0,
  },
  categoryMappings: BANKING_EMPLOYEE_SIGNALS.categoryMappings,
  timingRules: BANKING_EMPLOYEE_SIGNALS.timingRules,
};

// =============================================================================
// Signal Engine Class
// =============================================================================

export class SignalEngine {
  private config: PackSignalConfig;
  private vertical: Vertical;
  private subVertical: SubVertical;

  constructor(vertical: Vertical, subVertical: SubVertical) {
    this.vertical = vertical;
    this.subVertical = subVertical;
    this.config = this.loadPackConfig(vertical, subVertical);
  }

  /**
   * Load Pack configuration based on vertical/sub-vertical
   */
  private loadPackConfig(vertical: Vertical, subVertical: SubVertical): PackSignalConfig {
    switch (vertical) {
      case 'banking':
        if (subVertical === 'employee-banking') {
          return BANKING_EMPLOYEE_SIGNALS;
        }
        return BANKING_CORPORATE_SIGNALS;

      case 'recruitment':
        return RECRUITMENT_SIGNALS;

      case 'insurance':
        return INSURANCE_SIGNALS;

      case 'real-estate':
        return REAL_ESTATE_SIGNALS;

      case 'saas-sales':
        return BANKING_CORPORATE_SIGNALS; // Similar to corporate banking

      default:
        return BANKING_EMPLOYEE_SIGNALS;
    }
  }

  /**
   * Get allowed signal types for current context
   */
  getAllowedTypes(): SalesSignalType[] {
    return this.config.allowedTypes;
  }

  /**
   * Get priority weight for a signal type
   */
  getPriorityWeight(signalType: SalesSignalType): number {
    return this.config.priorityWeights[signalType] || 0;
  }

  /**
   * Get category for a signal type
   */
  getCategory(signalType: SalesSignalType): string {
    return this.config.categoryMappings[signalType] || 'Other';
  }

  /**
   * Get timing rules for a signal type
   */
  getTimingRules(signalType: SalesSignalType): { relevance: SignalDefinition['timingRelevance']; window: number } {
    return this.config.timingRules[signalType] || { relevance: 'medium-term', window: 60 };
  }

  /**
   * Filter signals based on Pack configuration
   */
  filterSignals(signals: SignalInstance[], filter?: Partial<SignalFilter>): SignalInstance[] {
    return signals
      .filter(signal => {
        // Only allow signals from the Pack
        if (!this.config.allowedTypes.includes(signal.type)) {
          return false;
        }

        // Apply additional filters
        if (filter?.minConfidence && signal.confidence < filter.minConfidence) {
          return false;
        }

        if (filter?.minRelevance && signal.relevance < filter.minRelevance) {
          return false;
        }

        if (filter?.priority && !filter.priority.includes(signal.priority)) {
          return false;
        }

        if (filter?.dateRange) {
          const signalDate = new Date(signal.detectedAt);
          if (signalDate < filter.dateRange.start || signalDate > filter.dateRange.end) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by Pack priority weight, then by recency
        const weightA = this.getPriorityWeight(a.type);
        const weightB = this.getPriorityWeight(b.type);

        if (weightA !== weightB) {
          return weightB - weightA; // Higher weight first
        }

        return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      });
  }

  /**
   * Calculate QTLE contribution for a signal
   */
  calculateQTLEContribution(signal: SignalInstance): SignalInstance['qtleContribution'] {
    const weight = this.getPriorityWeight(signal.type);
    const timing = this.getTimingRules(signal.type);

    // Calculate timing decay based on actionable window
    const daysSinceDetection = (Date.now() - new Date(signal.detectedAt).getTime()) / (1000 * 60 * 60 * 24);
    const timingDecay = Math.max(0, 1 - (daysSinceDetection / timing.window));

    return {
      quality: Math.round(signal.confidence * weight * 100),
      timing: Math.round(timingDecay * 100),
      likelihood: Math.round(signal.relevance * weight * 100),
      engagement: Math.round(weight * 50), // Base engagement from signal importance
    };
  }

  /**
   * Enrich signal with Pack-derived metadata
   */
  enrichSignal(signal: SignalInstance): SignalInstance {
    return {
      ...signal,
      qtleContribution: this.calculateQTLEContribution(signal),
    };
  }

  /**
   * Group signals by category
   */
  groupByCategory(signals: SignalInstance[]): Record<string, SignalInstance[]> {
    const groups: Record<string, SignalInstance[]> = {};

    for (const signal of signals) {
      const category = this.getCategory(signal.type);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(signal);
    }

    return groups;
  }

  /**
   * Get signal definitions for UI rendering
   */
  getSignalDefinitions(): SignalDefinition[] {
    return this.config.allowedTypes.map(type => {
      const timing = this.getTimingRules(type);
      const weight = this.getPriorityWeight(type);

      return {
        type,
        name: formatSignalTypeName(type),
        description: getSignalDescription(type, this.vertical),
        priority: weightToPriority(weight),
        category: this.getCategory(type),
        scoreWeight: weight,
        timingRelevance: timing.relevance,
        actionableWindow: timing.window,
      };
    });
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatSignalTypeName(type: SalesSignalType): string {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function weightToPriority(weight: number): SignalDefinition['priority'] {
  if (weight >= 0.9) return 'critical';
  if (weight >= 0.7) return 'high';
  if (weight >= 0.4) return 'medium';
  return 'low';
}

function getSignalDescription(type: SalesSignalType, vertical: Vertical): string {
  const descriptions: Record<SalesSignalType, Record<Vertical, string>> = {
    'hiring-expansion': {
      'banking': 'Company is actively hiring, indicating growth and potential payroll account needs.',
      'insurance': 'Company growth suggests expanding insurance coverage requirements.',
      'real-estate': 'Growing workforce may need office space expansion.',
      'recruitment': 'High-priority opportunity for placement services.',
      'saas-sales': 'Growing team indicates potential for new tool adoption.',
    },
    'headcount-jump': {
      'banking': 'Significant workforce increase - strong payroll banking opportunity.',
      'insurance': 'Rapid headcount growth means group insurance needs.',
      'real-estate': 'Major growth may require facility expansion.',
      'recruitment': 'Volume hiring opportunity detected.',
      'saas-sales': 'Scaling team needs scalable solutions.',
    },
    'office-opening': {
      'banking': 'New office location signals corporate banking needs.',
      'insurance': 'New location requires insurance coverage.',
      'real-estate': 'Active commercial real estate prospect.',
      'recruitment': 'New location means local hiring needs.',
      'saas-sales': 'Expansion suggests growing tech requirements.',
    },
    'funding-round': {
      'banking': 'Fresh capital indicates treasury and banking relationship opportunities.',
      'insurance': 'Funded company likely expanding coverage.',
      'real-estate': 'Capital may be used for real estate expansion.',
      'recruitment': 'Funding typically followed by hiring spree.',
      'saas-sales': 'Budget available for new tools and platforms.',
    },
    'market-entry': {
      'banking': 'Entering UAE market - needs local banking partner.',
      'insurance': 'New market entry requires local insurance setup.',
      'real-estate': 'Looking for office/facility space.',
      'recruitment': 'Will need local talent acquisition.',
      'saas-sales': 'New market means new operational tools needed.',
    },
    'project-award': {
      'banking': 'Major project win - working capital and treasury needs.',
      'insurance': 'Large project may need additional coverage.',
      'real-estate': 'Project may require temporary or permanent facilities.',
      'recruitment': 'Project staffing requirements expected.',
      'saas-sales': 'Project tools and collaboration needs.',
    },
    'subsidiary-creation': {
      'banking': 'New entity requires full banking relationship.',
      'insurance': 'Separate entity needs independent coverage.',
      'real-estate': 'New entity may need separate premises.',
      'recruitment': 'New entity leadership and staff hiring.',
      'saas-sales': 'New entity operational setup.',
    },
    'leadership-hiring': {
      'banking': 'New leadership may reassess banking relationships.',
      'insurance': 'Leadership change - policy review opportunity.',
      'real-estate': 'New leadership may drive expansion decisions.',
      'recruitment': 'C-level placement opportunity.',
      'saas-sales': 'New leadership often drives tool adoption.',
    },
    'merger-acquisition': {
      'banking': 'M&A activity signals major treasury restructuring.',
      'insurance': 'Policy integration and coverage review needed.',
      'real-estate': 'Consolidation may affect facilities.',
      'recruitment': 'Post-merger hiring or restructuring.',
      'saas-sales': 'Systems integration and tool consolidation.',
    },
    'expansion-announcement': {
      'banking': 'Planned expansion indicates future banking needs.',
      'insurance': 'Expansion planning requires coverage review.',
      'real-estate': 'Expansion announcement - facilities timing.',
      'recruitment': 'Expansion hiring pipeline opportunity.',
      'saas-sales': 'Scaling requires scalable solutions.',
    },
    // Personal/Individual signals (for Insurance, Real Estate)
    'life-event': {
      'banking': 'N/A for banking.',
      'insurance': 'Life event triggers coverage review.',
      'real-estate': 'Life event may trigger property decisions.',
      'recruitment': 'N/A for recruitment.',
      'saas-sales': 'N/A for SaaS.',
    },
    'salary-change': {
      'banking': 'N/A for banking.',
      'insurance': 'Income change affects coverage needs.',
      'real-estate': 'Income change affects buying power.',
      'recruitment': 'N/A for recruitment.',
      'saas-sales': 'N/A for SaaS.',
    },
    'job-change': {
      'banking': 'N/A for banking.',
      'insurance': 'Job change requires coverage transition.',
      'real-estate': 'Job change may trigger relocation.',
      'recruitment': 'Candidate available or opportunity.',
      'saas-sales': 'N/A for SaaS.',
    },
    'family-event': {
      'banking': 'N/A for banking.',
      'insurance': 'Family change affects coverage needs.',
      'real-estate': 'Family growth drives housing decisions.',
      'recruitment': 'N/A for recruitment.',
      'saas-sales': 'N/A for SaaS.',
    },
    'rental-expiry': {
      'banking': 'N/A for banking.',
      'insurance': 'N/A for insurance.',
      'real-estate': 'Rental expiry - active buyer/renter prospect.',
      'recruitment': 'N/A for recruitment.',
      'saas-sales': 'N/A for SaaS.',
    },
    'relocation': {
      'banking': 'N/A for banking.',
      'insurance': 'Relocation requires coverage updates.',
      'real-estate': 'Active property search expected.',
      'recruitment': 'Talent movement opportunity.',
      'saas-sales': 'N/A for SaaS.',
    },
    'family-growth': {
      'banking': 'N/A for banking.',
      'insurance': 'Family growth increases coverage needs.',
      'real-estate': 'Family growth drives upgrade decisions.',
      'recruitment': 'N/A for recruitment.',
      'saas-sales': 'N/A for SaaS.',
    },
    // Recruitment-specific
    'job-posting': {
      'banking': 'Hiring activity indicates growth.',
      'insurance': 'Hiring indicates potential coverage expansion.',
      'real-estate': 'N/A for real estate.',
      'recruitment': 'Active job - immediate placement opportunity.',
      'saas-sales': 'Hiring may need tools for new team.',
    },
    'layoff-announcement': {
      'banking': 'Cost-cutting - may affect banking relationship.',
      'insurance': 'Workforce reduction affects group coverage.',
      'real-estate': 'May lead to facility consolidation.',
      'recruitment': 'Talent pool available for placement.',
      'saas-sales': 'Budget constraints likely.',
    },
    'skill-trending': {
      'banking': 'N/A for banking.',
      'insurance': 'N/A for insurance.',
      'real-estate': 'N/A for real estate.',
      'recruitment': 'In-demand skills for candidate matching.',
      'saas-sales': 'Tech trends inform product positioning.',
    },
  };

  return descriptions[type]?.[vertical] || `${formatSignalTypeName(type)} detected.`;
}

// =============================================================================
// Factory Function
// =============================================================================

export function createSignalEngine(vertical: Vertical, subVertical: SubVertical): SignalEngine {
  return new SignalEngine(vertical, subVertical);
}

export default SignalEngine;
