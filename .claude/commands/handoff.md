# PremiumRadar Session Handoff

**Purpose:** Generate complete context for session continuity. Paste output into new session to avoid drift/derailment.

**Usage:** `/handoff` - Run at end of session or before context limit

---

## EXECUTION STEPS

### Step 1: Gather Session State

```bash
# Get current branch and recent commits
git branch --show-current
git log --oneline -10

# Get working directory status
git status --short

# Get any uncommitted changes summary
git diff --stat HEAD

# Check for session state file
cat .claude/session/current.json 2>/dev/null || echo "No session state"
```

### Step 2: Generate Handoff Document

**OUTPUT FORMAT (Copy everything between the markers):**

```
═══════════════════════════════════════════════════════════════════════════════
HANDOFF DOCUMENT - PremiumRadar
Generated: [TIMESTAMP]
═══════════════════════════════════════════════════════════════════════════════

## 1. SESSION IDENTITY

| Field | Value |
|-------|-------|
| Sprint | S[XXX] |
| Branch | [branch-name] |
| Service | SaaS / OS / Both |
| Session Duration | [approx hours] |

---

## 2. WHAT WAS COMPLETED

[List each completed item with file paths]

- ✅ [Task 1]: [files modified]
- ✅ [Task 2]: [files modified]
- ✅ [Task 3]: [files modified]

**Commits Made:**
```
[paste git log --oneline output for session commits]
```

---

## 3. WHAT IS IN PROGRESS

[Current task being worked on - BE SPECIFIC]

**Currently Working On:**
- [ ] [Task description]
  - File: [path/to/file.ts]
  - Line: [approximate line number if relevant]
  - Status: [what's done, what remains]

**Last Action Taken:**
[Exact last thing done before handoff]

**Next Immediate Action:**
[Exact next step to take]

---

## 4. WHAT IS PENDING/BLOCKED

| Task | Status | Blocker (if any) |
|------|--------|------------------|
| [Task] | Pending | [None / Blocker description] |

---

## 5. KEY DECISIONS MADE THIS SESSION

[Architectural or implementation decisions that future sessions must honor]

| Decision | Rationale | Locked? |
|----------|-----------|---------|
| [Decision 1] | [Why] | YES/NO |
| [Decision 2] | [Why] | YES/NO |

---

## 6. FILES MODIFIED THIS SESSION

**SaaS Repo:**
```
[List files with brief description of changes]
app/api/xxx/route.ts - [what changed]
lib/xxx.ts - [what changed]
```

**OS Repo (if applicable):**
```
[List files]
```

---

## 7. TECHNICAL CONTEXT

**Git State:**
```
Branch: [branch]
Last Commit: [hash] [message]
Uncommitted Changes: [yes/no - list if yes]
Pushed to Origin: [yes/no]
```

**Deployment State:**
```
Staging: [deployed/not deployed] [URL if relevant]
Production: [not touched / deployed]
Last Deploy Commit: [hash if known]
```

**Database State:**
```
Migrations Applied: [yes/no/none needed]
New Tables: [list if any]
Schema Changes: [list if any]
```

**Notion State:**
```
Sprint Status: [In Progress / Done / Not Started]
Features Updated: [list feature IDs updated]
Last Sync: [timestamp or "not synced"]
```

---

## 8. WARNINGS & GOTCHAS

[Things the next session MUST know to avoid breaking things]

⚠️ [Warning 1]
⚠️ [Warning 2]

---

## 9. REPRODUCTION COMMANDS

[Commands to get back to current state quickly]

```bash
# Switch to correct branch
git checkout [branch]
git pull origin [branch]

# If local dev needed
npm run dev

# If validation needed
[specific validation commands]
```

---

## 10. NEXT SESSION INSTRUCTIONS

**Priority 1 (Do First):**
[Most critical task]

**Priority 2:**
[Second task]

**Priority 3:**
[Third task]

**DO NOT:**
- [Thing to avoid 1]
- [Thing to avoid 2]

---

## 11. REFERENCE DOCUMENTS

[Key files the next session should read first]

| File | Why |
|------|-----|
| [path/to/file] | [Contains X context] |

---

## 12. OPEN QUESTIONS FOR FOUNDER

[Any unresolved questions that need founder input]

1. [Question 1]
2. [Question 2]

═══════════════════════════════════════════════════════════════════════════════
END HANDOFF DOCUMENT
═══════════════════════════════════════════════════════════════════════════════
```

---

## Step 3: Validate Handoff Quality

Before finalizing, verify:

| Check | Status |
|-------|--------|
| Sprint number correct? | ☐ |
| All commits listed? | ☐ |
| Current task clearly described? | ☐ |
| Next action is unambiguous? | ☐ |
| Files list complete? | ☐ |
| Decisions documented? | ☐ |
| Warnings included? | ☐ |

---

## HANDOFF TRIGGERS

Run `/handoff` when:

1. **Context limit approaching** - Session getting long
2. **Major milestone completed** - Sprint done, feature shipped
3. **Switching repos** - Moving from SaaS to OS or vice versa
4. **End of work session** - Before signing off
5. **Before risky operation** - Checkpoint before major refactor
6. **On user request** - When founder asks for handoff

---

## ANTI-PATTERNS (What NOT to do)

| Bad Handoff | Why It Fails |
|-------------|--------------|
| "Was working on stuff" | No specificity, causes drift |
| Missing file paths | Next session can't find context |
| No next action | Session starts confused |
| Skipping warnings | Next session breaks things |
| Vague decisions | Decisions get reversed |

---

## GOOD HANDOFF EXAMPLE

```
## 3. WHAT IS IN PROGRESS

**Currently Working On:**
- [ ] S253-F3: Wire UPL to discovery API proxy
  - File: app/api/os/discovery/route.ts
  - Line: 44-48 (securePayload construction)
  - Status: UPL injection working, need to add logging

**Last Action Taken:**
Added getResolvedUserPrefs() call at line 36-40

**Next Immediate Action:**
Add console.log for UPL diagnostic at line 51
```

---

## PASTE INSTRUCTIONS FOR NEW SESSION

When starting new session, paste the handoff document and say:

```
This is a handoff from a previous session. Please read it carefully and:
1. Confirm you understand the current state
2. Continue from "Next Immediate Action"
3. Honor all decisions marked as "Locked"
4. Avoid all items in "DO NOT" section
```

---

## NON-NEGOTIABLE RULES

1. **Never handoff without file paths** - Vague references cause drift
2. **Never skip "Next Action"** - New session must know exactly what to do
3. **Never omit warnings** - Critical context gets lost
4. **Always include git state** - Branch/commit context is essential
5. **Always run before context limit** - Don't wait until forced truncation
