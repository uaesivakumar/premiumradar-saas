/**
 * Beta Access Code System - Sprint S133
 *
 * Access codes resolve to:
 * - Vertical
 * - Sub-vertical
 * - Region
 * - Tenant (optional)
 * - Default pack template
 * - Persona configuration
 */

import type { Vertical, SubVertical } from '@/lib/intelligence/context/types';

// =============================================================================
// Types
// =============================================================================

export interface BetaAccessCode {
  code: string;
  type: 'founder' | 'beta' | 'enterprise' | 'partner' | 'demo';

  // Segmentation
  vertical: Vertical;
  subVertical: SubVertical;
  region: string;
  territory?: string;

  // Tenant/Organization binding
  tenantId?: string;
  tenantName?: string;

  // Pack & Persona
  packTemplate: string;
  personaId: string;

  // Limits
  maxUses?: number;
  expiresAt?: Date;

  // Metadata
  description: string;
  createdBy: string;
  createdAt: Date;
}

export interface AccessCodeResolution {
  valid: boolean;
  code: string;
  message: string;

  // Resolved values (if valid)
  vertical?: Vertical;
  subVertical?: SubVertical;
  region?: string;
  territory?: string;
  tenantId?: string;
  tenantName?: string;
  packTemplate?: string;
  personaId?: string;
  type?: 'founder' | 'beta' | 'enterprise' | 'partner' | 'demo';
}

// =============================================================================
// Predefined Access Codes (Founder/Demo Codes)
// =============================================================================

export const FOUNDER_CODES: Record<string, BetaAccessCode> = {
  // Universal founder access
  'SIVA2025': {
    code: 'SIVA2025',
    type: 'founder',
    vertical: 'banking',
    subVertical: 'employee-banking',
    region: 'UAE',
    territory: 'Dubai',
    packTemplate: 'eb-full-access',
    personaId: 'founder-unlimited',
    description: 'Founder universal access',
    createdBy: 'system',
    createdAt: new Date('2025-01-01'),
  },
  'FOUNDER-ACCESS': {
    code: 'FOUNDER-ACCESS',
    type: 'founder',
    vertical: 'banking',
    subVertical: 'employee-banking',
    region: 'UAE',
    territory: 'Dubai',
    packTemplate: 'eb-full-access',
    personaId: 'founder-unlimited',
    description: 'Founder access code',
    createdBy: 'system',
    createdAt: new Date('2025-01-01'),
  },
  'PREMIUM-BETA': {
    code: 'PREMIUM-BETA',
    type: 'founder',
    vertical: 'banking',
    subVertical: 'employee-banking',
    region: 'UAE',
    packTemplate: 'eb-full-access',
    personaId: 'founder-unlimited',
    description: 'Premium beta access',
    createdBy: 'system',
    createdAt: new Date('2025-01-01'),
  },
};

// =============================================================================
// Banking Vertical Codes
// =============================================================================

export const BANKING_CODES: Record<string, BetaAccessCode> = {
  // Employee Banking - UAE
  'ENBD-EB-UAE': {
    code: 'ENBD-EB-UAE',
    type: 'enterprise',
    vertical: 'banking',
    subVertical: 'employee-banking',
    region: 'UAE',
    territory: 'Dubai',
    tenantName: 'Emirates NBD',
    packTemplate: 'eb-uae-enterprise',
    personaId: 'eb-relationship-manager',
    description: 'Emirates NBD Employee Banking',
    createdBy: 'sales',
    createdAt: new Date(),
  },
  'ADCB-EB-UAE': {
    code: 'ADCB-EB-UAE',
    type: 'enterprise',
    vertical: 'banking',
    subVertical: 'employee-banking',
    region: 'UAE',
    territory: 'Abu Dhabi',
    tenantName: 'ADCB',
    packTemplate: 'eb-uae-enterprise',
    personaId: 'eb-relationship-manager',
    description: 'ADCB Employee Banking',
    createdBy: 'sales',
    createdAt: new Date(),
  },
  'EB-UAE-BETA': {
    code: 'EB-UAE-BETA',
    type: 'beta',
    vertical: 'banking',
    subVertical: 'employee-banking',
    region: 'UAE',
    packTemplate: 'eb-uae-starter',
    personaId: 'eb-sales-rep',
    description: 'Employee Banking UAE Beta',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 100,
  },

  // Corporate Banking
  'CB-UAE-BETA': {
    code: 'CB-UAE-BETA',
    type: 'beta',
    vertical: 'banking',
    subVertical: 'corporate-banking',
    region: 'UAE',
    packTemplate: 'cb-uae-starter',
    personaId: 'cb-relationship-manager',
    description: 'Corporate Banking UAE Beta',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 50,
  },

  // SME Banking
  'SME-UAE-R1': {
    code: 'SME-UAE-R1',
    type: 'beta',
    vertical: 'banking',
    subVertical: 'sme-banking',
    region: 'UAE',
    packTemplate: 'sme-uae-starter',
    personaId: 'sme-account-manager',
    description: 'SME Banking UAE Round 1',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 75,
  },
};

