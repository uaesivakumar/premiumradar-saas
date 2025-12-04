/**
 * LLM Extractor Service
 *
 * Uses OpenAI to extract structured data from news/text:
 * - Company names from hiring news
 * - Signal extraction (hiring count, expansion, etc.)
 * - Entity enrichment
 *
 * Used with SERP for company discovery without Apollo.
 */

import { getIntegrationConfig, recordUsage, recordError } from './api-integrations';
import type { SerpNewsResult, ExtractedSignal, SignalType } from './serp';

// =============================================================================
// TYPES
// =============================================================================

export interface ExtractedCompany {
  name: string;
  domain?: string;
  industry?: string;
  city?: string;
  country?: string;
  headcount?: number;
  hiringCount?: number;
  signals: ExtractedSignal[];
  confidence: number;
  source: string;
  sourceUrl: string;
}

export interface LLMExtractionResult {
  companies: ExtractedCompany[];
  totalExtracted: number;
  model: string;
  tokensUsed: number;
}

// =============================================================================
// OPENAI CLIENT
// =============================================================================

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

/**
 * Make OpenAI API request
 */
async function openaiRequest<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const config = await getIntegrationConfig('openai');

  if (!config) {
    // Fallback to env var
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API not configured. Add OPENAI_API_KEY.');
    }

    const response = await fetch(`${OPENAI_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  const url = `${config.baseUrl || OPENAI_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (config.integrationId) {
      await recordError(config.integrationId, `${response.status}: ${errorText}`);
    }
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  if (config.integrationId) {
    await recordUsage(config.integrationId);
  }

  return response.json();
}

// =============================================================================
// COMPANY EXTRACTION
// =============================================================================

/**
 * Extract company names and signals from news articles using LLM
 *
 * IMPORTANT: This is sub-vertical aware!
 * - Employee Banking: Focus on companies hiring = need PAYROLL/SALARY accounts
 * - Corporate Banking: Focus on large deals, treasury needs
 * - SME Banking: Focus on startups, small business growth
 */
export async function extractCompaniesFromNews(
  newsResults: SerpNewsResult[],
  options?: {
    vertical?: string;
    subVertical?: string;
    region?: string;
    maxCompanies?: number;
  }
): Promise<LLMExtractionResult> {
  if (newsResults.length === 0) {
    return {
      companies: [],
      totalExtracted: 0,
      model: 'gpt-4o-mini',
      tokensUsed: 0,
    };
  }

  // Prepare news content for LLM
  const newsToProcess = newsResults.slice(0, 20);
  console.log('[LLM] Processing', newsToProcess.length, 'news articles');
  console.log('[LLM] Sample titles:', newsToProcess.slice(0, 3).map(n => n.title));

  const newsContent = newsToProcess
    .map((n, i) => `[${i + 1}] Title: ${n.title}\nSnippet: ${n.snippet || 'N/A'}\nSource: ${n.source}\nDate: ${n.date || 'N/A'}\nURL: ${n.link}`)
    .join('\n\n');

  // Build sub-vertical specific prompt
  const isEmployeeBanking = options?.subVertical === 'employee-banking';
  const isCorporateBanking = options?.subVertical === 'corporate-banking';
  const isSMEBanking = options?.subVertical === 'sme-banking';

  let contextDescription = '';
  let valueProposition = '';
  let relevantSignals = '';

  if (isEmployeeBanking) {
    contextDescription = `You are a lead generation analyst for a Bank's EMPLOYEE BANKING division.
Your job is to find companies that are HIRING or EXPANDING their workforce in ${options?.region || 'UAE'}.

WHY THIS MATTERS:
- Companies hiring employees = NEW EMPLOYEES need PAYROLL ACCOUNTS and SALARY ACCOUNTS
- More employees = Higher payroll volume = Better opportunity for the bank
- Each new employee needs: salary account, debit card, possibly loans/credit cards

TARGET COMPANIES: Large employers, growing companies, companies opening offices, market entrants`;

    valueProposition = `HOW THIS HELPS EMPLOYEE BANKING SALES:
- 100 new hires = 100 potential new salary account holders
- Company with 5000 employees = massive payroll opportunity
- New office opening = entire workforce needs banking setup`;

    relevantSignals = `RELEVANT SIGNALS FOR EMPLOYEE BANKING:
- hiring-expansion: Company announcing hiring (MOST IMPORTANT - direct payroll opportunity)
- office-opening: New office = new employees need banking
- market-entry: Company entering UAE = needs local payroll partner
- headcount-jump: Sudden workforce growth = urgent banking need
- leadership-hiring: C-suite hires indicate company growth`;
  } else if (isCorporateBanking) {
    contextDescription = `You are a lead generation analyst for a Bank's CORPORATE BANKING division.
Find companies that need treasury services, trade finance, or corporate loans in ${options?.region || 'UAE'}.`;
    valueProposition = `Focus on: Large transactions, funding rounds, M&A activity, international expansion`;
    relevantSignals = `RELEVANT: funding-round, market-entry, project-award, subsidiary-creation`;
  } else if (isSMEBanking) {
    contextDescription = `You are a lead generation analyst for a Bank's SME BANKING division.
Find small and medium businesses that are growing in ${options?.region || 'UAE'}.`;
    valueProposition = `Focus on: Startups, growing small businesses, franchise expansions`;
    relevantSignals = `RELEVANT: funding-round, market-entry, expansion`;
  } else {
    // Generic banking
    contextDescription = `You are a business intelligence analyst extracting company information from news for banking opportunities in ${options?.region || 'UAE'}.`;
    valueProposition = '';
    relevantSignals = '';
  }

  const systemPrompt = `${contextDescription}

${valueProposition}

${relevantSignals}

For each company found, extract:
- name: Company name (required)
- domain: Website domain if mentioned
- industry: Industry/sector
- city: City in ${options?.region || 'UAE'}
- hiringCount: Number of positions if mentioned (CRITICAL for Employee Banking)
- signalType: Type of signal (hiring-expansion, office-opening, market-entry, funding-round, leadership-hiring, headcount-jump, subsidiary-creation)
- signalDescription: Brief description explaining WHY this is a good lead
- ebOpportunity: For Employee Banking - explain the payroll/salary account opportunity
- confidence: Your confidence 0-1

Return JSON with a "companies" array. Only include real companies, not generic terms.
${isEmployeeBanking ? 'PRIORITY: Companies with clear hiring numbers or workforce expansion.' : ''}`;

  const userPrompt = `Extract companies from these news articles:\n\n${newsContent}\n\nReturn JSON with format:
{
  "companies": [
    {
      "name": "Company Name",
      "domain": "company.com",
      "industry": "Technology",
      "city": "Dubai",
      "hiringCount": 100,
      "signalType": "hiring-expansion",
      "signalDescription": "Company is hiring 100 engineers in Dubai",
      ${isEmployeeBanking ? '"ebOpportunity": "100 new salary accounts + payroll processing",' : ''}
      "confidence": 0.9,
      "sourceIndex": 1
    }
  ]
}`;

  try {
    const response = await openaiRequest<{
      choices: Array<{
        message: {
          content: string;
        };
      }>;
      usage?: {
        total_tokens: number;
      };
    }>('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '[]';
    console.log('[LLM] Raw OpenAI response length:', content.length);
    console.log('[LLM] First 500 chars:', content.substring(0, 500));

    let parsed: { companies?: Array<{
      name: string;
      domain?: string;
      industry?: string;
      city?: string;
      hiringCount?: number;
      signalType?: string;
      signalDescription?: string;
      ebOpportunity?: string; // EB-specific: explains payroll/salary opportunity
      confidence?: number;
      sourceIndex?: number;
    }> } = { companies: [] };

    try {
      const rawParsed = JSON.parse(content);
      console.log('[LLM] Parsed successfully. Type:', typeof rawParsed, 'Is array:', Array.isArray(rawParsed));

      // Handle both array and object with companies key
      if (Array.isArray(rawParsed)) {
        parsed = { companies: rawParsed };
        console.log('[LLM] Found array with', rawParsed.length, 'items');
      } else if (rawParsed.companies) {
        parsed = rawParsed;
        console.log('[LLM] Found companies key with', rawParsed.companies.length, 'items');
      } else {
        console.log('[LLM] Unknown response format. Keys:', Object.keys(rawParsed));
      }
    } catch (parseError) {
      console.warn('[LLM] Failed to parse response:', content);
      console.error('[LLM] Parse error:', parseError);
    }

    // Transform to ExtractedCompany format
    const isEB = options?.subVertical === 'employee-banking';
    const companies: ExtractedCompany[] = (parsed.companies || [])
      .filter(c => c.name && c.name.length > 2)
      .slice(0, options?.maxCompanies || 25)
      .map(c => {
        const sourceIdx = (c.sourceIndex || 1) - 1;
        const sourceNews = newsResults[sourceIdx] || newsResults[0];

        // Build EB-specific description if applicable
        let description = c.signalDescription || `${c.name} is actively hiring`;
        if (isEB && c.ebOpportunity) {
          description = `${description}\n\n💼 EB OPPORTUNITY: ${c.ebOpportunity}`;
        } else if (isEB && c.hiringCount) {
          description = `${description}\n\n💼 EB OPPORTUNITY: ${c.hiringCount} potential new salary accounts + payroll processing`;
        }

        const signal: ExtractedSignal = {
          type: (c.signalType as SignalType) || 'hiring-expansion',
          title: c.signalType?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Hiring Signal',
          description,
          source: sourceNews?.source || 'News',
          sourceUrl: sourceNews?.link || '',
          date: sourceNews?.date,
          confidence: c.confidence || 0.7,
        };

        return {
          name: c.name,
          domain: c.domain,
          industry: c.industry,
          city: c.city || options?.region,
          country: options?.region || 'UAE',
          hiringCount: c.hiringCount,
          signals: [signal],
          confidence: c.confidence || 0.7,
          source: sourceNews?.source || 'News',
          sourceUrl: sourceNews?.link || '',
        };
      });

    // Deduplicate by company name
    const uniqueCompanies = companies.filter((company, index, self) =>
      index === self.findIndex(c => c.name.toLowerCase() === company.name.toLowerCase())
    );

    return {
      companies: uniqueCompanies,
      totalExtracted: uniqueCompanies.length,
      model: 'gpt-4o-mini',
      tokensUsed: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('[LLM] Extraction failed:', error);
    return {
      companies: [],
      totalExtracted: 0,
      model: 'gpt-4o-mini',
      tokensUsed: 0,
    };
  }
}

/**
 * Enrich a company with more details using LLM
 */
export async function enrichCompanyWithLLM(
  companyName: string,
  existingData: Partial<ExtractedCompany>
): Promise<ExtractedCompany | null> {
  const systemPrompt = `You are a business intelligence analyst. Given a company name, provide what you know about it.
Return JSON with: name, domain, industry, city, country, description, estimatedHeadcount.
Only include information you are confident about. If unsure, omit the field.`;

  const userPrompt = `Company: ${companyName}
${existingData.industry ? `Industry hint: ${existingData.industry}` : ''}
${existingData.city ? `Location hint: ${existingData.city}` : ''}

Return JSON with company details.`;

  try {
    const response = await openaiRequest<{
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    }>('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      name: parsed.name || companyName,
      domain: parsed.domain || existingData.domain,
      industry: parsed.industry || existingData.industry,
      city: parsed.city || existingData.city,
      country: parsed.country || existingData.country || 'UAE',
      headcount: parsed.estimatedHeadcount || existingData.headcount,
      signals: existingData.signals || [],
      confidence: 0.6,
      source: 'LLM Enrichment',
      sourceUrl: '',
    };
  } catch (error) {
    console.error('[LLM] Enrichment failed:', error);
    return null;
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export const llmExtractor = {
  extractCompanies: extractCompaniesFromNews,
  enrichCompany: enrichCompanyWithLLM,
};

export default llmExtractor;
