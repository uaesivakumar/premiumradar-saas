/**
 * Marketing Types
 *
 * Core types for marketing, pricing, and SEO.
 */

// ============================================================
// PRICING
// ============================================================

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  features: PricingFeature[];
  limits: PricingLimits;
  highlighted?: boolean;
  badge?: string;
  ctaText: string;
  ctaUrl: string;
}

export interface PricingFeature {
  name: string;
  included: boolean;
  limit?: string;
  tooltip?: string;
}

export interface PricingLimits {
  domains: number | 'unlimited';
  searches: number | 'unlimited';
  aiAnalyses: number | 'unlimited';
  exports: number | 'unlimited';
  teamMembers: number | 'unlimited';
  apiCalls: number | 'unlimited';
}

export interface PricingFAQ {
  question: string;
  answer: string;
  category?: string;
}

// ============================================================
// LEGAL PAGES
// ============================================================

export interface LegalSection {
  id: string;
  title: string;
  content: string;
  lastUpdated: Date;
}

export interface LegalPage {
  type: 'terms' | 'privacy' | 'cookies' | 'acceptable-use';
  title: string;
  effectiveDate: Date;
  sections: LegalSection[];
  version: string;
}

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  cookies: CookieInfo[];
}

export interface CookieInfo {
  name: string;
  provider: string;
  purpose: string;
  expiry: string;
  type: 'first-party' | 'third-party';
}

// ============================================================
// DOCUMENTATION
// ============================================================

export interface DocCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  pages: DocPage[];
}

export interface DocPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  order: number;
  lastUpdated: Date;
  readTime: number;
  tags: string[];
}

export interface DocSearchResult {
  page: DocPage;
  snippet: string;
  score: number;
}

// ============================================================
// SEO
// ============================================================

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface SchemaMarkup {
  type: SchemaType;
  data: Record<string, unknown>;
}

export type SchemaType =
  | 'Organization'
  | 'WebSite'
  | 'Product'
  | 'SoftwareApplication'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'Article'
  | 'HowTo';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SEOPage {
  slug: string;
  title: string;
  h1: string;
  description: string;
  content: string;
  schema: SchemaMarkup[];
  breadcrumbs: BreadcrumbItem[];
  internalLinks: string[];
  lastModified: Date;
}

// ============================================================
// MARKETING CONTENT
// ============================================================

export interface Testimonial {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar?: string;
  quote: string;
  rating?: number;
  featured?: boolean;
}

export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  company: string;
  industry: string;
  challenge: string;
  solution: string;
  results: { metric: string; value: string }[];
  testimonial?: Testimonial;
  logo?: string;
  featured?: boolean;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  benefits: string[];
  image?: string;
}
