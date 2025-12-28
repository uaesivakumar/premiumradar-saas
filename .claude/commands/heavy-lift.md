# PremiumRadar Heavy-Lift Autonomous Execution Protocol v1.0

**Purpose:** Execute large multi-sprint programs (10+ sprints) autonomously with guaranteed correctness.

**Created:** Based on User & Enterprise Management v1.1 hostile audit failure analysis.

---

## WHEN TO USE THIS PROTOCOL

Use `/heavy-lift` for:
- Programs spanning 10+ sprints
- Multi-phase implementations (3+ phases)
- Cross-repo work (SaaS + OS)
- New system introduction (e.g., enterprises replacing tenants)
- Architecture changes affecting entry points

---

## THE PROBLEM WITH STANDARD EXECUTION

Standard `/start` works per-sprint but fails at program-level because:

| Issue | What Happens | Result |
|-------|--------------|--------|
| Spec-driven certification | TC certifies based on spec, not behavior | Files exist but don't function |
| No cross-sprint verification | Sprint 5 doesn't verify Sprint 1 still works | Regression |
| Entry point disconnect | New system created but signup still uses old | Two parallel systems |
| Deferred wiring | "Wire it later" → never wired | Orphaned code |
| No hostile audit | Self-certification is biased | Invalid certification |

---

## HEAVY-LIFT EXECUTION FLOW

```
/heavy-lift "User & Enterprise Management v1.1" S279-S329
    │
    ├── PHASE 0: PRE-FLIGHT CHECK (BLOCKING)
    │   ├── Verify Notion has all sprints
    │   ├── Verify all feature contracts defined
    │   ├── Identify entry points that must change
    │   ├── Identify tables/schemas being introduced
    │   ├── Generate BEHAVIOR CONTRACTS (not just file contracts)
    │   └── FOUNDER APPROVAL GATE
    │
    ├── PHASE 1: FOUNDATION SPRINTS (with continuous verification)
    │   ├── Execute sprints sequentially
    │   ├── After EACH sprint: run behavior verification
    │   ├── After EACH sprint: verify entry points still correct
    │   └── CHECKPOINT: Foundation complete
    │
    ├── PHASE 2-N: Execution Phases (same pattern)
    │   ├── Execute sprints
    │   ├── Continuous verification
    │   └── CHECKPOINT after each phase
    │
    ├── PHASE FINAL-1: INTEGRATION VERIFICATION
    │   ├── Run /integrator on ALL sprints
    │   ├── Verify ALL contracts
    │   └── CHECKPOINT: Integration complete
    │
    ├── PHASE FINAL: HOSTILE AUDIT (MANDATORY)
    │   ├── Run automated hostile audit
    │   ├── Trace ALL entry points
    │   ├── Verify ALL claimed files exist
    │   ├── Check ALL SQL column names
    │   ├── Verify role taxonomy consistency
    │   └── Generate HOSTILE AUDIT REPORT
    │
    └── CERTIFICATION (only if hostile audit passes)
```

---

## PHASE 0: PRE-FLIGHT CHECK

### Step 0.1: Generate Behavior Contracts

**Before ANY code is written, define BEHAVIOR contracts:**

