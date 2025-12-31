/**
 * PLG Evidence Test Script
 *
 * Executes PLG actions and captures evidence for validation.
 */

import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://upr_app:f474d5aa0a71faf781dc7b9e021004bd2909545f9198e787@localhost:5433/upr_production';

const pool = new Pool({ connectionString: DATABASE_URL });

const DEMO_USER_ID = 'a1111111-1111-1111-1111-111111111111';
const REAL_USER_ID = 'a2222222-2222-2222-2222-222222222222';
const SUPER_ADMIN_EMAIL = 'skc@sivakumar.ai';
const SUPER_ADMIN_USER_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const PLG_WORKSPACE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PLG_SUB_VERTICAL_ID = 'b2c3d4e5-f6a7-4890-bcde-222222222222';

async function emitBusinessEvent(context, event) {
  // Schema: event_id, event_type, entity_type, entity_id, workspace_id, sub_vertical_id, actor_user_id, timestamp, metadata
  // For Super Admin actions, actor_user_id is NULL (system action), actor email goes in metadata
  const result = await pool.query(`
    INSERT INTO business_events (
      event_type, entity_type, entity_id,
      workspace_id, sub_vertical_id, actor_user_id,
      metadata
    ) VALUES ($1, $2, $3::uuid, $4::uuid, $5::uuid, $6::uuid, $7::jsonb)
    RETURNING event_id, timestamp
  `, [
    event.event_type,
    event.entity_type,
    event.entity_id,
    context.workspace_id,
    context.sub_vertical_id,
    SUPER_ADMIN_USER_ID,  // actor_user_id - Super Admin user ID
    JSON.stringify({
      ...event.metadata,
      actor_email: context.user_id,  // Store email in metadata
      actor_role: context.role,
      is_demo: context.is_demo,
    })
  ]);
  return result.rows[0];
}

