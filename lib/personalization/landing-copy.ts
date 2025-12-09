/**
 * Landing Page AI Personalization - Sprint S133
 *
 * Dynamic copy generation based on:
 * - User's geo location
 * - Device type
 * - Referral source
 * - Inferred industry
 * - Time of day
 */

import type { Vertical } from '@/lib/intelligence/context/types';

// =============================================================================
// Types
// =============================================================================

export interface VisitorContext {
  // Geo
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;

  // Device
  device?: 'mobile' | 'tablet' | 'desktop';
  os?: string;
  browser?: string;

  // Referral
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;

  // Inferred
  inferredIndustry?: string;
  inferredVertical?: Vertical;

  // Time
  localHour?: number;
  timezone?: string;
}

export interface PersonalizedCopy {
  headline: string;
  subheadline: string;
  ctaText: string;
  badge: string;
  socialProof: string;
  valueProps: string[];
}

// =============================================================================
// Industry-Specific Copy
// =============================================================================

const VERTICAL_COPY: Record<Vertical, PersonalizedCopy> = {
  'banking': {
    headline: 'Close More Payroll Deals',
    subheadline: "The world's smartest Sales OS for Employee Banking",
    ctaText: 'Get Early Access',
    badge: 'Banking Intelligence Active',
    socialProof: 'Trusted by 50+ UAE banking professionals',
    valueProps: [
      'Discover companies expanding headcount in real-time',
      'Identify payroll opportunities before competitors',
      'AI-powered relationship building',
    ],
  },
  'recruitment': {
    headline: 'Fill 5× More Roles',
    subheadline: 'Intelligence that finds candidates before competitors',
    ctaText: 'Join Waitlist',
    badge: 'Recruitment Intelligence Coming Soon',
    socialProof: 'Built for UAE recruiters',
    valueProps: [
      'Spot hiring signals from company expansions',
      'Track talent movement across industries',
      'Predict hiring needs before they post',
    ],
  },
  'real-estate': {
    headline: 'Never Miss a Property Buyer',
    subheadline: 'AI that spots buyers before they start searching',
    ctaText: 'Request Access',
    badge: 'Real Estate Intelligence Coming Soon',
    socialProof: 'Designed for Dubai property advisors',
    valueProps: [
      'Identify families ready to upgrade',
      'Track relocation signals from job changes',
      'Predict investment timing from funding news',
    ],
  },
  'insurance': {
    headline: 'Close Corporate Policies Faster',
    subheadline: 'Intelligence for insurance professionals',
    ctaText: 'Get on the List',
    badge: 'Insurance Intelligence Coming Soon',
    socialProof: 'Built for GCC insurance sales',
    valueProps: [
      'Spot growing companies needing coverage',
      'Track employee count changes automatically',
      'Identify renewal opportunities',
    ],
  },
  'saas-sales': {
    headline: 'Never Waste Time on Low-Quality Leads',
    subheadline: 'AI that scores and prioritizes your pipeline',
    ctaText: 'Join Beta',
    badge: 'SaaS Sales Intelligence Coming Soon',
    socialProof: 'For B2B SaaS sales teams',
    valueProps: [
      'Identify companies with buying intent',
      'Track tech stack changes for timing',
      'Predict budget availability from funding',
    ],
  },
};

// =============================================================================
// Region-Specific Copy
// =============================================================================

const REGION_COPY: Record<string, Partial<PersonalizedCopy>> = {
  'AE': {
    headline: 'AI Sales Intelligence for the UAE Market',
    socialProof: 'Built specifically for UAE sales professionals',
    badge: 'UAE-First Platform',
  },
  'SA': {
    headline: 'AI Sales Intelligence for Saudi Arabia',
    socialProof: 'Expanding to the Saudi market',
    badge: 'KSA Launch Coming',
  },
  'QA': {
    headline: 'AI Sales Intelligence for Qatar',
    socialProof: 'Built for GCC markets',
    badge: 'Qatar Coming Soon',
  },
  'SG': {
    headline: 'AI Sales Intelligence for Singapore',
    socialProof: 'Southeast Asia expansion planned',
    badge: 'Singapore Coming Soon',
  },
  'IN': {
    headline: 'AI Sales Intelligence for India',
    socialProof: 'India launch planned for 2025',
    badge: 'India Coming Soon',
  },
  'GB': {
    headline: 'AI Sales Intelligence for the UK',
    socialProof: 'UK expansion in roadmap',
    badge: 'UK Coming Soon',
  },
  'US': {
    headline: 'AI Sales Intelligence for Enterprise',
    socialProof: 'US market launch planned',
    badge: 'US Coming Soon',
  },
};

// =============================================================================
// Time-Based Copy
// =============================================================================

function getTimeBasedGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Hello';
}

// =============================================================================
// Referral-Based Copy
// =============================================================================

const REFERRAL_COPY: Record<string, Partial<PersonalizedCopy>> = {
  'linkedin': {
    ctaText: 'Join from LinkedIn',
    socialProof: 'Join 100+ sales professionals from LinkedIn',
  },
  'twitter': {
    ctaText: 'Join from X',
    socialProof: 'Trending in sales tech',
  },
  'google': {
    subheadline: 'The AI sales tool you\'ve been searching for',
  },
  'producthunt': {
    badge: 'Featured on Product Hunt',
    ctaText: 'Try It Now',
  },
};

