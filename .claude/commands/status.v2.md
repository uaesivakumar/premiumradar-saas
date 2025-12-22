# PremiumRadar-SAAS Status Check v2

Comprehensive status with **Derailment Detection**.

**Usage:**
- `/status` - Full status with drift analysis
- `/status git` - Git status only
- `/status drift` - Drift score and checkpoints only
- `/status services` - Cloud services only
- `/status integration` - Integration status only

---

## CRITICAL: DERAILMENT DETECTION

This command monitors for scope creep and drift from original goals.

### Drift Score Formula

```
drift_score = (todos_added - todos_completed) / original_todos

Thresholds:
  0.0 - 0.3  → ON TRACK (green)
  0.3 - 0.5  → DRIFTING (yellow) - Warning issued
  0.5 - 1.0  → SIGNIFICANT DRIFT (orange) - Pause recommended
  > 1.0      → DERAILED (red) - Founder review required
```

---

## EXECUTE THESE CHECKS:

### 1. Session State & Drift
```bash
echo "=== SESSION STATE ==="

SESSION_FILE=".claude/session/current.json"

if [ -f "$SESSION_FILE" ]; then
  SESSION=$(cat "$SESSION_FILE")

  # Extract values
  SPRINT=$(echo "$SESSION" | jq -r '.sprint // "unknown"')
  GOAL=$(echo "$SESSION" | jq -r '.goal // "unknown"')
  STARTED=$(echo "$SESSION" | jq -r '.started_at // "unknown"')

  # Drift calculation
  ORIGINAL_TODOS=$(echo "$SESSION" | jq -r '.todos.original_count // 0')
  CURRENT_TODOS=$(echo "$SESSION" | jq -r '.todos.current_count // 0')
  DRIFT_SCORE=$(echo "$SESSION" | jq -r '.todos.drift_score // 0')

  echo "Sprint: $SPRINT"
  echo "Goal: $GOAL"
  echo "Started: $STARTED"
  echo ""
  echo "Todos: $CURRENT_TODOS (was $ORIGINAL_TODOS)"
  echo "Drift Score: $DRIFT_SCORE"

  # Drift warning
  if (( $(echo "$DRIFT_SCORE > 1.0" | bc -l) )); then
    echo ""
    echo "!!! DERAILED: Scope has more than doubled !!!"
    echo "Founder review required before continuing."
  elif (( $(echo "$DRIFT_SCORE > 0.5" | bc -l) )); then
    echo ""
    echo "!! SIGNIFICANT DRIFT: Consider recalibrating !!"
  elif (( $(echo "$DRIFT_SCORE > 0.3" | bc -l) )); then
    echo ""
    echo "! DRIFTING: Scope expanding beyond plan !"
  else
    echo ""
    echo "ON TRACK"
  fi
else
  echo "No active session. Run /start to begin."
fi
```

### 2. Checkpoint History
```bash
echo ""
echo "=== CHECKPOINTS ==="

if [ -f "$SESSION_FILE" ]; then
  CHECKPOINTS=$(echo "$SESSION" | jq -r '.checkpoints // []')
  CHECKPOINT_COUNT=$(echo "$CHECKPOINTS" | jq 'length')

  echo "Total checkpoints: $CHECKPOINT_COUNT"
  echo ""

  # Show last 3 checkpoints
  echo "$CHECKPOINTS" | jq -r '.[-3:] | .[] | "  Tool call #\(.at_tool_call): \(.status) (\(.todos_completed) done, +\(.todos_added) added)"'
fi
```