```json
{
  "program_id": "user-enterprise-v1.1",
  "program_name": "User & Enterprise Management v1.1",
  "sprints": "S279-S329",

  "behavior_contracts": [
    {
      "behavior_id": "B001",
      "name": "User Signup Creates Enterprise",
      "entry_point": "app/api/auth/signup/route.ts",
      "trigger": "POST /api/auth/signup with email domain",
      "expected_behavior": [
        "Creates row in enterprises table",
        "Creates row in workspaces table (default workspace)",
        "Creates row in users table with enterprise_id set",
        "Session contains enterpriseId (not just tenantId)"
      ],
      "must_call": ["getOrCreateEnterpriseForDomain", "createDefaultWorkspace"],
      "must_not_call": ["getOrCreateTenantForDomain"],
      "db_writes": {
        "enterprises": { "required": true, "columns": ["enterprise_id", "name", "domain"] },
        "workspaces": { "required": true, "columns": ["workspace_id", "enterprise_id", "is_default"] },
        "users": { "required": true, "columns": ["id", "enterprise_id", "workspace_id"] }
      },
      "verification_query": "SELECT u.id, u.enterprise_id, e.name FROM users u JOIN enterprises e ON u.enterprise_id = e.enterprise_id WHERE u.email = $1"
    },
    {
      "behavior_id": "B002",
      "name": "Enterprise API Returns User's Enterprise",
      "entry_point": "app/api/enterprise/route.ts",
      "trigger": "GET /api/enterprise with valid session",
      "expected_behavior": [
        "Returns enterprise data for session.enterpriseId",
        "Does NOT return 404 for valid users"
      ],
      "prerequisite_behaviors": ["B001"],
      "verification_test": "After B001 completes, GET /api/enterprise returns 200 with enterprise data"
    }
  ],

  "entry_point_contracts": [
    {
      "entry_point": "app/api/auth/signup/route.ts",
      "before_program": {
        "calls": ["getOrCreateTenantForDomain"],
        "writes_to": ["tenants", "users"]
      },
      "after_program": {
        "calls": ["getOrCreateEnterpriseForDomain", "createDefaultWorkspace"],
        "writes_to": ["enterprises", "workspaces", "users"],
        "must_not_call": ["getOrCreateTenantForDomain"]
      }
    }
  ],

  "schema_contracts": [
    {
      "table": "enterprises",
      "primary_key": "enterprise_id",
      "required_columns": ["enterprise_id", "name", "domain", "is_active", "created_at"]
    },
    {
      "table": "workspaces",
      "primary_key": "workspace_id",
      "required_columns": ["workspace_id", "enterprise_id", "name", "is_default"]
    }
  ],

  "role_taxonomy_contract": {
    "taxonomy_version": "enterprise",
    "valid_roles": ["SUPER_ADMIN", "ENTERPRISE_ADMIN", "ENTERPRISE_USER", "INDIVIDUAL_USER"],
    "deprecated_roles": ["TENANT_ADMIN", "TENANT_USER"],
    "migration_required": true
  },

  "file_existence_contracts": [
    {
      "phase": "A",
      "files": [
        "lib/enterprise/types.ts",
        "lib/enterprise/context.tsx",
        "lib/enterprise/hooks.ts"
      ]
    },
    {
      "phase": "C",
      "files": [
        "lib/enterprise/enterprise-service.ts",
        "lib/enterprise/workspace-service.ts",
        "app/api/enterprise/route.ts"
      ]
    }
  ]
}
```

### Step 0.2: Founder Approval Gate

**BEFORE ANY EXECUTION:**

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    HEAVY-LIFT PRE-FLIGHT CHECK                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Program: User & Enterprise Management v1.1                                   ║
║  Sprints: S279-S329 (55 sprints)                                              ║
║  Phases: 9                                                                    ║
║                                                                               ║
║  BEHAVIOR CONTRACTS: 12                                                       ║
║    - User signup creates enterprise                                           ║
║    - Enterprise API returns data                                              ║
║    - Workspace creation                                                       ║
║    - ...                                                                      ║
║                                                                               ║
║  ENTRY POINT CHANGES: 3                                                       ║
║    - app/api/auth/signup/route.ts (CRITICAL)                                  ║
║    - app/api/auth/login/route.ts                                              ║
║    - middleware.ts                                                            ║
║                                                                               ║
║  SCHEMA CHANGES: 4 new tables                                                 ║
║    - enterprises (PK: enterprise_id)                                          ║
║    - workspaces (PK: workspace_id)                                            ║
║    - workspace_members                                                        ║
║    - user_invitations                                                         ║
║                                                                               ║
║  ROLE TAXONOMY: Migration required                                            ║
║    - FROM: TENANT_USER, TENANT_ADMIN                                          ║
║    - TO: ENTERPRISE_USER, ENTERPRISE_ADMIN                                    ║
║                                                                               ║
║  FILES TO CREATE: 24                                                          ║
║                                                                               ║
║  ⚠️  CRITICAL ENTRY POINT: signup                                             ║
║      Current: creates TENANT                                                  ║
║      Target: creates ENTERPRISE                                               ║
║      This MUST be wired in Phase C, not deferred.                            ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Reply "APPROVED" to begin autonomous execution.                              ║
║  Reply "ABORT" to cancel.                                                     ║
║  Reply with questions if contracts are unclear.                               ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## CONTINUOUS VERIFICATION (After Every Sprint)

After EACH sprint, TC MUST run:

### Verification Script

