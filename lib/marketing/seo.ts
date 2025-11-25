/**
 * SEO Module
 *
 * Schema markup generation and SEO utilities.
 */

import type {
  SEOMetadata,
  SchemaMarkup,
  SchemaType,
  BreadcrumbItem,
  SEOPage,
} from './types';

// ============================================================
// SCHEMA GENERATORS
// ============================================================

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): SchemaMarkup {
  return {
    type: 'Organization',
    data: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'PremiumRadar',
      url: 'https://premiumradar.com',
      logo: 'https://premiumradar.com/logo.png',
      description: 'AI-powered domain valuation and portfolio management platform',
      foundingDate: '2024',
      sameAs: [
        'https://twitter.com/premiumradar',
        'https://linkedin.com/company/premiumradar',
        'https://github.com/premiumradar',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@premiumradar.com',
      },
    },
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema(): SchemaMarkup {
  return {
    type: 'WebSite',
    data: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PremiumRadar',
      url: 'https://premiumradar.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://premiumradar.com/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  };
}

/**
 * Generate SoftwareApplication schema (for app/product pages)
 */
export function generateSoftwareApplicationSchema(): SchemaMarkup {
  return {
    type: 'SoftwareApplication',
    data: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PremiumRadar',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier available',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '150',
      },
    },
  };
}

/**
 * Generate Product schema for pricing page
 */
export function generateProductSchema(
  name: string,
  description: string,
  price: number,
  currency = 'USD'
): SchemaMarkup {
  return {
    type: 'Product',
    data: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description,
      brand: {
        '@type': 'Brand',
        name: 'PremiumRadar',
      },
      offers: {
        '@type': 'Offer',
        price: price.toString(),
        priceCurrency: currency,
        availability: 'https://schema.org/InStock',
      },
    },
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): SchemaMarkup {
  return {
    type: 'FAQPage',
    data: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: BreadcrumbItem[]
): SchemaMarkup {
  return {
    type: 'BreadcrumbList',
    data: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
  };
}

/**
 * Generate Article schema for blog/docs
 */
export function generateArticleSchema(
  title: string,
  description: string,
  datePublished: Date,
  dateModified: Date,
  author = 'PremiumRadar Team'
): SchemaMarkup {
  return {
    type: 'Article',
    data: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      datePublished: datePublished.toISOString(),
      dateModified: dateModified.toISOString(),
      author: {
        '@type': 'Person',
        name: author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'PremiumRadar',
        logo: {
          '@type': 'ImageObject',
          url: 'https://premiumradar.com/logo.png',
        },
      },
    },
  };
}

/**
 * Generate HowTo schema
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string }>
): SchemaMarkup {
  return {
    type: 'HowTo',
    data: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name,
      description,
      step: steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
      })),
    },
  };
}

// ============================================================
// SEO METADATA HELPERS
// ============================================================

/**
 * Generate default SEO metadata
 */
export function generateDefaultMetadata(): SEOMetadata {
  return {
    title: 'PremiumRadar - AI-Powered Domain Valuation Platform',
    description:
      'Discover, analyze, and value premium domains with AI-powered insights. Track portfolios, find opportunities, and make smarter domain investment decisions.',
    keywords: [
      'domain valuation',
      'domain investing',
      'domain appraisal',
      'domain portfolio',
      'premium domains',
    ],
    ogType: 'website',
    twitterCard: 'summary_large_image',
  };
}

/**
 * Generate page-specific metadata
 */
export function generatePageMetadata(
  page: string,
  title: string,
  description: string
): SEOMetadata {
  return {
    title: `${title} | PremiumRadar`,
    description,
    canonicalUrl: `https://premiumradar.com/${page}`,
    ogType: 'website',
    twitterCard: 'summary_large_image',
  };
}

/**
 * Generate meta tags HTML
 */
export function generateMetaTags(metadata: SEOMetadata): string {
  const tags: string[] = [];

  // Basic tags
  tags.push(`<title>${metadata.title}</title>`);
  tags.push(`<meta name="description" content="${metadata.description}">`);

  if (metadata.keywords?.length) {
    tags.push(`<meta name="keywords" content="${metadata.keywords.join(', ')}">`);
  }

  if (metadata.canonicalUrl) {
    tags.push(`<link rel="canonical" href="${metadata.canonicalUrl}">`);
  }

  // Open Graph
  tags.push(`<meta property="og:title" content="${metadata.title}">`);
  tags.push(`<meta property="og:description" content="${metadata.description}">`);
  tags.push(`<meta property="og:type" content="${metadata.ogType || 'website'}">`);

  if (metadata.ogImage) {
    tags.push(`<meta property="og:image" content="${metadata.ogImage}">`);
  }

  // Twitter
  tags.push(`<meta name="twitter:card" content="${metadata.twitterCard || 'summary'}">`);
  tags.push(`<meta name="twitter:title" content="${metadata.title}">`);
  tags.push(`<meta name="twitter:description" content="${metadata.description}">`);

  // Robots
  if (metadata.noIndex || metadata.noFollow) {
    const robots = [
      metadata.noIndex ? 'noindex' : 'index',
      metadata.noFollow ? 'nofollow' : 'follow',
    ].join(', ');
    tags.push(`<meta name="robots" content="${robots}">`);
  }

  return tags.join('\n');
}

/**
 * Generate JSON-LD script tag
 */
export function generateJsonLd(schemas: SchemaMarkup[]): string {
  return schemas
    .map(
      (schema) =>
        `<script type="application/ld+json">${JSON.stringify(schema.data)}</script>`
    )
    .join('\n');
}

// ============================================================
// SEO PAGE TEMPLATES
// ============================================================

export const SEO_PAGES: Record<string, Partial<SEOPage>> = {
  home: {
    slug: '',
    title: 'PremiumRadar - AI-Powered Domain Valuation Platform',
    h1: 'Discover Premium Domains with AI-Powered Insights',
    description:
      'Find, analyze, and value premium domains with our AI-powered platform. Make smarter domain investment decisions with real-time market data.',
  },
  pricing: {
    slug: 'pricing',
    title: 'Pricing Plans | PremiumRadar',
    h1: 'Choose the Perfect Plan for Your Domain Business',
    description:
      'Flexible pricing plans for domain investors of all sizes. Start free, upgrade as you grow. No credit card required for trial.',
  },
  features: {
    slug: 'features',
    title: 'Features | PremiumRadar',
    h1: 'Powerful Features for Domain Professionals',
    description:
      'AI valuation, portfolio management, discovery tools, and more. Everything you need to succeed in domain investing.',
  },
  about: {
    slug: 'about',
    title: 'About Us | PremiumRadar',
    h1: 'About PremiumRadar',
    description:
      'Learn about our mission to democratize domain investing with AI-powered tools and transparent market data.',
  },
  contact: {
    slug: 'contact',
    title: 'Contact Us | PremiumRadar',
    h1: 'Get in Touch',
    description:
      'Have questions? Contact our team for sales inquiries, support, or partnership opportunities.',
  },
};

/**
 * Get SEO config for page
 */
export function getSEOConfig(slug: string): Partial<SEOPage> | undefined {
  return SEO_PAGES[slug];
}
