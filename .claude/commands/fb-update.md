# Founder's Bible Update Command

Update the Founder's Bible with completed sprint information.

## What to Update

When a sprint or feature set is completed, update the following locations in the Founder's Bible:

### 1. Learning Modules (LEARNING_MODULES array)
**File:** `app/superadmin/founder-bible/page.tsx`

Add a new learning module if the feature introduces a significant architectural concept. Include:
- `id`: Unique identifier (e.g., 'model-routing')
- `title`: Module title with number (e.g., 'Module 16: Model Capability Routing')
- `description`: One-line description
- `topics`: Array of 4-6 topics, each with:
  - `id`, `title`, `content`, `analogy`, `keyPoints[]`, `deepDive`, `techRationale`, `futureCompatibility`
- Update `TOTAL_TOPICS` constant

### 2. Architecture Section (ArchitectureSection function)
**File:** `app/superadmin/founder-bible/page.tsx`

If the feature adds a new architectural layer, add a tab to the architecture section:
- Add to tabs array: `{ id: 'new-feature', label: 'Feature Name', icon: '...' }`
- Create corresponding diagram component

### 3. Roadmap Section
Update sprint progress in the roadmap if phase boundaries changed.

### 4. Quiz Section (QUIZZES array)
Add relevant quiz questions for the new content.

## Update Checklist

For sprint completion, verify:

- [ ] Learning module added with all topics
- [ ] TOTAL_TOPICS updated
- [ ] Architecture diagram updated (if applicable)
- [ ] Quiz questions added (at least 3)
- [ ] Notion synced with sprint data

## Current Sprint Information

### S228-S233: Model Capability Routing (December 2025)

**Completed Features:**
- S228: Capability Registry Core - 6 core capabilities defined
- S229: Persona Capability Policy - Whitelist/blacklist enforcement
- S230: Deterministic Model Router - Fixed weights, no randomness
- S231: Replay Safety - Append-only decisions, deviation detection
- S232: Model Radar UI - Read-only visibility for admins
- S233: Validation Suite - 23 tests proving non-bypassable chain

**Key Concepts Added:**
1. Capability Abstraction - SIVA never sees model names
2. Persona Policy Enforcement - 403 on denial before SIVA invoked
3. Deterministic Routing - Same inputs = same model always
4. Replay Safety - No silent substitutions
5. Budget Gating - Hard failure over silent downgrade
6. Model Radar - UI observes, never controls

**Architecture Principle:**
```
Models are commodities, not features.
Personas are policy, not UI roles.
Admins observe, never control.
Every decision is replayable.
Every deviation is visible.
```

## How to Run

```bash
# After completing a sprint, run:
/fb-update

# This will prompt you to:
# 1. Confirm sprint range (e.g., S228-S233)
# 2. Review learning module content
# 3. Update TOTAL_TOPICS
# 4. Sync to Notion
```

## Notion Sync

After updating FB, sync to Notion:
```bash
/notion-update s228-s233
```

This updates:
- Sprints DB with completion status
- Features DB with all feature items
- Knowledge Page with learnings
