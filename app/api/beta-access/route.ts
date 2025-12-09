/**
 * Beta Access Verification API - Sprint S133 (Enhanced)
 *
 * Access codes resolve to complete user context:
 * - Vertical & Sub-vertical
 * - Region & Territory
 * - Tenant (optional)
 * - Pack template
 * - Persona configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { resolveAccessCode, type AccessCodeResolution } from '@/lib/access/beta-codes';
import { analyzeEmail } from '@/lib/email/quality-engine';

interface BetaAccessRequest {
  code: string;
  email?: string;
}

interface BetaAccessResponse {
  success: boolean;
  valid: boolean;
  message: string;
  type?: 'founder' | 'beta' | 'enterprise' | 'partner' | 'demo';

  // Resolved context (if valid)
  context?: {
    vertical: string;
    subVertical: string;
    region: string;
    territory?: string;
    tenantId?: string;
    tenantName?: string;
    packTemplate: string;
    personaId: string;
  };

  // Email intelligence (if email provided)
  emailIntelligence?: {
    company?: string;
    industry?: string;
    region?: string;
    qualityTier: string;
  };
}

// POST - Verify beta access code
export async function POST(request: NextRequest): Promise<NextResponse<BetaAccessResponse>> {
  try {
    const body: BetaAccessRequest = await request.json();

    if (!body.code) {
      return NextResponse.json(
        { success: false, valid: false, message: 'Access code is required' },
        { status: 400 }
      );
    }

    // =========================================================================
    // RESOLVE ACCESS CODE
    // =========================================================================
    const resolution: AccessCodeResolution = resolveAccessCode(body.code);

    if (!resolution.valid) {
      // Try database lookup for dynamic codes
      const dbResult = await lookupCodeInDatabase(body.code);
      if (dbResult.valid) {
        return NextResponse.json({
          success: true,
          valid: true,
          message: dbResult.message,
          type: dbResult.type,
          context: {
            vertical: dbResult.vertical!,
            subVertical: dbResult.subVertical!,
            region: dbResult.region!,
            territory: dbResult.territory,
            tenantId: dbResult.tenantId,
            tenantName: dbResult.tenantName,
            packTemplate: dbResult.packTemplate!,
            personaId: dbResult.personaId!,
          },
        });
      }

      return NextResponse.json({
        success: true,
        valid: false,
        message: resolution.message,
      });
    }

    // =========================================================================
    // EMAIL INTELLIGENCE (if provided)
    // =========================================================================
    let emailIntelligence: BetaAccessResponse['emailIntelligence'] | undefined;

    if (body.email) {
      const emailAnalysis = analyzeEmail(body.email);
      emailIntelligence = {
        company: emailAnalysis.company?.name,
        industry: emailAnalysis.industry?.primary,
        region: emailAnalysis.region?.country,
        qualityTier: emailAnalysis.qualityTier,
      };

      // Cross-check: If email domain suggests different vertical, log warning
      if (
        emailAnalysis.suggestedVertical &&
        emailAnalysis.suggestedVertical !== resolution.vertical
      ) {
        console.warn(
          `[Beta Access] Vertical mismatch: Code suggests ${resolution.vertical}, email suggests ${emailAnalysis.suggestedVertical}`
        );
      }
    }

    // =========================================================================
    // RECORD ACCESS CODE USAGE
    // =========================================================================
    await recordCodeUsage(body.code, body.email, resolution);

    // =========================================================================
    // EMIT ANALYTICS EVENT
    // =========================================================================
    await emitBetaAccessEvent({
      type: 'beta_access_verified',
      code: body.code,
      codeType: resolution.type!,
      vertical: resolution.vertical!,
      subVertical: resolution.subVertical!,
      region: resolution.region!,
      email: body.email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      valid: true,
      message: getWelcomeMessage(resolution),
      type: resolution.type,
      context: {
        vertical: resolution.vertical!,
        subVertical: resolution.subVertical!,
        region: resolution.region!,
        territory: resolution.territory,
        tenantId: resolution.tenantId,
        tenantName: resolution.tenantName,
        packTemplate: resolution.packTemplate!,
        personaId: resolution.personaId!,
      },
      emailIntelligence,
    });
  } catch (error) {
    console.error('Beta access verification error:', error);
    return NextResponse.json(
      { success: false, valid: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}

// GET - Check if beta access is required and get available verticals
export async function GET() {
  const betaRequired = process.env.BETA_ACCESS_REQUIRED !== 'false';

  return NextResponse.json({
    success: true,
    betaRequired,
    message: betaRequired
      ? 'Private beta - access code required'
      : 'Public access enabled',
    availableVerticals: [
      { id: 'banking', name: 'Banking', status: 'active' },
      { id: 'insurance', name: 'Insurance', status: 'coming-soon' },
      { id: 'real-estate', name: 'Real Estate', status: 'coming-soon' },
      { id: 'recruitment', name: 'Recruitment', status: 'coming-soon' },
      { id: 'saas-sales', name: 'SaaS Sales', status: 'coming-soon' },
    ],
  });
}

// =============================================================================
// Helper Functions
// =============================================================================

async function lookupCodeInDatabase(code: string): Promise<AccessCodeResolution> {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT *
       FROM beta_access_codes
       WHERE code = $1
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR current_uses < max_uses)`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return { valid: false, code, message: 'Invalid or expired access code' };
    }

    const row = result.rows[0];
    return {
      valid: true,
      code: row.code,
      message: row.description || 'Welcome to the beta!',
      vertical: row.vertical,
      subVertical: row.sub_vertical,
      region: row.region,
      territory: row.territory,
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      packTemplate: row.pack_template,
      personaId: row.persona_id,
      type: row.code_type,
    };
  } catch (error) {
    // Table might not exist
    console.warn('Beta access codes table not found:', error);
    return { valid: false, code, message: 'Invalid access code' };
  }
}

async function recordCodeUsage(
  code: string,
  email: string | undefined,
  resolution: AccessCodeResolution
): Promise<void> {
  try {
    const pool = getPool();

    // Update usage count in database
    await pool.query(
      `UPDATE beta_access_codes
       SET current_uses = current_uses + 1,
           last_used_at = NOW()
       WHERE code = $1`,
      [code.toUpperCase()]
    ).catch(() => {
      // Table might not exist - that's ok for predefined codes
    });

    // Record usage event
    await pool.query(
      `INSERT INTO beta_access_usage (code, email, vertical, sub_vertical, region, used_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        code.toUpperCase(),
        email || null,
        resolution.vertical,
        resolution.subVertical,
        resolution.region,
      ]
    ).catch(() => {
      // Table might not exist
    });
  } catch (error) {
    console.error('Failed to record code usage:', error);
  }
}

function getWelcomeMessage(resolution: AccessCodeResolution): string {
  const verticalNames: Record<string, string> = {
    'banking': 'Banking',
    'insurance': 'Insurance',
    'real-estate': 'Real Estate',
    'recruitment': 'Recruitment',
    'saas-sales': 'SaaS Sales',
  };

  const subVerticalNames: Record<string, string> = {
    'employee-banking': 'Employee Banking',
    'corporate-banking': 'Corporate Banking',
    'sme-banking': 'SME Banking',
    'individual': 'Individual',
    'corporate': 'Corporate',
    'health': 'Health',
    'residential': 'Residential',
    'commercial': 'Commercial',
    'off-plan': 'Off-Plan',
    'tech-talent': 'Tech Talent',
    'executive-search': 'Executive Search',
    'enterprise-sales': 'Enterprise Sales',
    'smb-sales': 'SMB Sales',
  };

  if (resolution.type === 'founder') {
    return 'Welcome, founder! Full access granted.';
  }

  if (resolution.type === 'enterprise' && resolution.tenantName) {
    return `Welcome, ${resolution.tenantName}! Your enterprise access is ready.`;
  }

  if (resolution.type === 'demo') {
    return 'Demo mode activated. Explore all features!';
  }

  const vertical = verticalNames[resolution.vertical!] || resolution.vertical;
  const subVertical = subVerticalNames[resolution.subVertical!] || resolution.subVertical;

  return `Welcome to PremiumRadar ${vertical} - ${subVertical}!`;
}

// =============================================================================
// Analytics Event Emission
// =============================================================================

interface BetaAccessEvent {
  type: 'beta_access_verified';
  code: string;
  codeType: string;
  vertical: string;
  subVertical: string;
  region: string;
  email?: string;
  timestamp: string;
}

async function emitBetaAccessEvent(event: BetaAccessEvent): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO analytics_events (event_type, event_data, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING`,
      ['beta_access_verified', JSON.stringify(event)]
    ).catch(() => {
      // Silently fail if table doesn't exist
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Event]', event);
    }
  } catch (error) {
    console.error('Analytics event emission failed:', error);
  }
}