// =============================================================================
// Recruitment Vertical Codes
// =============================================================================

export const RECRUITMENT_CODES: Record<string, BetaAccessCode> = {
  'REC-TECH-UAE': {
    code: 'REC-TECH-UAE',
    type: 'beta',
    vertical: 'recruitment',
    subVertical: 'tech-recruitment',
    region: 'UAE',
    packTemplate: 'tech-recruitment-uae',
    personaId: 'tech-recruiter',
    description: 'Tech Recruitment UAE',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 50,
  },
  'REC-EXEC-UAE': {
    code: 'REC-EXEC-UAE',
    type: 'beta',
    vertical: 'recruitment',
    subVertical: 'executive-search',
    region: 'UAE',
    packTemplate: 'exec-search-uae',
    personaId: 'executive-recruiter',
    description: 'Executive Search UAE',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 25,
  },
};

// =============================================================================
// Real Estate Vertical Codes
// =============================================================================

export const REAL_ESTATE_CODES: Record<string, BetaAccessCode> = {
  'RE-DUBAI-2025': {
    code: 'RE-DUBAI-2025',
    type: 'beta',
    vertical: 'real-estate',
    subVertical: 'residential-sales',
    region: 'UAE',
    territory: 'Dubai',
    packTemplate: 're-dubai-residential',
    personaId: 're-property-consultant',
    description: 'Real Estate Dubai 2025',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 50,
  },
  'RE-ABU-2025': {
    code: 'RE-ABU-2025',
    type: 'beta',
    vertical: 'real-estate',
    subVertical: 'residential-sales',
    region: 'UAE',
    territory: 'Abu Dhabi',
    packTemplate: 're-abudhabi-residential',
    personaId: 're-property-consultant',
    description: 'Real Estate Abu Dhabi 2025',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 50,
  },
  'RE-COMMERCIAL-UAE': {
    code: 'RE-COMMERCIAL-UAE',
    type: 'beta',
    vertical: 'real-estate',
    subVertical: 'commercial-leasing',
    region: 'UAE',
    packTemplate: 're-commercial-uae',
    personaId: 're-commercial-advisor',
    description: 'Commercial Real Estate UAE',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 30,
  },
};

// =============================================================================
// Insurance Vertical Codes
// =============================================================================

export const INSURANCE_CODES: Record<string, BetaAccessCode> = {
  'INS-CORP-UAE': {
    code: 'INS-CORP-UAE',
    type: 'beta',
    vertical: 'insurance',
    subVertical: 'commercial-insurance',
    region: 'UAE',
    packTemplate: 'ins-corporate-uae',
    personaId: 'ins-account-executive',
    description: 'Corporate Insurance UAE',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 40,
  },
  'INS-HEALTH-UAE': {
    code: 'INS-HEALTH-UAE',
    type: 'beta',
    vertical: 'insurance',
    subVertical: 'health-insurance',
    region: 'UAE',
    packTemplate: 'ins-health-uae',
    personaId: 'ins-health-advisor',
    description: 'Health Insurance UAE',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 40,
  },
};

// =============================================================================
// SaaS Sales Vertical Codes
// =============================================================================

