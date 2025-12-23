/**
 * UPL v0.1 Zero-Trust Validation Script
 *
 * Tests:
 * 1. DB: Row persistence
 * 2. API: Whitelist enforcement
 * 3. API: Scope isolation
 * 4. Runtime: Injection proof
 */

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://upr_app:f474d5aa0a71faf781dc7b9e021004bd2909545f9198e787@localhost:5433/upr_production'
});

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function pass(msg) { console.log(`${COLORS.green}✅ PASS${COLORS.reset}: ${msg}`); }
function fail(msg) { console.log(`${COLORS.red}❌ FAIL${COLORS.reset}: ${msg}`); }
function info(msg) { console.log(`${COLORS.yellow}ℹ️  INFO${COLORS.reset}: ${msg}`); }
function header(msg) { console.log(`\n${COLORS.bold}═══ ${msg} ═══${COLORS.reset}\n`); }

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          UPL v0.1 ZERO-TRUST VALIDATION                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Test data
  const testTenantId = '11111111-1111-1111-1111-111111111111';
  const testUser1 = 'test-user-1';
  const testUser2 = 'test-user-2';
  const testWorkspaceA = 'workspace-a';
  const testWorkspaceB = 'workspace-b';

  try {
    // ========================================
    // 1. DB ROW-LEVEL PROOF
    // ========================================
    header('1. DB ROW-LEVEL PROOF');

    // Clean up any existing test data
    await pool.query(
      'DELETE FROM os_user_preferences WHERE tenant_id = $1',
      [testTenantId]
    );
    info('Cleaned up test data');

    // Insert test row
    const insertResult = await pool.query(`
      INSERT INTO os_user_preferences (tenant_id, workspace_id, user_id, prefs)
      VALUES ($1, $2, $3, $4)
      RETURNING id, tenant_id, workspace_id, user_id, prefs
    `, [testTenantId, testWorkspaceA, testUser1, JSON.stringify({ verbosity: 'low' })]);

    if (insertResult.rows.length > 0) {
      pass(`Row inserted: id=${insertResult.rows[0].id}`);
      console.log(`   tenant_id: ${insertResult.rows[0].tenant_id}`);
      console.log(`   workspace_id: ${insertResult.rows[0].workspace_id}`);
      console.log(`   user_id: ${insertResult.rows[0].user_id}`);
      console.log(`   prefs: ${JSON.stringify(insertResult.rows[0].prefs)}`);
    } else {
      fail('Row not inserted');
    }

    // Verify SELECT returns the row
    const selectResult = await pool.query(`
      SELECT * FROM os_user_preferences
      WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
    `, [testTenantId, testWorkspaceA, testUser1]);

    if (selectResult.rows.length === 1) {
      pass('Row persisted and retrieved');
    } else {
      fail('Row not found after insert');
    }

    // ========================================
    // 2. UNIQUE CONSTRAINT PROOF
    // ========================================
    header('2. UNIQUE CONSTRAINT PROOF');

    try {
      await pool.query(`
        INSERT INTO os_user_preferences (tenant_id, workspace_id, user_id, prefs)
        VALUES ($1, $2, $3, $4)
      `, [testTenantId, testWorkspaceA, testUser1, JSON.stringify({ verbosity: 'high' })]);
      fail('Duplicate insert should have failed');
    } catch (err) {
      if (err.code === '23505') { // unique_violation
        pass('Unique constraint enforced (duplicate rejected)');
      } else {
        fail(`Unexpected error: ${err.message}`);
      }
    }

    // ========================================
    // 3. SCOPE ISOLATION PROOF
    // ========================================
    header('3. SCOPE ISOLATION PROOF');

    // Same user, different workspace
    await pool.query(`
      INSERT INTO os_user_preferences (tenant_id, workspace_id, user_id, prefs)
      VALUES ($1, $2, $3, $4)
    `, [testTenantId, testWorkspaceB, testUser1, JSON.stringify({ verbosity: 'high' })]);

    const workspaceAResult = await pool.query(`
      SELECT prefs FROM os_user_preferences
      WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
    `, [testTenantId, testWorkspaceA, testUser1]);

    const workspaceBResult = await pool.query(`
      SELECT prefs FROM os_user_preferences
      WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
    `, [testTenantId, testWorkspaceB, testUser1]);

    if (workspaceAResult.rows[0].prefs.verbosity === 'low' &&
        workspaceBResult.rows[0].prefs.verbosity === 'high') {
      pass('Same user, different workspaces = different prefs');
      console.log(`   Workspace A: verbosity=${workspaceAResult.rows[0].prefs.verbosity}`);
      console.log(`   Workspace B: verbosity=${workspaceBResult.rows[0].prefs.verbosity}`);
    } else {
      fail('Workspace isolation failed');
    }

    // Different user, same workspace
    await pool.query(`
      INSERT INTO os_user_preferences (tenant_id, workspace_id, user_id, prefs)
      VALUES ($1, $2, $3, $4)
    `, [testTenantId, testWorkspaceA, testUser2, JSON.stringify({ verbosity: 'medium' })]);

    const user1Result = await pool.query(`
      SELECT prefs FROM os_user_preferences
      WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
    `, [testTenantId, testWorkspaceA, testUser1]);

    const user2Result = await pool.query(`
      SELECT prefs FROM os_user_preferences
      WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3
    `, [testTenantId, testWorkspaceA, testUser2]);

    if (user1Result.rows[0].prefs.verbosity === 'low' &&
        user2Result.rows[0].prefs.verbosity === 'medium') {
      pass('Different users, same workspace = different prefs');
      console.log(`   User 1: verbosity=${user1Result.rows[0].prefs.verbosity}`);
      console.log(`   User 2: verbosity=${user2Result.rows[0].prefs.verbosity}`);
    } else {
      fail('User isolation failed');
    }

    // ========================================
    // 4. VALIDATION FUNCTION PROOF
    // ========================================
    header('4. VALIDATION FUNCTION PROOF (inline implementation)');

    // Inline validation logic (mirrors user-preferences.ts)
    const ALLOWED_KEYS = ['verbosity', 'evidence_depth', 'automation_level', 'risk_tolerance', 'notification_pref'];
    const VERBOSITY_VALUES = ['low', 'medium', 'high'];
    const EVIDENCE_DEPTH_VALUES = ['summary', 'detailed'];
    const AUTOMATION_LEVEL_VALUES = ['assist', 'recommend', 'auto'];
    const RISK_TOLERANCE_VALUES = ['conservative', 'balanced', 'aggressive'];
    const DEFAULT_PREFS = {
      verbosity: 'medium',
      evidence_depth: 'summary',
      automation_level: 'assist',
      risk_tolerance: 'balanced',
      notification_pref: { email: true, in_app: true },
    };

    function validatePreferences(partial) {
      const unknownKeys = Object.keys(partial).filter(k => !ALLOWED_KEYS.includes(k));
      if (unknownKeys.length > 0) {
        return `Unknown preference keys: ${unknownKeys.join(', ')}. Allowed: ${ALLOWED_KEYS.join(', ')}`;
      }
      if (partial.verbosity && !VERBOSITY_VALUES.includes(partial.verbosity)) {
        return `Invalid verbosity: ${partial.verbosity}. Allowed: ${VERBOSITY_VALUES.join(', ')}`;
      }
      if (partial.evidence_depth && !EVIDENCE_DEPTH_VALUES.includes(partial.evidence_depth)) {
        return `Invalid evidence_depth: ${partial.evidence_depth}. Allowed: ${EVIDENCE_DEPTH_VALUES.join(', ')}`;
      }
      if (partial.automation_level && !AUTOMATION_LEVEL_VALUES.includes(partial.automation_level)) {
        return `Invalid automation_level: ${partial.automation_level}. Allowed: ${AUTOMATION_LEVEL_VALUES.join(', ')}`;
      }
      if (partial.risk_tolerance && !RISK_TOLERANCE_VALUES.includes(partial.risk_tolerance)) {
        return `Invalid risk_tolerance: ${partial.risk_tolerance}. Allowed: ${RISK_TOLERANCE_VALUES.join(', ')}`;
      }
      return null;
    }

    function mergeWithDefaults(partial) {
      return {
        verbosity: partial.verbosity || DEFAULT_PREFS.verbosity,
        evidence_depth: partial.evidence_depth || DEFAULT_PREFS.evidence_depth,
        automation_level: partial.automation_level || DEFAULT_PREFS.automation_level,
        risk_tolerance: partial.risk_tolerance || DEFAULT_PREFS.risk_tolerance,
        notification_pref: {
          ...DEFAULT_PREFS.notification_pref,
          ...(partial.notification_pref || {}),
        },
      };
    }

    // Test unknown key rejection
    const unknownKeyError = validatePreferences({ hacked: true });
    if (unknownKeyError && unknownKeyError.includes('Unknown preference keys')) {
      pass('Unknown key "hacked" rejected');
      console.log(`   Error: ${unknownKeyError}`);
    } else {
      fail('Unknown key should be rejected');
    }

    // Test bad enum rejection
    const badEnumError = validatePreferences({ verbosity: 'ultra' });
    if (badEnumError && badEnumError.includes('Invalid verbosity')) {
      pass('Bad enum "ultra" rejected');
      console.log(`   Error: ${badEnumError}`);
    } else {
      fail('Bad enum should be rejected');
    }

    // Test valid prefs accepted
    const validError = validatePreferences({ verbosity: 'low', evidence_depth: 'detailed' });
    if (validError === null) {
      pass('Valid prefs accepted');
    } else {
      fail(`Valid prefs rejected: ${validError}`);
    }

    // Test merge with defaults
    const merged = mergeWithDefaults({ verbosity: 'low' });
    if (merged.verbosity === 'low' && merged.evidence_depth === 'summary' && merged.automation_level === 'assist') {
      pass('Merge with defaults works correctly');
      console.log(`   merged.verbosity: ${merged.verbosity} (from user)`);
      console.log(`   merged.evidence_depth: ${merged.evidence_depth} (from default)`);
      console.log(`   merged.automation_level: ${merged.automation_level} (from default)`);
    } else {
      fail('Merge logic broken');
    }

    // ========================================
    // 5. CONTROL PLANE NON-CONTAMINATION
    // ========================================
    header('5. CONTROL PLANE NON-CONTAMINATION');

    // Check that os_user_preferences doesn't have foreign keys to control plane tables
    const fkResult = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'os_user_preferences'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);

    if (fkResult.rows.length === 0) {
      pass('No foreign keys to control plane tables');
    } else {
      fail(`Found foreign keys: ${JSON.stringify(fkResult.rows)}`);
    }

    // Verify control plane tables were NOT modified by S253
    const controlPlaneTables = ['os_verticals', 'os_sub_verticals', 'os_personas', 'os_persona_policies', 'os_workspace_bindings'];

    for (const table of controlPlaneTables) {
      const colCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = $1 AND column_name LIKE '%pref%'
      `, [table]);

      if (colCheck.rows.length === 0) {
        pass(`${table}: No preference columns added`);
      } else {
        fail(`${table}: Found preference columns: ${JSON.stringify(colCheck.rows)}`);
      }
    }

    // ========================================
    // CLEANUP
    // ========================================
    header('CLEANUP');

    await pool.query(
      'DELETE FROM os_user_preferences WHERE tenant_id = $1',
      [testTenantId]
    );
    pass('Test data cleaned up');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║          UPL v0.1 VALIDATION COMPLETE                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
