/**
 * Vertical Registry
 *
 * Registry of supported industry verticals with their
 * configurations, keywords, and scoring overrides.
 */

import { create } from 'zustand';
import type { Vertical, VerticalStatus, VerticalCategory, VerticalStats } from './types';

// ============================================================
// DEFAULT VERTICALS
// ============================================================

export const DEFAULT_VERTICALS: Vertical[] = [
  {
    id: 'vert_tech',
    key: 'technology',
    name: 'Technology',
    description: 'Tech companies, SaaS, software, and hardware',
    status: 'active',
    icon: '💻',
    color: '#3B82F6',
    keywords: [
      'tech', 'software', 'app', 'cloud', 'ai', 'data', 'cyber', 'digital', 'smart',
      'code', 'dev', 'api', 'saas', 'platform', 'system', 'network', 'compute',
    ],
    excludedKeywords: ['vintage', 'antique', 'classic'],
    preferredTlds: ['.com', '.io', '.tech', '.ai', '.dev'],
    scoringOverrides: {
      modifiers: {
        premiumTldBonus: 15,
        shortLengthBonus: 20,
        keywordMatchBonus: 12,
        newTldPenalty: 0,
        hyphenPenalty: -15,
        numberPenalty: -5,
      },
    },
    displayOrder: 1,
    isDefault: true,
    showInNavigation: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-11-25'),
    createdBy: 'system',
  },
  {
    id: 'vert_finance',
    key: 'finance',
    name: 'Finance & Banking',
    description: 'Banks, fintech, insurance, and investment',
    status: 'active',
    icon: '🏦',
    color: '#10B981',
    keywords: [
      'bank', 'finance', 'money', 'pay', 'invest', 'capital', 'fund', 'wealth',
      'credit', 'loan', 'insure', 'trade', 'stock', 'crypto', 'wallet', 'fintech',
    ],
    excludedKeywords: ['scam', 'fraud', 'fake'],
    preferredTlds: ['.com', '.finance', '.bank', '.money'],
    scoringOverrides: {
      qualityWeights: {
        length: 0.2,
        memorability: 0.3,
        pronunciation: 0.2,
        typoResistance: 0.2,
        brandability: 0.1,
      },
      modifiers: {
        premiumTldBonus: 20,
        shortLengthBonus: 25,
        keywordMatchBonus: 15,
        newTldPenalty: -10,
        hyphenPenalty: -20,
        numberPenalty: -15,
      },
    },
    displayOrder: 2,
    isDefault: false,
    showInNavigation: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-11-25'),
    createdBy: 'system',
  },
  {
    id: 'vert_health',
    key: 'healthcare',
    name: 'Healthcare',
    description: 'Medical, health tech, pharma, and wellness',
    status: 'active',
    icon: '🏥',
    color: '#EF4444',
    keywords: [
      'health', 'medical', 'care', 'clinic', 'doctor', 'pharma', 'med', 'bio',
      'wellness', 'therapy', 'hospital', 'nurse', 'dental', 'fitness', 'mental',
    ],
    excludedKeywords: ['illegal', 'drug', 'abuse'],
    preferredTlds: ['.com', '.health', '.medical', '.care'],
    scoringOverrides: {
      modifiers: {
        premiumTldBonus: 18,
        shortLengthBonus: 15,
        keywordMatchBonus: 10,
        newTldPenalty: -8,
        hyphenPenalty: -12,
        numberPenalty: -10,
      },
    },
    displayOrder: 3,
    isDefault: false,
    showInNavigation: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-11-25'),
    createdBy: 'system',
  },
  {
    id: 'vert_ecommerce',
    key: 'ecommerce',
    name: 'E-Commerce',
    description: 'Online retail, marketplaces, and D2C brands',
    status: 'active',
    icon: '🛒',
    color: '#F59E0B',
    keywords: [
      'shop', 'store', 'buy', 'sell', 'market', 'deal', 'sale', 'cart',
      'retail', 'brand', 'goods', 'product', 'order', 'ship', 'express',
    ],
    excludedKeywords: ['counterfeit', 'fake', 'replica'],
    preferredTlds: ['.com', '.shop', '.store', '.market'],
    scoringOverrides: {
      modifiers: {
        premiumTldBonus: 12,
        shortLengthBonus: 18,
        keywordMatchBonus: 10,
        newTldPenalty: -3,
        hyphenPenalty: -10,
        numberPenalty: -8,
      },
    },
    displayOrder: 4,
    isDefault: false,
    showInNavigation: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-11-25'),
    createdBy: 'system',
  },
  {
    id: 'vert_realestate',
    key: 'realestate',
    name: 'Real Estate',
    description: 'Property, rentals, and real estate tech',
    status: 'active',
    icon: '🏠',
    color: '#8B5CF6',
    keywords: [
      'home', 'house', 'property', 'real', 'estate', 'rent', 'lease', 'land',
      'apartment', 'condo', 'realty', 'invest', 'mortgage', 'agent', 'broker',
    ],
    excludedKeywords: ['foreclosure', 'eviction'],
    preferredTlds: ['.com', '.realty', '.house', '.homes'],
    scoringOverrides: {
      modifiers: {
        premiumTldBonus: 15,
        shortLengthBonus: 12,
        keywordMatchBonus: 8,
        newTldPenalty: -5,
        hyphenPenalty: -8,
        numberPenalty: -3,
      },
    },
    displayOrder: 5,
    isDefault: false,
    showInNavigation: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-11-25'),
    createdBy: 'system',
  },
  {
    id: 'vert_crypto',
    key: 'crypto',
    name: 'Crypto & Web3',
    description: 'Cryptocurrency, blockchain, NFTs, and DeFi',
    status: 'active',
    icon: '🪙',
    color: '#EC4899',
    keywords: [
      'crypto', 'coin', 'token', 'chain', 'block', 'defi', 'nft', 'web3',
      'wallet', 'exchange', 'dao', 'meta', 'verse', 'mint', 'stake', 'yield',
    ],
    excludedKeywords: ['scam', 'pump', 'dump', 'rug'],
    preferredTlds: ['.com', '.io', '.xyz', '.eth'],
    scoringOverrides: {
      modifiers: {
        premiumTldBonus: 8,
        shortLengthBonus: 20,
        keywordMatchBonus: 15,
        newTldPenalty: 5,
        hyphenPenalty: -15,
        numberPenalty: 0,
      },
    },
    displayOrder: 6,
    isDefault: false,
    showInNavigation: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-11-25'),
    createdBy: 'system',
  },
  {
    id: 'vert_education',
    key: 'education',
    name: 'Education',
    description: 'EdTech, online learning, and academic',
    status: 'active',
    icon: '📚',
    color: '#6366F1',
    keywords: [
      'learn', 'edu', 'study', 'course', 'teach', 'school', 'academy', 'tutor',
      'class', 'skill', 'train', 'certify', 'degree', 'university', 'college',
    ],
    excludedKeywords: ['diploma mill', 'fake degree'],
    preferredTlds: ['.com', '.edu', '.academy', '.school'],
    scoringOverrides: {
      modifiers: {
        premiumTldBonus: 15,
        shortLengthBonus: 10,
        keywordMatchBonus: 12,
        newTldPenalty: -5,
        hyphenPenalty: -8,
        numberPenalty: -5,
      },
    },
    displayOrder: 7,
    isDefault: false,
    showInNavigation: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-11-25'),
    createdBy: 'system',
  },
  {
    id: 'vert_travel',
    key: 'travel',
    name: 'Travel & Hospitality',
    description: 'Travel, hotels, tourism, and experiences',
    status: 'beta',
    icon: '✈️',
    color: '#14B8A6',
    keywords: [
      'travel', 'trip', 'tour', 'hotel', 'stay', 'book', 'flight', 'vacation',
      'resort', 'destination', 'adventure', 'escape', 'explore', 'journey',
    ],
    excludedKeywords: [],
    preferredTlds: ['.com', '.travel', '.tours', '.holiday'],
    scoringOverrides: {},
    displayOrder: 8,
    isDefault: false,
    showInNavigation: true,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-11-25'),
    createdBy: 'system',
  },
];

