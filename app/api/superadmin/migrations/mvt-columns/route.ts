/**
 * Migration Runner: Add MVT columns to os_sub_verticals
 *
 * POST /api/superadmin/migrations/mvt-columns
 * Applies the S255 MVT Hard Gate migration
 *
 * SUPERADMIN ONLY - requires valid session
 */

import { NextRequest } from 'next/server';
import { query } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';

export async function POST(request: NextRequest) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check for seed=true parameter to force reseed
  const { searchParams } = new URL(request.url);
  const forceSeed = searchParams.get('seed') === 'true';

  try {
    // Check if columns already exist
    const checkResult = await query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'os_sub_verticals'
       AND column_name IN ('buyer_role', 'decision_owner', 'allowed_signals', 'kill_rules', 'seed_scenarios', 'mvt_version', 'mvt_valid', 'mvt_validated_at')`
    );

    const existingColumns = checkResult.map(r => r.column_name);
    const allColumns = ['buyer_role', 'decision_owner', 'allowed_signals', 'kill_rules', 'seed_scenarios', 'mvt_version', 'mvt_valid', 'mvt_validated_at'];
    const missingColumns = allColumns.filter(c => !existingColumns.includes(c));

    // If columns exist but we want to reseed, skip to seeding
    if (missingColumns.length === 0 && !forceSeed) {
      return Response.json({
        success: true,
        message: 'All MVT columns already exist. Use ?seed=true to reseed data.',
        existingColumns,
        seedUrl: '/api/superadmin/migrations/mvt-columns?run=true&seed=true',
      });
    }

    // Apply migration for missing columns
    const migrations: string[] = [];

    if (missingColumns.includes('buyer_role')) {
      await query(`ALTER TABLE os_sub_verticals ADD COLUMN IF NOT EXISTS buyer_role VARCHAR(100)`);
      migrations.push('buyer_role');
    }

    if (missingColumns.includes('decision_owner')) {
      await query(`ALTER TABLE os_sub_verticals ADD COLUMN IF NOT EXISTS decision_owner VARCHAR(100)`);
      migrations.push('decision_owner');
    }

    if (missingColumns.includes('allowed_signals')) {
      await query(`ALTER TABLE os_sub_verticals ADD COLUMN IF NOT EXISTS allowed_signals JSONB DEFAULT '[]'::jsonb`);
      migrations.push('allowed_signals');
    }

    if (missingColumns.includes('kill_rules')) {
      await query(`ALTER TABLE os_sub_verticals ADD COLUMN IF NOT EXISTS kill_rules JSONB DEFAULT '[]'::jsonb`);
      migrations.push('kill_rules');
    }

    if (missingColumns.includes('seed_scenarios')) {
      await query(`ALTER TABLE os_sub_verticals ADD COLUMN IF NOT EXISTS seed_scenarios JSONB DEFAULT '{"golden":[],"kill":[]}'::jsonb`);
      migrations.push('seed_scenarios');
    }

    if (missingColumns.includes('mvt_version')) {
      await query(`ALTER TABLE os_sub_verticals ADD COLUMN IF NOT EXISTS mvt_version INTEGER DEFAULT 1`);
      migrations.push('mvt_version');
    }

    if (missingColumns.includes('mvt_valid')) {
      await query(`ALTER TABLE os_sub_verticals ADD COLUMN IF NOT EXISTS mvt_valid BOOLEAN DEFAULT false`);
      migrations.push('mvt_valid');
    }

    if (missingColumns.includes('mvt_validated_at')) {
      await query(`ALTER TABLE os_sub_verticals ADD COLUMN IF NOT EXISTS mvt_validated_at TIMESTAMP WITH TIME ZONE`);
      migrations.push('mvt_validated_at');
    }

    // Seed employee_banking with default MVT data
    // Use direct SET (not COALESCE) to ensure arrays are populated even if empty
    await query(`
      UPDATE os_sub_verticals SET
        buyer_role = 'HR Director / Finance Director',
        decision_owner = 'CFO / CEO',
        allowed_signals = '[
          {"signal_key": "hiring_growth", "entity_type": "company", "justification": "Headcount growth indicates payroll opportunity"},
          {"signal_key": "office_opening", "entity_type": "company", "justification": "New office = new employee banking relationship"},
          {"signal_key": "funding_round", "entity_type": "company", "justification": "Fresh capital often triggers banking relationship review"},
          {"signal_key": "executive_hire", "entity_type": "company", "justification": "New CFO/CHRO often reviews banking relationships"}
        ]'::jsonb,
        kill_rules = '[
          {"rule": "competitor_relationship", "action": "DEPRIORITIZE", "reason": "Already banking with competitor"},
          {"rule": "compliance_violation", "action": "KILL", "reason": "GDPR/regulatory compliance issue detected"},
          {"rule": "recently_contacted", "action": "DELAY", "reason": "Contacted within last 90 days"}
        ]'::jsonb,
        seed_scenarios = '{"golden": ["New company with 50+ employees seeking WPS-compliant payroll solution", "Tech startup expanding to UAE needing WPS setup"], "kill": ["Company already using competitor bank for payroll", "Company under regulatory investigation"]}'::jsonb,
        mvt_version = 1,
        mvt_valid = true,
        mvt_validated_at = NOW()
      WHERE key = 'employee_banking'
    `);

    const message = migrations.length > 0
      ? 'MVT columns migration and seed applied successfully'
      : 'MVT seed data applied successfully (columns already existed)';

    return Response.json({
      success: true,
      message,
      columnsAdded: migrations,
      seededSubVertical: 'employee_banking',
      operation: migrations.length > 0 ? 'migration+seed' : 'seed_only',
    });

  } catch (error) {
    console.error('[Migration:MVT] Error:', error);
    return Response.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if run=true parameter is present to trigger migration via GET
  const { searchParams } = new URL(request.url);
  const runMigration = searchParams.get('run') === 'true';

  if (runMigration) {
    // Redirect to POST behavior
    return POST(request);
  }

  try {
    // Check current column status
    const checkResult = await query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'os_sub_verticals'
       AND column_name IN ('buyer_role', 'decision_owner', 'allowed_signals', 'kill_rules', 'seed_scenarios', 'mvt_version', 'mvt_valid', 'mvt_validated_at')`
    );

    const existingColumns = checkResult.map(r => r.column_name);
    const allColumns = ['buyer_role', 'decision_owner', 'allowed_signals', 'kill_rules', 'seed_scenarios', 'mvt_version', 'mvt_valid', 'mvt_validated_at'];
    const missingColumns = allColumns.filter(c => !existingColumns.includes(c));

    return Response.json({
      success: true,
      existingColumns,
      missingColumns,
      migrationNeeded: missingColumns.length > 0,
      runUrl: missingColumns.length > 0 ? '/api/superadmin/migrations/mvt-columns?run=true' : null,
    });

  } catch (error) {
    console.error('[Migration:MVT] Status check error:', error);
    return Response.json({
      success: false,
      error: 'Status check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
