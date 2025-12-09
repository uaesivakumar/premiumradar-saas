/**
 * Waitlist API - Sprint S133 (Enhanced)
 *
 * Intelligent email capture with:
 * - Email Quality Engine integration
 * - Disposable email filtering
 * - Domain → Industry classification
 * - Lead type inference
 * - Vertical suggestion
 * - Analytics event emission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { analyzeEmail, generateQualityReport, type EmailQualityResult } from '@/lib/email/quality-engine';

interface WaitlistEntry {
  email: string;
  name?: string;
  company?: string;
  role?: string;
  source?: string;
  referrer?: string;
  userAgent?: string;
  geo?: {
    country?: string;
    city?: string;
  };
}

interface WaitlistResponse {
  success: boolean;
  message: string;
  alreadyRegistered?: boolean;
  position?: number;
  data?: {
    id: number;
    position: number;
    qualityTier: string;
    suggestedVertical: string | null;
    createdAt: string;
  };
  error?: string;
  qualityIssue?: string;
}

// POST - Add to waitlist with quality scoring
export async function POST(request: NextRequest): Promise<NextResponse<WaitlistResponse>> {
  try {
    const body: WaitlistEntry = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { success: false, message: 'Email is required', error: 'Email is required' },
        { status: 400 }
      );
    }

    // =========================================================================
    // EMAIL QUALITY ENGINE
    // =========================================================================
    const emailAnalysis: EmailQualityResult = analyzeEmail(body.email);

    // Reject invalid emails
    if (!emailAnalysis.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please use a valid email address',
          error: 'Invalid email',
          qualityIssue: emailAnalysis.isDisposable ? 'disposable' : 'invalid',
        },
        { status: 400 }
      );
    }

    // Reject disposable emails
    if (emailAnalysis.isDisposable) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please use your work email for early access',
          error: 'Disposable email not allowed',
          qualityIssue: 'disposable',
        },
        { status: 400 }
      );
    }

    // Warn on low quality but allow
    const qualityWarning = emailAnalysis.qualityTier === 'low'
      ? 'Consider using your corporate email for priority access'
      : null;

    // =========================================================================
    // DATABASE OPERATIONS
    // =========================================================================
    const pool = getPool();

    // Check if email already exists
    const existingResult = await pool.query(
      'SELECT id, created_at FROM waitlist WHERE email = $1',
      [emailAnalysis.email]
    );

    if (existingResult.rows.length > 0) {
      const position = await getWaitlistPosition(pool, emailAnalysis.email);
      return NextResponse.json({
        success: true,
        message: "You're already on the waitlist!",
        alreadyRegistered: true,
        position,
      });
    }

    // Insert new waitlist entry with full intelligence data
    const result = await pool.query(
      `INSERT INTO waitlist (
        email, name, company, role, domain,
        is_corporate, source, referrer,
        quality_score, quality_tier, lead_type,
        inferred_company, inferred_industry, inferred_vertical, inferred_sub_vertical,
        inferred_country, inferred_region,
        email_flags,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17,
        $18,
        NOW()
      )
      RETURNING id, created_at`,
      [
        emailAnalysis.email,
        body.name || null,
        body.company || emailAnalysis.company?.name || null,
        body.role || null,
        emailAnalysis.domain,
        emailAnalysis.isCorporate,
        body.source || 'landing-page',
        body.referrer || null,
        emailAnalysis.qualityScore,
        emailAnalysis.qualityTier,
        emailAnalysis.leadType,
        emailAnalysis.company?.name || null,
        emailAnalysis.industry?.primary || null,
        emailAnalysis.suggestedVertical,
        emailAnalysis.suggestedSubVertical,
        emailAnalysis.region?.country || null,
        emailAnalysis.region?.countryCode || null,
        JSON.stringify(emailAnalysis.flags),
      ]
    );

    const position = await getWaitlistPosition(pool, emailAnalysis.email);

    // =========================================================================
    // ANALYTICS EVENT EMISSION
    // =========================================================================
    await emitWaitlistEvent({
      type: 'waitlist_signup',
      email: emailAnalysis.email,
      domain: emailAnalysis.domain,
      qualityScore: emailAnalysis.qualityScore,
      qualityTier: emailAnalysis.qualityTier,
      leadType: emailAnalysis.leadType,
      vertical: emailAnalysis.suggestedVertical,
      subVertical: emailAnalysis.suggestedSubVertical,
      country: emailAnalysis.region?.country,
      source: body.source || 'landing-page',
      timestamp: new Date().toISOString(),
    });

    // Build response message
    let message = "Welcome to the waitlist!";
    if (emailAnalysis.qualityTier === 'premium') {
      message = "You're in! As a priority lead, expect early access soon.";
    } else if (qualityWarning) {
      message = `You're on the list! ${qualityWarning}`;
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        id: result.rows[0].id,
        position,
        qualityTier: emailAnalysis.qualityTier,
        suggestedVertical: emailAnalysis.suggestedVertical,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error('Waitlist API error:', error);

    // Handle table doesn't exist - create it
    if ((error as Error).message?.includes('relation "waitlist" does not exist')) {
      try {
        await createWaitlistTable();
        // Retry the request
        return POST(request);
      } catch {
        return NextResponse.json(
          { success: false, message: 'Database setup in progress. Please try again.', error: 'Database setup' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Failed to join waitlist', error: 'Internal error' },
      { status: 500 }
    );
  }
}

// GET - Get waitlist stats with quality breakdown
export async function GET() {
  try {
    const pool = getPool();

    const result = await pool.query(`
      SELECT
        COUNT(*) as total_count,
        COUNT(CASE WHEN is_corporate THEN 1 END) as corporate_count,
        COUNT(CASE WHEN quality_tier = 'premium' THEN 1 END) as premium_count,
        COUNT(CASE WHEN quality_tier = 'standard' THEN 1 END) as standard_count,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN inferred_country = 'United Arab Emirates' THEN 1 END) as uae_count,
        AVG(quality_score) as avg_quality_score
      FROM waitlist
    `);

    const verticalBreakdown = await pool.query(`
      SELECT inferred_vertical, COUNT(*) as count
      FROM waitlist
      WHERE inferred_vertical IS NOT NULL
      GROUP BY inferred_vertical
    `);

    const stats = result.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        totalSignups: parseInt(stats.total_count) || 0,
        corporateSignups: parseInt(stats.corporate_count) || 0,
        premiumLeads: parseInt(stats.premium_count) || 0,
        standardLeads: parseInt(stats.standard_count) || 0,
        last24Hours: parseInt(stats.last_24h) || 0,
        uaeSignups: parseInt(stats.uae_count) || 0,
        averageQualityScore: Math.round(parseFloat(stats.avg_quality_score) || 0),
        verticalBreakdown: verticalBreakdown.rows.reduce((acc, row) => {
          acc[row.inferred_vertical] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('Waitlist stats error:', error);

    // Return mock data if table doesn't exist
    return NextResponse.json({
      success: true,
      data: {
        totalSignups: 0,
        corporateSignups: 0,
        premiumLeads: 0,
        standardLeads: 0,
        last24Hours: 0,
        uaeSignups: 0,
        averageQualityScore: 0,
        verticalBreakdown: {},
      },
    });
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

async function getWaitlistPosition(pool: ReturnType<typeof getPool>, email: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) + 1 as position
     FROM waitlist
     WHERE created_at < (SELECT created_at FROM waitlist WHERE email = $1)`,
    [email]
  );
  return parseInt(result.rows[0]?.position) || 1;
}

async function createWaitlistTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      company VARCHAR(255),
      role VARCHAR(255),
      domain VARCHAR(255),
      is_corporate BOOLEAN DEFAULT false,
      source VARCHAR(100),
      referrer TEXT,

      -- Quality scoring
      quality_score INTEGER DEFAULT 0,
      quality_tier VARCHAR(20),
      lead_type VARCHAR(50),

      -- Inferred intelligence
      inferred_company VARCHAR(255),
      inferred_industry VARCHAR(100),
      inferred_vertical VARCHAR(50),
      inferred_sub_vertical VARCHAR(50),
      inferred_country VARCHAR(100),
      inferred_region VARCHAR(10),

      -- Flags and metadata
      email_flags JSONB DEFAULT '[]',

      -- Beta access
      beta_code VARCHAR(50),
      invited_at TIMESTAMP,

      -- Timestamps
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create indexes for common queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_waitlist_domain ON waitlist(domain);
    CREATE INDEX IF NOT EXISTS idx_waitlist_quality_tier ON waitlist(quality_tier);
    CREATE INDEX IF NOT EXISTS idx_waitlist_vertical ON waitlist(inferred_vertical);
    CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at);
  `);
}

// =============================================================================
// Analytics Event Emission
// =============================================================================

interface WaitlistEvent {
  type: 'waitlist_signup';
  email: string;
  domain: string;
  qualityScore: number;
  qualityTier: string;
  leadType: string;
  vertical: string | null;
  subVertical: string | null;
  country: string | undefined;
  source: string;
  timestamp: string;
}

async function emitWaitlistEvent(event: WaitlistEvent): Promise<void> {
  try {
    // Store event in database for analytics pipeline
    const pool = getPool();
    await pool.query(
      `INSERT INTO analytics_events (event_type, event_data, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING`,
      ['waitlist_signup', JSON.stringify(event)]
    ).catch(() => {
      // Silently fail if table doesn't exist - analytics is optional
    });

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Event]', event);
    }

    // Future: Send to analytics service (Segment, Mixpanel, etc.)
    // await fetch(process.env.ANALYTICS_ENDPOINT, {
    //   method: 'POST',
    //   body: JSON.stringify(event),
    // });
  } catch (error) {
    // Analytics should never block the main flow
    console.error('Analytics event emission failed:', error);
  }
}
