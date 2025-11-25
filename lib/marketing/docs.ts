/**
 * Documentation Module
 *
 * Documentation pages and search functionality.
 */

import type { DocCategory, DocPage, DocSearchResult } from './types';

// ============================================================
// DOCUMENTATION CATEGORIES
// ============================================================

export const DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics of PremiumRadar',
    icon: '🚀',
    pages: [
      {
        id: 'introduction',
        title: 'Introduction to PremiumRadar',
        slug: 'introduction',
        description: 'Overview of the platform and its capabilities',
        content: `# Introduction to PremiumRadar

PremiumRadar is an AI-powered domain valuation and portfolio management platform designed for domain investors of all levels.

## What You Can Do

- **Discover Domains**: Search and filter millions of domains across all TLDs
- **Value Domains**: Get AI-powered valuations based on market data
- **Track Portfolios**: Manage your domain investments in one place
- **Find Opportunities**: Discover undervalued domains before others

## Key Features

1. **Q/T/L/E Scoring**: Our proprietary scoring system evaluates Quality, Traffic, Liquidity, and End-User potential
2. **AI Valuations**: Machine learning models trained on millions of sales
3. **Real-time Data**: Market data updated hourly
4. **Portfolio Analytics**: Track performance and ROI across your portfolio`,
        category: 'getting-started',
        order: 1,
        lastUpdated: new Date('2025-01-01'),
        readTime: 3,
        tags: ['overview', 'basics'],
      },
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        slug: 'quick-start',
        description: 'Get up and running in 5 minutes',
        content: `# Quick Start Guide

Get started with PremiumRadar in just 5 minutes.

## Step 1: Create Your Account

Sign up for a free account at premiumradar.com/signup. No credit card required.

## Step 2: Explore the Dashboard

Once logged in, you'll see the main dashboard with:
- Search bar for domain discovery
- Your watchlist
- Recent activity
- Market trends

## Step 3: Search for Domains

Enter any keyword or domain name in the search bar to see:
- Available domains
- Scored results with Q/T/L/E metrics
- Price estimates and comparables

## Step 4: Add to Watchlist

Click the heart icon on any domain to add it to your watchlist for tracking.

## Step 5: Get a Valuation

Select any domain and click "Get AI Valuation" for a detailed analysis.`,
        category: 'getting-started',
        order: 2,
        lastUpdated: new Date('2025-01-01'),
        readTime: 5,
        tags: ['quickstart', 'tutorial'],
      },
    ],
  },
  {
    id: 'features',
    name: 'Features',
    description: 'Deep dive into platform features',
    icon: '⚙️',
    pages: [
      {
        id: 'domain-scoring',
        title: 'Domain Scoring (Q/T/L/E)',
        slug: 'domain-scoring',
        description: 'Understanding our proprietary scoring system',
        content: `# Domain Scoring (Q/T/L/E)

Our proprietary Q/T/L/E scoring system provides a comprehensive view of domain value.

## The Four Dimensions

### Quality (Q) - 30% Weight
Measures intrinsic domain characteristics:
- Length and memorability
- TLD value (.com premium)
- Brandability score
- Pronunciation ease

### Traffic (T) - 25% Weight
Evaluates traffic metrics:
- Monthly visitors
- Type-in traffic potential
- Historical traffic trends
- Geographic distribution

### Liquidity (L) - 20% Weight
Assesses market liquidity:
- Recent comparable sales
- Time on market for similar domains
- Broker interest indicators
- Marketplace activity

### End-User (E) - 25% Weight
Potential for end-user sale:
- Industry relevance
- Commercial intent keywords
- Company name matches
- Development potential

## Score Interpretation

- 85-100: Excellent - Premium domain, strong investment
- 70-84: Good - Solid fundamentals, worth considering
- 50-69: Fair - Average domain, may need development
- Below 50: Poor - High risk, limited appeal`,
        category: 'features',
        order: 1,
        lastUpdated: new Date('2025-01-01'),
        readTime: 7,
        tags: ['scoring', 'valuation', 'QTLE'],
      },
      {
        id: 'ai-valuations',
        title: 'AI Valuations',
        slug: 'ai-valuations',
        description: 'How our AI valuation model works',
        content: `# AI Valuations

Our AI valuation engine uses machine learning trained on millions of domain sales.

## How It Works

1. **Data Collection**: We aggregate sales data from major marketplaces
2. **Feature Extraction**: Extract 50+ features per domain
3. **Model Training**: Ensemble of models (gradient boosting, neural networks)
4. **Confidence Scoring**: Each valuation includes a confidence score

## Valuation Factors

- Historical sales of similar domains
- Current market conditions
- Keyword trends and search volume
- Industry-specific multipliers
- TLD premiums and discounts

## Accuracy

Our valuations are within 30% of actual sale price 85% of the time for domains in our training data range.

## Limitations

- Best for domains valued $1K-$500K
- Less accurate for ultra-premium (7+ figure) domains
- Requires at least some market comparables`,
        category: 'features',
        order: 2,
        lastUpdated: new Date('2025-01-01'),
        readTime: 6,
        tags: ['AI', 'valuation', 'machine-learning'],
      },
    ],
  },
  {
    id: 'api',
    name: 'API Reference',
    description: 'Integrate PremiumRadar into your applications',
    icon: '🔌',
    pages: [
      {
        id: 'api-overview',
        title: 'API Overview',
        slug: 'api-overview',
        description: 'Introduction to the PremiumRadar API',
        content: `# API Overview

The PremiumRadar API allows you to integrate domain data into your applications.

## Base URL

\`\`\`
https://api.premiumradar.com/v1
\`\`\`

## Authentication

All API requests require an API key in the header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Rate Limits

- Free: 100 requests/day
- Pro: 10,000 requests/month
- Enterprise: Unlimited

## Response Format

All responses are JSON:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
\`\`\`

## Error Handling

Errors return appropriate HTTP status codes with details:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded"
  }
}
\`\`\``,
        category: 'api',
        order: 1,
        lastUpdated: new Date('2025-01-01'),
        readTime: 4,
        tags: ['API', 'integration', 'reference'],
      },
    ],
  },
];