```javascript
async function runContinuousVerification(sprintId, programContracts) {
  const results = {
    sprint: sprintId,
    timestamp: new Date().toISOString(),
    checks: []
  };

  // 1. File existence check
  for (const fc of programContracts.file_existence_contracts) {
    if (fc.phase <= getCurrentPhase(sprintId)) {
      for (const file of fc.files) {
        const exists = fs.existsSync(file);
        results.checks.push({
          type: 'file_existence',
          file,
          expected: true,
          actual: exists,
          pass: exists
        });

        if (!exists) {
          console.error(`BLOCKING: File ${file} claimed in Phase ${fc.phase} does not exist`);
          return { pass: false, blocking: true, results };
        }
      }
    }
  }

  // 2. Entry point wiring check
  for (const ep of programContracts.entry_point_contracts) {
    const content = fs.readFileSync(ep.entry_point, 'utf8');

    for (const fn of ep.after_program.must_not_call || []) {
      if (content.includes(fn)) {
        results.checks.push({
          type: 'entry_point_legacy',
          entry_point: ep.entry_point,
          legacy_function: fn,
          pass: false
        });
        console.error(`BLOCKING: ${ep.entry_point} still calls legacy ${fn}`);
        return { pass: false, blocking: true, results };
      }
    }
  }

  // 3. SQL column check
  for (const sc of programContracts.schema_contracts) {
    const sqlFiles = glob.sync('lib/**/*.ts');
    for (const file of sqlFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const badPattern = new RegExp(`FROM\\s+${sc.table}[^;]*WHERE\\s+id\\s*=`, 'gi');

      if (sc.primary_key !== 'id' && badPattern.test(content)) {
        results.checks.push({
          type: 'sql_column',
          file,
          table: sc.table,
          expected_pk: sc.primary_key,
          pass: false
        });
        console.error(`BLOCKING: ${file} uses WHERE id = on ${sc.table} (should be ${sc.primary_key})`);
        return { pass: false, blocking: true, results };
      }
    }
  }

  // 4. Role taxonomy check
  const rt = programContracts.role_taxonomy_contract;
  if (rt.migration_required) {
    const securityFiles = glob.sync('lib/security/**/*.ts');
    for (const file of securityFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const usesDeprecated = rt.deprecated_roles.some(r => content.includes(r));
      const usesNew = rt.valid_roles.some(r => content.includes(r));

      if (usesDeprecated && usesNew) {
        results.checks.push({
          type: 'role_taxonomy',
          file,
          issue: 'mixed_taxonomy',
          pass: false
        });
        console.warn(`WARNING: ${file} mixes deprecated and new role taxonomy`);
      }
    }
  }

  results.pass = results.checks.every(c => c.pass);
  return results;
}
```

### Verification Gate

```
After Sprint S285 (Phase B):
────────────────────────────────────────────────────────────────────────────────
CONTINUOUS VERIFICATION
────────────────────────────────────────────────────────────────────────────────

File Existence:
  ✓ lib/enterprise/types.ts
  ✓ lib/enterprise/context.tsx
  ✗ lib/enterprise/hooks.ts  ← BLOCKING

Entry Point Wiring:
  ⚠ app/api/auth/signup/route.ts still calls getOrCreateTenantForDomain
    (Expected to be fixed in Phase C - monitoring)

SQL Columns:
  ✓ All queries use correct column names

Role Taxonomy:
  ⚠ lib/db/users.ts still uses TENANT_USER
    (Expected to be migrated in Phase G - monitoring)

────────────────────────────────────────────────────────────────────────────────
STATUS: ✗ BLOCKED - lib/enterprise/hooks.ts missing
────────────────────────────────────────────────────────────────────────────────

ACTION: Create lib/enterprise/hooks.ts before proceeding to next sprint.
```

---

## PHASE CHECKPOINTS

At the end of each phase, run a PHASE CHECKPOINT:

```javascript
async function runPhaseCheckpoint(phase, programContracts) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`PHASE ${phase} CHECKPOINT`);
  console.log(`${'═'.repeat(80)}\n`);

  // 1. All files for this phase must exist
  const phaseFiles = programContracts.file_existence_contracts
    .filter(fc => fc.phase === phase)
    .flatMap(fc => fc.files);

  const missingFiles = phaseFiles.filter(f => !fs.existsSync(f));
  if (missingFiles.length > 0) {
    console.error(`CHECKPOINT FAILED: Missing files for Phase ${phase}:`);
    missingFiles.forEach(f => console.error(`  - ${f}`));
    return { pass: false, phase, reason: 'missing_files' };
  }

  // 2. If this phase should wire entry points, verify they're wired
  const phaseEntryPoints = programContracts.entry_point_contracts
    .filter(ep => ep.wire_in_phase === phase);

  for (const ep of phaseEntryPoints) {
    const content = fs.readFileSync(ep.entry_point, 'utf8');

    for (const fn of ep.after_program.calls) {
      if (!content.includes(fn)) {
        console.error(`CHECKPOINT FAILED: ${ep.entry_point} must call ${fn} by Phase ${phase}`);
        return { pass: false, phase, reason: 'entry_point_not_wired' };
      }
    }
  }

  // 3. Run all behavior contracts that should work by this phase
  const phaseBehaviors = programContracts.behavior_contracts
    .filter(bc => bc.complete_by_phase <= phase);

  for (const bc of phaseBehaviors) {
    const result = await verifyBehavior(bc);
    if (!result.pass) {
      console.error(`CHECKPOINT FAILED: Behavior ${bc.behavior_id} not working`);
      console.error(`  ${bc.name}`);
      return { pass: false, phase, reason: 'behavior_not_working', behavior: bc };
    }
  }

  console.log(`\n✓ PHASE ${phase} CHECKPOINT PASSED\n`);
  return { pass: true, phase };
}
```