### 3. Integration Status
```bash
echo ""
echo "=== INTEGRATION STATUS ==="

if [ -f "$SESSION_FILE" ]; then
  INTEGRATION=$(echo "$SESSION" | jq -r '.integration // {}')

  REQUIRED=$(echo "$INTEGRATION" | jq -r '.required // false')
  VERIFIED=$(echo "$INTEGRATION" | jq -r '.verified // false')
  PENDING=$(echo "$INTEGRATION" | jq -r '.components_pending // [] | length')
  WIRED=$(echo "$INTEGRATION" | jq -r '.components_wired // [] | length')

  if [ "$VERIFIED" = "true" ]; then
    echo "Integration: VERIFIED"
    echo "Components wired: $WIRED"
  else
    echo "Integration: PENDING"
    echo "Components wired: $WIRED"
    echo "Components pending: $PENDING"

    # List pending
    echo "$INTEGRATION" | jq -r '.components_pending // [] | .[] | "  - \(.)"'
  fi
fi
```

### 4. Git Status
```bash
echo ""
echo "=== GIT STATUS ==="
git branch --show-current
git status --short
git log --oneline -3
```

### 5. Build Status
```bash
echo ""
echo "=== BUILD STATUS ==="
# Quick check without full build
if npm run build 2>&1 | tail -1 | grep -q "success\|completed"; then
  echo "Build: PASS"
else
  echo "Build: Check required (run npm run build)"
fi
```

### 6. Cloud Services Status
```bash
echo ""
echo "=== CLOUD SERVICES ==="

# Staging SaaS
echo -n "Staging: "
curl -s -o /dev/null -w "%{http_code}" https://upr.sivakumar.ai/api/health 2>/dev/null || echo "FAIL"

# OS Service
echo -n "OS Service: "
gcloud run services describe upr-os-service --region=us-central1 --format="value(status.conditions[0].status)" 2>/dev/null || echo "UNKNOWN"
```

### 7. Recent Activity
```bash
echo ""
echo "=== RECENT ACTIVITY ==="

# Files changed in session (if branch exists)
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "Files changed on $BRANCH:"
  git diff main --name-only 2>/dev/null | head -10
fi
```

---

## STATUS REPORT FORMAT v2

```
╔══════════════════════════════════════════════════════════════════════╗
║                         STATUS REPORT v2                              ║
║                     Time: 2025-12-21 10:45:00                         ║
╠══════════════════════════════════════════════════════════════════════╣
║ SESSION                                                               ║
║   Sprint:        S48 - Dark Mode Implementation                       ║
║   Goal:          Add dark mode toggle to settings                     ║
║   Duration:      2h 15m                                               ║
║   Tool calls:    45                                                   ║
╠══════════════════════════════════════════════════════════════════════╣
║ DRIFT ANALYSIS                                                        ║
║                                                                       ║
║   Original todos:    5                                                ║
║   Current todos:     7                                                ║
║   Completed:         4                                                ║
║   Added:             2                                                ║
║                                                                       ║
║   Drift Score:       0.2                                              ║
║                                                                       ║
║   ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ON TRACK                 ║
║                                                                       ║
║   Checkpoints:                                                        ║
║     #15: on_track (2 done, +1 added)                                 ║
║     #30: on_track (3 done, +0 added)                                 ║
║     #45: on_track (4 done, +1 added)                                 ║
╠══════════════════════════════════════════════════════════════════════╣
║ INTEGRATION                                                           ║
║   Status:            PENDING                                          ║
║   Components wired:  3                                                ║
║   Pending wiring:    2                                                ║
║     - ThemeProvider.tsx                                              ║
║     - /api/theme/preferences                                         ║
╠══════════════════════════════════════════════════════════════════════╣
║ GIT                                                                   ║
║   Branch:            feat/s48-dark-mode                               ║
║   Status:            3 uncommitted changes                            ║
║   Last commit:       abc123 "feat(s48): Add theme context"            ║
╠══════════════════════════════════════════════════════════════════════╣
║ SERVICES                                                              ║
║   Staging:           200 OK                                           ║
║   OS Service:        True                                             ║
║   Worker:            True                                             ║
╠══════════════════════════════════════════════════════════════════════╣
║ FILES CHANGED (10)                                                    ║
║   src/components/ThemeToggle.tsx                                     ║
║   src/contexts/ThemeContext.tsx                                       ║
║   src/hooks/useTheme.ts                                              ║
║   app/api/theme/route.ts                                              ║
║   ... and 6 more                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## DRIFT ALERT LEVELS

### Level 0: ON TRACK (drift < 0.3)
```
Drift Score: 0.15
████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ON TRACK