// ============================================================
// DOCUMENTATION SEARCH
// ============================================================

/**
 * Search documentation pages
 */
export function searchDocs(query: string): DocSearchResult[] {
  const queryLower = query.toLowerCase();
  const results: DocSearchResult[] = [];

  DOC_CATEGORIES.forEach((category) => {
    category.pages.forEach((page) => {
      let score = 0;
      let snippet = '';

      // Check title match (highest priority)
      if (page.title.toLowerCase().includes(queryLower)) {
        score += 100;
        snippet = page.description;
      }

      // Check description match
      if (page.description.toLowerCase().includes(queryLower)) {
        score += 50;
        snippet = page.description;
      }

      // Check content match
      const contentLower = page.content.toLowerCase();
      const contentIndex = contentLower.indexOf(queryLower);
      if (contentIndex !== -1) {
        score += 25;
        // Extract snippet around match
        const start = Math.max(0, contentIndex - 50);
        const end = Math.min(page.content.length, contentIndex + query.length + 100);
        snippet = '...' + page.content.slice(start, end) + '...';
      }

      // Check tags match
      if (page.tags.some((tag) => tag.toLowerCase().includes(queryLower))) {
        score += 30;
      }

      if (score > 0) {
        results.push({ page, snippet, score });
      }
    });
  });

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Get all documentation pages flattened
 */
export function getAllDocPages(): DocPage[] {
  return DOC_CATEGORIES.flatMap((category) => category.pages);
}

/**
 * Get documentation page by slug
 */
export function getDocPageBySlug(slug: string): DocPage | undefined {
  for (const category of DOC_CATEGORIES) {
    const page = category.pages.find((p) => p.slug === slug);
    if (page) return page;
  }
  return undefined;
}

/**
 * Get documentation category by ID
 */
export function getDocCategory(id: string): DocCategory | undefined {
  return DOC_CATEGORIES.find((c) => c.id === id);
}

/**
 * Get related pages based on tags
 */
export function getRelatedPages(page: DocPage, limit = 3): DocPage[] {
  const allPages = getAllDocPages();
  const related: { page: DocPage; score: number }[] = [];

  allPages.forEach((p) => {
    if (p.id === page.id) return;

    // Score based on matching tags
    const matchingTags = page.tags.filter((tag) => p.tags.includes(tag)).length;
    if (matchingTags > 0) {
      related.push({ page: p, score: matchingTags });
    }

    // Boost if same category
    if (p.category === page.category) {
      const existing = related.find((r) => r.page.id === p.id);
      if (existing) {
        existing.score += 1;
      } else {
        related.push({ page: p, score: 0.5 });
      }
    }
  });

  return related
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.page);
}

/**
 * Generate table of contents from markdown content
 */
export function generateTableOfContents(
  content: string
): Array<{ level: number; text: string; slug: string }> {
  const headings: Array<{ level: number; text: string; slug: string }> = [];
  const lines = content.split('\n');

  lines.forEach((line) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      const slug = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      headings.push({ level, text, slug });
    }
  });

  return headings;
}
