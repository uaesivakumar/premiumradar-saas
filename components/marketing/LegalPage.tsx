/**
 * Legal Page Component
 *
 * Display legal pages (Terms, Privacy, Cookies).
 */

'use client';

import { useState } from 'react';
import {
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  COOKIE_CATEGORIES,
  formatEffectiveDate,
  generateTableOfContents,
  type LegalPage,
  type CookieCategory,
} from '@/lib/marketing';

interface LegalPageViewProps {
  type: 'terms' | 'privacy' | 'cookies';
}

export function LegalPageView({ type }: LegalPageViewProps) {
  const page = type === 'terms' ? TERMS_OF_SERVICE : type === 'privacy' ? PRIVACY_POLICY : null;

  if (type === 'cookies') {
    return <CookiePolicyView />;
  }

  if (!page) return null;

  const toc = generateTableOfContents(page.sections);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900">{page.title}</h1>
        <p className="mt-4 text-gray-500">
          Effective Date: {formatEffectiveDate(page.effectiveDate)} • Version{' '}
          {page.version}
        </p>
      </div>

      <div className="flex gap-12">
        {/* Table of contents - sticky sidebar */}
        <nav className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-8">
            <h2 className="text-sm font-semibold text-gray-900 uppercase mb-4">
              Contents
            </h2>
            <ul className="space-y-2">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 prose prose-gray max-w-none">
          {page.sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {section.title}
              </h2>
              <div className="text-gray-600 whitespace-pre-wrap">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Print/Download buttons */}
      <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Last updated: {formatEffectiveDate(page.effectiveDate)}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.print()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Print this page
          </button>
          <button className="text-sm text-blue-600 hover:text-blue-700">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function CookiePolicyView() {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    essential: true,
    functional: true,
    analytics: true,
    marketing: false,
  });

  const handleToggle = (categoryId: string) => {
    if (categoryId === 'essential') return; // Can't toggle essential
    setPreferences((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleSavePreferences = () => {
    // Save to localStorage or cookie
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    alert('Cookie preferences saved!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Cookie Policy</h1>
        <p className="mt-4 text-gray-500">
          We use cookies to improve your experience. Learn more about how we use
          cookies and how you can control them.
        </p>
      </div>

      {/* Cookie preferences */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-12">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Cookie Preferences</h2>
          <p className="text-sm text-gray-500">
            Manage your cookie preferences below
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {COOKIE_CATEGORIES.map((category) => (
            <CookieCategoryRow
              key={category.id}
              category={category}
              enabled={preferences[category.id]}
              onToggle={() => handleToggle(category.id)}
            />
          ))}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-4">
          <button
            onClick={() =>
              setPreferences({
                essential: true,
                functional: false,
                analytics: false,
                marketing: false,
              })
            }
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Reject All
          </button>
          <button
            onClick={() =>
              setPreferences({
                essential: true,
                functional: true,
                analytics: true,
                marketing: true,
              })
            }
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Accept All
          </button>
          <button
            onClick={handleSavePreferences}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Detailed cookie information */}
      <div className="space-y-8">
        {COOKIE_CATEGORIES.map((category) => (
          <div key={category.id}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {category.name}
            </h3>
            <p className="text-gray-600 mb-4">{category.description}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      Cookie
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      Provider
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      Purpose
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      Expiry
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {category.cookies.map((cookie) => (
                    <tr key={cookie.name}>
                      <td className="px-4 py-2 font-mono text-xs">
                        {cookie.name}
                      </td>
                      <td className="px-4 py-2">{cookie.provider}</td>
                      <td className="px-4 py-2">{cookie.purpose}</td>
                      <td className="px-4 py-2">{cookie.expiry}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            cookie.type === 'first-party'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {cookie.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CookieCategoryRow({
  category,
  enabled,
  onToggle,
}: {
  category: CookieCategory;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <div>
        <h3 className="font-medium text-gray-900">
          {category.name}
          {category.required && (
            <span className="ml-2 text-xs text-gray-400">(Required)</span>
          )}
        </h3>
        <p className="text-sm text-gray-500">{category.description}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={category.required}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        } ${category.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

// Cookie consent banner
export function CookieConsentBanner({
  onAccept,
  onReject,
  onManage,
}: {
  onAccept: () => void;
  onReject: () => void;
  onManage: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            We use cookies to enhance your experience. By continuing to visit
            this site you agree to our use of cookies.{' '}
            <a href="/cookies" className="text-blue-600 hover:underline">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onReject}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Reject
          </button>
          <button
            onClick={onManage}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Manage
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
