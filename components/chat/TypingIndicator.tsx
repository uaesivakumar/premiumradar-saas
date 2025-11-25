'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

export function TypingIndicator() {
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  return (
    <div className="flex justify-start">
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-md"
        style={{
          backgroundColor: `${industryConfig.primaryColor}15`,
          borderLeft: `3px solid ${industryConfig.primaryColor}`,
        }}
      >
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: industryConfig.primaryColor }}
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