---

## MANDATORY HOSTILE AUDIT (Before Certification)

**TC CANNOT self-certify. An automated hostile audit MUST run.**

```javascript
async function runHostileAudit(programContracts) {
  console.log('\n' + '═'.repeat(80));
  console.log('HOSTILE AUDIT - READ ONLY');
  console.log('═'.repeat(80) + '\n');

  const findings = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  // 1. TRACE ALL ENTRY POINTS
  console.log('=== ENTRY POINT TRACE ===\n');

  for (const ep of programContracts.entry_point_contracts) {
    const content = fs.readFileSync(ep.entry_point, 'utf8');

    // Check for legacy calls
    for (const fn of ep.after_program.must_not_call || []) {
      if (content.includes(fn)) {
        findings.critical.push({
          type: 'ENTRY_POINT_LEGACY',
          file: ep.entry_point,
          issue: `Still calls legacy function: ${fn}`,
          expected: `Should call: ${ep.after_program.calls.join(', ')}`
        });
      }
    }

    // Check for required calls
    for (const fn of ep.after_program.calls) {
      if (!content.includes(fn)) {
        findings.critical.push({
          type: 'ENTRY_POINT_MISSING',
          file: ep.entry_point,
          issue: `Does not call required function: ${fn}`
        });
      }
    }
  }

  // 2. VERIFY ALL CLAIMED FILES EXIST
  console.log('=== FILE EXISTENCE ===\n');

  for (const fc of programContracts.file_existence_contracts) {
    for (const file of fc.files) {
      if (!fs.existsSync(file)) {
        findings.critical.push({
          type: 'FILE_MISSING',
          file,
          phase: fc.phase,
          issue: `Claimed in Phase ${fc.phase} but does not exist`
        });
      }
    }
  }

  // 3. CHECK ALL SQL COLUMN NAMES
  console.log('=== SQL COLUMN NAMES ===\n');

  for (const sc of programContracts.schema_contracts) {
    const sqlFiles = [
      ...glob.sync('lib/**/*.ts'),
      ...glob.sync('app/api/**/*.ts')
    ];

    for (const file of sqlFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for incorrect column usage
      const badPattern = new RegExp(`FROM\\s+${sc.table}[^;]*WHERE\\s+id\\s*=`, 'gi');
      if (sc.primary_key !== 'id' && badPattern.test(content)) {
        findings.critical.push({
          type: 'SQL_COLUMN_BUG',
          file,
          table: sc.table,
          issue: `Uses WHERE id = but ${sc.table} uses ${sc.primary_key}`
        });
      }
    }
  }

  // 4. VERIFY ROLE TAXONOMY
  console.log('=== ROLE TAXONOMY ===\n');

  const rt = programContracts.role_taxonomy_contract;
  const allFiles = [
    ...glob.sync('lib/**/*.ts'),
    ...glob.sync('app/**/*.ts')
  ];

  let usesDeprecated = false;
  let usesNew = false;

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (rt.deprecated_roles.some(r => content.includes(r))) usesDeprecated = true;
    if (rt.valid_roles.some(r => content.includes(r))) usesNew = true;
  }

  if (usesDeprecated && usesNew) {
    findings.high.push({
      type: 'ROLE_TAXONOMY_MIXED',
      issue: 'Codebase mixes deprecated and new role taxonomy'
    });
  }

  // 5. VERIFY BEHAVIORS ACTUALLY WORK
  console.log('=== BEHAVIOR VERIFICATION ===\n');

  for (const bc of programContracts.behavior_contracts) {
    // Trace the call graph from entry point to DB write
    const entryContent = fs.readFileSync(bc.entry_point, 'utf8');

    for (const fn of bc.must_call) {
      if (!entryContent.includes(fn)) {
        findings.critical.push({
          type: 'BEHAVIOR_BROKEN',
          behavior: bc.behavior_id,
          name: bc.name,
          issue: `Entry point does not call ${fn}`
        });
      }
    }
  }

  // 6. GENERATE REPORT
  console.log('\n' + '═'.repeat(80));
  console.log('HOSTILE AUDIT FINDINGS');
  console.log('═'.repeat(80) + '\n');

  if (findings.critical.length > 0) {
    console.log('CRITICAL FAILURES:');
    findings.critical.forEach((f, i) => {
      console.log(`  ${i + 1}. [${f.type}] ${f.file || ''}`);
      console.log(`     ${f.issue}`);
      if (f.expected) console.log(`     Expected: ${f.expected}`);
    });
  }

  if (findings.high.length > 0) {
    console.log('\nHIGH SEVERITY:');
    findings.high.forEach((f, i) => {
      console.log(`  ${i + 1}. [${f.type}] ${f.issue}`);
    });
  }

  // VERDICT
  console.log('\n' + '═'.repeat(80));
  if (findings.critical.length > 0) {
    console.log('VERDICT: ❌ CRITICAL FAILURE - NOT PRODUCTION READY');
    console.log(`${findings.critical.length} critical issues must be fixed.`);
    return { pass: false, findings };
  } else if (findings.high.length > 0) {
    console.log('VERDICT: ⚠️ CONDITIONAL PASS - HIGH SEVERITY ISSUES');
    console.log(`${findings.high.length} high severity issues should be addressed.`);
    return { pass: true, conditional: true, findings };
  } else {
    console.log('VERDICT: ✅ PASSED - PRODUCTION READY');
    return { pass: true, findings };
  }
}
```