Continue as planned.
```

### Level 1: DRIFTING (0.3 < drift < 0.5)
```
Drift Score: 0.4
██████████████████████████░░░░░░░░░░░░░░  DRIFTING

! WARNING: Scope expanding
  Original: 5 todos
  Current:  7 todos (+2 unplanned)

Consider:
  - Deferring new tasks to next sprint
  - Splitting current sprint

Continue? [Y/n]
```

### Level 2: SIGNIFICANT DRIFT (0.5 < drift < 1.0)
```
Drift Score: 0.7
██████████████████████████████████░░░░░░  SIGNIFICANT DRIFT

!! CAUTION: Sprint scope increased 70%
   Original: 5 todos
   Current:  9 todos (+4 unplanned)

Recommend:
  1. Pause and recalibrate
  2. Move new tasks to next sprint
  3. Get founder acknowledgment

Run: /status acknowledge-drift
```

### Level 3: DERAILED (drift > 1.0)
```
Drift Score: 1.4
████████████████████████████████████████  DERAILED

!!! BLOCKED: Sprint has more than doubled
    Original: 5 todos
    Current:  12 todos (+7 unplanned)

CANNOT CONTINUE without founder review.

Options:
  1. Split into multiple sprints
  2. Abandon and restart with new scope
  3. Override with: /status override-drift --reason="..."
```

---

## QUICK STATUS COMMANDS

### Drift only
```bash
/status drift
```
Output:
```
Drift Score: 0.2 | ON TRACK | 4/5 todos complete
```

### Integration only
```bash
/status integration
```
Output:
```
Integration: PENDING | 3 wired, 2 pending
  Pending: ThemeProvider.tsx, /api/theme
```

### Services only
```bash
/status services
```
Output:
```
Staging: 200 | OS: True | Worker: True
```

---

## CHECKPOINT TRIGGERS

Checkpoints are automatically created:

| Trigger | Action |
|---------|--------|
| Every 15 tool calls | Create checkpoint, calculate drift |
| Todo added | Recalculate drift score |
| Todo completed | Update completion stats |
| Integration change | Update integration status |
| 30 minutes elapsed | Time-based checkpoint |

---

## SESSION STATE UPDATES

After each `/status`:
```json
{
  "last_status_check": "2025-12-21T10:45:00Z",
  "status_checks_count": 5,
  "alerts_triggered": ["drift_warning"],
  "alerts_acknowledged": false
}
```

---

## INTEGRATION WITH OTHER COMMANDS

| Command | Status Dependency |
|---------|-------------------|
| `/start` | Initializes session state |
| `/status` | Reads and displays state (this command) |
| `/integrator` | Updates integration status |
| `/qa` | Requires acceptable drift score |
| `/commit` | Includes drift score in message |

---

## DERAILMENT RECOVERY

### Acknowledge Drift
```bash
/status acknowledge-drift
```
Logs acknowledgment, allows continuation.

### Override Drift (Founder Only)
```bash
/status override-drift --reason="Critical hotfix required"
```
Bypasses drift block with logged reason.

### Reset Session
```bash
/status reset
```
Clears session state, starts fresh.

---

## GOLDEN RULES

1. **Check status frequently** - Catch drift early
2. **Acknowledge warnings** - Don't ignore yellow/orange alerts
3. **Recalibrate when drifting** - Split sprints if needed
4. **Never ignore DERAILED** - Founder must review
5. **Integration pending = not done** - Wire before moving on
