/**
 * Locale Store - Zustand store for i18n
 * Sprint 1: English/Arabic Toggle
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Locale, translations } from '../i18n/translations';

interface LocaleState {
  locale: Locale;
  isRTL: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
}

// Helper to get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path; // Return key if not found
    }
  }

  return typeof value === 'string' ? value : path;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      isRTL: false,

      setLocale: (locale) => {
        set({
          locale,
          isRTL: locale === 'ar',
        });

        // Update document direction
        if (typeof document !== 'undefined') {
          document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = locale;
        }
      },

      toggleLocale: () => {
        const newLocale = get().locale === 'en' ? 'ar' : 'en';
        get().setLocale(newLocale);
      },

      t: (key) => {
        const { locale } = get();
        const trans = translations[locale];
        return getNestedValue(trans as Record<string, unknown>, key);
      },
    }),
    {
      name: 'premium-radar-locale',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.dir = state.locale === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = state.locale;
        }
      },
    }
  )
);

// Hook for translations with type safety
export function useTranslation() {
  const { locale, isRTL, t, toggleLocale, setLocale } = useLocaleStore();

  return {
    locale,
    isRTL,
    t,
    toggleLocale,
    setLocale,
    translations: translations[locale],
  };
}
