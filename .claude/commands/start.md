# PremiumRadar-SAAS Sprint Execution

Start executing sprints with full Notion integration and implementation guidelines.

**Usage:**
- `/start` - Start current sprint (fetches from Notion)
- `/start S26` - Start specific sprint
- `/start S26-S30` - Start sprint range (stream)

## EXECUTE THESE STEPS IN ORDER:

### Step 1: Read Master Context (MANDATORY)
```bash
cat docs/UPR_SAAS_CONTEXT.md
```
**TC MUST read this file completely before any action.**

### Step 2: Parse Sprint Input
Extract sprint number(s) from command:
- Single: `/start S26` → Sprint 26
- Range: `/start S26-S30` → Sprints 26, 27, 28, 29, 30
- Current: `/start` → Fetch latest incomplete sprint

### Step 3: Fetch Notion Token
```bash
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS)
```

### Step 4: Fetch Sprint Details from Notion
```javascript
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

// Fetch sprint(s)
const sprints = await notion.databases.query({
  database_id: SPRINTS_DB,
  filter: {
    or: sprintNumbers.map(n => ({
      property: 'Sprint',
      title: { contains: `S${n}` }
    }))
  }
});

// Fetch features for these sprints
const features = await notion.databases.query({
  database_id: FEATURES_DB,
  filter: {
    and: [
      { property: 'Sprint', number: { greater_than_or_equal_to: startSprint } },
      { property: 'Sprint', number: { less_than_or_equal_to: endSprint } },
    ]
  }
});
```

### Step 5: Validate Environment
```bash
# Check staging health
curl -s https://upr.sivakumar.ai/api/health | jq .

# Check git status
git status
git log --oneline -3
```

### Step 6: Display Sprint Plan
Present to user:
```
============================================================
SPRINT EXECUTION PLAN
============================================================

Sprint(s): S26-S30
Stream: Stream 11 - AI Surface Extension
Total Features: 40

SPRINT S26: Global SIVA Surface
Goal: Full-screen AI canvas replacing traditional dashboard
Features (8):
  [ ] SIVASurface.tsx component
  [ ] Neural mesh background animation
  [ ] SIVAInputBar with Cmd+K
  [ ] SIVAPersonaPanel for AI state
  [ ] Zustand store setup
  [ ] Industry-aware theming
  [ ] Quick start suggestion cards
  [ ] Keyboard shortcut handler

SPRINT S27: Output Object Engine
Goal: Draggable AI response containers
Features (8):
  ...

============================================================
```

### Step 7: Implementation Guidelines (CRITICAL)

**TC MUST follow these rules during implementation:**

#### DO:
- ✅ Create components in appropriate directories (`components/`, `lib/`, `app/`)
- ✅ Use TypeScript for all new files
- ✅ Follow existing code patterns in the codebase
- ✅ Run `npm run build` after major changes
- ✅ Update feature status in Notion as you complete each feature
- ✅ Create meaningful git commits with conventional commit format
- ✅ Test locally before considering complete

#### DON'T:
- ❌ Skip reading existing code before modifying
- ❌ Create features without UI surface (unless backend-only)
- ❌ Deploy to production without approval
- ❌ Mark sprint complete without all features done
- ❌ Skip Notion updates
- ❌ Introduce security vulnerabilities (OWASP Top 10)

#### File Organization:
```
components/
├── siva/           # SIVA AI Surface components
├── shell/          # AppShell, Sidebar, Header
├── ui/             # Shared UI components
└── layout/         # Layout components

lib/
├── stores/         # Zustand stores
├── agents/         # AI agent definitions
└── os-client.ts    # OS API client (ONLY way to call OS)

app/
├── (dashboard)/    # Dashboard routes
├── api/            # API routes
└── page.tsx        # Landing page
```

### Step 8: Begin Execution
After displaying the plan, ask:
```
Ready to begin Sprint S26?
- Features will be implemented in order
- Status will be updated in Notion
- Commits will follow conventional format

Reply "begin" to start, or specify a different starting point.
```

### Step 9: Track Progress
As features are completed:
1. Mark feature as "Done" in Notion
2. Create meaningful commit
3. Update sprint status if all features complete
4. Move to next feature

### Step 10: Sprint Completion
When all features in a sprint are done:
1. Run `npm run build` to verify no errors
2. Run `npm test` for test coverage
3. Update sprint status to "Done" in Notion
4. Fill in Outcomes, Highlights, Learnings
5. Create git tag: `sprint-sX-complete`
6. Ask if user wants to continue to next sprint

## Quick Reference

### Notion Database IDs
- Sprints: `5c32e26d-641a-4711-a9fb-619703943fb9`
- Features: `26ae5afe-4b5f-4d97-b402-5c459f188944`
- Knowledge: `f1552250-cafc-4f5f-90b0-edc8419e578b`

### Environment URLs
- Staging: https://upr.sivakumar.ai
- Production: https://premiumradar.com

### Key Files
- `docs/UPR_SAAS_CONTEXT.md` - Master context
- `lib/os-client.ts` - OS API client
- `.notion-db-ids.json` - Database IDs

## Golden Rules

1. **Load context first** - Always read UPR_SAAS_CONTEXT.md
2. **Fetch from Notion** - Get sprint/feature details from source of truth
3. **Follow guidelines** - Implement according to established patterns
4. **Update as you go** - Keep Notion in sync with progress
5. **No hidden features** - Every feature must have UI surface
6. **Build before done** - Always verify build passes

## NO HIDDEN FEATURES RULE

**No sprint may be marked "Done" unless its UI is visible in staging.**

For every feature, TC MUST verify:
1. Route exists in `app/` directory
2. Navigation link exists in Sidebar.tsx or Header.tsx
3. Component renders without TypeScript errors
4. Feature is accessible via UI navigation

**If a feature has no UI surface, it must be explicitly documented as "Backend-only" in Notion.**
