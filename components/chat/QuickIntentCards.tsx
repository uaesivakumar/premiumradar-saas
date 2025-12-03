'use client';

/**
 * QuickIntentCards - Sprint P2
 * P2 VERTICALISATION: Now uses dynamic prompts based on sales context vertical.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';
import { useLocaleStore } from '@/lib/stores/locale-store';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';
import { getExamplePromptsForVertical } from '@/lib/vertical';

interface QuickIntentCardsProps {
  onSelect: (prompt: string) => void;
}

export function QuickIntentCards({ onSelect }: QuickIntentCardsProps) {
  const { detectedIndustry } = useIndustryStore();
  const { locale } = useLocaleStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  // P2 VERTICALISATION: Get vertical from sales context instead of industry
  const vertical = useSalesContextStore(selectVertical);
  const prompts = getExamplePromptsForVertical(vertical, locale as 'en' | 'ar');

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {prompts.map((prompt, index) => (
        <motion.button
          key={prompt}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelect(prompt)}
          className="px-4 py-2 text-sm rounded-full border transition-all hover:scale-105"
          style={{
            borderColor: industryConfig.primaryColor,
            color: industryConfig.primaryColor,
            backgroundColor: `${industryConfig.primaryColor}10`,
          }}
        >
          {prompt}
        </motion.button>
      ))}
    </div>
  );
}