---

## EXECUTION SUMMARY

For a heavy-lift task to complete autonomously WITHOUT intervention:

### 1. Pre-Flight (Founder approves once)
- Define ALL behavior contracts upfront
- Define ALL entry point changes upfront
- Define ALL file creation claims upfront
- Define schema contracts (table → primary key)
- Define role taxonomy contract
- **Founder reviews and approves**

### 2. Continuous Verification (Automatic)
- After EVERY sprint, verify:
  - All claimed files exist
  - Entry points call correct functions
  - SQL uses correct column names
  - Role taxonomy is consistent
- **BLOCK if any check fails**

### 3. Phase Checkpoints (Automatic)
- At end of each phase:
  - All phase files exist
  - All phase behaviors work
  - Entry points wired (if phase requires)
- **BLOCK if checkpoint fails**

### 4. Hostile Audit (Automatic, Mandatory)
- Before certification:
  - Trace all entry points
  - Verify all claimed files
  - Check all SQL columns
  - Verify role taxonomy
  - Test all behaviors
- **FAIL certification if audit fails**

### 5. Certification (Only after hostile audit passes)
- Generate certification report
- Update Notion
- Create git tag
- Push

---

## QUICK START

```bash
# Start a heavy-lift program
/heavy-lift "User & Enterprise Management v1.1" S279-S329

# TC will:
# 1. Generate behavior contracts
# 2. Show pre-flight check
# 3. Wait for APPROVED

# After approval, TC executes autonomously with:
# - Continuous verification after each sprint
# - Phase checkpoints
# - Automatic hostile audit before certification
```

---

## KEY DIFFERENCES FROM STANDARD /start

| Aspect | /start | /heavy-lift |
|--------|--------|-------------|
| Contracts | Per-sprint wiring | Program-wide behavior |
| Verification | After each feature | After each sprint |
| Entry points | Not tracked | Must-call/must-not-call |
| File claims | Trust certification | Verify existence |
| SQL columns | Not checked | Schema contracts |
| Role taxonomy | Not checked | Consistency required |
| Hostile audit | None | Mandatory before cert |
| Self-certification | Allowed | Blocked |

---

## GOLDEN RULES

1. **Behavior contracts before code** - Define expected behavior, not just files
2. **Continuous verification** - Check after every sprint, not just at end
3. **Entry points are critical** - Track what they call, not just that they exist
4. **Files must exist** - Claims verified by fs.existsSync()
5. **SQL columns matter** - Wrong column = runtime crash
6. **Role taxonomy consistent** - No mixing old and new
7. **Hostile audit mandatory** - TC cannot self-certify heavy-lift
8. **Block on failure** - Don't proceed with broken foundation
