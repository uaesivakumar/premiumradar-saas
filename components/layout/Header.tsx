'use client';

/**
 * Header Component - Global navigation
 * Sprint 1: Accessibility + Responsive + i18n
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/stores/locale-store';
import { Menu, X, Globe } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, toggleLocale, translations, isRTL } = useTranslation();

  const navItems = [
    { href: '#features', label: translations.nav.features },
    { href: '#pricing', label: translations.nav.pricing },
    { href: '/docs', label: translations.nav.docs },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              Premium<span className="text-primary-600">Radar</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={`Switch to ${locale === 'en' ? 'Arabic' : 'English'}`}
            >
              <Globe size={18} />
              <span className="text-sm font-medium">
                {locale === 'en' ? 'عربي' : 'EN'}
              </span>
            </button>

            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {translations.nav.login}
            </Link>

            <Link
              href="/signup"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {translations.nav.signup}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <button
                    onClick={toggleLocale}
                    className="flex items-center gap-2 w-full px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Globe size={18} />
                    <span>{locale === 'en' ? 'العربية' : 'English'}</span>
                  </button>

                  <Link
                    href="/login"
                    className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {translations.nav.login}
                  </Link>

                  <Link
                    href="/signup"
                    className="block mx-4 py-2 text-center bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {translations.nav.signup}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

export default Header;
