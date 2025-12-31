/**
 * S347-F6: Context Completeness Tests
 *
 * Validates that ResolvedContext fields are properly populated
 * when business events are emitted from Admin Plane mutations.
 *
 * Test Contract:
 * - ENTERPRISE_CREATED event has non-NULL enterprise_id
 * - WORKSPACE_CREATED event has non-NULL workspace_id AND enterprise_id
 * - USER_CREATED for enterprise user has non-NULL enterprise_id
 * - Evidence Pack includes populated context fields
 *
 * Run: npx tsx scripts/tests/context-completeness.test.ts
 */

import { query, queryOne } from '../../lib/db/client';
import {
  emitBusinessEvent,
  StoredBusinessEvent,
} from '../../lib/events/event-emitter';
import {
  createSuperAdminContextWithTarget,
  ResolvedContext,
} from '../../lib/auth/session/session-context';

// ============================================================
// TEST UTILITIES
// ============================================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
  console.log(`✅ ${message}`);
}

function assertNotNull<T>(
  value: T | null | undefined,
  fieldName: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`❌ ASSERTION FAILED: ${fieldName} is ${value}`);
  }
  console.log(`✅ ${fieldName} is populated: ${value}`);
}

// ============================================================
// TEST 1: ENTERPRISE_CREATED Context Completeness
// ============================================================

async function testEnterpriseCreatedContext() {
  console.log('\n=== TEST 1: ENTERPRISE_CREATED Context Completeness ===\n');

  const testEnterpriseId = `test-ent-${Date.now()}`;

  // Emit event with target context
  const ctx = createSuperAdminContextWithTarget({
    enterprise_id: testEnterpriseId,
    region_code: 'UAE',
  });

  const event = await emitBusinessEvent(ctx, {
    event_type: 'ENTERPRISE_CREATED',
    entity_type: 'ENTERPRISE',
    entity_id: testEnterpriseId,
    metadata: { test: true },
  });

  // Parse stored metadata
  const metadata =
    typeof event.metadata === 'string'
      ? JSON.parse(event.metadata)
      : event.metadata;
  const resolvedContext = metadata.resolved_context as Partial<ResolvedContext>;

  // Validate context completeness
  assertNotNull(resolvedContext.enterprise_id, 'resolved_context.enterprise_id');
  assert(
    resolvedContext.enterprise_id === testEnterpriseId,
    `enterprise_id matches (${resolvedContext.enterprise_id})`
  );
  assertNotNull(resolvedContext.region_code, 'resolved_context.region_code');
  assert(
    resolvedContext.role === 'SUPER_ADMIN',
    'role is SUPER_ADMIN for Super Admin context'
  );

  // Cleanup
  await query('DELETE FROM business_events WHERE entity_id = $1', [
    testEnterpriseId,
  ]);

  console.log('ENTERPRISE_CREATED context completeness verified.');
}

// ============================================================
// TEST 2: WORKSPACE_CREATED Context Completeness
// ============================================================

async function testWorkspaceCreatedContext() {
  console.log('\n=== TEST 2: WORKSPACE_CREATED Context Completeness ===\n');

  const testEnterpriseId = `test-ent-ws-${Date.now()}`;
  const testWorkspaceId = `test-ws-${Date.now()}`;
  const testSubVerticalId = `test-sv-${Date.now()}`;

  // Emit event with full target context
  const ctx = createSuperAdminContextWithTarget({
    enterprise_id: testEnterpriseId,
    workspace_id: testWorkspaceId,
    sub_vertical_id: testSubVerticalId,
    region_code: 'UAE',
  });

  const event = await emitBusinessEvent(ctx, {
    event_type: 'WORKSPACE_CREATED',
    entity_type: 'WORKSPACE',
    entity_id: testWorkspaceId,
    metadata: { test: true },
  });

  // Parse stored metadata
  const metadata =
    typeof event.metadata === 'string'
      ? JSON.parse(event.metadata)
      : event.metadata;
  const resolvedContext = metadata.resolved_context as Partial<ResolvedContext>;

  // Validate WORKSPACE requires both workspace_id AND enterprise_id
  assertNotNull(resolvedContext.workspace_id, 'resolved_context.workspace_id');
  assertNotNull(resolvedContext.enterprise_id, 'resolved_context.enterprise_id');
  assertNotNull(
    resolvedContext.sub_vertical_id,
    'resolved_context.sub_vertical_id'
  );
  assertNotNull(resolvedContext.region_code, 'resolved_context.region_code');

  assert(
    resolvedContext.workspace_id === testWorkspaceId,
    `workspace_id matches (${resolvedContext.workspace_id})`
  );
  assert(
    resolvedContext.enterprise_id === testEnterpriseId,
    `enterprise_id matches (${resolvedContext.enterprise_id})`
  );

  // Cleanup
  await query('DELETE FROM business_events WHERE entity_id = $1', [
    testWorkspaceId,
  ]);

  console.log('WORKSPACE_CREATED context completeness verified.');
}

