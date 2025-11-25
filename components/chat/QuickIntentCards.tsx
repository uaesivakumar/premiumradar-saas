'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useIndustryStore, getIndustryConfig, Industry } from '@/lib/stores/industry-store';
import { useLocaleStore } from '@/lib/stores/locale-store';

interface QuickIntentCardsProps {
  onSelect: (prompt: string) => void;
}

// Vertical-specific demo prompts
const verticalPrompts: Record<Industry, { en: string[]; ar: string[] }> = {
  banking: {
    en: [
      'Analyze fintech competitors in my region',
      'Show me banking market trends',
      'Compare digital banking features',
    ],
    ar: [
      'تحليل منافسي التقنية المالية في منطقتي',
      'أظهر لي اتجاهات سوق البنوك',
      'قارن ميزات البنوك الرقمية',
    ],
  },
  healthcare: {
    en: [
      'Track healthcare tech competitors',
      'Analyze telemedicine market',
      'Compare hospital management systems',
    ],
    ar: [
      'تتبع منافسي تقنيات الرعاية الصحية',
      'تحليل سوق الطب عن بعد',
      'مقارنة أنظمة إدارة المستشفيات',
    ],
  },
  technology: {
    en: [
      'Monitor SaaS competitor pricing',
      'Analyze tech startup landscape',
      'Track product feature updates',
    ],
    ar: [
      'مراقبة أسعار منافسي SaaS',
      'تحليل مشهد الشركات التقنية الناشئة',
      'تتبع تحديثات ميزات المنتج',
    ],
  },
  retail: {
    en: [
      'Track e-commerce competitor prices',
      'Analyze retail market segments',
      'Compare loyalty programs',
    ],
    ar: [
      'تتبع أسعار منافسي التجارة الإلكترونية',
      'تحليل قطاعات سوق التجزئة',
      'مقارنة برامج الولاء',
    ],
  },
  manufacturing: {
    en: [
      'Analyze supply chain competitors',
      'Track industry 4.0 adoption',
      'Compare manufacturing efficiency',
    ],
    ar: [
      'تحليل منافسي سلسلة التوريد',
      'تتبع تبني الصناعة 4.0',
      'مقارنة كفاءة التصنيع',
    ],
  },
  realestate: {
    en: [
      'Track property market competitors',
      'Analyze real estate pricing trends',
      'Compare property tech platforms',
    ],
    ar: [
      'تتبع منافسي سوق العقارات',
      'تحليل اتجاهات أسعار العقارات',
      'مقارنة منصات تقنية العقارات',
    ],
  },
  'professional-services': {
    en: [
      'Analyze consulting firm competitors',
      'Track professional service pricing',
      'Compare service offerings',
    ],
    ar: [
      'تحليل منافسي الشركات الاستشارية',
      'تتبع أسعار الخدمات المهنية',
      'مقارنة عروض الخدمات',
    ],
  },
  general: {
    en: [
      'Show me competitor analysis',
      'What can PremiumRadar do?',
      'Help me track my competitors',
    ],
    ar: [
      'أظهر لي تحليل المنافسين',
      'ماذا يمكن أن يفعل PremiumRadar؟',
      'ساعدني في تتبع منافسي',
    ],
  },
};

export function QuickIntentCards({ onSelect }: QuickIntentCardsProps) {
  const { detectedIndustry } = useIndustryStore();
  const { locale } = useLocaleStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const prompts = verticalPrompts[detectedIndustry][locale];

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
