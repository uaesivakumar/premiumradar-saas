# PremiumRadar Notion Update

Fix Notion data issues and ensure complete property population in the **UNIFIED** databases.

**Use after:** Completing a stream, sprint, or when Notion data is incomplete/broken.

---

## SOURCE OF TRUTH

**There are exactly TWO Notion databases. No others exist.**

| Database | ID | Records |
|----------|-----|---------|
| **SPRINTS** | `5c32e26d-641a-4711-a9fb-619703943fb9` | 132 sprints (S1-S132) |
| **FEATURES** | `26ae5afe-4b5f-4d97-b402-5c459f188944` | 754 features |

### Current Distribution
| Repo | Sprints | Features |
|------|---------|----------|
| OS | 65 | 533 |
| SaaS Frontend | 56 | 105 |
| Super Admin | 11 | 116 |

---

## Common Issues This Command Fixes

1. Columns not fully populated
2. Missing Repo assignment
3. Property types incorrect (checkbox vs multi_select)
4. Status not updated properly
5. Missing dates, notes, or business value
6. Sprints/features not assigned to correct Repo

---

## EXECUTE THESE STEPS:

### Step 1: Fetch Notion Token
```bash
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS --project=applied-algebra-474804-e6)
echo "Token fetched: ${NOTION_TOKEN:0:10}..."
```

### Step 2: Audit Current State
Run the audit script to see what needs fixing:

```bash
cd /Users/skc/Projects/UPR/upr-os
NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS --project=applied-algebra-474804-e6) node scripts/notion/audit-features.js
```

This shows:
- Column fill rates
- Empty columns to delete
- Repo distribution

### Step 3: Validate Schema

**SPRINTS Schema:**
```javascript
{
  "Sprint": "title",              // "SX: Name" format
  "Status": "select",             // Backlog | In Progress | Done
  "Repo": "select",               // OS | SaaS Frontend | Super Admin (REQUIRED!)
  "Goal": "rich_text",
  "Sprint Notes": "rich_text",
  "Outcomes": "rich_text",
  "Highlights": "rich_text",
  "Business Value": "rich_text",
  "Learnings": "rich_text",
  "Branch": "rich_text",
  "Commit": "rich_text",
  "Git Tag": "rich_text",
  "Started At": "date",
  "Completed At": "date",
  "Synced At": "date",
  "Phases Updated": "multi_select",  // NOT checkbox!
  "Commits Count": "number"
}
```

**FEATURES Schema:**
```javascript
{
  "Features": "title",
  "Sprint": "number",             // Sprint number (e.g., 26)
  "Status": "select",             // Backlog | In Progress | Done
  "Repo": "select",               // OS | SaaS Frontend | Super Admin (REQUIRED!)
  "Priority": "select",           // High | Medium | Low
  "Complexity": "select",         // High | Medium | Low
  "Type": "select",               // Feature | Bug | Infrastructure | Testing
  "Notes": "rich_text",
  "Tags": "multi_select",         // UI, AI, API, Database, Security, etc.
  "Assignee": "rich_text",        // Claude (TC) or human name
  "Done?": "checkbox",
  "Started At": "date",
  "Completed At": "date"
}
```

### Step 4: Fix Sprints

**Update a single sprint:**
```javascript
import { Client } from '@notionhq/client';
const notion = new Client({ auth: process.env.NOTION_TOKEN });

await notion.pages.update({
  page_id: sprint.id,
  properties: {
    'Status': { select: { name: 'Done' } },
    'Repo': { select: { name: 'OS' } },  // REQUIRED!
    'Goal': { rich_text: [{ text: { content: 'Goal description' } }] },
    'Sprint Notes': { rich_text: [{ text: { content: 'Notes here' } }] },
    'Outcomes': { rich_text: [{ text: { content: 'What was delivered' } }] },
    'Highlights': { rich_text: [{ text: { content: 'Key features' } }] },
    'Business Value': { rich_text: [{ text: { content: 'Impact' } }] },
    'Learnings': { rich_text: [{ text: { content: 'Technical insights' } }] },
    'Branch': { rich_text: [{ text: { content: 'feat/branch-name' } }] },
    'Commit': { rich_text: [{ text: { content: 'Commit reference' } }] },
    'Git Tag': { rich_text: [{ text: { content: 'sprint-sX-complete' } }] },
    'Started At': { date: { start: '2025-11-20' } },
    'Completed At': { date: { start: '2025-11-26' } },
    'Synced At': { date: { start: new Date().toISOString().split('T')[0] } },
    'Phases Updated': { multi_select: [{ name: 'Done' }] },
    'Commits Count': { number: 10 },
  },
});
```