export const SAAS_CODES: Record<string, BetaAccessCode> = {
  'SAAS-ENT-UAE': {
    code: 'SAAS-ENT-UAE',
    type: 'beta',
    vertical: 'saas-sales',
    subVertical: 'enterprise-sales',
    region: 'UAE',
    packTemplate: 'saas-enterprise-uae',
    personaId: 'saas-ae',
    description: 'SaaS Enterprise Sales UAE',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 50,
  },
  'SAAS-SMB-UAE': {
    code: 'SAAS-SMB-UAE',
    type: 'beta',
    vertical: 'saas-sales',
    subVertical: 'smb-sales',
    region: 'UAE',
    packTemplate: 'saas-smb-uae',
    personaId: 'saas-sdr',
    description: 'SaaS SMB Sales UAE',
    createdBy: 'marketing',
    createdAt: new Date(),
    maxUses: 75,
  },
};

// =============================================================================
// Demo Codes (Time-limited, for presentations)
// =============================================================================

export const DEMO_CODES: Record<string, BetaAccessCode> = {
  'DEMO-EB-LIVE': {
    code: 'DEMO-EB-LIVE',
    type: 'demo',
    vertical: 'banking',
    subVertical: 'employee-banking',
    region: 'UAE',
    territory: 'Dubai',
    packTemplate: 'eb-demo-full',
    personaId: 'demo-unlimited',
    description: 'Live demo - Employee Banking',
    createdBy: 'demo',
    createdAt: new Date(),
    maxUses: 5,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  'DEMO-MULTI-VERTICAL': {
    code: 'DEMO-MULTI-VERTICAL',
    type: 'demo',
    vertical: 'banking', // Start with banking, can switch
    subVertical: 'employee-banking',
    region: 'UAE',
    packTemplate: 'demo-multi-vertical',
    personaId: 'demo-unlimited',
    description: 'Multi-vertical demo',
    createdBy: 'demo',
    createdAt: new Date(),
    maxUses: 10,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
  },
};

// =============================================================================
// Combined Code Registry
// =============================================================================

export const ALL_CODES: Record<string, BetaAccessCode> = {
  ...FOUNDER_CODES,
  ...BANKING_CODES,
  ...RECRUITMENT_CODES,
  ...REAL_ESTATE_CODES,
  ...INSURANCE_CODES,
  ...SAAS_CODES,
  ...DEMO_CODES,
};

// =============================================================================
// Code Resolution
// =============================================================================

export function resolveAccessCode(code: string): AccessCodeResolution {
  const normalizedCode = code.toUpperCase().trim();

  // Check predefined codes
  const predefinedCode = ALL_CODES[normalizedCode];
  if (predefinedCode) {
    // Check expiry
    if (predefinedCode.expiresAt && new Date() > predefinedCode.expiresAt) {
      return {
        valid: false,
        code: normalizedCode,
        message: 'This access code has expired',
      };
    }

    return {
      valid: true,
      code: normalizedCode,
      message: predefinedCode.description,
      vertical: predefinedCode.vertical,
      subVertical: predefinedCode.subVertical,
      region: predefinedCode.region,
      territory: predefinedCode.territory,
      tenantId: predefinedCode.tenantId,
      tenantName: predefinedCode.tenantName,
      packTemplate: predefinedCode.packTemplate,
      personaId: predefinedCode.personaId,
      type: predefinedCode.type,
    };
  }

  // Try to parse structured codes (VERTICAL-SUBVERT-REGION format)
  const parsedCode = parseStructuredCode(normalizedCode);
  if (parsedCode) {
    return parsedCode;
  }

  return {
    valid: false,
    code: normalizedCode,
    message: 'Invalid access code',
  };
}

// =============================================================================
// Structured Code Parser
// =============================================================================

function parseStructuredCode(code: string): AccessCodeResolution | null {
  // Pattern: VERTICAL-SUBVERTICAL-REGION
  // Examples: BANKING-EB-UAE, REC-TECH-DUBAI, RE-RES-ABUDHABI

  const parts = code.split('-');
  if (parts.length < 3) return null;

  const verticalMap: Record<string, Vertical> = {
    'BANKING': 'banking',
    'BANK': 'banking',
    'REC': 'recruitment',
    'RECRUIT': 'recruitment',
    'RE': 'real-estate',
    'REALESTATE': 'real-estate',
    'INS': 'insurance',
    'INSURANCE': 'insurance',
    'SAAS': 'saas-sales',
  };

  const subVerticalMap: Record<string, Record<string, SubVertical>> = {
    'banking': {
      'EB': 'employee-banking',
      'CB': 'corporate-banking',
      'SME': 'sme-banking',
      'RETAIL': 'retail-banking',
      'WEALTH': 'wealth-management',
    },
    'recruitment': {
      'TECH': 'tech-recruitment',
      'EXEC': 'executive-search',
      'MASS': 'mass-recruitment',
    },
    'real-estate': {
      'RES': 'residential-sales',
      'COM': 'commercial-leasing',
      'PM': 'property-management',
    },
    'insurance': {
      'LIFE': 'life-insurance',
      'GROUP': 'group-insurance',
      'HEALTH': 'health-insurance',
      'CORP': 'commercial-insurance',
    },
    'saas-sales': {
      'ENT': 'enterprise-sales',
      'MID': 'mid-market-sales',
      'SMB': 'smb-sales',
    },
  };

  const [verticalPart, subVertPart, regionPart] = parts;

  const vertical = verticalMap[verticalPart];
  if (!vertical) return null;

  const subVertical = subVerticalMap[vertical]?.[subVertPart];
  if (!subVertical) return null;

  // Valid structured code
  return {
    valid: true,
    code,
    message: `${vertical} - ${subVertical} - ${regionPart}`,
    vertical,
    subVertical,
    region: regionPart,
    packTemplate: `${vertical}-${subVertical}-default`,
    personaId: `${vertical}-default`,
    type: 'beta',
  };
}

// =============================================================================
// Code Validation for Database
// =============================================================================

export interface DatabaseCodeResult {
  found: boolean;
  code: BetaAccessCode | null;
  usageCount: number;
  remainingUses: number | null;
}

// This will be called by the API route to check database codes
export async function validateCodeFromDatabase(
  code: string,
  _pool: unknown // Database pool
): Promise<DatabaseCodeResult> {
  // First check predefined codes
  const predefined = ALL_CODES[code.toUpperCase()];
  if (predefined) {
    return {
      found: true,
      code: predefined,
      usageCount: 0, // Predefined codes don't track usage in memory
      remainingUses: predefined.maxUses || null,
    };
  }

  // TODO: Implement database lookup when beta_access_codes table exists
  // const result = await pool.query(
  //   'SELECT * FROM beta_access_codes WHERE code = $1',
  //   [code.toUpperCase()]
  // );

  return {
    found: false,
    code: null,
    usageCount: 0,
    remainingUses: null,
  };
}

// =============================================================================
// Generate New Code
// =============================================================================

export function generateAccessCode(params: {
  vertical: Vertical;
  subVertical: SubVertical;
  region: string;
  type: 'beta' | 'enterprise' | 'partner' | 'demo';
  tenantName?: string;
}): string {
  const verticalPrefix: Record<Vertical, string> = {
    'banking': 'BNK',
    'insurance': 'INS',
    'real-estate': 'RE',
    'recruitment': 'REC',
    'saas-sales': 'SAAS',
  };

  const subVertPrefix: Record<SubVertical, string> = {
    // Banking
    'employee-banking': 'EB',
    'corporate-banking': 'CB',
    'sme-banking': 'SME',
    'retail-banking': 'RETAIL',
    'wealth-management': 'WEALTH',
    // Insurance
    'life-insurance': 'LIFE',
    'group-insurance': 'GROUP',
    'health-insurance': 'HEALTH',
    'commercial-insurance': 'CORP',
    // Real Estate
    'residential-sales': 'RES',
    'commercial-leasing': 'COM',
    'property-management': 'PM',
    // Recruitment
    'executive-search': 'EXEC',
    'tech-recruitment': 'TECH',
    'mass-recruitment': 'MASS',
    // SaaS
    'enterprise-sales': 'ENT',
    'mid-market-sales': 'MID',
    'smb-sales': 'SMB',
  };

  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${verticalPrefix[params.vertical]}-${subVertPrefix[params.subVertical]}-${params.region.toUpperCase().substring(0, 3)}-${randomSuffix}`;
}

export default resolveAccessCode;
