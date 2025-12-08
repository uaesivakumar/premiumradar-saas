# PremiumRadar Notion Create

Create new sprints and features in the **UNIFIED** Notion databases.

**Use when:** Starting a new stream/stretch, planning new work, or creating sprint backlog.

---

## SOURCE OF TRUTH

**There are exactly TWO Notion databases. No others exist.**

| Database | ID | Records | Purpose |
|----------|-----|---------|---------|
| **SPRINTS** | `5c32e26d-641a-4711-a9fb-619703943fb9` | 132 sprints (S1-S132) | Sprint planning & tracking |
| **FEATURES** | `26ae5afe-4b5f-4d97-b402-5c459f188944` | 754 features | Feature tracking |

### Sprint Distribution by Repo
| Repo | Sprints | Range |
|------|---------|-------|
| OS | 65 | Backend/API work |
| SaaS Frontend | 56 | UI/Frontend work |
| Super Admin | 11 | Admin panel work |

### Feature Distribution by Repo
| Repo | Features |
|------|----------|
| OS | 533 |
| SaaS Frontend | 105 |
| Super Admin | 116 |

---

## IMPORTANT RULES

1. **TC MUST populate ALL required fields** (not just name/status)
2. **TC MUST set Repo correctly** - determines which codebase
3. **TC MUST wait for founder approval before executing** created sprints
4. **Next sprint number:** Query DB to find max Sprint number + 1

---

## Database Schemas

### SPRINTS Database
**ID:** `5c32e26d-641a-4711-a9fb-619703943fb9`

```javascript
{
  "Sprint": "title",              // "SX: Name" format (e.g., "S133: New Feature")
  "Status": "select",             // Backlog | In Progress | Done
  "Repo": "select",               // OS | SaaS Frontend | Super Admin (REQUIRED!)
  "Goal": "rich_text",            // Sprint objective
  "Sprint Notes": "rich_text",    // Stream/phase context
  "Outcomes": "rich_text",        // Expected deliverables
  "Highlights": "rich_text",      // Key features/components
  "Business Value": "rich_text",  // Why this matters
  "Learnings": "rich_text",       // Technical insights (fill after completion)
  "Branch": "rich_text",          // feat/branch-name
  "Commit": "rich_text",          // Commit reference
  "Git Tag": "rich_text",         // sprint-sX-complete
  "Started At": "date",           // When sprint started
  "Completed At": "date",         // When sprint completed
  "Synced At": "date",            // Last Notion sync
  "Phases Updated": "multi_select", // Phase tracking
  "Commits Count": "number"       // Number of commits
}
```

### FEATURES Database
**ID:** `26ae5afe-4b5f-4d97-b402-5c459f188944`

```javascript
{
  "Features": "title",            // Feature name
  "Sprint": "number",             // Sprint number (e.g., 133)
  "Status": "select",             // Backlog | In Progress | Done
  "Repo": "select",               // OS | SaaS Frontend | Super Admin (REQUIRED!)
  "Priority": "select",           // High | Medium | Low
  "Complexity": "select",         // High | Medium | Low
  "Type": "select",               // Feature | Bug | Infrastructure | Testing
  "Notes": "rich_text",           // Feature description
  "Tags": "multi_select",         // UI, AI, API, Database, Security, Frontend, Backend, Core
  "Assignee": "rich_text",        // Claude (TC) or human name
  "Done?": "checkbox",            // Completion flag
  "Started At": "date",           // When started
  "Completed At": "date"          // When completed
}
```

---

## EXECUTE THESE STEPS:

### Step 1: Fetch Notion Token
```bash
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS --project=applied-algebra-474804-e6)
```

### Step 2: Find Next Sprint Number
```javascript
import { Client } from '@notionhq/client';
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';

// Find highest sprint number
const sprints = await notion.databases.query({
  database_id: SPRINTS_DB,
  sorts: [{ property: 'Sprint', direction: 'descending' }],
  page_size: 1
});

const lastTitle = sprints.results[0]?.properties.Sprint?.title?.[0]?.plain_text || 'S0';
const match = lastTitle.match(/^S(\d+)/);
const nextSprintNum = match ? parseInt(match[1]) + 1 : 133;
console.log('Next sprint number:', nextSprintNum);
```

### Step 3: Determine Repo
Choose based on WHERE the work will be done:

