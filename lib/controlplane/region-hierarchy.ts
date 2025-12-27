/**
 * Region Hierarchy - Control Plane v2.0 Governance
 *
 * Defines the canonical region hierarchy for persona scoping.
 * No free-text region codes allowed - must be from this hierarchy.
 *
 * Resolution rule: Longest match wins (LOCAL → REGIONAL → GLOBAL)
 */

export interface RegionNode {
  code: string;
  name: string;
  level: 'GLOBAL' | 'REGIONAL' | 'LOCAL';
  children?: RegionNode[];
}

/**
 * Canonical Region Hierarchy
 * GLOBAL is the root, REGIONAL are continent/macro regions, LOCAL are countries/territories
 */
export const REGION_HIERARCHY: RegionNode = {
  code: 'GLOBAL',
  name: 'Global (All Regions)',
  level: 'GLOBAL',
  children: [
    {
      code: 'EMEA',
      name: 'Europe, Middle East & Africa',
      level: 'REGIONAL',
      children: [
        { code: 'UAE', name: 'United Arab Emirates', level: 'LOCAL' },
        { code: 'SA', name: 'Saudi Arabia', level: 'LOCAL' },
        { code: 'EG', name: 'Egypt', level: 'LOCAL' },
        { code: 'UK', name: 'United Kingdom', level: 'LOCAL' },
        { code: 'DE', name: 'Germany', level: 'LOCAL' },
      ],
    },
    {
      code: 'APAC',
      name: 'Asia Pacific',
      level: 'REGIONAL',
      children: [
        { code: 'IN', name: 'India', level: 'LOCAL' },
        { code: 'SG', name: 'Singapore', level: 'LOCAL' },
        { code: 'AU', name: 'Australia', level: 'LOCAL' },
        { code: 'JP', name: 'Japan', level: 'LOCAL' },
      ],
    },
    {
      code: 'AMER',
      name: 'Americas',
      level: 'REGIONAL',
      children: [
        { code: 'US', name: 'United States', level: 'LOCAL' },
        { code: 'US-CA', name: 'California, USA', level: 'LOCAL' },
        { code: 'US-NY', name: 'New York, USA', level: 'LOCAL' },
        { code: 'US-TX', name: 'Texas, USA', level: 'LOCAL' },
        { code: 'CA', name: 'Canada', level: 'LOCAL' },
        { code: 'BR', name: 'Brazil', level: 'LOCAL' },
        { code: 'MX', name: 'Mexico', level: 'LOCAL' },
      ],
    },
  ],
};

/**
 * Get all regions at a specific level
 */
export function getRegionsByLevel(level: 'GLOBAL' | 'REGIONAL' | 'LOCAL'): RegionNode[] {
  const result: RegionNode[] = [];

  function traverse(node: RegionNode) {
    if (node.level === level) {
      result.push(node);
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(REGION_HIERARCHY);
  return result;
}

/**
 * Get all valid region codes (flat list)
 */
export function getAllRegionCodes(): string[] {
  const codes: string[] = [];

  function traverse(node: RegionNode) {
    codes.push(node.code);
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(REGION_HIERARCHY);
  return codes;
}

/**
 * Validate a region code exists in the hierarchy
 */
export function isValidRegionCode(code: string): boolean {
  return getAllRegionCodes().includes(code);
}

/**
 * Get a region node by code
 */
export function getRegionByCode(code: string): RegionNode | null {
  function traverse(node: RegionNode): RegionNode | null {
    if (node.code === code) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = traverse(child);
        if (found) return found;
      }
    }
    return null;
  }

  return traverse(REGION_HIERARCHY);
}

/**
 * Validate region code matches required scope level
 * - GLOBAL scope: code must be null or 'GLOBAL'
 * - REGIONAL scope: code must be a REGIONAL level region
 * - LOCAL scope: code must be a LOCAL level region
 */
export function validateRegionForScope(
  scope: 'GLOBAL' | 'REGIONAL' | 'LOCAL',
  regionCode: string | null
): { valid: boolean; error?: string } {
  if (scope === 'GLOBAL') {
    if (regionCode && regionCode !== 'GLOBAL') {
      return { valid: false, error: 'GLOBAL scope cannot have a region code' };
    }
    return { valid: true };
  }

  if (!regionCode) {
    return { valid: false, error: `${scope} scope requires a region code` };
  }

  const region = getRegionByCode(regionCode);
  if (!region) {
    return { valid: false, error: `Unknown region code: ${regionCode}` };
  }

  if (scope === 'REGIONAL' && region.level !== 'REGIONAL') {
    return {
      valid: false,
      error: `REGIONAL scope requires a regional-level region (e.g., EMEA, APAC). Got: ${regionCode} (${region.level})`,
    };
  }

  if (scope === 'LOCAL' && region.level !== 'LOCAL') {
    return {
      valid: false,
      error: `LOCAL scope requires a local-level region (e.g., UAE, US). Got: ${regionCode} (${region.level})`,
    };
  }

  return { valid: true };
}

/**
 * Get regions valid for a specific scope (for dropdown)
 */
export function getRegionsForScope(scope: 'GLOBAL' | 'REGIONAL' | 'LOCAL'): RegionNode[] {
  if (scope === 'GLOBAL') {
    return []; // No region selection for GLOBAL
  }
  return getRegionsByLevel(scope);
}
