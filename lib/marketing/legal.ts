/**
 * Legal Module
 *
 * Legal pages content - Terms, Privacy, Cookies.
 */

import type { LegalPage, CookieCategory } from './types';

// ============================================================
// TERMS OF SERVICE
// ============================================================

export const TERMS_OF_SERVICE: LegalPage = {
  type: 'terms',
  title: 'Terms of Service',
  effectiveDate: new Date('2025-01-01'),
  version: '1.0',
  sections: [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: `By accessing or using PremiumRadar ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the Terms, you may not access the Service.

These Terms apply to all visitors, users, and others who access or use the Service. By using the Service, you represent that you are at least 18 years of age and have the legal authority to enter into these Terms.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'account',
      title: '2. User Accounts',
      content: `When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms.

You are responsible for safeguarding the password used to access the Service and for any activities under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use.

We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'subscriptions',
      title: '3. Subscriptions and Billing',
      content: `Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle").

At the end of each Billing Cycle, your Subscription will automatically renew unless you cancel it or we cancel it. You may cancel your Subscription through your account settings or by contacting us.

A valid payment method is required to process the payment. By submitting your payment information, you authorize us to charge all Subscription fees incurred through your account.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'acceptable-use',
      title: '4. Acceptable Use',
      content: `You agree not to use the Service:
- For any unlawful purpose
- To violate any laws in your jurisdiction
- To exploit, harm, or attempt to exploit minors
- To transmit any malicious code or spam
- To infringe upon others' intellectual property rights
- To harass, abuse, or threaten others
- To scrape or harvest data without authorization
- To interfere with the Service's security features`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'intellectual-property',
      title: '5. Intellectual Property',
      content: `The Service and its original content, features, and functionality are owned by PremiumRadar and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.

You may not copy, modify, distribute, sell, or lease any part of our Service or included software, nor may you reverse engineer or attempt to extract the source code.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'disclaimer',
      title: '6. Disclaimer of Warranties',
      content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

Domain valuations and analyses are estimates only and should not be relied upon as the sole basis for investment decisions. We do not guarantee the accuracy, completeness, or usefulness of any information provided.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'limitation',
      title: '7. Limitation of Liability',
      content: `IN NO EVENT SHALL PREMIUMRADAR, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.

Our total liability shall not exceed the amount paid by you, if any, for accessing the Service during the twelve months prior to the claim.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'termination',
      title: '8. Termination',
      content: `We may terminate or suspend your account immediately, without prior notice, for any reason whatsoever, including without limitation if you breach the Terms.

Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'governing-law',
      title: '9. Governing Law',
      content: `These Terms shall be governed by the laws of the State of Delaware, United States, without regard to its conflict of law provisions.

Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'changes',
      title: '10. Changes to Terms',
      content: `We reserve the right to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page and updating the effective date.

Your continued use of the Service after any changes constitutes acceptance of the new Terms.`,
      lastUpdated: new Date('2025-01-01'),
    },
  ],
};

// ============================================================
// PRIVACY POLICY
// ============================================================

