# PremiumRadar Execution Governance Rules

**Version:** 2.0
**Status:** DRAFT - Awaiting Founder Approval
**Purpose:** Codified rules that TC must follow during execution

---

## Rule Categories

1. **HARD RULES** - Cannot be bypassed, ever
2. **SOFT RULES** - Can be bypassed with founder override
3. **ADVISORY** - Best practices, not enforced

---

## HARD RULES (No Bypass)

### H1: Never Expose Secrets
```
RULE: TC must NEVER output, log, or commit secrets
SCOPE: All operations
EXAMPLES:
  - Never echo API keys to terminal
  - Never commit .env files with real values
  - Never include secrets in error messages
VIOLATION: Immediate session termination
```

### H2: Never Force Push to Main
```
RULE: TC must NEVER force push to main/master branch
SCOPE: Git operations
COMMAND BLOCKED: git push --force origin main
VIOLATION: Operation blocked, cannot override
```

### H3: Never Execute Arbitrary User Code
```
RULE: TC must NEVER eval() or execute untrusted code
SCOPE: All code execution
EXAMPLES:
  - No eval() of user-provided strings
  - No require() of user-specified paths
  - No execution of downloaded scripts
VIOLATION: Operation blocked
```

### H4: Never Delete Production Data Without Backup Verification
```
RULE: TC must verify backup exists before any data deletion
SCOPE: Database operations
COMMANDS BLOCKED: DROP TABLE, TRUNCATE (production)
VIOLATION: Operation blocked
```

### H5: Never Commit Malformed Code
```
RULE: TC must verify TypeScript compiles before commit
SCOPE: Git commits
CHECK: npx tsc --noEmit must pass
VIOLATION: Commit blocked
```

---

## SOFT RULES (Bypassable with Override)

### S1: Integration Before Completion
```
RULE: Features must pass /integrator before marking complete
SCOPE: Feature completion
BYPASS: /integrator --bypass --reason="..."
LOG: Bypass logged to session state
```

### S2: Drift Threshold Enforcement
```
RULE: Pause execution when drift > 0.5
SCOPE: Sprint execution
BYPASS: /status acknowledge-drift
LOG: Acknowledgment logged, execution continues
```

### S3: Test Coverage Requirement
```
RULE: New code must have corresponding tests
SCOPE: Feature implementation
BYPASS: Founder explicit instruction "skip tests for this"
LOG: Skip reason logged
```

### S4: Staging Verification Required
```
RULE: Changes must be verified in staging before production
SCOPE: Deployments
BYPASS: /deploy --skip-staging --reason="..."
LOG: Skip reason logged
```

### S5: QA Certification Before Tag
```
RULE: Sprint must pass /qa before git tag creation
SCOPE: Sprint completion
BYPASS: /qa --skip-phase=X --reason="..."
LOG: Skip logged with phase
```

---

## ADVISORY RULES (Best Practices)

### A1: Commit Frequently
```
ADVISORY: Commit after each logical unit of work
REASON: Enables easy rollback, clear history
NOT ENFORCED: TC will remind but not block
```

### A2: Run Build After Major Changes
```
ADVISORY: Run npm run build after changing multiple files
REASON: Catch issues early
NOT ENFORCED: TC will remind but not block
```

### A3: Check Status Periodically
```
ADVISORY: Run /status every 30 minutes during long sessions
REASON: Catch drift early
NOT ENFORCED: Checkpoints are automatic
```

### A4: Document Complex Logic
```
ADVISORY: Add comments for non-obvious code
REASON: Future maintainability
NOT ENFORCED: Left to developer judgment
```

---

## Checkpoint Rules

### CP1: Automatic Checkpoints
```
RULE: Create checkpoint every 15 tool calls
SCOPE: Session execution
ACTION: Calculate drift, log status
NO BYPASS: Cannot disable
```

### CP2: Drift Warning Threshold
```
RULE: Warn when drift > 0.3
SCOPE: Checkpoint evaluation
ACTION: Display warning, continue execution
```

### CP3: Drift Pause Threshold
```
RULE: Pause when drift > 0.5 (first time)
SCOPE: Checkpoint evaluation
ACTION: Display alert, require acknowledgment
BYPASS: /status acknowledge-drift
```

### CP4: Drift Block Threshold
```
RULE: Block when drift > 1.0
SCOPE: Checkpoint evaluation
ACTION: Cannot continue without founder review
BYPASS: /status override-drift --reason="..."
```

---

## Integration Rules

### I1: Component-to-API Wiring
```
RULE: Every new component must have API integration
SCOPE: UI components
CHECK: grep for fetch/useSWR/useQuery calls
ENFORCEMENT: /integrator Phase 1
```

### I2: Route Registration
```
RULE: Every new API route must be registered
SCOPE: API endpoints
CHECK: File exists in app/api/
ENFORCEMENT: /integrator Phase 2
```

### I3: Test Coverage
```
RULE: Every new route must have test
SCOPE: API endpoints
CHECK: Corresponding test file exists
ENFORCEMENT: /integrator Phase 3
```

### I4: Staging Verification
```
RULE: Every new route must respond in staging
SCOPE: Deployed code
CHECK: curl returns non-404
ENFORCEMENT: /integrator Phase 4
```

### I5: Navigation Wiring
```
RULE: Every new page must be navigable
SCOPE: Page routes
CHECK: href exists in navigation
ENFORCEMENT: /integrator Phase 5
```

