/**
 * SERP Integration Service
 *
 * Fetches REAL hiring news and signals from SerpAPI:
 * - Hiring announcements
 * - Expansion news
 * - Office openings
 * - Subsidiary creation
 * - Leadership changes
 *
 * NO MOCK DATA - ALL REAL API CALLS
 */

import { getIntegrationConfig, recordUsage, recordError } from './api-integrations';

// =============================================================================
// TYPES
// =============================================================================

export interface SerpNewsResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  date?: string;
  thumbnail?: string;
}

export interface SerpSearchResult {
  news: SerpNewsResult[];
  organic?: {
    title: string;
    link: string;
    snippet: string;
  }[];
  total: number;
}

export type SignalType =
  | 'hiring-expansion'
  | 'headcount-jump'
  | 'office-opening'
  | 'market-entry'
  | 'subsidiary-creation'
  | 'leadership-hiring'
  | 'funding-round'
  | 'expansion';

export interface ExtractedSignal {
  type: SignalType;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  date?: string;
  confidence: number;
}

// =============================================================================
// API CLIENT
// =============================================================================

const SERP_BASE_URL = 'https://serpapi.com/search';

/**
 * Make authenticated request to SerpAPI
 */
async function serpRequest(params: Record<string, string>): Promise<Record<string, unknown>> {
  const config = await getIntegrationConfig('serp');

  if (!config) {
    throw new Error('SerpAPI not configured. Add API key in Super Admin → Integrations.');
  }

  const searchParams = new URLSearchParams({
    ...params,
    api_key: config.apiKey,
  });

  const url = `${config.baseUrl || SERP_BASE_URL}?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (config.integrationId) {
      await recordError(config.integrationId, `${response.status}: ${errorText}`);
    }
    throw new Error(`SerpAPI error: ${response.status} - ${errorText}`);
  }

  if (config.integrationId) {
    await recordUsage(config.integrationId);
  }

  return response.json();
}

// =============================================================================
// NEWS SEARCH
// =============================================================================

/**
 * Search Google News for a query
 */
export async function searchNews(query: string, options?: {
  location?: string;
  timeRange?: 'd' | 'w' | 'm' | 'y';  // day, week, month, year
  num?: number;
}): Promise<SerpSearchResult> {
  const response = await serpRequest({
    engine: 'google_news',
    q: query,
    gl: 'ae',  // United Arab Emirates
    hl: 'en',
    ...(options?.location && { location: options.location }),
    ...(options?.timeRange && { tbs: `qdr:${options.timeRange}` }),
    ...(options?.num && { num: options.num.toString() }),
  }) as {
    news_results?: Array<{
      title: string;
      link: string;
      snippet?: string;
      source?: { name?: string };
      date?: string;
      thumbnail?: string;
    }>;
  };

  const news = (response.news_results || []).map(item => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet || '',
    source: item.source?.name || 'Unknown',
    date: item.date,
    thumbnail: item.thumbnail,
  }));

  return {
    news,
    total: news.length,
  };
}

/**
 * Search for hiring news for a company
 */
export async function searchHiringNews(companyName: string, options?: {
  location?: string;
  timeRange?: 'd' | 'w' | 'm' | 'y';
}): Promise<SerpSearchResult> {
  // Try multiple search queries to find hiring signals
  const queries = [
    `"${companyName}" hiring UAE`,
    `"${companyName}" jobs Dubai`,
    `"${companyName}" recruitment`,
    `"${companyName}" expansion workforce`,
  ];

  const allNews: SerpNewsResult[] = [];

  for (const query of queries.slice(0, 2)) {  // Limit API calls
    try {
      const result = await searchNews(query, {
        location: options?.location || 'Dubai,United Arab Emirates',
        timeRange: options?.timeRange || 'm',  // Last month
        num: 10,
      });
      allNews.push(...result.news);
    } catch (error) {
      console.warn(`[SERP] Query failed: ${query}`, error);
    }
  }

  // Deduplicate by URL
  const uniqueNews = allNews.filter((news, index, self) =>
    index === self.findIndex(n => n.link === news.link)
  );

  return {
    news: uniqueNews,
    total: uniqueNews.length,
  };
}

/**
 * Search for expansion news for a company
 */
export async function searchExpansionNews(companyName: string): Promise<SerpSearchResult> {
  const query = `"${companyName}" (expansion OR "new office" OR "new branch" OR subsidiary OR "market entry") UAE`;

  return searchNews(query, {
    location: 'Dubai,United Arab Emirates',
    timeRange: 'm',
    num: 10,
  });
}

// =============================================================================
// SIGNAL EXTRACTION
// =============================================================================

/**
 * Extract EB signals from news results
 */
export function extractSignals(news: SerpNewsResult[]): ExtractedSignal[] {
  const signals: ExtractedSignal[] = [];

  for (const item of news) {
    const title = item.title.toLowerCase();
    const snippet = (item.snippet || '').toLowerCase();
    const combined = `${title} ${snippet}`;

    // Hiring signals
    if (
      combined.includes('hiring') ||
      combined.includes('recruit') ||
      combined.includes('jobs') ||
      combined.includes('positions') ||
      combined.includes('vacancies')
    ) {
      // Extract number if present
      const numberMatch = combined.match(/(\d+,?\d*)\s*(jobs|positions|roles|employees|staff)/);
      const count = numberMatch ? numberMatch[1].replace(',', '') : null;

      signals.push({
        type: 'hiring-expansion',
        title: 'Hiring Expansion',
        description: count
          ? `Hiring ${count}+ positions: ${item.title}`
          : `Active hiring: ${item.title}`,
        source: item.source,
        sourceUrl: item.link,
        date: item.date,
        confidence: combined.includes('hiring') ? 0.9 : 0.75,
      });
    }

    // Headcount growth
    if (
      combined.includes('headcount') ||
      combined.includes('workforce growth') ||
      combined.includes('employee growth') ||
      combined.includes('team expansion')
    ) {
      signals.push({
        type: 'headcount-jump',
        title: 'Headcount Growth',
        description: item.title,
        source: item.source,
        sourceUrl: item.link,
        date: item.date,
        confidence: 0.85,
      });
    }

    // Office opening
    if (
      combined.includes('new office') ||
      combined.includes('opens office') ||
      combined.includes('new branch') ||
      combined.includes('new location') ||
      combined.includes('headquarters')
    ) {
      signals.push({
        type: 'office-opening',
        title: 'New Office/Branch',
        description: item.title,
        source: item.source,
        sourceUrl: item.link,
        date: item.date,
        confidence: 0.88,
      });
    }

    // Market entry
    if (
      combined.includes('enters') ||
      combined.includes('expands to') ||
      combined.includes('launches in') ||
      combined.includes('market entry')
    ) {
      signals.push({
        type: 'market-entry',
        title: 'Market Entry/Expansion',
        description: item.title,
        source: item.source,
        sourceUrl: item.link,
        date: item.date,
        confidence: 0.82,
      });
    }

    // Subsidiary creation
    if (
      combined.includes('subsidiary') ||
      combined.includes('new company') ||
      combined.includes('spin-off') ||
      combined.includes('new division')
    ) {
      signals.push({
        type: 'subsidiary-creation',
        title: 'New Subsidiary/Division',
        description: item.title,
        source: item.source,
        sourceUrl: item.link,
        date: item.date,
        confidence: 0.85,
      });
    }

    // Leadership hiring
    if (
      combined.includes('appoints') ||
      combined.includes('names') ||
      combined.includes('hires') ||
      (combined.includes('new') && (
        combined.includes('ceo') ||
        combined.includes('cto') ||
        combined.includes('chro') ||
        combined.includes('director') ||
        combined.includes('vp')
      ))
    ) {
      signals.push({
        type: 'leadership-hiring',
        title: 'Leadership Change',
        description: item.title,
        source: item.source,
        sourceUrl: item.link,
        date: item.date,
        confidence: 0.8,
      });
    }

    // Funding round
    if (
      combined.includes('funding') ||
      combined.includes('raises') ||
      combined.includes('investment') ||
      combined.includes('series')
    ) {
      signals.push({
        type: 'funding-round',
        title: 'Funding/Investment',
        description: item.title,
        source: item.source,
        sourceUrl: item.link,
        date: item.date,
        confidence: 0.9,
      });
    }

    // General expansion
    if (
      combined.includes('expansion') ||
      combined.includes('growth plan') ||
      combined.includes('scaling')
    ) {
      signals.push({
        type: 'expansion',
        title: 'Expansion Plans',
        description: item.title,
        source: item.source,
        sourceUrl: item.link,
        date: item.date,
        confidence: 0.75,
      });
    }
  }

  // Deduplicate and sort by confidence
  const uniqueSignals = signals.filter((signal, index, self) =>
    index === self.findIndex(s => s.type === signal.type && s.sourceUrl === signal.sourceUrl)
  );

  return uniqueSignals.sort((a, b) => b.confidence - a.confidence);
}

// =============================================================================
// EB-SPECIFIC FUNCTIONS
// =============================================================================

/**
 * Get all hiring signals for a company
 */
export async function getCompanySignals(companyName: string): Promise<ExtractedSignal[]> {
  try {
    const [hiringNews, expansionNews] = await Promise.all([
      searchHiringNews(companyName),
      searchExpansionNews(companyName),
    ]);

    const allNews = [
      ...hiringNews.news,
      ...expansionNews.news,
    ];

    // Deduplicate
    const uniqueNews = allNews.filter((news, index, self) =>
      index === self.findIndex(n => n.link === news.link)
    );

    return extractSignals(uniqueNews);
  } catch (error) {
    console.error(`[SERP] Failed to get signals for ${companyName}:`, error);
    return [];
  }
}

/**
 * Search for top hiring companies in UAE
 */
export async function searchTopHiringCompanies(options?: {
  industry?: string;
  city?: string;
}): Promise<SerpSearchResult> {
  let query = 'companies hiring UAE';
  if (options?.industry) query += ` ${options.industry}`;
  if (options?.city) query += ` ${options.city}`;

  return searchNews(query, {
    location: options?.city ? `${options.city},United Arab Emirates` : 'Dubai,United Arab Emirates',
    timeRange: 'w',  // Last week for freshness
    num: 20,
  });
}
