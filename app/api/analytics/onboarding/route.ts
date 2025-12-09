/**
 * Onboarding Analytics API - Sprint S135
 *
 * Captures all onboarding events for:
 * - Conversion analysis
 * - Dropoff detection
 * - Self-healing triggers
 * - SIVA tuning
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

interface OnboardingEvent {
  type: string;
  step: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  email?: string;
  vertical?: string;
  subVertical?: string;
  regions?: string[];
  data?: Record<string, unknown>;
  timeOnStep?: number;
  totalTimeElapsed?: number;
  device?: string;
  userAgent?: string;
}

// POST - Record single event
export async function POST(request: NextRequest) {
  try {
    const event: OnboardingEvent = await request.json();

    if (!event.type || !event.step || !event.sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await storeEvent(event);

    // Check for self-healing triggers
    if (shouldTriggerSelfHealing(event)) {
      await triggerSelfHealing(event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record event' },
      { status: 500 }
    );
  }
}

// GET - Get analytics summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const pool = getPool();

    // Funnel analysis
    const funnelResult = await pool.query(`
      SELECT
        step,
        COUNT(DISTINCT session_id) as sessions,
        COUNT(*) as events
      FROM onboarding_events
      WHERE created_at > NOW() - INTERVAL '${days} days'
        AND event_type IN ('step_started', 'step_completed')
      GROUP BY step
      ORDER BY
        CASE step
          WHEN 'welcome' THEN 1
          WHEN 'identity' THEN 2
          WHEN 'workspace' THEN 3
          WHEN 'vertical' THEN 4
          WHEN 'subVertical' THEN 5
          WHEN 'regions' THEN 6
          WHEN 'transition' THEN 7
          WHEN 'complete' THEN 8
        END
    `).catch(() => ({ rows: [] }));

    // Dropoff analysis
    const dropoffResult = await pool.query(`
      SELECT
        step,
        COUNT(*) as dropoffs,
        AVG(time_on_step) as avg_time_before_dropoff
      FROM onboarding_events
      WHERE event_type = 'onboarding_abandoned'
        AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY step
      ORDER BY dropoffs DESC
    `).catch(() => ({ rows: [] }));

    // Confusion patterns
    const confusionResult = await pool.query(`
      SELECT
        step,
        event_data->>'patternType' as pattern_type,
        COUNT(*) as occurrences
      FROM onboarding_events
      WHERE event_type = 'confusion_pattern'
        AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY step, event_data->>'patternType'
      ORDER BY occurrences DESC
      LIMIT 20
    `).catch(() => ({ rows: [] }));

    // Completion rate
    const completionResult = await pool.query(`
      SELECT
        COUNT(DISTINCT CASE WHEN event_type = 'step_started' AND step = 'welcome' THEN session_id END) as started,
        COUNT(DISTINCT CASE WHEN event_type = 'onboarding_completed' THEN session_id END) as completed
      FROM onboarding_events
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `).catch(() => ({ rows: [{ started: 0, completed: 0 }] }));

    const stats = completionResult.rows[0];
    const completionRate = stats.started > 0
      ? Math.round((stats.completed / stats.started) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: `${days} days`,
        summary: {
          started: parseInt(stats.started) || 0,
          completed: parseInt(stats.completed) || 0,
          completionRate,
        },
        funnel: funnelResult.rows,
        dropoffs: dropoffResult.rows,
        confusionPatterns: confusionResult.rows,
      },
    });
  } catch (error) {
    console.error('Onboarding analytics fetch error:', error);
    return NextResponse.json({
      success: true,
      data: {
        summary: { started: 0, completed: 0, completionRate: 0 },
        funnel: [],
        dropoffs: [],
        confusionPatterns: [],
      },
    });
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

async function storeEvent(event: OnboardingEvent): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO onboarding_events (
        event_type, step, session_id, user_id, email,
        vertical, sub_vertical, regions,
        event_data, time_on_step, total_time_elapsed,
        device, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        event.type,
        event.step,
        event.sessionId,
        event.userId || null,
        event.email || null,
        event.vertical || null,
        event.subVertical || null,
        event.regions ? JSON.stringify(event.regions) : null,
        event.data ? JSON.stringify(event.data) : null,
        event.timeOnStep || null,
        event.totalTimeElapsed || null,
        event.device || null,
        event.userAgent || null,
        event.timestamp,
      ]
    );
  } catch (error) {
    // Create table if it doesn't exist
    if ((error as Error).message?.includes('relation "onboarding_events" does not exist')) {
      await createOnboardingEventsTable();
      await storeEvent(event); // Retry
    } else {
      throw error;
    }
  }
}

async function createOnboardingEventsTable(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS onboarding_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      step VARCHAR(50) NOT NULL,
      session_id VARCHAR(100) NOT NULL,
      user_id VARCHAR(100),
      email VARCHAR(255),
      vertical VARCHAR(50),
      sub_vertical VARCHAR(50),
      regions JSONB,
      event_data JSONB,
      time_on_step INTEGER,
      total_time_elapsed INTEGER,
      device VARCHAR(20),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_onboarding_events_session ON onboarding_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_onboarding_events_type ON onboarding_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_onboarding_events_step ON onboarding_events(step);
    CREATE INDEX IF NOT EXISTS idx_onboarding_events_created ON onboarding_events(created_at);
  `);
}

function shouldTriggerSelfHealing(event: OnboardingEvent): boolean {
  // Trigger self-healing for:
  // - Dropoffs
  // - Confusion patterns
  // - Repeated errors
  if (event.type === 'onboarding_abandoned' || event.type === 'confusion_pattern') {
    return true;
  }

  if (event.type === 'field_error') {
    const data = event.data as { count?: number } | undefined;
    if (data?.count && data.count >= 3) {
      return true;
    }
  }

  return false;
}

async function triggerSelfHealing(event: OnboardingEvent): Promise<void> {
  try {
    // Forward to self-healing engine
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/self-healing/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'analytics',
        trigger: event.type,
        step: event.step,
        data: event.data,
        sessionId: event.sessionId,
        timestamp: event.timestamp,
      }),
    }).catch(() => {
      // Non-blocking
    });
  } catch {
    // Non-blocking
  }
}
