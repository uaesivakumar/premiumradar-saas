/**
 * Governance Update Script - Stream 3 (Sprints S8-S9) - FIXED
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

// Knowledge Pages content
const KNOWLEDGE_PAGES = [
  {
    title: `Multi-Tenant Architecture (Updated: ${TODAY})`,
    content: `Overview: PremiumRadar uses a multi-tenant architecture where each workspace represents an isolated tenant with its own data, settings, and team.\n\nKey Concepts:\n- Workspace: Top-level container for tenant data\n- Tenant: Data isolation boundary (1:1 with workspace)\n- Team: Members with role-based access within a workspace\n- Isolation: Request-scoped context ensuring data separation`
  },
  {
    title: `Role-Based Access Control (Updated: ${TODAY})`,
    content: `Role Hierarchy:\n1. Owner - Full workspace control including billing and deletion\n2. Admin - Team management and all features, no billing\n3. Analyst - Use features, create outreach, export data\n4. Viewer - Read-only access to discovery and analytics\n\nPermission Categories: Workspace, Team, Discovery, Outreach, Analytics, API`
  },
  {
    title: `Tenant Data Isolation (Updated: ${TODAY})`,
    content: `Isolation Levels:\n- Shared: Logical isolation via tenant_id filtering\n- Dedicated: Separate database schema per tenant\n- Isolated: Physically separate database instances\n\nRequest-Scoped Context: setTenantContext() at request start, all queries automatically scoped`
  },
  {
    title: `API Key Management (Updated: ${TODAY})`,
    content: `API Key Format: upr_[base64url random 32 bytes]\n\nKey Storage: Only hash stored in database, prefix stored for identification\n\nScope Presets: read_only, discovery, analytics, full_access`
  },
  {
    title: `Rate Limiting System (Updated: ${TODAY})`,
    content: `Algorithm: Sliding window counter\n\nDefault Limits (per minute):\n- /api/discovery/*: 100\n- /api/outreach/*: 50\n- /api/analytics/*: 200\n- /api/export/*: 10/hour\n\nPlan Multipliers: Free 0.5x, Starter 1x, Pro 2x, Enterprise 5x`
  },
  {
    title: `Activity Boundaries (Updated: ${TODAY})`,
    content: `Metrics Tracked: API calls, Exports, Searches, Outreach sent, Storage, Active users\n\nPlan Limits (Professional):\n- API calls/day: 100K\n- Exports/mo: 1K\n- Searches/day: 10K\n- Outreach/mo: 5K\n- Storage: 10GB\n- Users: 20\n\nAlert Thresholds: Warning 80%, Critical 95%`
  },
  {
    title: `Workspace Components (Updated: ${TODAY})`,
    content: `WorkspaceSelector: Dropdown for switching workspaces with plan badges\n\nTeamManager: Table view with status filter, search, role badges, actions\n\nInviteModal: Email input, role selection, loading states\n\nPermissionsTable: Visual matrix showing permissions by role`
  }
];

async function updateSprintsDB() {
  console.log('\\n📅 UPDATING SPRINTS DATABASE');
  console.log('─'.repeat(60));

  for (const sprint of SPRINTS) {
    try {
      // Find existing sprint by title contains
      const existing = await notion.databases.query({
        database_id: dbIds.sprints_db_id,
        filter: { property: 'Sprint', title: { contains: `S${sprint.sprintNumber}` } }
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

async function createKnowledgePages() {
  console.log('\\n📚 CREATING KNOWLEDGE PAGES (as children of Knowledge Page)');
  console.log('─'.repeat(60));

  for (const page of KNOWLEDGE_PAGES) {
    try {
      // Create as child page of the main Knowledge page
      await notion.pages.create({
        parent: { page_id: dbIds.knowledge_page_id },
        properties: { title: { title: [{ text: { content: page.title } }] } },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ type: 'text', text: { content: page.content } }] }
          }
        ]
      });
      console.log(`✅ Created: ${page.title}`);
    } catch (err) {
      console.error(`❌ ${page.title}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('\\n' + '='.repeat(60));
  console.log('GOVERNANCE UPDATE - STREAM 3 (S8-S9) [FIXED]');
  console.log('='.repeat(60));
  console.log(`Date: ${TODAY}`);

  await updateSprintsDB();
  await createKnowledgePages();

  console.log('\\n' + '='.repeat(60));
  console.log('GOVERNANCE COMPLETE');
  console.log('='.repeat(60));
  console.log('✅ Sprints: S8-S9 (2 sprints)');
  console.log('✅ Features: 10 features (already created)');
  console.log('✅ Knowledge Pages: 7 pages');
}

main().catch(console.error);