---

## Permission Rules

### P1: Pre-Approved Operations
```
RULE: Level 0 operations execute immediately
SCOPE: Build, test, read operations
NO PROMPT: Executes without asking
```

### P2: Session Approval
```
RULE: Level 1 operations prompt once per session
SCOPE: First deploy, first migration
PROMPT: Once, then auto-approved
```

### P3: Always Prompt
```
RULE: Level 2 operations always prompt
SCOPE: Destructive operations
PROMPT: Every time, no caching
```

### P4: Never Approve
```
RULE: Level 3 operations require founder command
SCOPE: Secrets, billing, DNS
BLOCKED: TC cannot execute
```

---

## Session Rules

### SE1: Session Initialization
```
RULE: /start must initialize session state
SCOPE: Sprint start
ACTION: Create .claude/session/current.json
REQUIRED FIELDS: session_id, sprint, goal, todos
```

### SE2: State Persistence
```
RULE: State must persist after every checkpoint
SCOPE: Session execution
ACTION: Write to session file
NO BYPASS: Cannot disable
```

### SE3: Goal Immutability
```
RULE: Goal cannot change after session start
SCOPE: Sprint goal
BYPASS: Founder explicit "change goal to..."
LOG: Change logged with reason
```

### SE4: Session Recovery
```
RULE: /resume must restore from last state
SCOPE: Session continuation
ACTION: Load .claude/session/current.json
FALLBACK: Start fresh if file corrupted
```

---

## Sub-Agent Rules

### SA1: Agent Isolation
```
RULE: Sub-agents cannot communicate directly
SCOPE: Task tool usage
ENFORCEMENT: All coordination through orchestrator
```

### SA2: Explore Agent Scope
```
RULE: Explore agents cannot modify files
SCOPE: Task(Explore)
ALLOWED: Read, Glob, Grep, WebFetch
DENIED: Edit, Write, Bash(write)
```

### SA3: Plan Agent Scope
```
RULE: Plan agents can only write to .claude/plans/
SCOPE: Task(Plan)
ALLOWED: Read ops, Write(.claude/plans/*)
DENIED: Edit(code), Bash(write)
```

### SA4: Implementation Agent Scope
```
RULE: Implementation agents have Level 0-1 access
SCOPE: Task(general-purpose)
DENIED: Level 2+ operations
```

### SA5: Parallel Agent Conflict Prevention
```
RULE: No two agents can edit same file simultaneously
SCOPE: Parallel Task calls
CHECK: Lock file before edit
VIOLATION: Second agent waits
```

---

## QA Rules

### Q1: Integration Gate First
```
RULE: /integrator must pass before /qa
SCOPE: Sprint certification
CHECK: session.integration.verified === true
BLOCKED: Cannot proceed without
```

### Q2: All Features Complete
```
RULE: All Notion features must be "Done"
SCOPE: Sprint certification
CHECK: Query Notion, verify all Done
BLOCKED: Cannot certify with incomplete features
```

### Q3: Build Must Pass
```
RULE: npm run build must succeed
SCOPE: Sprint certification
CHECK: Exit code 0
BLOCKED: Cannot certify with build failure
```

### Q4: No High Vulnerabilities
```
RULE: npm audit must show 0 high/critical
SCOPE: Sprint certification
CHECK: npm audit --audit-level=high
BLOCKED: Cannot certify with vulnerabilities
```

---

## Override Protocol

### Override Request Format
```bash
/command --bypass --reason="Explanation for bypass"

# Example
/integrator --bypass --reason="Hotfix for production outage"
```

### Override Logging
```json
{
  "overrides": [
    {
      "command": "/integrator",
      "bypassed_rule": "I1-I5",
      "reason": "Hotfix for production outage",
      "approved_by": "founder",
      "timestamp": "2025-12-21T10:30:00Z"
    }
  ]
}
```

### Override Restrictions
```
CANNOT OVERRIDE:
  - H1: Secret exposure
  - H2: Force push to main
  - H3: Arbitrary code execution
  - H4: Production data deletion without backup
  - H5: Malformed code commit
```

---

## Enforcement Hierarchy

```
1. HARD RULES (H1-H5)
   └── Cannot bypass, built into TC behavior

2. SOFT RULES (S1-S5)
   └── Can bypass with --bypass --reason

3. CHECKPOINT RULES (CP1-CP4)
   └── Automatic, some acknowledgment required

4. INTEGRATION RULES (I1-I5)
   └── Enforced by /integrator

5. PERMISSION RULES (P1-P4)
   └── Enforced by permission system

6. SESSION RULES (SE1-SE4)
   └── Enforced by session management

7. SUB-AGENT RULES (SA1-SA5)
   └── Enforced by Task tool scoping

8. QA RULES (Q1-Q4)
   └── Enforced by /qa command

9. ADVISORY RULES (A1-A4)
   └── Not enforced, suggestions only
```

---

## Approval Signature

- [ ] **Founder reviewed all HARD RULES**
- [ ] **Founder approved SOFT RULE bypass protocol**
- [ ] **Founder approved permission levels**
- [ ] **Founder approved drift thresholds**
- [ ] **Ready for implementation**

**Approved By:** _______________
**Date:** _______________

---

**Document Owner:** TC (Claude Code Execution Layer)
**Last Updated:** 2025-12-21
