/**
 * Industry Store - Zustand store for vertical detection and morphing
 * Sprint 1: Industry Classifier + Vertical Morphing Engine
 */
import { create } from 'zustand';

export type Industry =
  | 'banking'
  | 'healthcare'
  | 'technology'
  | 'retail'
  | 'manufacturing'
  | 'realestate'
  | 'professional-services'
  | 'general';

export interface IndustryConfig {
  id: Industry;
  name: string;
  nameAr: string;
  primaryColor: string;
  secondaryColor: string;
  icon: string;
  tagline: string;
  taglineAr: string;
  features: string[];
}

export const INDUSTRY_CONFIGS: Record<Industry, IndustryConfig> = {
  banking: {
    id: 'banking',
    name: 'Banking & Finance',
    nameAr: 'البنوك والتمويل',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    icon: '🏦',
    tagline: 'AI-Powered Corporate Banking Intelligence',
    taglineAr: 'ذكاء الأعمال المصرفية المدعوم بالذكاء الاصطناعي',
    features: ['Corporate Lending', 'Trade Finance', 'Treasury Management'],
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    nameAr: 'الرعاية الصحية',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    icon: '🏥',
    tagline: 'Healthcare Provider Intelligence Platform',
    taglineAr: 'منصة استخبارات مقدمي الرعاية الصحية',
    features: ['Provider Networks', 'Payer Analysis', 'Clinical Partnerships'],
  },
  technology: {
    id: 'technology',
    name: 'Technology',
    nameAr: 'التكنولوجيا',
    primaryColor: '#7c3aed',
    secondaryColor: '#a78bfa',
    icon: '💻',
    tagline: 'Tech Sales Intelligence Accelerator',
    taglineAr: 'مسرّع استخبارات مبيعات التكنولوجيا',
    features: ['SaaS Prospects', 'Enterprise IT', 'Digital Transformation'],
  },
  retail: {
    id: 'retail',
    name: 'Retail & E-Commerce',
    nameAr: 'التجزئة والتجارة الإلكترونية',
    primaryColor: '#dc2626',
    secondaryColor: '#f87171',
    icon: '🛒',
    tagline: 'Retail Partnership Discovery Engine',
    taglineAr: 'محرك اكتشاف شراكات التجزئة',
    features: ['Merchant Networks', 'Supplier Analysis', 'Franchise Opportunities'],
  },
  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing',
    nameAr: 'التصنيع',
    primaryColor: '#d97706',
    secondaryColor: '#fbbf24',
    icon: '🏭',
    tagline: 'Industrial Sales Intelligence',
    taglineAr: 'استخبارات المبيعات الصناعية',
    features: ['Supply Chain', 'OEM Partners', 'Industrial Buyers'],
  },
  realestate: {
    id: 'realestate',
    name: 'Real Estate',
    nameAr: 'العقارات',
    primaryColor: '#0891b2',
    secondaryColor: '#22d3ee',
    icon: '🏢',
    tagline: 'Property & Development Intelligence',
    taglineAr: 'استخبارات العقارات والتطوير',
    features: ['Developer Tracking', 'Investment Analysis', 'Tenant Intelligence'],
  },
  'professional-services': {
    id: 'professional-services',
    name: 'Professional Services',
    nameAr: 'الخدمات المهنية',
    primaryColor: '#4f46e5',
    secondaryColor: '#818cf8',
    icon: '💼',
    tagline: 'Professional Services Growth Platform',
    taglineAr: 'منصة نمو الخدمات المهنية',
    features: ['Client Acquisition', 'Partnership Mapping', 'Market Expansion'],
  },
  general: {
    id: 'general',
    name: 'All Industries',
    nameAr: 'جميع الصناعات',
    primaryColor: '#3b82f6',
    secondaryColor: '#60a5fa',
    icon: '🌐',
    tagline: 'AI-Powered Sales Intelligence Platform',
    taglineAr: 'منصة استخبارات المبيعات المدعومة بالذكاء الاصطناعي',
    features: ['Smart Discovery', 'Intelligent Scoring', 'AI Assistant'],
  },
};

interface IndustryState {
  detectedIndustry: Industry;
  selectedIndustry: Industry;
  confidence: number;
  isDetecting: boolean;
  userInputs: string[];

  // Actions
  setDetectedIndustry: (industry: Industry, confidence: number) => void;
  setSelectedIndustry: (industry: Industry) => void;
  addUserInput: (input: string) => void;
  detectFromInput: (input: string) => Promise<void>;
  reset: () => void;
}

// Industry keywords for client-side detection (fast path)
const INDUSTRY_KEYWORDS: Record<Industry, string[]> = {
  banking: ['bank', 'finance', 'loan', 'credit', 'treasury', 'lending', 'mortgage', 'investment'],
  healthcare: ['hospital', 'clinic', 'medical', 'health', 'patient', 'doctor', 'pharma', 'healthcare'],
  technology: ['software', 'saas', 'tech', 'digital', 'cloud', 'ai', 'data', 'startup', 'app'],
  retail: ['retail', 'store', 'shop', 'ecommerce', 'merchant', 'consumer', 'brand'],
  manufacturing: ['manufacturing', 'factory', 'industrial', 'production', 'supply chain', 'oem'],
  realestate: ['real estate', 'property', 'developer', 'construction', 'building', 'tenant'],
  'professional-services': ['consulting', 'legal', 'accounting', 'advisory', 'professional'],
  general: [],
};

function detectIndustryFromKeywords(input: string): { industry: Industry; confidence: number } {
  const lowerInput = input.toLowerCase();
  let bestMatch: Industry = 'general';
  let bestScore = 0;

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (industry === 'general') continue;

    let score = 0;
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = industry as Industry;
    }
  }

  const confidence = bestScore > 0 ? Math.min(0.3 + (bestScore * 0.15), 0.9) : 0.1;
  return { industry: bestMatch, confidence };
}

export const useIndustryStore = create<IndustryState>((set, get) => ({
  detectedIndustry: 'general',
  selectedIndustry: 'general',
  confidence: 0,
  isDetecting: false,
  userInputs: [],

  setDetectedIndustry: (industry, confidence) => {
    set({ detectedIndustry: industry, confidence });
  },

  setSelectedIndustry: (industry) => {
    set({ selectedIndustry: industry });
  },

  addUserInput: (input) => {
    set((state) => ({ userInputs: [...state.userInputs, input] }));
  },

  detectFromInput: async (input) => {
    set({ isDetecting: true });

    // Fast path: keyword detection
    const { industry, confidence } = detectIndustryFromKeywords(input);

    if (confidence > 0.5) {
      set({
        detectedIndustry: industry,
        confidence,
        isDetecting: false,
        userInputs: [...get().userInputs, input],
      });
      return;
    }

    // Slow path: LLM detection (would call API)
    // For now, use keyword detection result
    set({
      detectedIndustry: industry,
      confidence: Math.max(confidence, 0.3),
      isDetecting: false,
      userInputs: [...get().userInputs, input],
    });
  },

  reset: () => {
    set({
      detectedIndustry: 'general',
      selectedIndustry: 'general',
      confidence: 0,
      isDetecting: false,
      userInputs: [],
    });
  },
}));

export const getIndustryConfig = (industry: Industry): IndustryConfig => {
  return INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS.general;
};