export const PRIVACY_POLICY: LegalPage = {
  type: 'privacy',
  title: 'Privacy Policy',
  effectiveDate: new Date('2025-01-01'),
  version: '1.0',
  sections: [
    {
      id: 'introduction',
      title: '1. Introduction',
      content: `PremiumRadar ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.

Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'information-collected',
      title: '2. Information We Collect',
      content: `We collect information you provide directly:
- Account information (name, email, password)
- Payment information (processed securely via Stripe)
- Profile information (company, role, preferences)
- Communications (support tickets, feedback)

We automatically collect:
- Device information (browser, OS, IP address)
- Usage data (pages visited, features used, time spent)
- Cookies and similar technologies
- Analytics data`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'use-of-information',
      title: '3. How We Use Your Information',
      content: `We use collected information to:
- Provide, maintain, and improve the Service
- Process transactions and send related information
- Send technical notices and support messages
- Respond to comments, questions, and requests
- Monitor and analyze trends, usage, and activities
- Detect, investigate, and prevent fraudulent transactions
- Personalize and improve your experience
- Send promotional communications (with consent)`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'sharing',
      title: '4. Sharing of Information',
      content: `We may share your information with:
- Service providers who assist our operations
- Payment processors for transaction processing
- Analytics providers to improve our Service
- Law enforcement when required by law
- Other parties with your consent

We do not sell your personal information to third parties.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'security',
      title: '5. Data Security',
      content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'retention',
      title: '6. Data Retention',
      content: `We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.

When you delete your account, we will delete or anonymize your information within 30 days, except where required for legal purposes.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'your-rights',
      title: '7. Your Rights',
      content: `Depending on your location, you may have rights including:
- Access to your personal data
- Correction of inaccurate data
- Deletion of your data
- Data portability
- Objection to processing
- Withdrawal of consent

To exercise these rights, contact us at privacy@premiumradar.com.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'international',
      title: '8. International Transfers',
      content: `Your information may be transferred to and processed in countries other than your own. These countries may have different data protection laws.

We ensure appropriate safeguards are in place for international transfers, including Standard Contractual Clauses approved by the European Commission.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'children',
      title: '9. Children\'s Privacy',
      content: `The Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18.

If you become aware that a child has provided us with personal information, please contact us and we will take steps to delete such information.`,
      lastUpdated: new Date('2025-01-01'),
    },
    {
      id: 'changes',
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.

We encourage you to review this Privacy Policy periodically for any changes.`,
      lastUpdated: new Date('2025-01-01'),
    },
  ],
};

// ============================================================
// COOKIE POLICY
// ============================================================

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    name: 'Essential Cookies',
    description:
      'These cookies are necessary for the website to function and cannot be disabled. They are usually set in response to actions you take, such as logging in or filling forms.',
    required: true,
    cookies: [
      {
        name: 'session_id',
        provider: 'PremiumRadar',
        purpose: 'Maintains user session state',
        expiry: 'Session',
        type: 'first-party',
      },
      {
        name: 'csrf_token',
        provider: 'PremiumRadar',
        purpose: 'Security token to prevent cross-site request forgery',
        expiry: 'Session',
        type: 'first-party',
      },
      {
        name: 'auth_token',
        provider: 'PremiumRadar',
        purpose: 'Authenticates logged-in users',
        expiry: '30 days',
        type: 'first-party',
      },
    ],
  },
  {
    id: 'functional',
    name: 'Functional Cookies',
    description:
      'These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.',
    required: false,
    cookies: [
      {
        name: 'preferences',
        provider: 'PremiumRadar',
        purpose: 'Stores user preferences like theme and language',
        expiry: '1 year',
        type: 'first-party',
      },
      {
        name: 'recently_viewed',
        provider: 'PremiumRadar',
        purpose: 'Tracks recently viewed domains for quick access',
        expiry: '30 days',
        type: 'first-party',
      },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description:
      'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
    required: false,
    cookies: [
      {
        name: '_ga',
        provider: 'Google Analytics',
        purpose: 'Distinguishes unique users',
        expiry: '2 years',
        type: 'third-party',
      },
      {
        name: '_gid',
        provider: 'Google Analytics',
        purpose: 'Distinguishes unique users',
        expiry: '24 hours',
        type: 'third-party',
      },
      {
        name: 'mp_*',
        provider: 'Mixpanel',
        purpose: 'Product analytics and usage tracking',
        expiry: '1 year',
        type: 'third-party',
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description:
      'These cookies are used to track visitors across websites to display relevant advertisements.',
    required: false,
    cookies: [
      {
        name: '_fbp',
        provider: 'Facebook',
        purpose: 'Tracks visits across websites for Facebook ads',
        expiry: '3 months',
        type: 'third-party',
      },
      {
        name: '_gcl_au',
        provider: 'Google Ads',
        purpose: 'Stores conversion data for Google Ads',
        expiry: '90 days',
        type: 'third-party',
      },
    ],
  },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Get legal page by type
 */
export function getLegalPage(type: LegalPage['type']): LegalPage | null {
  switch (type) {
    case 'terms':
      return TERMS_OF_SERVICE;
    case 'privacy':
      return PRIVACY_POLICY;
    default:
      return null;
  }
}

/**
 * Format effective date
 */
export function formatEffectiveDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate table of contents from sections
 */
export function generateTableOfContents(
  sections: LegalPage['sections']
): { id: string; title: string }[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
  }));
}
