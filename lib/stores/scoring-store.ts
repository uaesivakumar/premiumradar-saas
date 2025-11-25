/**
 * Scoring Store
 *
 * Zustand store for Q/T/L/E scoring state management
 */

import { create } from 'zustand';
import type { QTLEScore, CompanyProfile, BankingCompanyProfile } from '../scoring/types';

interface ScoringState {
  // Current company being viewed
  selectedCompany: CompanyProfile | BankingCompanyProfile | null;
  selectedScore: QTLEScore | null;

  // Company list with scores
  companies: (CompanyProfile | BankingCompanyProfile)[];
  scores: Map<string, QTLEScore>;

  // Filters
  filters: {
    minScore: number;
    maxScore: number;
    grades: ('A' | 'B' | 'C' | 'D' | 'F')[];
    industries: string[];
    regions: string[];
  };

  // Sort
  sortBy: 'composite' | 'quality' | 'timing' | 'likelihood' | 'engagement' | 'name';
  sortDirection: 'asc' | 'desc';

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedCompany: (company: CompanyProfile | BankingCompanyProfile | null) => void;
  setSelectedScore: (score: QTLEScore | null) => void;
  setCompanies: (companies: (CompanyProfile | BankingCompanyProfile)[]) => void;
  updateScore: (companyId: string, score: QTLEScore) => void;
  setFilters: (filters: Partial<ScoringState['filters']>) => void;
  setSortBy: (sortBy: ScoringState['sortBy']) => void;
  setSortDirection: (direction: ScoringState['sortDirection']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSelection: () => void;
  reset: () => void;
}

const initialFilters = {
  minScore: 0,
  maxScore: 100,
  grades: ['A', 'B', 'C', 'D', 'F'] as ('A' | 'B' | 'C' | 'D' | 'F')[],
  industries: [],
  regions: [],
};

export const useScoringStore = create<ScoringState>((set) => ({
  selectedCompany: null,
  selectedScore: null,
  companies: [],
  scores: new Map(),
  filters: initialFilters,
  sortBy: 'composite',
  sortDirection: 'desc',
  isLoading: false,
  error: null,

  setSelectedCompany: (company) =>
    set((state) => ({
      selectedCompany: company,
      selectedScore: company ? state.scores.get(company.id) || null : null,
    })),

  setSelectedScore: (score) => set({ selectedScore: score }),

  setCompanies: (companies) => set({ companies }),

  updateScore: (companyId, score) =>
    set((state) => {
      const newScores = new Map(state.scores);
      newScores.set(companyId, score);
      return { scores: newScores };
    }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setSortBy: (sortBy) => set({ sortBy }),

  setSortDirection: (direction) => set({ sortDirection: direction }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearSelection: () => set({ selectedCompany: null, selectedScore: null }),

  reset: () =>
    set({
      selectedCompany: null,
      selectedScore: null,
      companies: [],
      scores: new Map(),
      filters: initialFilters,
      sortBy: 'composite',
      sortDirection: 'desc',
      isLoading: false,
      error: null,
    }),
}));

// Selectors
export const selectFilteredCompanies = (state: ScoringState) => {
  const { companies, scores, filters, sortBy, sortDirection } = state;

  let filtered = companies.filter((company) => {
    const score = scores.get(company.id);
    if (!score) return true;

    // Score range filter
    if (score.composite < filters.minScore || score.composite > filters.maxScore) {
      return false;
    }

    // Grade filter
    if (filters.grades.length > 0 && !filters.grades.includes(score.grade)) {
      return false;
    }

    // Industry filter
    if (filters.industries.length > 0 && !filters.industries.includes(company.industry)) {
      return false;
    }

    // Region filter
    if (filters.regions.length > 0 && !filters.regions.includes(company.region)) {
      return false;
    }

    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    const scoreA = scores.get(a.id);
    const scoreB = scores.get(b.id);

    let comparison = 0;

    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (scoreA && scoreB) {
      comparison = scoreA[sortBy] - scoreB[sortBy];
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return filtered;
};
