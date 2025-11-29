/**
 * Industry Detection API Route - Sprint S48
 * Server-side endpoint for detecting industry from domain
 *
 * This API route handles the server-side OS enrichment call
 * to avoid importing server-only libraries in client components.
 */

import { NextRequest, NextResponse } from 'next/server';
import { osClient } from '@/lib/os-client';
import {
  IndustryDetection,
  IndustrySource,
  INDUSTRY_TO_VERTICAL,
} from '@/lib/auth/identity/types';
import { VerticalId } from '@/lib/stores/onboarding-store';

/**
 * Map raw industry string to known vertical
 */
function mapIndustryToVertical(industry: string): VerticalId | null {
  if (!industry) return null;

  const lower = industry.toLowerCase().trim();

  // Direct match
  if (INDUSTRY_TO_VERTICAL[lower]) {
    return INDUSTRY_TO_VERTICAL[lower];
  }

  // Partial match
  for (const [key, vertical] of Object.entries(INDUSTRY_TO_VERTICAL)) {
    if (lower.includes(key) || key.includes(lower)) {
      return vertical;
    }
  }

  return null;
}

/**
 * Calculate confidence score from multiple sources
 */
function calculateConfidenceScore(sources: IndustrySource[]): number {
  if (!sources.length) return 0;

  const sourceWeights: Record<string, number> = {
    'apollo': 0.9,
    'clearbit': 0.9,
    'crunchbase': 0.85,
    'linkedin': 0.8,
    'zoominfo': 0.85,
    'google': 0.6,
    'website': 0.5,
    'heuristic': 0.3,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const source of sources) {
    const weight = sourceWeights[source.name.toLowerCase()] || 0.5;
    weightedSum += source.confidence * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;

  return Math.round(weightedSum / totalWeight);
}

/**
 * Get consensus industry from multiple sources
 */
function getConsensusIndustry(sources: IndustrySource[]): string | null {
  if (!sources.length) return null;

  const industryScores = new Map<string, number>();

  for (const source of sources) {
    const lower = source.industry.toLowerCase();
    const current = industryScores.get(lower) || 0;
    industryScores.set(lower, current + source.confidence);
  }

  let bestIndustry: string | null = null;
  let bestScore = 0;

  for (const [industry, score] of industryScores.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestIndustry = industry;
    }
  }

  return bestIndustry;
}

/**
 * Detect industry from domain keywords (fallback)
 */
function detectIndustryFromDomainHeuristic(domain: string): string | null {
  const lower = domain.toLowerCase();

  if (lower.includes('bank') || lower.includes('credit') || lower.includes('finance')) {
    return 'banking';
  }
  if (lower.includes('insurance') || lower.includes('insure') || lower.includes('assurance')) {
    return 'insurance';
  }
  if (lower.includes('realty') || lower.includes('property') || lower.includes('estate') ||
      lower.includes('homes') || lower.includes('housing')) {
    return 'real estate';
  }
  if (lower.includes('pay') || lower.includes('wallet') || lower.includes('fintech')) {
    return 'fintech';
  }
  if (lower.includes('consult') || lower.includes('advisory') || lower.includes('partners')) {
    return 'consulting';
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid domain' },
        { status: 400 }
      );
    }

    const result: IndustryDetection = {
      domain,
      detectedIndustry: null,
      suggestedVertical: null,
      confidenceScore: 0,
      sources: [],
      detectedAt: new Date().toISOString(),
    };

    try {
      // Call OS enrichment API
      const osResponse = await osClient.enrich({
        tenant_id: 'system',
        entity_ids: [domain],
        enrichment_sources: ['clearbit', 'apollo', 'crunchbase'],
      });

      if (osResponse.success && osResponse.data) {
        const enrichmentData = osResponse.data as {
          entities?: Array<{
            domain: string;
            industry?: string;
            sources?: Array<{
              name: string;
              industry: string;
              confidence: number;
            }>;
          }>;
        };

        if (enrichmentData.entities?.[0]) {
          const entity = enrichmentData.entities[0];

          result.sources = (entity.sources || []).map(s => ({
            name: s.name,
            industry: s.industry,
            confidence: s.confidence,
          }));

          result.detectedIndustry = entity.industry || getConsensusIndustry(result.sources);
        }
      }
    } catch (osError) {
      console.error('[Industry Detection API] OS enrichment failed:', osError);
    }

    // Fallback to heuristic detection
    if (!result.detectedIndustry) {
      const heuristicResult = detectIndustryFromDomainHeuristic(domain);
      if (heuristicResult) {
        result.sources.push({
          name: 'heuristic',
          industry: heuristicResult,
          confidence: 30,
        });
        result.detectedIndustry = heuristicResult;
      }
    }

    // Calculate confidence and map to vertical
    result.confidenceScore = calculateConfidenceScore(result.sources);
    result.suggestedVertical = result.detectedIndustry
      ? mapIndustryToVertical(result.detectedIndustry)
      : null;

    return NextResponse.json({
      success: true,
      detection: result,
    });
  } catch (error) {
    console.error('[Industry Detection API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