// ============================================================
// TEST 3: USER_CREATED Context Completeness
// ============================================================

async function testUserCreatedContext() {
  console.log('\n=== TEST 3: USER_CREATED Context Completeness ===\n');

  const testEnterpriseId = `test-ent-usr-${Date.now()}`;
  const testWorkspaceId = `test-ws-usr-${Date.now()}`;
  const testUserId = `test-usr-${Date.now()}`;

  // Emit event with target context
  const ctx = createSuperAdminContextWithTarget({
    enterprise_id: testEnterpriseId,
    workspace_id: testWorkspaceId,
  });

  const event = await emitBusinessEvent(ctx, {
    event_type: 'USER_CREATED',
    entity_type: 'USER',
    entity_id: testUserId,
    metadata: { test: true },
  });

  // Parse stored metadata
  const metadata =
    typeof event.metadata === 'string'
      ? JSON.parse(event.metadata)
      : event.metadata;
  const resolvedContext = metadata.resolved_context as Partial<ResolvedContext>;

  // Validate USER for enterprise must have enterprise_id
  assertNotNull(resolvedContext.enterprise_id, 'resolved_context.enterprise_id');
  assert(
    resolvedContext.enterprise_id === testEnterpriseId,
    `enterprise_id matches (${resolvedContext.enterprise_id})`
  );

  // Cleanup
  await query('DELETE FROM business_events WHERE entity_id = $1', [testUserId]);

  console.log('USER_CREATED context completeness verified.');
}

// ============================================================
// TEST 4: Validation Rules Fire on Incomplete Context
// ============================================================

async function testValidationRules() {
  console.log('\n=== TEST 4: Validation Rules ===\n');

  // Test that emitting ENTERPRISE event with NULL enterprise_id triggers warning
  // (In strict mode, this would throw)

  const originalEnv = process.env.STRICT_CONTEXT_VALIDATION;
  process.env.STRICT_CONTEXT_VALIDATION = 'false';

  const warnSpy: string[] = [];
  const originalWarn = console.warn;
  console.warn = (msg: string) => {
    warnSpy.push(msg);
    originalWarn(msg);
  };

  try {
    const incompleteCtx = createSuperAdminContextWithTarget({
      // enterprise_id intentionally missing for ENTERPRISE event
    });

    const testEntityId = `test-incomplete-${Date.now()}`;

    await emitBusinessEvent(incompleteCtx, {
      event_type: 'ENTERPRISE_CREATED',
      entity_type: 'ENTERPRISE',
      entity_id: testEntityId,
      metadata: { test: true },
    });

    // Should have logged a warning
    const s347Warning = warnSpy.find((w) => w.includes('[S347]'));
    assert(
      s347Warning !== undefined,
      'S347 warning fired for incomplete ENTERPRISE context'
    );
    console.log(`  Warning: ${s347Warning?.substring(0, 80)}...`);

    // Cleanup
    await query('DELETE FROM business_events WHERE entity_id = $1', [
      testEntityId,
    ]);
  } finally {
    console.warn = originalWarn;
    process.env.STRICT_CONTEXT_VALIDATION = originalEnv;
  }

  console.log('Validation rules verified.');
}