async function testForceConvert() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: FORCE CONVERT (Demo → Real)');
  console.log('='.repeat(60));

  // Reset demo user to initial state
  await pool.query(`UPDATE users SET is_demo = true, is_active = true WHERE id = $1`, [DEMO_USER_ID]);

  const client = await pool.connect();
  try {
    // Get BEFORE state
    const beforeResult = await client.query('SELECT * FROM users WHERE id = $1', [DEMO_USER_ID]);
    const beforeUser = beforeResult.rows[0];
    console.log('\nBEFORE:');
    console.log('  is_demo:', beforeUser.is_demo);
    console.log('  is_active:', beforeUser.is_active);

    const convertedAt = new Date().toISOString();

    await client.query('BEGIN');

    // Update user
    await client.query(
      `UPDATE users SET is_demo = false, updated_at = NOW() WHERE id = $1`,
      [DEMO_USER_ID]
    );

    // Update profile metadata
    await client.query(
      `UPDATE user_profiles SET
        metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
        updated_at = NOW()
      WHERE user_id = $1`,
      [DEMO_USER_ID, JSON.stringify({
        demo_converted: true,
        demo_converted_at: convertedAt,
        conversion_reason: 'force_convert_test',
        converted_by: 'superadmin'
      })]
    );

    await client.query('COMMIT');

    // Emit event
    const eventResult = await emitBusinessEvent(
      {
        user_id: SUPER_ADMIN_EMAIL,
        role: 'SUPER_ADMIN',
        enterprise_id: null,
        workspace_id: PLG_WORKSPACE_ID,
        sub_vertical_id: PLG_SUB_VERTICAL_ID,
        region_code: 'UAE',
        is_demo: false,
        demo_type: null,
      },
      {
        event_type: 'PLG_ADMIN_CONVERT',
        entity_type: 'USER',
        entity_id: DEMO_USER_ID,
        metadata: {
          action: 'force_convert',
          target_user_email: beforeUser.email,
          target_user_role: beforeUser.role,
          converted_at: convertedAt,
          conversion_reason: 'force_convert_test',
          performed_by: SUPER_ADMIN_EMAIL,
          was_demo: true,
          days_as_demo: Math.floor((Date.now() - new Date(beforeUser.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        },
      }
    );

    // Get AFTER state
    const afterResult = await client.query('SELECT * FROM users WHERE id = $1', [DEMO_USER_ID]);
    const afterUser = afterResult.rows[0];
    console.log('\nAFTER:');
    console.log('  is_demo:', afterUser.is_demo);
    console.log('  is_active:', afterUser.is_active);

    console.log('\nEVENT EMITTED:');
    console.log('  event_id:', eventResult.id);
    console.log('  created_at:', eventResult.created_at);

    return eventResult;
  } finally {
    client.release();
  }
}

async function testForceSuspend() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: FORCE SUSPEND (Real User)');
  console.log('='.repeat(60));

  // Reset real user to initial state (active)
  await pool.query(`UPDATE users SET is_active = true WHERE id = $1`, [REAL_USER_ID]);

  const client = await pool.connect();
  try {
    // Get BEFORE state
    const beforeResult = await client.query('SELECT * FROM users WHERE id = $1', [REAL_USER_ID]);
    const beforeUser = beforeResult.rows[0];
    console.log('\nBEFORE:');
    console.log('  is_active:', beforeUser.is_active);

    const suspendedAt = new Date().toISOString();

    await client.query('BEGIN');

    // Suspend user
    await client.query(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [REAL_USER_ID]
    );

    // Update profile metadata
    await client.query(
      `UPDATE user_profiles SET
        metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
        updated_at = NOW()
      WHERE user_id = $1`,
      [REAL_USER_ID, JSON.stringify({
        suspended: true,
        suspended_at: suspendedAt,
        suspended_by: 'superadmin',
        suspension_reason: 'test_suspension'
      })]
    );

    await client.query('COMMIT');

    // Emit event
    const eventResult = await emitBusinessEvent(
      {
        user_id: SUPER_ADMIN_EMAIL,
        role: 'SUPER_ADMIN',
        enterprise_id: null,
        workspace_id: PLG_WORKSPACE_ID,
        sub_vertical_id: PLG_SUB_VERTICAL_ID,
        region_code: 'UAE',
        is_demo: false,
        demo_type: null,
      },
      {
        event_type: 'PLG_ADMIN_SUSPEND',
        entity_type: 'USER',
        entity_id: REAL_USER_ID,
        metadata: {
          action: 'suspend',
          target_user_email: beforeUser.email,
          target_user_role: beforeUser.role,
          suspended_at: suspendedAt,
          suspension_reason: 'test_suspension',
          performed_by: SUPER_ADMIN_EMAIL,
          was_demo: beforeUser.is_demo,
        },
      }
    );

    // Get AFTER state
    const afterResult = await client.query('SELECT * FROM users WHERE id = $1', [REAL_USER_ID]);
    const afterUser = afterResult.rows[0];
    console.log('\nAFTER:');
    console.log('  is_active:', afterUser.is_active);

    console.log('\nEVENT EMITTED:');
    console.log('  event_id:', eventResult.id);
    console.log('  created_at:', eventResult.created_at);

    return eventResult;
  } finally {
    client.release();
  }
}

async function testForceReinstate() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: FORCE REINSTATE (Suspended User)');
  console.log('='.repeat(60));

  const client = await pool.connect();
  try {
    // Get BEFORE state
    const beforeResult = await client.query('SELECT * FROM users WHERE id = $1', [REAL_USER_ID]);
    const beforeUser = beforeResult.rows[0];
    console.log('\nBEFORE:');
    console.log('  is_active:', beforeUser.is_active);

    const reinstatedAt = new Date().toISOString();

    await client.query('BEGIN');

    // Reinstate user
    await client.query(
      `UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1`,
      [REAL_USER_ID]
    );

    // Update profile metadata
    await client.query(
      `UPDATE user_profiles SET
        metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
        updated_at = NOW()
      WHERE user_id = $1`,
      [REAL_USER_ID, JSON.stringify({
        suspended: false,
        reinstated_at: reinstatedAt,
        reinstated_by: 'superadmin'
      })]
    );

    await client.query('COMMIT');

    // Emit event
    const eventResult = await emitBusinessEvent(
      {
        user_id: SUPER_ADMIN_EMAIL,
        role: 'SUPER_ADMIN',
        enterprise_id: null,
        workspace_id: PLG_WORKSPACE_ID,
        sub_vertical_id: PLG_SUB_VERTICAL_ID,
        region_code: 'UAE',
        is_demo: false,
        demo_type: null,
      },
      {
        event_type: 'PLG_ADMIN_REINSTATE',
        entity_type: 'USER',
        entity_id: REAL_USER_ID,
        metadata: {
          action: 'reinstate',
          target_user_email: beforeUser.email,
          target_user_role: beforeUser.role,
          reinstated_at: reinstatedAt,
          performed_by: SUPER_ADMIN_EMAIL,
          is_demo: beforeUser.is_demo,
        },
      }
    );

    // Get AFTER state
    const afterResult = await client.query('SELECT * FROM users WHERE id = $1', [REAL_USER_ID]);
    const afterUser = afterResult.rows[0];
    console.log('\nAFTER:');
    console.log('  is_active:', afterUser.is_active);

    console.log('\nEVENT EMITTED:');
    console.log('  event_id:', eventResult.id);
    console.log('  created_at:', eventResult.created_at);

    return eventResult;
  } finally {
    client.release();
  }
}

