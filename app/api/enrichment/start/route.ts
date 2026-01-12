/**
 * Enrichment Start API - S396
 *
 * POST /api/enrichment/start
 *
 * Starts the enrichment pipeline for a company:
 * 1. Creates enrichment session
 * 2. Calls providers (Apollo) with role-scoped filters
 * 3. Scores contacts via QTLE
 * 4. Returns ranked contacts
 */

import { NextRequest, NextResponse } from 'next/server';
import { enrichCompanyContacts, getEnrichmentResult } from '@/lib/enrichment/enrichment-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      entityId,
      entityName,
      entityDomain,
      subVertical = 'employee-banking',
      region = 'UAE',
      maxContacts = 10,
    } = body;

    // Validate required fields
    if (!entityId || !entityName) {
      return NextResponse.json(
        { success: false, error: 'entityId and entityName are required' },
        { status: 400 }
      );
    }

    // TODO: Get from session/auth
    const userId = 'user_default';
    const tenantId = 'tenant_default';
    const workspaceId = 'workspace_default';

    console.log('[API /enrichment/start] Starting enrichment for:', entityName);

    // Run enrichment pipeline
    const result = await enrichCompanyContacts({
      entityId,
      entityName,
      entityDomain,
      userId,
      tenantId,
      workspaceId,
      subVertical,
      region,
      maxContacts,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          sessionId: result.sessionId,
        },
        { status: 500 }
      );
    }

    // Return scored contacts (never raw provider data)
    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      stage: result.session.stage,
      contacts: result.contacts.map(contact => ({
        id: contact.id,
        fullName: contact.fullName,
        firstName: contact.firstName,
        lastName: contact.lastName,
        title: contact.title,
        email: contact.email,
        linkedinUrl: contact.linkedinUrl,
        phone: contact.phone,
        role: contact.role,
        seniority: contact.seniority,
        department: contact.department,
        priority: contact.priority,
        priorityRank: contact.priorityRank,
        score: contact.qtleScore,
        scoreBreakdown: contact.scoreBreakdown,
        whyRecommended: contact.whyRecommended,
        confidence: contact.confidence,
      })),
      metrics: {
        contactsFound: result.session.contactsFound,
        contactsScored: result.session.contactsScored,
        providerCalls: result.session.providerCalls,
      },
    });

  } catch (error) {
    console.error('[API /enrichment/start] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrichment/start?sessionId=xxx
 * GET /api/enrichment/start?entityId=xxx
 *
 * Get enrichment result by session ID or entity ID
 * S396: Now loads from database if not in memory cache
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const entityId = searchParams.get('entityId');

    if (!sessionId && !entityId) {
      return NextResponse.json(
        { success: false, error: 'sessionId or entityId is required' },
        { status: 400 }
      );
    }

    // S396: getEnrichmentResult is now async and loads from DB
    let result;
    if (sessionId) {
      result = await getEnrichmentResult(sessionId);
    } else if (entityId) {
      // Also support looking up by entity ID
      const { getEnrichmentResultByEntity } = await import('@/lib/enrichment/enrichment-engine');
      result = await getEnrichmentResultByEntity(entityId);
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: result.success,
      sessionId: result.sessionId,
      stage: result.session.stage,
      contacts: result.contacts.map(contact => ({
        id: contact.id,
        fullName: contact.fullName,
        firstName: contact.firstName,
        lastName: contact.lastName,
        title: contact.title,
        email: contact.email,
        linkedinUrl: contact.linkedinUrl,
        phone: contact.phone,
        role: contact.role,
        seniority: contact.seniority,
        department: contact.department,
        priority: contact.priority,
        priorityRank: contact.priorityRank,
        score: contact.qtleScore,
        scoreBreakdown: contact.scoreBreakdown,
        whyRecommended: contact.whyRecommended,
        confidence: contact.confidence,
      })),
      error: result.error,
    });

  } catch (error) {
    console.error('[API /enrichment/start] GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
