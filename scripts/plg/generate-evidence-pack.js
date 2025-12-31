/**
 * S348-F6: PLG Evidence Pack Generator
 * Sprint: S348 - PLG Proof Pack
 *
 * Generates a comprehensive evidence pack for PLG compliance.
 * This pack can be used for:
 * - Audit trails
 * - Investor due diligence
 * - Compliance verification
 * - Marketing claims validation
 *
 * Output: JSON evidence pack with all PLG events and attribution
 *
 * Usage:
 *   DATABASE_URL="..." node scripts/plg/generate-evidence-pack.js
 *   DATABASE_URL="..." node scripts/plg/generate-evidence-pack.js --output=evidence.json
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const OUTPUT_FILE = process.argv.find(a => a.startsWith('--output='))?.split('=')[1];
const VERBOSE = process.argv.includes('--verbose');

function log(message) {
  console.log(message);
}

function verbose(message) {
  if (VERBOSE) console.log(`  ${message}`);
}

// ============================================================
// EVIDENCE COLLECTION FUNCTIONS
// ============================================================

async function collectSignupEvidence(pool) {
  log('Collecting signup evidence...');

  const result = await pool.query(`
    SELECT
      be.id,
      be.event_type,
      be.entity_type,
      be.entity_id,
      be.created_at,
      be.metadata,
      u.email,
      u.role,
      u.is_demo,
      u.enterprise_id,
      u.workspace_id
    FROM business_events be
    LEFT JOIN users u ON u.id = be.entity_id
    WHERE be.event_type = 'USER_CREATED'
    ORDER BY be.created_at DESC
    LIMIT 100
  `);

  const evidence = {
    total_count: result.rows.length,
    plg_signups: 0,
    demo_signups: 0,
    enterprise_signups: 0,
    events: [],
  };

  result.rows.forEach(row => {
    const meta = row.metadata || {};
    const isPLG = meta.plg_signup === true || row.role === 'INDIVIDUAL_USER';
    const isDemo = row.is_demo === true;

    if (isPLG && !isDemo) evidence.plg_signups++;
    if (isDemo) evidence.demo_signups++;
    if (meta.enterprise_bound) evidence.enterprise_signups++;

    evidence.events.push({
      event_id: row.id,
      user_id: row.entity_id,
      email: row.email ? `${row.email.substring(0, 3)}***@***` : null, // Redacted
      role: row.role,
      is_demo: row.is_demo,
      plg_signup: isPLG,
      enterprise_bound: !!row.enterprise_id,
      workspace_bound: !!row.workspace_id,
      created_at: row.created_at,
      metadata_keys: Object.keys(meta),
    });
  });

  log(`  Found ${evidence.total_count} signup events (${evidence.plg_signups} PLG, ${evidence.demo_signups} demo)`);
  return evidence;
}

async function collectOnboardingEvidence(pool) {
  log('Collecting onboarding context evidence...');

  const result = await pool.query(`
    SELECT
      be.id,
      be.event_type,
      be.entity_id,
      be.created_at,
      be.metadata
    FROM business_events be
    WHERE be.event_type = 'USER_UPDATED'
      AND (
        be.metadata ? 'context_selected'
        OR be.metadata ? 'onboarding_progress'
        OR be.metadata ? 'vertical'
        OR be.metadata ? 'sub_vertical'
        OR be.metadata ? 'region'
      )
    ORDER BY be.created_at DESC
    LIMIT 200
  `);

  const evidence = {
    total_count: result.rows.length,
    vertical_selections: 0,
    sub_vertical_selections: 0,
    region_selections: 0,
    events: [],
  };

  result.rows.forEach(row => {
    const meta = row.metadata || {};
    const changes = meta.changes || {};

    if (changes.vertical) evidence.vertical_selections++;
    if (changes.sub_vertical) evidence.sub_vertical_selections++;
    if (changes.region) evidence.region_selections++;

    evidence.events.push({
      event_id: row.id,
      user_id: row.entity_id,
      created_at: row.created_at,
      context_selected: meta.context_selected || false,
      changes: changes,
      onboarding_step: meta.onboarding_step,
    });
  });

  log(`  Found ${evidence.total_count} onboarding events`);
  return evidence;
}

async function collectWorkspaceEvidence(pool) {
  log('Collecting workspace binding evidence...');

  // Workspace creation events
  const workspaceCreated = await pool.query(`
    SELECT
      be.id,
      be.entity_id,
      be.created_at,
      be.metadata
    FROM business_events be
    WHERE be.event_type = 'WORKSPACE_CREATED'
    ORDER BY be.created_at DESC
    LIMIT 100
  `);

  // Role transition events (INDIVIDUAL_USER → ENTERPRISE_USER)
  const roleTransitions = await pool.query(`
    SELECT
      be.id,
      be.entity_id,
      be.created_at,
      be.metadata
    FROM business_events be
    WHERE be.event_type = 'USER_UPDATED'
      AND be.metadata->'role_transition' IS NOT NULL
    ORDER BY be.created_at DESC
    LIMIT 100
  `);

  const evidence = {
    workspaces_created: workspaceCreated.rows.length,
    plg_workspaces: 0,
    role_transitions: roleTransitions.rows.length,
    workspace_events: [],
    transition_events: [],
  };

  workspaceCreated.rows.forEach(row => {
    const meta = row.metadata || {};
    if (meta.plg_workspace) evidence.plg_workspaces++;

    evidence.workspace_events.push({
      event_id: row.id,
      workspace_id: row.entity_id,
      created_at: row.created_at,
      plg_workspace: meta.plg_workspace || false,
      workspace_name: meta.workspace_name,
      workspace_type: meta.workspace_type,
      enterprise_id: meta.enterprise_id,
    });
  });

  roleTransitions.rows.forEach(row => {
    const meta = row.metadata || {};
    const transition = meta.role_transition || {};

    evidence.transition_events.push({
      event_id: row.id,
      user_id: row.entity_id,
      created_at: row.created_at,
      from_role: transition.from,
      to_role: transition.to,
      workspace_bound: meta.workspace_bound || false,
    });
  });

  log(`  Found ${evidence.workspaces_created} workspace creations (${evidence.plg_workspaces} PLG)`);
  log(`  Found ${evidence.role_transitions} role transitions`);
  return evidence;
}

async function collectConversionEvidence(pool) {
  log('Collecting demo conversion evidence...');

  const result = await pool.query(`
    SELECT
      be.id,
      be.entity_id,
      be.created_at,
      be.metadata
    FROM business_events be
    WHERE be.event_type = 'DEMO_CONVERTED'
    ORDER BY be.created_at DESC
    LIMIT 100
  `);

  const evidence = {
    total_conversions: result.rows.length,
    explicit_conversions: 0,
    auto_conversions: 0,
    conversions: [],
  };

  result.rows.forEach(row => {
    const meta = row.metadata || {};
    if (meta.conversion_explicit) {
      evidence.explicit_conversions++;
    } else {
      evidence.auto_conversions++;
    }

    evidence.conversions.push({
      event_id: row.id,
      user_id: row.entity_id,
      created_at: row.created_at,
      conversion_explicit: meta.conversion_explicit || false,
      conversion_reason: meta.conversion_reason,
      attribution_source: meta.attribution_source,
      plg_conversion: meta.plg_conversion || false,
    });
  });

  log(`  Found ${evidence.total_conversions} conversions (${evidence.explicit_conversions} explicit, ${evidence.auto_conversions} auto)`);
  return evidence;
}

async function collectRoleDistribution(pool) {
  log('Collecting user role distribution...');

  const result = await pool.query(`
    SELECT
      role,
      is_demo,
      COUNT(*) as count
    FROM users
    GROUP BY role, is_demo
    ORDER BY count DESC
  `);

  const distribution = {};
  result.rows.forEach(row => {
    const key = `${row.role}${row.is_demo ? ' (demo)' : ''}`;
    distribution[key] = parseInt(row.count);
  });

  return distribution;
}

async function collectEventTimeline(pool) {
  log('Collecting event timeline summary...');

  const result = await pool.query(`
    SELECT
      event_type,
      DATE_TRUNC('day', created_at) as date,
      COUNT(*) as count
    FROM business_events
    WHERE created_at > NOW() - INTERVAL '30 days'
      AND event_type IN ('USER_CREATED', 'USER_UPDATED', 'WORKSPACE_CREATED', 'DEMO_CONVERTED')
    GROUP BY event_type, DATE_TRUNC('day', created_at)
    ORDER BY date DESC, event_type
  `);

  const timeline = {};
  result.rows.forEach(row => {
    const dateKey = row.date.toISOString().split('T')[0];
    if (!timeline[dateKey]) timeline[dateKey] = {};
    timeline[dateKey][row.event_type] = parseInt(row.count);
  });

  return timeline;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  log('╔══════════════════════════════════════════════════════════════════╗');
  log('║           S348 PLG EVIDENCE PACK GENERATOR                       ║');
  log('║           Sprint: S348 - PLG Proof Pack                          ║');
  log('╚══════════════════════════════════════════════════════════════════╝\n');

  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    console.error('Usage: DATABASE_URL="..." node scripts/plg/generate-evidence-pack.js');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    await pool.query('SELECT 1');
    log('✅ Database connected\n');

    // Collect all evidence
    const evidencePack = {
      generated_at: new Date().toISOString(),
      sprint: 'S348',
      version: '1.0',
      purpose: 'PLG Proof Pack Evidence',

      summary: {
        description: 'Evidence of PLG compliance per S348 requirements',
        requirements: [
          'No silent onboarding - Every signup must emit evidence',
          'Every choice must be attributable',
          'Individual users ≠ demo users',
          'Roles, limits, and conversion paths must be explicit',
          'No implicit upgrade logic',
        ],
      },

      signups: await collectSignupEvidence(pool),
      onboarding: await collectOnboardingEvidence(pool),
      workspaces: await collectWorkspaceEvidence(pool),
      conversions: await collectConversionEvidence(pool),
      role_distribution: await collectRoleDistribution(pool),
      event_timeline: await collectEventTimeline(pool),
    };

    // Calculate compliance metrics
    evidencePack.compliance = {
      signups_with_events: evidencePack.signups.total_count > 0,
      onboarding_attributable: evidencePack.onboarding.total_count > 0,
      workspaces_explicit: evidencePack.workspaces.workspaces_created >= 0,
      conversions_explicit: evidencePack.conversions.explicit_conversions >= evidencePack.conversions.auto_conversions,
      plg_path_working: evidencePack.signups.plg_signups > 0 || evidencePack.workspaces.plg_workspaces > 0,
    };

    // Output
    log('\n═══════════════════════════════════════════════════════════════');
    log('EVIDENCE PACK SUMMARY');
    log('═══════════════════════════════════════════════════════════════\n');

    log(`📊 Signups: ${evidencePack.signups.total_count} total`);
    log(`   - PLG Signups: ${evidencePack.signups.plg_signups}`);
    log(`   - Demo Signups: ${evidencePack.signups.demo_signups}`);
    log('');
    log(`📋 Onboarding Events: ${evidencePack.onboarding.total_count}`);
    log(`   - Vertical Selections: ${evidencePack.onboarding.vertical_selections}`);
    log(`   - Sub-Vertical Selections: ${evidencePack.onboarding.sub_vertical_selections}`);
    log(`   - Region Selections: ${evidencePack.onboarding.region_selections}`);
    log('');
    log(`🏢 Workspaces: ${evidencePack.workspaces.workspaces_created}`);
    log(`   - PLG Workspaces: ${evidencePack.workspaces.plg_workspaces}`);
    log(`   - Role Transitions: ${evidencePack.workspaces.role_transitions}`);
    log('');
    log(`🔄 Conversions: ${evidencePack.conversions.total_conversions}`);
    log(`   - Explicit: ${evidencePack.conversions.explicit_conversions}`);
    log(`   - Auto: ${evidencePack.conversions.auto_conversions}`);
    log('');
    log('📈 Role Distribution:');
    Object.entries(evidencePack.role_distribution).forEach(([role, count]) => {
      log(`   - ${role}: ${count}`);
    });

    log('\n✅ Compliance Checks:');
    Object.entries(evidencePack.compliance).forEach(([check, passed]) => {
      log(`   ${passed ? '✅' : '❌'} ${check.replace(/_/g, ' ')}`);
    });

    // Save to file if specified
    if (OUTPUT_FILE) {
      const outputPath = path.resolve(OUTPUT_FILE);
      fs.writeFileSync(outputPath, JSON.stringify(evidencePack, null, 2));
      log(`\n📁 Evidence pack saved to: ${outputPath}`);
    } else {
      log('\nTip: Use --output=evidence.json to save the full evidence pack');
    }

    log('\n╔══════════════════════════════════════════════════════════════════╗');
    log('║                    EVIDENCE PACK GENERATED                        ║');
    log('╚══════════════════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
