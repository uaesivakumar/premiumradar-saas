# PremiumRadar Session Begin

**Purpose:** Initialize new session with full context. Loads handoff + PRD + project context.

**Usage:** `/begin` - Run at START of every new session

**Prerequisite:** Previous session ran `/handoff` to save state

---

## EXECUTION ORDER (MANDATORY)

```
/begin
    │
    ├── STEP 1: Load Handoff (session continuity)
    │   └── Read .claude/session/latest-handoff.md
    │
    ├── STEP 2: Load PRD (architectural laws)
    │   └── Execute /prd logic
    │
    ├── STEP 3: Load Context (project structure)
    │   └── Execute /context logic
    │
    └── STEP 4: Confirm Ready
        └── Display session initialization summary
```

---

## STEP 1: LOAD HANDOFF

```bash
# Check if handoff exists
if [ -f ".claude/session/latest-handoff.md" ]; then
  echo "═══════════════════════════════════════════════════════════════"
  echo "LOADING HANDOFF FROM PREVIOUS SESSION"
  echo "═══════════════════════════════════════════════════════════════"
  cat .claude/session/latest-handoff.md
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
else
  echo "⚠️  NO HANDOFF FOUND - Starting fresh session"
  echo "   (Previous session may not have run /handoff)"
fi
```

**After reading handoff, TC MUST:**
1. Identify the "Next Immediate Action" from Section 3
2. Note all "Warnings & Gotchas" from Section 8
3. Honor all "Locked" decisions from Section 5
4. Avoid all items in "DO NOT" list from Section 10

---

## STEP 2: LOAD PRD (Architectural Laws)

**Read and internalize PRD v1.2:**

```bash
cat docs/PRD_v1.2_FINAL.md 2>/dev/null || echo "PRD file location may vary"
```

**5 Architectural Laws (memorize):**

| # | Law | Meaning |
|---|-----|---------|
| 1 | Authority precedes intelligence | UPR-OS decides what SIVA can do |
| 2 | Persona is policy, not personality | Persona defines capability boundaries |
| 3 | SIVA never mutates the world | SIVA interprets, OS acts |
| 4 | Every output must be explainable | No black boxes |
| 5 | If it cannot be replayed, it did not happen | Deterministic replay required |

**VIOLATION_COUNT starts at 0 for this session.**

---

## STEP 3: LOAD CONTEXT (Project Structure)

**Read master context:**

```bash
cat docs/UPR_SAAS_CONTEXT.md
```

**Project Structure:**
```
~/Projects/UPR/
├── upr-os/              # Core Intelligence Layer (UPR OS)
├── upr-os-worker/       # Async Processing Worker
├── premiumradar-saas/   # SaaS Frontend (THIS REPO)
└── upr-infra/           # Infrastructure configs
```

**Notion Database IDs:**
| Database | ID |
|----------|-----|
| Sprints | `5c32e26d-641a-4711-a9fb-619703943fb9` |
| Features | `26ae5afe-4b5f-4d97-b402-5c459f188944` |
| Knowledge | `f1552250-cafc-4f5f-90b0-edc8419e578b` |

**Environment URLs:**
| Environment | URL |
|-------------|-----|
| Staging | https://upr.sivakumar.ai |
| Production | https://premiumradar.com |
| OS Service | https://upr-os-service-191599223867.us-central1.run.app |

---

## STEP 4: CHECK CURRENT STATE

```bash
# Git status
echo "=== GIT STATUS ==="
git branch --show-current
git status --short
git log --oneline -5

# Check for active sprint
echo ""
echo "=== ACTIVE SPRINT ==="
cat .claude/session/current.json 2>/dev/null | jq -r '.sprint // "No active sprint"' || echo "No session state"
```

---

## STEP 5: CONFIRM READY

After loading all context, display:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SESSION INITIALIZED                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  Handoff:     ✅ Loaded / ⚠️ Not found                                       ║
║  PRD:         ✅ Laws internalized (VIOLATION_COUNT = 0)                     ║
║  Context:     ✅ Project structure loaded                                     ║
║                                                                               ║
║  Branch:      [current branch]                                               ║
║  Sprint:      [active sprint or "None"]                                      ║
║                                                                               ║
║  FROM HANDOFF:                                                                ║
║  ├── Last Action:  [from handoff section 3]                                  ║
║  ├── Next Action:  [from handoff section 3]                                  ║
║  └── Warnings:     [count from handoff section 8]                            ║
║                                                                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Ready to continue. Awaiting founder instructions.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## HANDOFF CONTINUITY RULES

When handoff exists, TC MUST:

| Rule | Enforcement |
|------|-------------|
| Resume from "Next Immediate Action" | MANDATORY |
| Honor all "Locked" decisions | BLOCKED if violated |
| Respect "DO NOT" list | BLOCKED if violated |
| Address warnings first | RECOMMENDED |
| Read reference documents | RECOMMENDED |

---

## NO HANDOFF SCENARIO

If no handoff file exists:

```
⚠️ FRESH SESSION - No handoff found

Options:
1. Ask founder for context
2. Check git log for recent work
3. Check Notion for active sprints
4. Run /status to see system state
```

---

## QUICK REFERENCE

| Command | When |
|---------|------|
| `/begin` | Start of new session |
| `/handoff` | End of session (saves state) |
| `/start.v2 S250` | Start executing a sprint |
| `/status` | Check system state |
| `/context` | Reload project context only |
| `/prd` | Reload PRD only |

---

## SESSION LIFECYCLE

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION LIFECYCLE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NEW SESSION                                                     │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────┐                                                     │
│  │ /begin  │ ← Load handoff + PRD + context                     │
│  └────┬────┘                                                     │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐                                                 │
│  │ Work Sprint │ ← /start.v2, implement, /wiring, /qa           │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────┐                                                    │
│  │ /handoff │ ← Save state before session ends                  │
│  └──────────┘                                                    │
│         │                                                        │
│         ▼                                                        │
│    END SESSION                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## NON-NEGOTIABLE RULES

1. **Always run `/begin` first** - No work without context
2. **Never ignore handoff warnings** - They exist for a reason
3. **Honor locked decisions** - They were made deliberately
4. **Resume from Next Action** - Don't restart from scratch
5. **Run `/handoff` before ending** - Don't lose context
