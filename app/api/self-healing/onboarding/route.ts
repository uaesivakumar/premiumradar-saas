/**
 * Self-Healing Engine - Onboarding Module - Sprint S135
 *
 * Receives dropoff and confusion signals from onboarding flow.
 * Generates improvement recommendations for:
 * - UI adjustments
 * - Tooltip improvements
 * - Pack suggestions
 * - Vertical recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

interface SelfHealingRequest {
  source: 'onboarding' | 'analytics';
  trigger: 'confusion' | 'dropoff' | 'error';
  step: string;
  patternType?: string;
  data?: unknown;
  sessionId: string;
  timestamp: string;
}

interface HealingRecommendation {
  type: 'ui_adjustment' | 'tooltip_update' | 'flow_change' | 'pack_suggestion' | 'vertical_hint';
  priority: 'critical' | 'high' | 'medium' | 'low';
  step: string;
  description: string;
  action: string;
  data?: Record<string, unknown>;
}

// POST - Receive self-healing trigger
export async function POST(request: NextRequest) {
  try {
    const body: SelfHealingRequest = await request.json();

    if (!body.trigger || !body.step || !body.sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store the trigger event
    await storeHealingTrigger(body);

    // Analyze and generate recommendations
    const recommendations = await generateRecommendations(body);

    // Store recommendations for review
    if (recommendations.length > 0) {
      await storeRecommendations(recommendations);
    }

    // Check if immediate action is needed
    const criticalRecommendations = recommendations.filter(r => r.priority === 'critical');
    if (criticalRecommendations.length > 0) {
      await notifyAdmins(criticalRecommendations);
    }

    return NextResponse.json({
      success: true,
      recommendationsGenerated: recommendations.length,
      criticalCount: criticalRecommendations.length,
    });
  } catch (error) {
    console.error('Self-healing onboarding error:', error);
    return NextResponse.json(
      { success: false, error: 'Self-healing processing failed' },
      { status: 500 }
    );
  }
}

// GET - Get healing recommendations and stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    const pool = getPool();

    // Get recommendations
    const recommendationsResult = await pool.query(`
      SELECT *
      FROM self_healing_recommendations
      WHERE status = $1
      ORDER BY
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
      LIMIT $2
    `, [status, limit]).catch(() => ({ rows: [] }));

    // Get trigger stats
    const statsResult = await pool.query(`
      SELECT
        step,
        trigger_type,
        COUNT(*) as count
      FROM self_healing_triggers
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY step, trigger_type
      ORDER BY count DESC
      LIMIT 20
    `).catch(() => ({ rows: [] }));

    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendationsResult.rows,
        triggerStats: statsResult.rows,
      },
    });
  } catch (error) {
    console.error('Self-healing fetch error:', error);
    return NextResponse.json({
      success: true,
      data: {
        recommendations: [],
        triggerStats: [],
      },
    });
  }
}

// =============================================================================
// Healing Logic
// =============================================================================

async function generateRecommendations(trigger: SelfHealingRequest): Promise<HealingRecommendation[]> {
  const recommendations: HealingRecommendation[] = [];

  // Analyze based on trigger type and step
  switch (trigger.trigger) {
    case 'dropoff':
      recommendations.push(...analyzeDropoff(trigger));
      break;

    case 'confusion':
      recommendations.push(...analyzeConfusion(trigger));
      break;

    case 'error':
      recommendations.push(...analyzeError(trigger));
      break;
  }

  // Check for patterns across sessions
  const patternRecommendations = await analyzePatterns(trigger.step);
  recommendations.push(...patternRecommendations);

  return recommendations;
}

function analyzeDropoff(trigger: SelfHealingRequest): HealingRecommendation[] {
  const recommendations: HealingRecommendation[] = [];
  const data = trigger.data as { timeOnStep?: number; confusionPatterns?: Array<{ type: string }> } | undefined;

  // Step-specific dropoff analysis
  switch (trigger.step) {
    case 'identity':
      recommendations.push({
        type: 'ui_adjustment',
        priority: 'high',
        step: 'identity',
        description: 'User dropped off at identity step',
        action: 'Consider simplifying the identity form or adding social login',
        data: { timeOnStep: data?.timeOnStep },
      });
      break;

    case 'vertical':
      recommendations.push({
        type: 'vertical_hint',
        priority: 'high',
        step: 'vertical',
        description: 'User unsure about vertical selection',
        action: 'Add industry detection from email domain or company name',
        data: { confusionPatterns: data?.confusionPatterns },
      });
      break;

    case 'subVertical':
      recommendations.push({
        type: 'tooltip_update',
        priority: 'medium',
        step: 'subVertical',
        description: 'Sub-vertical selection causing confusion',
        action: 'Add clearer descriptions for each sub-vertical option',
      });
      break;

    case 'regions':
      recommendations.push({
        type: 'flow_change',
        priority: 'medium',
        step: 'regions',
        description: 'Region selection too complex',
        action: 'Consider auto-detecting region from IP or simplifying to single select',
      });
      break;

    default:
      recommendations.push({
        type: 'ui_adjustment',
        priority: 'low',
        step: trigger.step,
        description: `Dropoff at ${trigger.step}`,
        action: 'Review step for usability issues',
      });
  }

  return recommendations;
}

function analyzeConfusion(trigger: SelfHealingRequest): HealingRecommendation[] {
  const recommendations: HealingRecommendation[] = [];

  switch (trigger.patternType) {
    case 'repeated_back':
      recommendations.push({
        type: 'flow_change',
        priority: 'high',
        step: trigger.step,
        description: 'User navigating back repeatedly',
        action: 'Review step flow - user may be confused about progress or missing information',
      });
      break;

    case 'field_refill':
      recommendations.push({
        type: 'ui_adjustment',
        priority: 'medium',
        step: trigger.step,
        description: 'User refilling fields multiple times',
        action: 'Improve field validation and inline error messages',
      });
      break;

    case 'long_pause':
      recommendations.push({
        type: 'tooltip_update',
        priority: 'medium',
        step: trigger.step,
        description: 'User pausing for extended period',
        action: 'Add contextual help or SIVA assistant prompt',
      });
      break;

    case 'error_loop':
      recommendations.push({
        type: 'ui_adjustment',
        priority: 'critical',
        step: trigger.step,
        description: 'User stuck in error loop',
        action: 'Review validation logic and error messages for this step',
      });
      break;

    case 'help_click':
      recommendations.push({
        type: 'tooltip_update',
        priority: 'low',
        step: trigger.step,
        description: 'User seeking help frequently',
        action: 'Improve inline instructions or add SIVA contextual hints',
      });
      break;
  }

  return recommendations;
}

function analyzeError(trigger: SelfHealingRequest): HealingRecommendation[] {
  const data = trigger.data as { field?: string; error?: string } | undefined;

  return [
    {
      type: 'ui_adjustment',
      priority: 'high',
      step: trigger.step,
      description: `Repeated errors on field: ${data?.field || 'unknown'}`,
      action: 'Review field validation and provide clearer guidance',
      data: { field: data?.field, error: data?.error },
    },
  ];
}

async function analyzePatterns(step: string): Promise<HealingRecommendation[]> {
  const recommendations: HealingRecommendation[] = [];

  try {
    const pool = getPool();

    // Check for high dropoff rate at this step
    const dropoffResult = await pool.query(`
      SELECT
        COUNT(*) as dropoffs,
        (SELECT COUNT(DISTINCT session_id) FROM self_healing_triggers WHERE step = $1) as total_sessions
      FROM self_healing_triggers
      WHERE step = $1
        AND trigger_type = 'dropoff'
        AND created_at > NOW() - INTERVAL '24 hours'
    `, [step]).catch(() => ({ rows: [{ dropoffs: 0, total_sessions: 1 }] }));

    const stats = dropoffResult.rows[0];
    const dropoffRate = stats.total_sessions > 0
      ? (stats.dropoffs / stats.total_sessions) * 100
      : 0;

    if (dropoffRate > 30) {
      recommendations.push({
        type: 'flow_change',
        priority: 'critical',
        step,
        description: `Critical: ${Math.round(dropoffRate)}% dropoff rate at ${step}`,
        action: 'Immediate review required - step causing major friction',
        data: { dropoffRate, dropoffs: stats.dropoffs, totalSessions: stats.total_sessions },
      });
    } else if (dropoffRate > 15) {
      recommendations.push({
        type: 'ui_adjustment',
        priority: 'high',
        step,
        description: `High dropoff rate (${Math.round(dropoffRate)}%) at ${step}`,
        action: 'Review step for usability improvements',
        data: { dropoffRate },
      });
    }
  } catch {
    // Non-blocking pattern analysis
  }

  return recommendations;
}

// =============================================================================
// Storage Functions
// =============================================================================

async function storeHealingTrigger(trigger: SelfHealingRequest): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO self_healing_triggers (
        source, trigger_type, step, pattern_type,
        data, session_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        trigger.source,
        trigger.trigger,
        trigger.step,
        trigger.patternType || null,
        trigger.data ? JSON.stringify(trigger.data) : null,
        trigger.sessionId,
        trigger.timestamp,
      ]
    );
  } catch (error) {
    if ((error as Error).message?.includes('relation "self_healing_triggers" does not exist')) {
      await createSelfHealingTables();
      await storeHealingTrigger(trigger);
    }
  }
}

async function storeRecommendations(recommendations: HealingRecommendation[]): Promise<void> {
  try {
    const pool = getPool();
    for (const rec of recommendations) {
      await pool.query(
        `INSERT INTO self_healing_recommendations (
          type, priority, step, description, action, data, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
        [
          rec.type,
          rec.priority,
          rec.step,
          rec.description,
          rec.action,
          rec.data ? JSON.stringify(rec.data) : null,
        ]
      );
    }
  } catch (error) {
    if ((error as Error).message?.includes('relation "self_healing_recommendations" does not exist')) {
      await createSelfHealingTables();
      await storeRecommendations(recommendations);
    }
  }
}

async function createSelfHealingTables(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS self_healing_triggers (
      id SERIAL PRIMARY KEY,
      source VARCHAR(50) NOT NULL,
      trigger_type VARCHAR(50) NOT NULL,
      step VARCHAR(50) NOT NULL,
      pattern_type VARCHAR(50),
      data JSONB,
      session_id VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_sh_triggers_step ON self_healing_triggers(step);
    CREATE INDEX IF NOT EXISTS idx_sh_triggers_type ON self_healing_triggers(trigger_type);
    CREATE INDEX IF NOT EXISTS idx_sh_triggers_created ON self_healing_triggers(created_at);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS self_healing_recommendations (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      priority VARCHAR(20) NOT NULL,
      step VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      action TEXT NOT NULL,
      data JSONB,
      status VARCHAR(20) DEFAULT 'pending',
      reviewed_at TIMESTAMP,
      reviewed_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_sh_recs_status ON self_healing_recommendations(status);
    CREATE INDEX IF NOT EXISTS idx_sh_recs_priority ON self_healing_recommendations(priority);
  `);
}

async function notifyAdmins(_recommendations: HealingRecommendation[]): Promise<void> {
  // TODO: Implement admin notification (email, Slack, etc.)
  console.log('[Self-Healing] Critical recommendations generated:', _recommendations.length);
}