// ============================================================
// VERTICAL CATEGORIES
// ============================================================

export const DEFAULT_CATEGORIES: VerticalCategory[] = [
  {
    id: 'cat_business',
    name: 'Business & Enterprise',
    description: 'B2B and enterprise verticals',
    verticals: ['vert_tech', 'vert_finance'],
    displayOrder: 1,
  },
  {
    id: 'cat_consumer',
    name: 'Consumer & Lifestyle',
    description: 'B2C and consumer verticals',
    verticals: ['vert_ecommerce', 'vert_health', 'vert_travel'],
    displayOrder: 2,
  },
  {
    id: 'cat_emerging',
    name: 'Emerging Markets',
    description: 'New and emerging verticals',
    verticals: ['vert_crypto', 'vert_education'],
    displayOrder: 3,
  },
];

// ============================================================
// VERTICAL REGISTRY STORE
// ============================================================

interface VerticalRegistryStore {
  verticals: Vertical[];
  categories: VerticalCategory[];
  isLoading: boolean;
  error: string | null;

  loadVerticals: () => Promise<void>;
  getVertical: (id: string) => Vertical | undefined;
  getVerticalByKey: (key: string) => Vertical | undefined;
  getActiveVerticals: () => Vertical[];
  createVertical: (vertical: Omit<Vertical, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Vertical>;
  updateVertical: (id: string, updates: Partial<Vertical>) => Promise<void>;
  deleteVertical: (id: string) => Promise<void>;
  setVerticalStatus: (id: string, status: VerticalStatus) => Promise<void>;
  reorderVerticals: (orderedIds: string[]) => Promise<void>;
}

export const useVerticalRegistryStore = create<VerticalRegistryStore>((set, get) => ({
  verticals: DEFAULT_VERTICALS,
  categories: DEFAULT_CATEGORIES,
  isLoading: false,
  error: null,

  loadVerticals: async () => {
    set({ isLoading: true, error: null });
    try {
      // In production, this would fetch from API
      await new Promise((resolve) => setTimeout(resolve, 100));
      set({ verticals: DEFAULT_VERTICALS, categories: DEFAULT_CATEGORIES, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load verticals', isLoading: false });
    }
  },

  getVertical: (id) => {
    return get().verticals.find((v) => v.id === id);
  },

  getVerticalByKey: (key) => {
    return get().verticals.find((v) => v.key === key);
  },

  getActiveVerticals: () => {
    return get()
      .verticals.filter((v) => v.status === 'active' || v.status === 'beta')
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },

  createVertical: async (verticalData) => {
    const { verticals } = get();

    const newVertical: Vertical = {
      ...verticalData,
      id: `vert_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set({ verticals: [...verticals, newVertical] });
    return newVertical;
  },

  updateVertical: async (id, updates) => {
    const { verticals } = get();

    set({
      verticals: verticals.map((v) =>
        v.id === id ? { ...v, ...updates, updatedAt: new Date() } : v
      ),
    });
  },

  deleteVertical: async (id) => {
    const { verticals } = get();
    set({ verticals: verticals.filter((v) => v.id !== id) });
  },

  setVerticalStatus: async (id, status) => {
    const { verticals } = get();

    set({
      verticals: verticals.map((v) =>
        v.id === id ? { ...v, status, updatedAt: new Date() } : v
      ),
    });
  },

  reorderVerticals: async (orderedIds) => {
    const { verticals } = get();

    const reordered = verticals.map((v) => ({
      ...v,
      displayOrder: orderedIds.indexOf(v.id) + 1,
    }));

    set({ verticals: reordered });
  },
}));

// ============================================================
// VERTICAL HELPERS
// ============================================================

/**
 * Get vertical status color
 */
export function getVerticalStatusColor(status: VerticalStatus): string {
  const colors: Record<VerticalStatus, string> = {
    active: 'green',
    beta: 'blue',
    deprecated: 'yellow',
    disabled: 'gray',
  };
  return colors[status];
}

/**
 * Get vertical status label
 */
export function getVerticalStatusLabel(status: VerticalStatus): string {
  const labels: Record<VerticalStatus, string> = {
    active: 'Active',
    beta: 'Beta',
    deprecated: 'Deprecated',
    disabled: 'Disabled',
  };
  return labels[status];
}

/**
 * Check if domain matches vertical keywords
 */
export function matchesVertical(domain: string, vertical: Vertical): boolean {
  const domainLower = domain.toLowerCase();

  // Check excluded keywords first
  for (const excluded of vertical.excludedKeywords) {
    if (domainLower.includes(excluded.toLowerCase())) {
      return false;
    }
  }

  // Check if any keyword matches
  for (const keyword of vertical.keywords) {
    if (domainLower.includes(keyword.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Find best matching vertical for a domain
 */
export function findBestVertical(domain: string, verticals: Vertical[]): Vertical | null {
  let bestMatch: Vertical | null = null;
  let bestScore = 0;

  for (const vertical of verticals) {
    if (vertical.status === 'disabled') continue;

    const domainLower = domain.toLowerCase();

    // Check excluded keywords
    let excluded = false;
    for (const keyword of vertical.excludedKeywords) {
      if (domainLower.includes(keyword.toLowerCase())) {
        excluded = true;
        break;
      }
    }
    if (excluded) continue;

    // Count matching keywords
    let score = 0;
    for (const keyword of vertical.keywords) {
      if (domainLower.includes(keyword.toLowerCase())) {
        score++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = vertical;
    }
  }

  return bestMatch;
}

/**
 * Get verticals by category
 */
export function getVerticalsByCategory(
  categoryId: string,
  verticals: Vertical[],
  categories: VerticalCategory[]
): Vertical[] {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return [];

  return verticals.filter((v) => category.verticals.includes(v.id));
}

/**
 * Generate mock vertical stats
 */
export function generateMockVerticalStats(verticalId: string): VerticalStats {
  return {
    verticalId,
    totalAnalyses: Math.floor(Math.random() * 10000),
    avgScore: Math.floor(Math.random() * 30) + 50,
    topKeywords: ['premium', 'business', 'global', 'pro', 'hub'].slice(0, 3),
    lastUsed: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
  };
}