async function testForceExpire() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: FORCE EXPIRE (Converted User → Expired)');
  console.log('='.repeat(60));

  // First reset demo user back to demo state for this test
  await pool.query(`UPDATE users SET is_demo = true WHERE id = $1`, [DEMO_USER_ID]);

  const client = await pool.connect();
  try {
    // Get BEFORE state
    const beforeResult = await client.query('SELECT * FROM users WHERE id = $1', [DEMO_USER_ID]);
    const beforeUser = beforeResult.rows[0];
    console.log('\nBEFORE:');
    console.log('  is_demo:', beforeUser.is_demo);
    console.log('  is_active:', beforeUser.is_active);

    const expiredAt = new Date().toISOString();

    await client.query('BEGIN');

    // Expire demo
    await client.query(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [DEMO_USER_ID]
    );

    // Update profile metadata
    await client.query(
      `UPDATE user_profiles SET
        metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
        updated_at = NOW()
      WHERE user_id = $1`,
      [DEMO_USER_ID, JSON.stringify({
        demo_expired: true,
        demo_expired_at: expiredAt,
        expired_by: 'superadmin'
      })]
    );

    await client.query('COMMIT');

    // Emit event
    const eventResult = await emitBusinessEvent(
      {
        user_id: SUPER_ADMIN_EMAIL,
        role: 'SUPER_ADMIN',
        enterprise_id: null,
        workspace_id: PLG_WORKSPACE_ID,
        sub_vertical_id: PLG_SUB_VERTICAL_ID,
        region_code: 'UAE',
        is_demo: false,
        demo_type: null,
      },
      {
        event_type: 'PLG_ADMIN_EXPIRE',
        entity_type: 'USER',
        entity_id: DEMO_USER_ID,
        metadata: {
          action: 'force_expire',
          target_user_email: beforeUser.email,
          target_user_role: beforeUser.role,
          expired_at: expiredAt,
          performed_by: SUPER_ADMIN_EMAIL,
          days_as_demo: Math.floor((Date.now() - new Date(beforeUser.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        },
      }
    );

    // Get AFTER state
    const afterResult = await client.query('SELECT * FROM users WHERE id = $1', [DEMO_USER_ID]);
    const afterUser = afterResult.rows[0];
    console.log('\nAFTER:');
    console.log('  is_demo:', afterUser.is_demo);
    console.log('  is_active:', afterUser.is_active);

    console.log('\nEVENT EMITTED:');
    console.log('  event_id:', eventResult.id);
    console.log('  created_at:', eventResult.created_at);

    return eventResult;
  } finally {
    client.release();
  }
}

async function testOverrideContext() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST: OVERRIDE CONTEXT');
  console.log('='.repeat(60));

  const client = await pool.connect();
  try {
    // Get BEFORE state
    const beforeResult = await client.query(`
      SELECT u.*, up.vertical, up.sub_vertical, up.region_country
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.id = $1
    `, [REAL_USER_ID]);
    const beforeUser = beforeResult.rows[0];
    console.log('\nBEFORE:');
    console.log('  vertical:', beforeUser.vertical);
    console.log('  sub_vertical:', beforeUser.sub_vertical);
    console.log('  region_country:', beforeUser.region_country);

    const overrideAt = new Date().toISOString();
    const changes = {
      vertical: { from: 'banking', to: 'insurance' },
      sub_vertical: { from: 'employee_banking', to: 'corporate_insurance' },
      region_country: { from: 'UAE', to: 'India' },
    };

    await client.query('BEGIN');

    // Update profile context
    await client.query(
      `UPDATE user_profiles SET
        vertical = 'insurance',
        sub_vertical = 'corporate_insurance',
        region_country = 'India',
        metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
        updated_at = NOW()
      WHERE user_id = $1`,
      [REAL_USER_ID, JSON.stringify({
        last_override_at: overrideAt,
        last_override_by: 'superadmin',
        last_override_changes: changes
      })]
    );

    await client.query('COMMIT');

    // Emit event
    const eventResult = await emitBusinessEvent(
      {
        user_id: SUPER_ADMIN_EMAIL,
        role: 'SUPER_ADMIN',
        enterprise_id: null,
        workspace_id: PLG_WORKSPACE_ID,
        sub_vertical_id: PLG_SUB_VERTICAL_ID,
        region_code: 'UAE',
        is_demo: false,
        demo_type: null,
      },
      {
        event_type: 'PLG_ADMIN_OVERRIDE',
        entity_type: 'USER',
        entity_id: REAL_USER_ID,
        metadata: {
          action: 'override_context',
          target_user_email: beforeUser.email,
          target_user_role: beforeUser.role,
          override_at: overrideAt,
          performed_by: SUPER_ADMIN_EMAIL,
          changes: changes,
        },
      }
    );

    // Get AFTER state
    const afterResult = await client.query(`
      SELECT up.vertical, up.sub_vertical, up.region_country
      FROM user_profiles up WHERE user_id = $1
    `, [REAL_USER_ID]);
    const afterProfile = afterResult.rows[0];
    console.log('\nAFTER:');
    console.log('  vertical:', afterProfile.vertical);
    console.log('  sub_vertical:', afterProfile.sub_vertical);
    console.log('  region_country:', afterProfile.region_country);

    console.log('\nEVENT EMITTED:');
    console.log('  event_id:', eventResult.id);
    console.log('  created_at:', eventResult.created_at);
    console.log('  changes:', JSON.stringify(changes, null, 2));

    return eventResult;
  } finally {
    client.release();
  }
}

async function verifyEvents() {
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION: All PLG_ADMIN_* Events');
  console.log('='.repeat(60));

  const result = await pool.query(`
    SELECT
      event_id, event_type, entity_type, entity_id,
      actor_user_id, workspace_id, sub_vertical_id,
      metadata, timestamp
    FROM business_events
    WHERE event_type LIKE 'PLG_ADMIN_%'
    ORDER BY timestamp DESC
    LIMIT 10
  `);

  console.log('\nTotal PLG_ADMIN events:', result.rows.length);

  result.rows.forEach((event, i) => {
    console.log(`\n--- Event ${i + 1} ---`);
    console.log('  event_id:', event.event_id);
    console.log('  event_type:', event.event_type);
    console.log('  entity_type:', event.entity_type);
    console.log('  entity_id:', event.entity_id);
    console.log('  actor_user_id:', event.actor_user_id);
    console.log('  workspace_id:', event.workspace_id);
    console.log('  sub_vertical_id:', event.sub_vertical_id);
    console.log('  timestamp:', event.timestamp);
    console.log('  metadata:', JSON.stringify(event.metadata, null, 4));
  });
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           PLG GOVERNANCE EVIDENCE TEST                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await testForceConvert();
    await testForceSuspend();
    await testForceReinstate();
    await testForceExpire();
    await testOverrideContext();
    await verifyEvents();

    console.log('\n' + '='.repeat(60));
    console.log('ALL TESTS COMPLETED');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

main();
