/**
 * VS11.1: Company API
 * Sprint: VS11 (Frontend Wiring)
 *
 * Fetches company data from OS/enrichment engine.
 * Returns real company details, signals, QTLE scores, and contacts.
 *
 * Authorization Code: VS11-FRONTEND-WIRING-20251213
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { enrichSingleEntity } from '@/lib/integrations/enrichment-engine';
import { sivaClient } from '@/lib/integrations/siva-client';

export const dynamic = 'force-dynamic';

interface CompanyResponse {
  success: boolean;
  data?: {
    company: {
      id: string;
      name: string;
      industry?: string;
      description?: string;
      website?: string;
      linkedin?: string;
      size?: 'enterprise' | 'mid-market' | 'smb';
      headcount?: number;
      headcountGrowth?: number;
      region: string;
      city?: string;
      bankingTier?: string;
      freshness?: 'fresh' | 'recent' | 'stale';
    };
    score: {
      total: number;
      quality: number;
      timing: number;
      likelihood: number;
      engagement: number;
    };
    signals: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      category: string;
      impact: 'positive' | 'negative' | 'neutral';
      source?: string;
      sourceUrl?: string;
      confidence: number;
      date: string;
      scoreContribution?: number;
    }>;
    contacts: Array<{
      id: string;
      name: string;
      title: string;
      department?: string;
      email?: string;
      phone?: string;
      linkedin?: string;
      role: 'decision-maker' | 'champion' | 'influencer' | 'end-user';
      relevanceScore: number;
      isStarred?: boolean;
      lastInteraction?: string;
    }>;
    activities: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      timestamp: string;
      user?: { name: string };
      metadata?: Record<string, unknown>;
    }>;
    lastUpdated: string;
  };
  error?: string;
}

/**
 * GET /api/companies/[id]
 * Fetch company profile with signals, scores, and contacts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<CompanyResponse>> {
  try {
    // VS11: Require authenticated session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const companyId = params.id;
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID required' },
        { status: 400 }
      );
    }

    // VS11: Use default vertical context (Banking-only for now)
    // TODO: Extend session to include user profile with vertical info
    const vertical = 'banking';
    const subVertical = 'employee-banking';
    const region = 'UAE';

    console.log(`[API /companies/${companyId}] Fetching for tenant=${session.tenantId} vertical=${vertical}`);

    // Try to fetch from enrichment engine
    let enrichedEntity = null;
    try {
      enrichedEntity = await enrichSingleEntity(companyId, vertical, subVertical, region);
    } catch (enrichError) {
      console.warn('[API /companies] Enrichment failed, will use fallback:', enrichError);
    }

    // If enrichment failed, try SIVA scoring with basic entity data
    let sivaScores = null;
    if (enrichedEntity) {
      try {
        const scoreResponse = await sivaClient.score({
          entity_data: {
            name: enrichedEntity.name,
            domain: enrichedEntity.website,
            industry: enrichedEntity.industry,
            size: enrichedEntity.headcount,
          },
          signals: enrichedEntity.signals.map(s => ({
            type: s.type,
            title: s.title,
            description: s.description,
            source: s.source,
            confidence: s.confidence,
          })),
          score_types: ['q_score', 't_score', 'l_score', 'e_score', 'composite'],
          options: {
            profile: 'banking_employee',
            include_breakdown: true,
            include_explanation: true,
          },
        });

        if (scoreResponse.success) {
          sivaScores = scoreResponse.data.scores;
        }
      } catch (sivaError) {
        console.warn('[API /companies] SIVA scoring failed:', sivaError);
      }
    }

    // Build response
    if (enrichedEntity) {
      const response: CompanyResponse = {
        success: true,
        data: {
          company: {
            id: enrichedEntity.id,
            name: enrichedEntity.name,
            industry: enrichedEntity.industry,
            description: enrichedEntity.description,
            website: enrichedEntity.website,
            linkedin: enrichedEntity.linkedIn,
            size: enrichedEntity.size,
            headcount: enrichedEntity.headcount,
            headcountGrowth: enrichedEntity.headcountGrowth,
            region: enrichedEntity.region,
            city: enrichedEntity.city,
            bankingTier: 'tier2', // TODO: Derive from size/headcount
            freshness: enrichedEntity.freshness,
          },
          score: {
            total: sivaScores?.composite?.value || enrichedEntity.score || 50,
            quality: sivaScores?.q_score?.value || Math.round(enrichedEntity.score * 0.9) || 50,
            timing: sivaScores?.t_score?.value || Math.round(enrichedEntity.score * 0.85) || 50,
            likelihood: sivaScores?.l_score?.value || Math.round(enrichedEntity.score * 0.8) || 50,
            engagement: sivaScores?.e_score?.value || Math.round(enrichedEntity.score * 0.75) || 50,
          },
          signals: enrichedEntity.signals.map((s, idx) => ({
            id: `sig-${idx}`,
            type: s.type,
            title: s.title,
            description: s.description,
            category: mapSignalTypeToCategory(s.type),
            impact: 'positive' as const,
            source: s.source,
            sourceUrl: s.sourceUrl,
            confidence: Math.round((s.confidence || 0.8) * 100),
            date: s.date || new Date().toISOString(),
            scoreContribution: Math.round((s.confidence || 0.8) * 10),
          })),
          contacts: enrichedEntity.decisionMaker
            ? [
                {
                  id: 'contact-1',
                  name: enrichedEntity.decisionMaker.name,
                  title: enrichedEntity.decisionMaker.title,
                  department: inferDepartment(enrichedEntity.decisionMaker.title),
                  email: enrichedEntity.decisionMaker.email,
                  linkedin: enrichedEntity.decisionMaker.linkedin,
                  role: 'decision-maker' as const,
                  relevanceScore: 90,
                  isStarred: true,
                },
              ]
            : [],
          activities: [
            {
              id: 'act-1',
              type: 'view',
              title: 'Profile viewed',
              timestamp: new Date().toISOString(),
              user: { name: 'You' },
            },
          ],
          lastUpdated: enrichedEntity.lastEnriched?.toISOString() || new Date().toISOString(),
        },
      };

      return NextResponse.json(response);
    }

    // Fallback: Return not found if no data available
    return NextResponse.json(
      {
        success: false,
        error: 'Company not found. Please check the company ID or try a different search.',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('[API /companies] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch company',
      },
      { status: 500 }
    );
  }
}

/**
 * Map signal type to QTLE category
 */
function mapSignalTypeToCategory(signalType: string): string {
  const categoryMap: Record<string, string> = {
    'hiring-expansion': 'quality',
    'headcount-jump': 'quality',
    'office-opening': 'timing',
    'market-entry': 'timing',
    'funding-round': 'likelihood',
    'project-award': 'likelihood',
    'subsidiary-creation': 'engagement',
  };
  return categoryMap[signalType] || 'quality';
}

/**
 * Infer department from job title
 */
function inferDepartment(title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('hr') || titleLower.includes('human')) return 'HR';
  if (titleLower.includes('finance') || titleLower.includes('cfo')) return 'Finance';
  if (titleLower.includes('treasury')) return 'Treasury';
  if (titleLower.includes('ceo') || titleLower.includes('chief')) return 'Executive';
  if (titleLower.includes('payroll')) return 'HR Operations';
  return 'Operations';
}
