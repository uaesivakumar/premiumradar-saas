'use client';

/**
 * Discovery Object - Sprint S27
 * AI-generated company discovery results card
 */

import { motion } from 'framer-motion';
import {
  Building2,
  TrendingUp,
  MapPin,
  Users,
  ExternalLink,
  Plus,
  Star,
} from 'lucide-react';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

interface Company {
  name: string;
  industry: string;
  subIndustry?: string;
  country: string;
  score: number;
  signal: string;
  employees?: string;
  website?: string;
}

interface DiscoveryObjectProps {
  companies: Company[];
  query: string;
  totalResults: number;
  onCompanySelect?: (company: Company) => void;
  onAddToList?: (company: Company) => void;
}

export function DiscoveryObject({
  companies,
  query,
  totalResults,
  onCompanySelect,
  onAddToList,
}: DiscoveryObjectProps) {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  return (
    <div className="space-y-4">
      {/* Query Context */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {companies.length} of {totalResults} results
        </p>
        <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          View all results
        </button>
      </div>

      {/* Company Cards */}
      <div className="space-y-3">
        {companies.map((company, i) => (
          <motion.div
            key={company.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onCompanySelect?.(company)}
            className="group relative p-4 bg-slate-900/50 hover:bg-slate-800/70 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between">
              {/* Company Info */}
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{
                    backgroundColor: `${industryConfig.primaryColor}20`,
                    color: industryConfig.primaryColor,
                  }}
                >
                  {company.name.charAt(0)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white truncate">
                      {company.name}
                    </h4>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {company.industry}
                      {company.subIndustry && ` · ${company.subIndustry}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {company.country}
                    </span>
                    {company.employees && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {company.employees}
                      </span>
                    )}
                  </div>

                  {/* Signal Badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300">
                      <TrendingUp className="w-3 h-3" />
                      {company.signal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score & Actions */}
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{company.score}</div>
                  <div className="text-xs text-gray-500">Q/T/L/E</div>
                </div>

                {/* Action Buttons (visible on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToList?.(company);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                    title="Add to list"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 transition-all"
                    title="Star"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Score Bar */}
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${company.score}%` }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default DiscoveryObject;