| Repo | When to Use |
|------|-------------|
| **OS** | Backend API, services, database, UPR OS codebase |
| **SaaS Frontend** | UI components, React, frontend in premiumradar-saas |
| **Super Admin** | Admin panel, vertical config, persona editor, tenant management |

### Step 4: Create Sprint
```javascript
async function createSprint(sprintNumber, name, goal, repo) {
  return await notion.pages.create({
    parent: { database_id: SPRINTS_DB },
    properties: {
      'Sprint': { title: [{ text: { content: `S${sprintNumber}: ${name}` } }] },
      'Status': { select: { name: 'Backlog' } },
      'Repo': { select: { name: repo } },  // REQUIRED: OS | SaaS Frontend | Super Admin
      'Goal': { rich_text: [{ text: { content: goal } }] },
      'Sprint Notes': { rich_text: [{ text: { content: goal } }] },
      'Outcomes': { rich_text: [{ text: { content: 'To be filled upon completion' } }] },
      'Highlights': { rich_text: [{ text: { content: 'To be filled upon completion' } }] },
      'Business Value': { rich_text: [{ text: { content: 'Business impact description' } }] },
      'Branch': { rich_text: [{ text: { content: `feat/sprint-s${sprintNumber}` } }] },
      'Phases Updated': { multi_select: [{ name: 'Backlog' }] },
    },
  });
}
```

### Step 5: Create Features
```javascript
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

async function createFeature(name, sprintNumber, type, priority, complexity, notes, tags, repo) {
  return await notion.pages.create({
    parent: { database_id: FEATURES_DB },
    properties: {
      'Features': { title: [{ text: { content: name } }] },
      'Sprint': { number: sprintNumber },
      'Status': { select: { name: 'Backlog' } },
      'Repo': { select: { name: repo } },  // MUST match sprint's Repo
      'Priority': { select: { name: priority } },
      'Complexity': { select: { name: complexity } },
      'Type': { select: { name: type } },
      'Notes': { rich_text: [{ text: { content: notes } }] },
      'Tags': { multi_select: tags.map(t => ({ name: t })) },
      'Assignee': { rich_text: [{ text: { content: 'Claude (TC)' } }] },
      'Done?': { checkbox: false },
      'Started At': { date: { start: new Date().toISOString().split('T')[0] } },
    },
  });
}
```

### Step 6: Report Creation Summary
```
## Notion Creation Complete

**Repo:** [OS | SaaS Frontend | Super Admin]
**Sprints Created:** X (S133-S135)
**Features Created:** Y

### Sprint Breakdown:
| Sprint | Goal | Features | Repo |
|--------|------|----------|------|
| S133 | [Goal] | 5 features | OS |
| S134 | [Goal] | 6 features | OS |

**AWAITING APPROVAL**

View in Notion:
- Sprints: https://www.notion.so/5c32e26d641a4711a9fb619703943fb9
- Features: https://www.notion.so/26ae5afe4b5f4d97b4025c459f188944

Reply "approved" to begin execution.
```

---

## Usage Examples

### Create OS backend sprints:
```
/notion-create 3 sprints for SIVA agent improvements (OS)
```

### Create SaaS Frontend sprints:
```
/notion-create 2 sprints for dashboard redesign (SaaS Frontend)
```

### Create Super Admin sprints:
```
/notion-create vertical config editor (Super Admin)
```

---

## Quick Reference

### Priority
- **High:** Core functionality, blockers
- **Medium:** Important but not blocking
- **Low:** Nice-to-have, polish

### Complexity
- **High:** New architecture, complex state
- **Medium:** Standard feature
- **Low:** Simple UI, bug fix

### Type
- **Feature:** New user-facing functionality
- **Infrastructure:** Backend, state management, API
- **Testing:** Tests, QA
- **Bug:** Bug fixes

### Tags
- `UI` - User interface
- `AI` - AI/ML related
- `API` - API work
- `Database` - DB changes
- `Security` - Auth/security
- `Frontend` - Frontend work
- `Backend` - Backend work
- `Core` - Core logic

---

## FORBIDDEN PRACTICES

- Creating sprints/features without setting Repo
- Mismatching feature Repo with sprint Repo
- Creating without full property population
- Starting execution before founder approval
- Using incorrect property types
