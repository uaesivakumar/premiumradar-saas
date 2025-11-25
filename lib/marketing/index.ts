/**
 * Marketing Module
 *
 * Exports all marketing, pricing, and SEO functionality.
 */

// Types
export type {
  PricingTier,
  PricingFeature,
  PricingLimits,
  PricingFAQ,
  LegalSection,
  LegalPage,
  CookieCategory,
  CookieInfo,
  DocCategory,
  DocPage,
  DocSearchResult,
  SEOMetadata,
  SchemaMarkup,
  SchemaType,
  BreadcrumbItem,
  SEOPage,
  Testimonial,
  CaseStudy,
  Feature,
} from './types';

// Pricing
export {
  PRICING_TIERS,
  FEATURE_CATEGORIES,
  PRICING_FAQ,
  getTierById,
  calculateYearlySavings,
  calculateYearlySavingsPercent,
  formatPrice,
  formatLimit,
  compareTiers,
} from './pricing';

// Legal
export {
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  COOKIE_CATEGORIES,
  getLegalPage,
  formatEffectiveDate,
  generateTableOfContents,
} from './legal';

// SEO
export {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSoftwareApplicationSchema,
  generateProductSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateArticleSchema,
  generateHowToSchema,
  generateDefaultMetadata,
  generatePageMetadata,
  generateMetaTags,
  generateJsonLd,
  SEO_PAGES,
  getSEOConfig,
} from './seo';

// Documentation
export {
  DOC_CATEGORIES,
  searchDocs,
  getAllDocPages,
  getDocPageBySlug,
  getDocCategory,
  getRelatedPages,
  generateTableOfContents as generateDocTableOfContents,
} from './docs';
