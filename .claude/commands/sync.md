# PremiumRadar Notion Sync

Synchronize local progress with Notion - mark features as Done, update sprint progress.

**Usage:**
- `/sync` - Sync current sprint progress
- `/sync S26` - Sync specific sprint
- `/sync feature "Feature Name"` - Mark specific feature as Done

**NOTE:** This is for ROUTINE synchronization. Use `/notion-update` for fixing issues.

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

## SYNC WORKFLOW

### Step 1: Fetch Token
```bash
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS --project=applied-algebra-474804-e6)
```

### Step 2: Identify Completed Work
TC analyzes recent activity:
```bash
# Check recent commits
git log --oneline -10

# Check modified files
git diff --stat HEAD~5

# Identify features completed
```

### Step 3: Update Feature Status
```javascript
import { Client } from '@notionhq/client';
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

async function markFeatureDone(featureName, sprintNumber) {
  // Find feature
  const response = await notion.databases.query({
    database_id: FEATURES_DB,
    filter: {
      and: [
        { property: 'Features', title: { contains: featureName } },
        { property: 'Sprint', number: { equals: sprintNumber } },
      ]
    }
  });

  if (response.results.length === 0) {
    console.log(`Feature not found: ${featureName}`);
    return;
  }

  const feature = response.results[0];
  const currentStatus = feature.properties.Status?.select?.name;

  if (currentStatus === 'Done') {
    console.log(`Already Done: ${featureName}`);
    return;
  }

  // Update to Done
  await notion.pages.update({
    page_id: feature.id,
    properties: {
      'Status': { select: { name: 'Done' } },
      'Done?': { checkbox: true },
      'Completed At': { date: { start: new Date().toISOString().split('T')[0] } },
    },
  });

  console.log(`Done: ${featureName}`);
}
```

### Step 4: Update Sprint Progress
```javascript
async function updateSprintProgress(sprintNumber) {
  // Get features for sprint
  const features = await notion.databases.query({
    database_id: FEATURES_DB,
    filter: { property: 'Sprint', number: { equals: sprintNumber } }
  });

  const total = features.results.length;
  const done = features.results.filter(f =>
    f.properties.Status?.select?.name === 'Done'
  ).length;

  // Find sprint
  const sprints = await notion.databases.query({
    database_id: SPRINTS_DB,
    filter: { property: 'Sprint', title: { contains: `S${sprintNumber}` } }
  });

  if (sprints.results.length > 0) {
    const sprint = sprints.results[0];
    const status = done === total ? 'Done' : (done > 0 ? 'In Progress' : 'Backlog');

    const updates = {
      'Status': { select: { name: status } },
      'Synced At': { date: { start: new Date().toISOString().split('T')[0] } },
    };

    // Add completion date if Done
    if (status === 'Done') {
      updates['Completed At'] = { date: { start: new Date().toISOString().split('T')[0] } };
    }

    await notion.pages.update({
      page_id: sprint.id,
      properties: updates,
    });

    console.log(`Sprint S${sprintNumber}: ${done}/${total} features (${status})`);
  }
}
```

### Step 5: Report Sync Status
```
## NOTION SYNC COMPLETE

Sprint: S26
Repo: OS
Features Updated: 3
   Done: SIVASurface.tsx component
   Done: Neural mesh background animation
   Done: SIVAInputBar with Cmd+K

Sprint Progress: 3/8 (37%)
Sprint Status: In Progress
Synced At: 2025-12-07

View in Notion:
- Sprints: https://www.notion.so/5c32e26d641a4711a9fb619703943fb9
- Features: https://www.notion.so/26ae5afe4b5f4d97b4025c459f188944
```

---

## SYNC TRIGGERS

### When to Sync
- After completing a feature
- After a commit
- Before ending a session
- After QA certification

### Auto-Sync Patterns
TC should sync automatically when:
1. Feature implementation is complete (files created/modified)
2. Tests pass for a feature
3. User says "done with X"
4. Moving to next feature

---

## QUICK SYNC COMMANDS

### Mark single feature Done
```javascript
await markFeatureDone("SIVASurface", 26);
```

### Bulk sync all completed
```javascript
const completedFeatures = [
  "SIVASurface.tsx component",
  "Neural mesh background",
  "SIVAInputBar with Cmd+K",
];

for (const name of completedFeatures) {
  await markFeatureDone(name, 26);
}
await updateSprintProgress(26);
```

### Get sprint status
```javascript
async function getSprintStatus(sprintNumber) {
  const features = await notion.databases.query({
    database_id: FEATURES_DB,
    filter: { property: 'Sprint', number: { equals: sprintNumber } }
  });

  const total = features.results.length;
  const done = features.results.filter(f => f.properties.Status?.select?.name === 'Done').length;
  const repo = features.results[0]?.properties.Repo?.select?.name || 'Unknown';

  return { total, done, percentage: Math.round(done/total*100), repo };
}

const status = await getSprintStatus(26);
console.log(`S26 [${status.repo}]: ${status.done}/${status.total} (${status.percentage}%)`);
```

---

## SYNC vs NOTION-UPDATE

| `/sync` | `/notion-update` |
|---------|------------------|
| Routine progress updates | Fix problems |
| Mark features Done | Populate missing fields |
| Update sprint progress | Fix schema issues |
| Quick & frequent | Comprehensive & occasional |
| Assumes schema is correct | Verifies/fixes schema |

**Use `/sync` during normal work**
**Use `/notion-update` when things are broken**

---

## ERROR HANDLING

### Feature Not Found
```
Feature not found: "XYZ Component"
  - Check spelling (case-sensitive search)
  - Verify sprint number
  - Try partial name match
  - Run /notion-update to check data
```

### Token Error
```bash
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS --project=applied-algebra-474804-e6)
```

### Already Done
```
Already Done: "ABC Feature"
  - No update needed
  - Skipping...
```

---

## INTEGRATION WITH OTHER COMMANDS

### After `/start SX`
- TC begins work on sprint SX
- `/sync` after each feature completion

### Before `/qa`
- Run `/sync` to ensure Notion reflects actual progress
- Then run `/qa` for certification

### After `/deploy`
- Run `/sync` to update deployment-related notes

---

## Filtering by Repo

When syncing, you can filter by repo:

```javascript
// Get only OS features for a sprint
const osFeatures = await notion.databases.query({
  database_id: FEATURES_DB,
  filter: {
    and: [
      { property: 'Sprint', number: { equals: 26 } },
      { property: 'Repo', select: { equals: 'OS' } },
    ]
  }
});
```

---

**TIP:** TC should proactively sync after completing features without being asked.