### Step 5: Fix Features

**Update a single feature:**
```javascript
await notion.pages.update({
  page_id: feature.id,
  properties: {
    'Status': { select: { name: 'Done' } },
    'Repo': { select: { name: 'OS' } },  // REQUIRED - must match sprint's Repo
    'Priority': { select: { name: 'High' } },
    'Complexity': { select: { name: 'Medium' } },
    'Type': { select: { name: 'Feature' } },
    'Notes': { rich_text: [{ text: { content: 'Feature description' } }] },
    'Tags': { multi_select: [{ name: 'UI' }, { name: 'AI' }] },
    'Assignee': { rich_text: [{ text: { content: 'Claude (TC)' } }] },
    'Done?': { checkbox: true },
    'Started At': { date: { start: '2025-11-20' } },
    'Completed At': { date: { start: '2025-11-26' } },
  },
});
```

### Step 6: Bulk Updates

**Re-tag Super Admin features:**
```bash
cd /Users/skc/Projects/UPR/upr-os
NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS --project=applied-algebra-474804-e6) node scripts/notion/retag-super-admin-features.js --dry-run
# Remove --dry-run to apply
```

**Reassign features across sprints:**
```bash
NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS --project=applied-algebra-474804-e6) node scripts/notion/reassign-features.js --dry-run
```

**Perfect features (fill missing values):**
```bash
NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS --project=applied-algebra-474804-e6) node scripts/notion/perfect-features.js --dry-run
```

### Step 7: Verify Updates

```javascript
// Check distribution
const features = await fetchAll(notion, FEATURES_DB);
const byRepo = {};
features.forEach(f => {
  const repo = f.properties.Repo?.select?.name || 'Not set';
  byRepo[repo] = (byRepo[repo] || 0) + 1;
});
console.log('Features by Repo:', byRepo);
// Expected: { 'OS': 533, 'SaaS Frontend': 105, 'Super Admin': 116 }
```

---

## Available Fix Scripts

| Script | Purpose |
|--------|---------|
| `audit-features.js` | Analyze column usage and repo distribution |
| `perfect-features.js` | Fill missing values (dates, tags, type, assignee) |
| `reassign-features.js` | Redistribute features across sprints by Repo |
| `retag-super-admin-features.js` | Re-tag features that should be Super Admin |
| `find-super-admin-features.js` | Find features that might be Super Admin |

All scripts support `--dry-run` flag.

---

## Usage

```
/notion-update
```

Or to fix specific sprint range:
```
/notion-update S78-S132
```

---

## Troubleshooting

### "Property X is expected to be Y"
- **Cause:** Using wrong property type
- **Fix:** Check schema - `Phases Updated` is `multi_select`, not checkbox

### "Token not found"
```bash
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS --project=applied-algebra-474804-e6)
```

### "Page not found"
- Verify database IDs are correct
- SPRINTS: `5c32e26d-641a-4711-a9fb-619703943fb9`
- FEATURES: `26ae5afe-4b5f-4d97-b402-5c459f188944`

### Features missing Repo
Run retag script to auto-assign based on keywords:
```bash
node scripts/notion/retag-super-admin-features.js
```

---

## FORBIDDEN PRACTICES

- Updating only Status without other fields
- Leaving Repo unset
- Skipping required fields
- Leaving Notes/Learnings/Business Value empty
- Assuming property types - always verify schema
- Creating new databases (only 2 exist!)