// ============================================================
// TEST 5: Strict Mode Throws on Incomplete Context
// ============================================================

async function testStrictModeThrows() {
  console.log('\n=== TEST 5: Strict Mode Throws ===\n');

  const originalEnv = process.env.STRICT_CONTEXT_VALIDATION;
  process.env.STRICT_CONTEXT_VALIDATION = 'true';

  try {
    const incompleteCtx = createSuperAdminContextWithTarget({
      // enterprise_id intentionally missing
    });

    let threw = false;
    try {
      await emitBusinessEvent(incompleteCtx, {
        event_type: 'ENTERPRISE_CREATED',
        entity_type: 'ENTERPRISE',
        entity_id: `test-strict-${Date.now()}`,
        metadata: { test: true },
      });
    } catch (error) {
      threw = true;
      const errorMsg = (error as Error).message;
      assert(
        errorMsg.includes('[S347]'),
        'Error message mentions S347 validation'
      );
      console.log(`  Error thrown: ${errorMsg.substring(0, 80)}...`);
    }

    assert(threw, 'Strict mode throws on incomplete context');
  } finally {
    process.env.STRICT_CONTEXT_VALIDATION = originalEnv;
  }

  console.log('Strict mode verified.');
}

// ============================================================
// TEST 6: Evidence Pack Contains Populated Context
// ============================================================

async function testEvidencePackContext() {
  console.log('\n=== TEST 6: Evidence Pack Context ===\n');

  const testEnterpriseId = `test-ent-evidence-${Date.now()}`;

  // Create enterprise event with full context
  const ctx = createSuperAdminContextWithTarget({
    enterprise_id: testEnterpriseId,
    region_code: 'UAE',
  });

  await emitBusinessEvent(ctx, {
    event_type: 'ENTERPRISE_CREATED',
    entity_type: 'ENTERPRISE',
    entity_id: testEnterpriseId,
    metadata: { enterprise_name: 'Test Corp' },
  });

  // Query the event like Evidence Pack would
  const events = await query<StoredBusinessEvent>(
    `SELECT * FROM business_events WHERE entity_id = $1`,
    [testEnterpriseId]
  );

  assert(events.length > 0, 'Event found in business_events table');

  const event = events[0];
  const metadata =
    typeof event.metadata === 'string'
      ? JSON.parse(event.metadata)
      : event.metadata;

  // Evidence Pack checks
  assertNotNull(
    metadata.resolved_context,
    'metadata.resolved_context exists'
  );
  assertNotNull(
    metadata.resolved_context.enterprise_id,
    'metadata.resolved_context.enterprise_id'
  );
  assertNotNull(
    metadata.resolved_context.region_code,
    'metadata.resolved_context.region_code'
  );

  // Verify it's not NULL or sentinel UUID
  const SENTINEL_UUID = '00000000-0000-0000-0000-000000000000';
  assert(
    metadata.resolved_context.enterprise_id !== SENTINEL_UUID,
    'enterprise_id is not sentinel UUID'
  );

  // Cleanup
  await query('DELETE FROM business_events WHERE entity_id = $1', [
    testEnterpriseId,
  ]);

  console.log('Evidence Pack context verified.');
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(
    '╔══════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║     S347-F6: Context Completeness Tests                      ║'
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝'
  );

  const tests = [
    testEnterpriseCreatedContext,
    testWorkspaceCreatedContext,
    testUserCreatedContext,
    testValidationRules,
    testStrictModeThrows,
    testEvidencePackContext,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      console.error(`\n${error}`);
      failed++;
    }
  }

  console.log(
    '\n╔══════════════════════════════════════════════════════════════╗'
  );
  console.log(
    `║  Results: ${passed} passed, ${failed} failed                                    ║`
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝'
  );

  if (failed > 0) {
    process.exit(1);
  }

  console.log('\n✅ All S347 Context Completeness tests passed!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
