/**
 * Intake API Endpoint
 *
 * S367: Intake API
 * Behavior Contracts:
 * - B015: Individual lead intake with dedup
 * - B016: Intake validates before save
 *
 * POST /api/workspace/intake - Add individual lead
 * POST /api/workspace/intake/batch - Add multiple leads
 * POST /api/workspace/intake/check-duplicate - Check for duplicates
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-gate';
import {
  individualIntake,
  validateLeadInput,
  IndividualLeadInput,
} from '@/lib/workspace/individual-intake';
import { logger } from '@/lib/logging/structured-logger';

/**
 * POST /api/workspace/intake
 * Add an individual lead
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth();
  if (!auth.success) {
    return auth.response;
  }

  const { session } = auth;
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    const body = await request.json();

    // Handle different actions
    if (action === 'check-duplicate') {
      return handleCheckDuplicate(session.tenantId, body);
    }

    if (action === 'batch') {
      return handleBatchIntake(session.tenantId, session.user.id, body);
    }

    // Default: single lead intake
    return handleSingleIntake(session.tenantId, session.user.id, body);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Intake API failed', {
      tenantId: session.tenantId,
      action,
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Intake failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single lead intake
 */
async function handleSingleIntake(
  tenantId: string,
  userId: string,
  body: {
    lead: IndividualLeadInput;
    options?: {
      skipDuplicateCheck?: boolean;
      assignToUserId?: string;
    };
  }
) {
  const { lead, options } = body;

  if (!lead) {
    return NextResponse.json(
      { success: false, error: 'lead object is required' },
      { status: 400 }
    );
  }

  // Validate before processing
  const validation = validateLeadInput(lead);
  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors,
        warnings: validation.warnings,
      },
      { status: 400 }
    );
  }

  // Process intake
  const result = await individualIntake.intakeLead(tenantId, userId, lead, options);

  if (!result.success) {
    const status = result.isDuplicate ? 409 : 400;
    return NextResponse.json(
      {
        success: false,
        error: result.message,
        isDuplicate: result.isDuplicate,
        duplicateInfo: result.duplicateInfo,
        validationErrors: result.validationErrors,
      },
      { status }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      leadId: result.leadId,
      message: result.message,
    },
  });
}

/**
 * Handle batch intake
 */
async function handleBatchIntake(
  tenantId: string,
  userId: string,
  body: {
    leads: IndividualLeadInput[];
    options?: {
      skipDuplicates?: boolean;
      assignToUserId?: string;
    };
  }
) {
  const { leads, options } = body;

  if (!leads || !Array.isArray(leads)) {
    return NextResponse.json(
      { success: false, error: 'leads array is required' },
      { status: 400 }
    );
  }

  if (leads.length > 100) {
    return NextResponse.json(
      { success: false, error: 'Maximum 100 leads per batch' },
      { status: 400 }
    );
  }

  const result = await individualIntake.intakeBatch(tenantId, userId, leads, options);

  return NextResponse.json({
    success: true,
    data: {
      total: leads.length,
      success: result.success,
      failed: result.failed,
      duplicates: result.duplicates,
      results: result.results.map((r) => ({
        leadId: r.leadId,
        success: r.success,
        isDuplicate: r.isDuplicate,
        message: r.message,
      })),
    },
  });
}

/**
 * Handle duplicate check
 */
async function handleCheckDuplicate(
  tenantId: string,
  body: {
    companyName?: string;
    companyDomain?: string;
    contactEmail?: string;
  }
) {
  const { companyName, companyDomain, contactEmail } = body;

  if (!companyName && !companyDomain && !contactEmail) {
    return NextResponse.json(
      { success: false, error: 'At least one field is required' },
      { status: 400 }
    );
  }

  const result = await individualIntake.checkForDuplicates(tenantId, {
    companyName: companyName || '',
    companyDomain,
    contactEmail,
  });

  return NextResponse.json({
    success: true,
    data: {
      isDuplicate: result.isDuplicate,
      matchType: result.matchType,
      existingLead: result.existingLead,
      similarLeads: result.similarLeads,
    },
  });
}
