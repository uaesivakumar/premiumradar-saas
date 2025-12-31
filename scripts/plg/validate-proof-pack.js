/**
 * S348-F1: PLG Proof Pack Validation Script
 * Sprint: S348 - PLG Proof Pack
 *
 * Validates the complete PLG proof pack requirements:
 * 1. No silent onboarding - Every signup must emit evidence
 * 2. Every choice must be attributable
 * 3. Individual users ≠ demo users
 * 4. Roles, limits, and conversion paths must be explicit
 * 5. No "implicit upgrade" logic
 *
 * Usage:
 *   node scripts/plg/validate-proof-pack.js
 *   node scripts/plg/validate-proof-pack.js --verbose
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Configuration
const VERBOSE = process.argv.includes('--verbose');
const DATABASE_URL = process.env.DATABASE_URL;

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

function log(message) {
  console.log(message);
}

function verbose(message) {
  if (VERBOSE) console.log(`  ${message}`);
}

function pass(check, details) {
  results.passed++;
  results.checks.push({ status: 'PASS', check, details });
  log(`✅ PASS: ${check}`);
  if (details) verbose(details);
}

function fail(check, details) {
  results.failed++;
  results.checks.push({ status: 'FAIL', check, details });
  log(`❌ FAIL: ${check}`);
  if (details) log(`   ${details}`);
}

function warn(check, details) {
  results.warnings++;
  results.checks.push({ status: 'WARN', check, details });
  log(`⚠️  WARN: ${check}`);
  if (details) verbose(details);
}

// ============================================================
// PHASE 1: CODE STRUCTURE VALIDATION
// ============================================================

async function validateCodeStructure() {
  log('\n═══════════════════════════════════════════════════════════════');
  log('PHASE 1: CODE STRUCTURE VALIDATION');
  log('═══════════════════════════════════════════════════════════════\n');

  // Check 1.1: createIndividualUser function exists
  const usersPath = path.join(process.cwd(), 'lib/db/users.ts');
  if (fs.existsSync(usersPath)) {
    const usersContent = fs.readFileSync(usersPath, 'utf8');
    if (usersContent.includes('export async function createIndividualUser')) {
      pass('createIndividualUser function exists', 'lib/db/users.ts');
    } else {
      fail('createIndividualUser function missing', 'Expected in lib/db/users.ts');
    }
  } else {
    fail('lib/db/users.ts not found');
  }

  // Check 1.2: Signup route uses createIndividualUser
  const signupPath = path.join(process.cwd(), 'app/api/auth/signup/route.ts');
  if (fs.existsSync(signupPath)) {
    const signupContent = fs.readFileSync(signupPath, 'utf8');
    if (signupContent.includes('createIndividualUser')) {
      pass('Signup uses createIndividualUser');
    } else {
      fail('Signup does NOT use createIndividualUser', 'Still using legacy createUser?');
    }

    // Check 1.3: Signup emits USER_CREATED event
    if (signupContent.includes('USER_CREATED')) {
      pass('Signup emits USER_CREATED event');
    } else {
      fail('Signup does NOT emit USER_CREATED event');
    }

    // Check 1.4: Signup sets role = INDIVIDUAL_USER
    if (signupContent.includes('INDIVIDUAL_USER')) {
      pass('Signup creates user with INDIVIDUAL_USER role');
    } else {
      fail('Signup does NOT set INDIVIDUAL_USER role');
    }
  } else {
    fail('Signup route not found');
  }

  // Check 1.5: Onboarding context API exists
  const contextPath = path.join(process.cwd(), 'app/api/onboarding/context/route.ts');
  if (fs.existsSync(contextPath)) {
    const contextContent = fs.readFileSync(contextPath, 'utf8');
    if (contextContent.includes('USER_UPDATED')) {
      pass('Onboarding context API emits USER_UPDATED events');
    } else {
      fail('Onboarding context API does NOT emit events');
    }
  } else {
    fail('Onboarding context API not found');
  }

  // Check 1.6: Workspace binding API exists
  const workspacePath = path.join(process.cwd(), 'app/api/onboarding/workspace/route.ts');
  if (fs.existsSync(workspacePath)) {
    const workspaceContent = fs.readFileSync(workspacePath, 'utf8');
    if (workspaceContent.includes('WORKSPACE_CREATED') && workspaceContent.includes('USER_UPDATED')) {
      pass('Workspace binding API emits business events');
    } else {
      fail('Workspace binding API missing event emission');
    }

    // Check 1.7: Workspace binding transitions role
    if (workspaceContent.includes('ENTERPRISE_USER')) {
      pass('Workspace binding transitions to ENTERPRISE_USER');
    } else {
      fail('Workspace binding does NOT transition role');
    }
  } else {
    fail('Workspace binding API not found');
  }

  // Check 1.8: Demo conversion API exists
  const convertPath = path.join(process.cwd(), 'app/api/onboarding/convert/route.ts');
  if (fs.existsSync(convertPath)) {
    const convertContent = fs.readFileSync(convertPath, 'utf8');
    if (convertContent.includes('DEMO_CONVERTED')) {
      pass('Demo conversion API emits DEMO_CONVERTED event');
    } else {
      fail('Demo conversion API missing DEMO_CONVERTED event');
    }

    // Check 1.9: Conversion is explicit (not auto-upgrade)
    if (convertContent.includes('conversion_explicit: true')) {
      pass('Demo conversion is explicit (not auto-upgrade)');
    } else {
      warn('Cannot verify conversion is explicit');
    }
  } else {
    fail('Demo conversion API not found');
  }

  // Check 1.10: useDemoConversion hook exists
  const hookPath = path.join(process.cwd(), 'lib/hooks/useDemoConversion.ts');
  if (fs.existsSync(hookPath)) {
    pass('useDemoConversion hook exists');
  } else {
    fail('useDemoConversion hook not found');
  }
}

// ============================================================
// PHASE 2: DATABASE SCHEMA VALIDATION
// ============================================================

async function validateDatabaseSchema(pool) {
  log('\n═══════════════════════════════════════════════════════════════');
  log('PHASE 2: DATABASE SCHEMA VALIDATION');
  log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Check 2.1: Users table has is_demo column
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    const columnMap = {};
    usersColumns.rows.forEach(row => {
      columnMap[row.column_name] = row;
    });

    if (columnMap['is_demo']) {
      pass('users.is_demo column exists', `Type: ${columnMap['is_demo'].data_type}`);
    } else {
      fail('users.is_demo column missing');
    }

    if (columnMap['role']) {
      pass('users.role column exists', `Type: ${columnMap['role'].data_type}`);
    } else {
      fail('users.role column missing');
    }

    if (columnMap['enterprise_id']) {
      pass('users.enterprise_id column exists (nullable for PLG)');
    } else {
      fail('users.enterprise_id column missing');
    }

    if (columnMap['workspace_id']) {
      pass('users.workspace_id column exists (nullable for PLG)');
    } else {
      fail('users.workspace_id column missing');
    }

    // Check 2.2: business_events table exists
    const eventsTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'business_events'
      )
    `);

    if (eventsTable.rows[0].exists) {
      pass('business_events table exists');

      // Check event columns
      const eventColumns = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'business_events'
      `);
      const eventCols = eventColumns.rows.map(r => r.column_name);

      if (eventCols.includes('event_type')) {
        pass('business_events.event_type column exists');
      } else {
        fail('business_events.event_type column missing');
      }

      if (eventCols.includes('metadata')) {
        pass('business_events.metadata column exists');
      } else {
        fail('business_events.metadata column missing');
      }
    } else {
      fail('business_events table missing');
    }

    // Check 2.3: user_profiles table has onboarding columns
    const profileColumns = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'user_profiles'
    `);
    const profileCols = profileColumns.rows.map(r => r.column_name);

    if (profileCols.includes('onboarding_step')) {
      pass('user_profiles.onboarding_step column exists');
    } else {
      fail('user_profiles.onboarding_step column missing');
    }

    if (profileCols.includes('onboarding_completed')) {
      pass('user_profiles.onboarding_completed column exists');
    } else {
      fail('user_profiles.onboarding_completed column missing');
    }
  } catch (error) {
    fail('Database schema validation failed', error.message);
  }
}

// ============================================================
// PHASE 3: EVENT FLOW VALIDATION
// ============================================================

async function validateEventFlow(pool) {
  log('\n═══════════════════════════════════════════════════════════════');
  log('PHASE 3: EVENT FLOW VALIDATION');
  log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Check 3.1: Required event types exist in business_events
    const eventTypes = await pool.query(`
      SELECT DISTINCT event_type, COUNT(*) as count
      FROM business_events
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY event_type
      ORDER BY count DESC
    `);

    if (eventTypes.rows.length > 0) {
      log('Recent event types found:');
      eventTypes.rows.forEach(row => {
        log(`   ${row.event_type}: ${row.count} events`);
      });

      const types = eventTypes.rows.map(r => r.event_type);

      if (types.includes('USER_CREATED')) {
        pass('USER_CREATED events exist');
      } else {
        warn('No USER_CREATED events in last 30 days (may be expected for new install)');
      }

      if (types.includes('USER_UPDATED')) {
        pass('USER_UPDATED events exist');
      } else {
        warn('No USER_UPDATED events in last 30 days');
      }
    } else {
      warn('No business events in last 30 days', 'This may be expected for new installations');
    }

    // Check 3.2: PLG signup events have required metadata
    const plgSignups = await pool.query(`
      SELECT id, metadata
      FROM business_events
      WHERE event_type = 'USER_CREATED'
        AND (metadata->>'plg_signup')::boolean = true
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (plgSignups.rows.length > 0) {
      pass(`Found ${plgSignups.rows.length} PLG signup events with plg_signup=true`);

      // Check metadata has required fields
      const sample = plgSignups.rows[0];
      const metadata = sample.metadata;

      if (metadata.role === 'INDIVIDUAL_USER') {
        pass('PLG signup events have role=INDIVIDUAL_USER');
      } else {
        fail('PLG signup events have wrong role', `Expected INDIVIDUAL_USER, got ${metadata.role}`);
      }

      if (metadata.enterprise_bound === false) {
        pass('PLG signup events have enterprise_bound=false');
      } else {
        warn('PLG signup events may not have enterprise_bound field');
      }
    } else {
      warn('No PLG signup events found (run a test signup to validate)');
    }

    // Check 3.3: Workspace binding events
    const workspaceEvents = await pool.query(`
      SELECT id, metadata
      FROM business_events
      WHERE event_type = 'WORKSPACE_CREATED'
        AND (metadata->>'plg_workspace')::boolean = true
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (workspaceEvents.rows.length > 0) {
      pass(`Found ${workspaceEvents.rows.length} PLG workspace creation events`);
    } else {
      warn('No PLG workspace creation events found');
    }

    // Check 3.4: Demo conversion events
    const conversionEvents = await pool.query(`
      SELECT id, metadata
      FROM business_events
      WHERE event_type = 'DEMO_CONVERTED'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (conversionEvents.rows.length > 0) {
      pass(`Found ${conversionEvents.rows.length} demo conversion events`);

      const sample = conversionEvents.rows[0];
      if (sample.metadata?.conversion_explicit === true) {
        pass('Demo conversions are marked as explicit');
      } else {
        warn('Demo conversion events may not have conversion_explicit flag');
      }
    } else {
      warn('No demo conversion events found (may be expected if no demos converted)');
    }
  } catch (error) {
    fail('Event flow validation failed', error.message);
  }
}

// ============================================================
// PHASE 4: USER LIFECYCLE VALIDATION
// ============================================================

async function validateUserLifecycle(pool) {
  log('\n═══════════════════════════════════════════════════════════════');
  log('PHASE 4: USER LIFECYCLE VALIDATION');
  log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Check 4.1: INDIVIDUAL_USER role exists in users
    const individualUsers = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'INDIVIDUAL_USER'
    `);

    if (individualUsers.rows[0].count > 0) {
      pass(`Found ${individualUsers.rows[0].count} INDIVIDUAL_USER users`);
    } else {
      warn('No INDIVIDUAL_USER users found (may be expected for new install)');
    }

    // Check 4.2: PLG users are unbound at signup
    const unboundUsers = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'INDIVIDUAL_USER'
        AND enterprise_id IS NULL
        AND workspace_id IS NULL
    `);

    const totalIndividual = parseInt(individualUsers.rows[0].count);
    const unboundCount = parseInt(unboundUsers.rows[0].count);

    if (totalIndividual > 0 && unboundCount > 0) {
      pass(`${unboundCount}/${totalIndividual} INDIVIDUAL_USER users are unbound (expected)`);
    } else if (totalIndividual > 0) {
      warn('All INDIVIDUAL_USER users are bound (check if signup binds incorrectly)');
    }

    // Check 4.3: Demo users are marked correctly
    const demoUsers = await pool.query(`
      SELECT COUNT(*) as demo_count,
             SUM(CASE WHEN role = 'INDIVIDUAL_USER' THEN 1 ELSE 0 END) as individual_demo
      FROM users
      WHERE is_demo = true
    `);

    if (demoUsers.rows[0].demo_count > 0) {
      pass(`Found ${demoUsers.rows[0].demo_count} demo users`);
      verbose(`${demoUsers.rows[0].individual_demo} are INDIVIDUAL_USER`);
    } else {
      warn('No demo users found (may be expected)');
    }

    // Check 4.4: Role distribution
    const roleDistribution = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `);

    log('User role distribution:');
    roleDistribution.rows.forEach(row => {
      log(`   ${row.role}: ${row.count}`);
    });

    // Check 4.5: No TENANT_* roles for new signups (PLG uses INDIVIDUAL/ENTERPRISE)
    const legacyRoles = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role IN ('TENANT_USER', 'TENANT_ADMIN')
        AND created_at > NOW() - INTERVAL '7 days'
    `);

    if (parseInt(legacyRoles.rows[0].count) === 0) {
      pass('No new users created with legacy TENANT_* roles');
    } else {
      warn(`${legacyRoles.rows[0].count} users created with legacy TENANT_* roles in last 7 days`);
    }
  } catch (error) {
    fail('User lifecycle validation failed', error.message);
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  log('╔══════════════════════════════════════════════════════════════════╗');
  log('║           S348 PLG PROOF PACK VALIDATION                        ║');
  log('║           Sprint: S348 - PLG Proof Pack                         ║');
  log('╚══════════════════════════════════════════════════════════════════╝');

  // Phase 1: Code structure (no DB needed)
  await validateCodeStructure();

  // Phases 2-4: Database validation
  let pool = null;

  if (DATABASE_URL) {
    pool = new Pool({ connectionString: DATABASE_URL });

    try {
      await pool.query('SELECT 1');
      pass('Database connection successful');

      await validateDatabaseSchema(pool);
      await validateEventFlow(pool);
      await validateUserLifecycle(pool);
    } catch (error) {
      fail('Database connection failed', error.message);
    } finally {
      if (pool) await pool.end();
    }
  } else {
    warn('DATABASE_URL not set - skipping database validation');
  }

  // Summary
  log('\n═══════════════════════════════════════════════════════════════');
  log('VALIDATION SUMMARY');
  log('═══════════════════════════════════════════════════════════════\n');

  log(`✅ Passed:   ${results.passed}`);
  log(`❌ Failed:   ${results.failed}`);
  log(`⚠️  Warnings: ${results.warnings}`);

  if (results.failed === 0) {
    log('\n╔══════════════════════════════════════════════════════════════════╗');
    log('║                    PLG PROOF PACK: VALIDATED                      ║');
    log('╚══════════════════════════════════════════════════════════════════╝');
    process.exit(0);
  } else {
    log('\n╔══════════════════════════════════════════════════════════════════╗');
    log('║                    PLG PROOF PACK: FAILED                         ║');
    log('╚══════════════════════════════════════════════════════════════════╝');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Validation script error:', error);
  process.exit(1);
});
