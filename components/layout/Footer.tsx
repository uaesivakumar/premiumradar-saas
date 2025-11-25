'use client';

/**
 * Footer Component
 * Sprint 1: Accessibility + Responsive + i18n
 */

import Link from 'next/link';
import { useTranslation } from '@/lib/stores/locale-store';

export function Footer() {
  const { translations, isRTL } = useTranslation();

  return (
    <footer className="bg-gray-50 border-t border-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold">
              Premium<span className="text-primary-600">Radar</span>
            </Link>
            <p className="mt-4 text-gray-600 max-w-md">
              AI-Powered Sales Intelligence Platform. Discover, score, and engage
              high-value leads with cognitive intelligence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-gray-600 hover:text-gray-900">
                  {translations.nav.features}
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
                  {translations.nav.pricing}
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-gray-600 hover:text-gray-900">
                  {translations.nav.docs}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                  {translations.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                  {translations.footer.terms}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            {translations.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