// =============================================================================
// Device-Based Adjustments
// =============================================================================

function getDeviceAdjustments(device?: 'mobile' | 'tablet' | 'desktop'): Partial<PersonalizedCopy> {
  if (device === 'mobile') {
    return {
      ctaText: 'Join Now',
      // Shorter copy for mobile
    };
  }
  return {};
}

// =============================================================================
// Main Personalization Function
// =============================================================================

export function getPersonalizedCopy(context: VisitorContext): PersonalizedCopy {
  // Start with default copy
  let copy: PersonalizedCopy = {
    headline: 'AI-Powered Sales Intelligence',
    subheadline: 'Your cognitive sales OS for the UAE market',
    ctaText: 'Join the Waitlist',
    badge: 'Private Beta',
    socialProof: 'Join early adopters',
    valueProps: [
      'Discover high-potential opportunities',
      'AI-powered lead scoring',
      'Real-time market intelligence',
    ],
  };

  // Layer 1: Industry/Vertical personalization (highest priority)
  if (context.inferredVertical && VERTICAL_COPY[context.inferredVertical]) {
    copy = { ...copy, ...VERTICAL_COPY[context.inferredVertical] };
  }

  // Layer 2: Region personalization
  if (context.countryCode && REGION_COPY[context.countryCode]) {
    copy = { ...copy, ...REGION_COPY[context.countryCode] };
  }

  // Layer 3: Referral personalization
  if (context.referrer) {
    const referrerDomain = extractReferrerSource(context.referrer);
    if (referrerDomain && REFERRAL_COPY[referrerDomain]) {
      copy = { ...copy, ...REFERRAL_COPY[referrerDomain] };
    }
  }

  // Layer 4: UTM-based personalization
  if (context.utmSource && REFERRAL_COPY[context.utmSource.toLowerCase()]) {
    copy = { ...copy, ...REFERRAL_COPY[context.utmSource.toLowerCase()] };
  }

  // Layer 5: Device adjustments
  copy = { ...copy, ...getDeviceAdjustments(context.device) };

  // Layer 6: Time-based greeting (optional enhancement)
  if (context.localHour !== undefined) {
    const greeting = getTimeBasedGreeting(context.localHour);
    // Could prefix headline with greeting if desired
  }

  return copy;
}

// =============================================================================
// Helper Functions
// =============================================================================

function extractReferrerSource(referrer: string): string | null {
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes('linkedin')) return 'linkedin';
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('google')) return 'google';
    if (hostname.includes('producthunt')) return 'producthunt';
    if (hostname.includes('facebook')) return 'facebook';
    if (hostname.includes('instagram')) return 'instagram';

    return null;
  } catch {
    return null;
  }
}

// =============================================================================
// Context Detection (Client-Side)
// =============================================================================

export async function detectVisitorContext(): Promise<VisitorContext> {
  const context: VisitorContext = {};

  // Device detection
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) {
      context.device = 'mobile';
    } else if (width < 1024) {
      context.device = 'tablet';
    } else {
      context.device = 'desktop';
    }

    // Referrer
    context.referrer = document.referrer || undefined;

    // URL params
    const params = new URLSearchParams(window.location.search);
    context.utmSource = params.get('utm_source') || undefined;
    context.utmMedium = params.get('utm_medium') || undefined;
    context.utmCampaign = params.get('utm_campaign') || undefined;

    // Time
    context.localHour = new Date().getHours();
    context.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Geo detection (via API)
  try {
    const geoData = await fetchGeoData();
    if (geoData) {
      context.country = geoData.country;
      context.countryCode = geoData.countryCode;
      context.city = geoData.city;
      context.region = geoData.region;
    }
  } catch {
    // Geo detection failed, continue without it
  }

  return context;
}

async function fetchGeoData(): Promise<{
  country: string;
  countryCode: string;
  city: string;
  region: string;
} | null> {
  try {
    // Use a free geo-IP service
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    if (!response.ok) return null;

    const data = await response.json();
    return {
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      region: data.region,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// Industry Inference from Email (for post-signup personalization)
// =============================================================================

export function inferVerticalFromEmail(email: string): Vertical | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  // Banking keywords
  if (domain.includes('bank') || domain.includes('finance') || domain.includes('capital')) {
    return 'banking';
  }

  // Insurance
  if (domain.includes('insurance') || domain.includes('takaful')) {
    return 'insurance';
  }

  // Real estate
  if (domain.includes('properties') || domain.includes('realty') || domain.includes('estate')) {
    return 'real-estate';
  }

  // Recruitment
  if (domain.includes('recruit') || domain.includes('staffing') || domain.includes('talent')) {
    return 'recruitment';
  }

  // SaaS/Tech
  if (domain.includes('tech') || domain.includes('software') || domain.includes('cloud')) {
    return 'saas-sales';
  }

  return null;
}

export default getPersonalizedCopy;
