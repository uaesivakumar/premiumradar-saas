/**
 * Governance Update Script - Stream 3 (Sprints S8-S9)
 *
 * Updates Notion databases with Sprint 8-9 completion.
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TODAY = new Date().toISOString().split('T')[0];

// Sprint definitions
const SPRINTS = [
  {
    sprintNumber: 8,
    name: 'Workspace Management',
    goal: 'Multi-tenant workspace infrastructure with team management and RBAC',
    status: 'Done',
    priority: 'P0',
    deliverables: [
      'lib/workspace/types.ts - Core workspace & team types',
      'lib/workspace/rbac.ts - Role-based access control with permission matrix',
      'lib/workspace/workspace-store.ts - Zustand state management',
      'components/workspace/* - WorkspaceSelector, TeamManager, InviteModal, PermissionsTable',
      'app/dashboard/settings/team/page.tsx - Team settings UI'
    ]
  },
  {
    sprintNumber: 9,
    name: 'Tenant Isolation',
    goal: 'Data isolation, API keys, rate limiting, and activity boundaries',
    status: 'Done',
    priority: 'P0',
    deliverables: [
      'lib/tenant/tenant-context.ts - Request-scoped tenant context',
      'lib/tenant/isolation-policy.ts - Data isolation policy engine',
      'lib/tenant/api-keys.ts - Tenant-scoped API key management',
      'lib/tenant/rate-limiter.ts - Per-tenant rate limiting with sliding window',
      'lib/tenant/activity-boundary.ts - Usage boundaries and alerts'
    ]
  }
];

// Feature definitions
const FEATURES = {
  8: [
    { name: 'Workspaces', notes: 'Multi-tenant workspace model with settings, plans, and features' },
    { name: 'Team Management', notes: 'TeamMember model with roles, status, and workspace association' },
    { name: 'Invitation Flow', notes: 'Invitation system with token, expiry, and status tracking' },
    { name: 'RBAC', notes: 'Role-based access control with permission matrix (owner/admin/analyst/viewer)' },
    { name: 'Team Permissions UI', notes: 'WorkspaceSelector, TeamManager, InviteModal, PermissionsTable components' }
  ],
  9: [
    { name: 'Tenant-Aware DB Queries', notes: 'Tenant context with request-scoped isolation and query helpers' },
    { name: 'Isolation Policies', notes: 'Policy engine with rules, conditions, and resource filtering' },
    { name: 'API Keys', notes: 'Tenant-scoped API key generation, validation, and revocation' },
    { name: 'Tenant-Level Rate Limiting', notes: 'Sliding window rate limiter with plan-based multipliers' },
    { name: 'Activity Boundaries', notes: 'Usage boundaries by plan with alerts and notifications' }
  ]
};

// Knowledge Pages
const KNOWLEDGE_PAGES = [
  {
    title: `Multi-Tenant Architecture (Updated: ${TODAY})`,
    content: `
## Overview
PremiumRadar uses a multi-tenant architecture where each workspace represents an isolated tenant with its own data, settings, and team.

## Key Concepts
- **Workspace**: Top-level container for tenant data
- **Tenant**: Data isolation boundary (1:1 with workspace)
- **Team**: Members with role-based access within a workspace
- **Isolation**: Request-scoped context ensuring data separation

## Data Model
\`\`\`
Workspace (tenant boundary)
├── Settings (features, limits)
├── Team Members (with roles)
├── API Keys (scoped access)
└── Activity Logs (audit trail)
\`\`\`
`
  },
  {
    title: `Role-Based Access Control (Updated: ${TODAY})`,
    content: `
## Role Hierarchy
1. **Owner** - Full workspace control including billing and deletion
2. **Admin** - Team management and all features, no billing
3. **Analyst** - Use features, create outreach, export data
4. **Viewer** - Read-only access to discovery and analytics

## Permission Categories
- Workspace: read, update, delete, billing
- Team: read, invite, remove, role:change
- Discovery: read, export
- Outreach: read, create, send
- Analytics: read, export
- API: read, create, revoke

## Implementation
- Permission matrix in \`lib/workspace/rbac.ts\`
- Role checks via \`hasPermission()\`, \`canManageRole()\`
- Guards with \`createPermissionGuard()\`
`
  },
  {
    title: `Tenant Data Isolation (Updated: ${TODAY})`,
    content: `
## Isolation Levels
- **Shared**: Logical isolation via tenant_id filtering
- **Dedicated**: Separate database schema per tenant
- **Isolated**: Physically separate database instances

## Request-Scoped Context
\`\`\`typescript
// Set context at request start
setTenantContext({
  tenantId: 'tenant_123',
  workspaceId: 'ws_456',
  userId: 'user_789',
  region: 'uae',
  permissions: ['discovery:read', ...]
});

// All queries automatically scoped
const companies = await getCompanies(); // Only tenant's data
\`\`\`

## Isolation Policies
- Default policy: tenant_id must match
- Regional policy: data_region must be allowed
- Custom policies for enterprise tenants
`
  },
  {
    title: `API Key Management (Updated: ${TODAY})`,
    content: `
## API Key Format
\`upr_[base64url random 32 bytes]\`

Example: \`upr_abc123def456...\`

## Key Storage
- Only hash stored in database
- Prefix stored for identification
- Full key shown once at creation

## Scope Presets
- **read_only**: View workspace, team, discovery, outreach, analytics
- **discovery**: Read and export discovery data
- **analytics**: Read and export analytics
- **full_access**: All read/write operations

## Rate Limits
API keys inherit tenant rate limits with optional per-key overrides.
`
  },
  {
    title: `Rate Limiting System (Updated: ${TODAY})`,
    content: `
## Algorithm
Sliding window counter with configurable window sizes.

## Default Limits (per minute)
| Endpoint | Requests |
|----------|----------|
| /api/discovery/* | 100 |
| /api/outreach/* | 50 |
| /api/analytics/* | 200 |
| /api/export/* | 10/hour |
| /api/search | 30 |
| /api/bulk/* | 5/hour |

## Plan Multipliers
- Free: 0.5x
- Starter: 1x
- Professional: 2x
- Enterprise: 5x

## Headers
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1700000000
\`\`\`
`
  },
  {
    title: `Activity Boundaries (Updated: ${TODAY})`,
    content: `
## Metrics Tracked
- API calls (per day)
- Exports (per month)
- Searches (per day)
- Outreach sent (per month)
- Storage (MB)
- Active users

## Plan Limits

| Metric | Free | Starter | Pro | Enterprise |
|--------|------|---------|-----|------------|
| API calls/day | 1K | 10K | 100K | 1M |
| Exports/mo | 10 | 100 | 1K | 10K |
| Searches/day | 100 | 1K | 10K | 100K |
| Outreach/mo | 50 | 500 | 5K | 50K |
| Storage MB | 100 | 1K | 10K | 100K |
| Users | 2 | 5 | 20 | 100 |

## Alert Thresholds
- Warning: 80% of limit
- Critical: 95% of limit
- Exceeded: Action based on rule (warn/block/notify)
`
  },
  {
    title: `Workspace Components (Updated: ${TODAY})`,
    content: `
## WorkspaceSelector
Dropdown for switching between workspaces with plan badges.

## TeamManager
Table view of team members with:
- Status filter (all/active/invited)
- Search by name/email
- Role badges with colors
- Actions for role change and removal

## InviteModal
Form for inviting new members:
- Email input with validation
- Role selection with descriptions
- Loading states and error handling

## PermissionsTable
Visual matrix showing permissions by role:
- Grouped by category (Workspace, Team, Discovery, etc.)
- Checkmarks for allowed permissions
- Role highlighting on hover
`
  }
];

async function updateSprintsDB() {
  console.log('\\n📅 UPDATING SPRINTS DATABASE');
  console.log('─'.repeat(60));

  for (const sprint of SPRINTS) {
    try {
      // Find existing sprint
      const existing = await notion.databases.query({
        database_id: dbIds.sprints_db_id,
        filter: { property: 'Sprint', number: { equals: sprint.sprintNumber } }
      });

      const properties = {
        'Sprint': { title: [{ text: { content: `S${sprint.sprintNumber}: ${sprint.name}` } }] },
        'Goal': { rich_text: [{ text: { content: sprint.goal } }] },
        'Status': { select: { name: sprint.status } },
        'Priority': { select: { name: sprint.priority } },
        'Deliverables': { rich_text: [{ text: { content: sprint.deliverables.join('\\n') } }] }
      };

      if (existing.results.length > 0) {
        await notion.pages.update({ page_id: existing.results[0].id, properties });
        console.log(`✅ Updated S${sprint.sprintNumber}: ${sprint.name}`);
      } else {
        await notion.pages.create({ parent: { database_id: dbIds.sprints_db_id }, properties });
        console.log(`✅ Created S${sprint.sprintNumber}: ${sprint.name}`);
      }
    } catch (err) {
      console.error(`❌ S${sprint.sprintNumber}: ${err.message}`);
    }
  }
}

async function updateFeaturesDB() {
  console.log('\\n📦 UPDATING FEATURES DATABASE');
  console.log('─'.repeat(60));

  for (const [sprintNum, features] of Object.entries(FEATURES)) {
    for (const feature of features) {
      try {
        // Find by notes match
        const existing = await notion.databases.query({
          database_id: dbIds.module_features_db_id,
          filter: {
            and: [
              { property: 'Sprint', number: { equals: parseInt(sprintNum) } },
              { property: 'Notes', rich_text: { contains: feature.notes.substring(0, 50) } }
            ]
          }
        });

        const properties = {
          'Features': { title: [{ text: { content: feature.name } }] },
          'Sprint': { number: parseInt(sprintNum) },
          'Status': { select: { name: 'Done' } },
          'Priority': { select: { name: 'P0' } },
          'Complexity': { select: { name: 'Medium' } },
          'Notes': { rich_text: [{ text: { content: feature.notes } }] }
        };

        if (existing.results.length > 0) {
          await notion.pages.update({ page_id: existing.results[0].id, properties });
          console.log(`✅ Updated: ${feature.name}`);
        } else {
          await notion.pages.create({ parent: { database_id: dbIds.module_features_db_id }, properties });
          console.log(`✅ Created: ${feature.name}`);
        }
      } catch (err) {
        console.error(`❌ ${feature.name}: ${err.message}`);
      }
    }
  }
}

async function createKnowledgePages() {
  console.log('\\n📚 CREATING KNOWLEDGE PAGES');
  console.log('─'.repeat(60));

  for (const page of KNOWLEDGE_PAGES) {
    try {
      // Check if exists
      const existing = await notion.databases.query({
        database_id: dbIds.knowledge_db_id,
        filter: { property: 'title', title: { contains: page.title.split('(')[0].trim() } }
      });

      const blocks = [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: page.content } }] }
        }
      ];

      if (existing.results.length > 0) {
        // Update title
        await notion.pages.update({
          page_id: existing.results[0].id,
          properties: { title: { title: [{ text: { content: page.title } }] } }
        });
        console.log(`✅ Updated: ${page.title}`);
      } else {
        await notion.pages.create({
          parent: { database_id: dbIds.knowledge_db_id },
          properties: { title: { title: [{ text: { content: page.title } }] } },
          children: blocks
        });
        console.log(`✅ Created: ${page.title}`);
      }
    } catch (err) {
      console.error(`❌ ${page.title}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('\\n' + '='.repeat(60));
  console.log('GOVERNANCE UPDATE - STREAM 3 (S8-S9)');
  console.log('='.repeat(60));
  console.log(`Date: ${TODAY}`);

  await updateSprintsDB();
  await updateFeaturesDB();
  await createKnowledgePages();

  console.log('\\n' + '='.repeat(60));
  console.log('GOVERNANCE COMPLETE');
  console.log('='.repeat(60));
  console.log('Sprints: S8-S9 (2 sprints)');
  console.log('Features: 10 features');
  console.log('Knowledge Pages: 7 pages');
}

main().catch(console.error);
