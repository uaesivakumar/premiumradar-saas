'use client';

/**
 * Filter Bar Component
 *
 * Banking-specific filtering options for discovery view.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterBarProps {
  onFilterChange: (filters: DiscoveryFilters) => void;
  currentFilters: DiscoveryFilters;
}

export interface DiscoveryFilters {
  grades: ('A' | 'B' | 'C' | 'D' | 'F')[];
  minScore: number;
  maxScore: number;
  industries: string[];
  regions: string[];
  sizes: string[];
  bankingTiers: string[];
  digitalMaturity: string[];
  hasSignals: string[];
}

const gradeOptions = ['A', 'B', 'C', 'D', 'F'] as const;

const regionOptions = [
  { value: 'UAE', label: 'UAE' },
  { value: 'UAE-Dubai', label: 'UAE - Dubai' },
  { value: 'UAE-AbuDhabi', label: 'UAE - Abu Dhabi' },
  { value: 'KSA', label: 'Saudi Arabia' },
  { value: 'KSA-Riyadh', label: 'KSA - Riyadh' },
  { value: 'Qatar', label: 'Qatar' },
  { value: 'Bahrain', label: 'Bahrain' },
  { value: 'Kuwait', label: 'Kuwait' },
  { value: 'Oman', label: 'Oman' },
];

const bankingTierOptions = [
  { value: 'tier1', label: 'Tier 1 Banks' },
  { value: 'tier2', label: 'Tier 2 Banks' },
  { value: 'tier3', label: 'Tier 3 Banks' },
  { value: 'challenger', label: 'Challenger Banks' },
  { value: 'fintech', label: 'Fintechs' },
];

const digitalMaturityOptions = [
  { value: 'leader', label: 'Digital Leaders' },
  { value: 'fast-follower', label: 'Fast Followers' },
  { value: 'mainstream', label: 'Mainstream' },
  { value: 'laggard', label: 'Laggards' },
];

const signalTypeOptions = [
  { value: 'timing', label: 'Timing Signals' },
  { value: 'regulatory', label: 'Regulatory Pressure' },
  { value: 'leadership', label: 'Leadership Change' },
  { value: 'engagement', label: 'High Engagement' },
];

export function FilterBar({ onFilterChange, currentFilters }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGradeToggle = (grade: typeof gradeOptions[number]) => {
    const newGrades = currentFilters.grades.includes(grade)
      ? currentFilters.grades.filter((g) => g !== grade)
      : [...currentFilters.grades, grade];
    onFilterChange({ ...currentFilters, grades: newGrades });
  };

  const handleMultiSelect = (
    key: keyof DiscoveryFilters,
    value: string,
    currentValues: string[]
  ) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    onFilterChange({ ...currentFilters, [key]: newValues });
  };

  const activeFilterCount = [
    currentFilters.grades.length < 5 ? 1 : 0,
    currentFilters.regions.length > 0 ? 1 : 0,
    currentFilters.bankingTiers.length > 0 ? 1 : 0,
    currentFilters.digitalMaturity.length > 0 ? 1 : 0,
    currentFilters.hasSignals.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Quick Filters */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Grade Quick Filter */}
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500 mr-2">Grade:</span>
            {gradeOptions.map((grade) => (
              <button
                key={grade}
                onClick={() => handleGradeToggle(grade)}
                className={`
                  w-8 h-8 rounded-full text-sm font-bold transition-all
                  ${
                    currentFilters.grades.includes(grade)
                      ? grade === 'A'
                        ? 'bg-emerald-500 text-white'
                        : grade === 'B'
                          ? 'bg-blue-500 text-white'
                          : grade === 'C'
                            ? 'bg-yellow-500 text-white'
                            : grade === 'D'
                              ? 'bg-orange-500 text-white'
                              : 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                  }
                `}
              >
                {grade}
              </button>
            ))}
          </div>

          {/* Score Range */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Score:</span>
            <input
              type="number"
              min="0"
              max="100"
              value={currentFilters.minScore}
              onChange={(e) =>
                onFilterChange({ ...currentFilters, minScore: parseInt(e.target.value) || 0 })
              }
              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              min="0"
              max="100"
              value={currentFilters.maxScore}
              onChange={(e) =>
                onFilterChange({ ...currentFilters, maxScore: parseInt(e.target.value) || 100 })
              }
              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
          <span>More Filters</span>
          <motion.span animate={{ rotate: isExpanded ? 180 : 0 }}>▼</motion.span>
        </button>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-700"
          >
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Region Filter */}
              <FilterGroup
                title="Region"
                options={regionOptions}
                selected={currentFilters.regions}
                onChange={(value) =>
                  handleMultiSelect('regions', value, currentFilters.regions)
                }
              />

              {/* Banking Tier Filter */}
              <FilterGroup
                title="Banking Tier"
                options={bankingTierOptions}
                selected={currentFilters.bankingTiers}
                onChange={(value) =>
                  handleMultiSelect('bankingTiers', value, currentFilters.bankingTiers)
                }
              />

              {/* Digital Maturity Filter */}
              <FilterGroup
                title="Digital Maturity"
                options={digitalMaturityOptions}
                selected={currentFilters.digitalMaturity}
                onChange={(value) =>
                  handleMultiSelect('digitalMaturity', value, currentFilters.digitalMaturity)
                }
              />

              {/* Signal Type Filter */}
              <FilterGroup
                title="Has Signals"
                options={signalTypeOptions}
                selected={currentFilters.hasSignals}
                onChange={(value) =>
                  handleMultiSelect('hasSignals', value, currentFilters.hasSignals)
                }
              />
            </div>

            {/* Clear Filters */}
            <div className="px-4 pb-4">
              <button
                onClick={() =>
                  onFilterChange({
                    grades: ['A', 'B', 'C', 'D', 'F'],
                    minScore: 0,
                    maxScore: 100,
                    industries: [],
                    regions: [],
                    sizes: [],
                    bankingTiers: [],
                    digitalMaturity: [],
                    hasSignals: [],
                  })
                }
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FilterGroupProps {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (value: string) => void;
}

function FilterGroup({ title, options, selected, onChange }: FilterGroupProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 px-2 py-1 rounded"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onChange(option.value)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-600 dark:text-gray-400">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default FilterBar;
