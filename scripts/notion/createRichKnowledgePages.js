/**
 * Create Rich Knowledge Pages for Stream 3
 *
 * Proper formatting with headings, callouts, code blocks, tables
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TODAY = '2025-11-25';

// Helper to create heading block
const heading2 = (text) => ({
  object: 'block',
  type: 'heading_2',
  heading_2: { rich_text: [{ type: 'text', text: { content: text } }] }
});

const heading3 = (text) => ({
  object: 'block',
  type: 'heading_3',
  heading_3: { rich_text: [{ type: 'text', text: { content: text } }] }
});

const paragraph = (text) => ({
  object: 'block',
  type: 'paragraph',
  paragraph: { rich_text: [{ type: 'text', text: { content: text } }] }
});

const bulletItem = (text) => ({
  object: 'block',
  type: 'bulleted_list_item',
  bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] }
});

const numberedItem = (text) => ({
  object: 'block',
  type: 'numbered_list_item',
  numbered_list_item: { rich_text: [{ type: 'text', text: { content: text } }] }
});

const codeBlock = (code, language = 'typescript') => ({
  object: 'block',
  type: 'code',
  code: {
    rich_text: [{ type: 'text', text: { content: code } }],
    language: language
  }
});

const callout = (text, emoji = '💡') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji }
  }
});

const divider = () => ({
  object: 'block',
  type: 'divider',
  divider: {}
});

const tableOfContents = () => ({
  object: 'block',
  type: 'table_of_contents',
  table_of_contents: { color: 'default' }
});

// Knowledge Pages with rich content
const KNOWLEDGE_PAGES = [
  {
    title: `Multi-Tenant Architecture (Updated: ${TODAY})`,
    blocks: [
      callout('Stream 3 Core Concept: Multi-tenant workspace isolation for enterprise SaaS', '🏢'),
      tableOfContents(),
      divider(),

      heading2('1. Product Essentials'),
      paragraph('PremiumRadar uses a multi-tenant architecture where each workspace represents an isolated tenant with its own data, settings, and team members.'),
      bulletItem('Workspace: Top-level container for all tenant data'),
      bulletItem('Tenant: 1:1 mapping with workspace for data isolation'),
      bulletItem('Team: Members with role-based access within workspace'),
      bulletItem('Isolation: Request-scoped context ensuring complete data separation'),

      heading2('2. Core Frameworks'),
      bulletItem('Zustand - Lightweight state management for workspace/team state'),
      bulletItem('Next.js 14 App Router - Server and client components'),
      bulletItem('TypeScript - Full type safety for tenant types'),

      heading2('3. Technologies Used'),
      codeBlock(`// Key files:
lib/workspace/types.ts     - Workspace, Team, Permission types
lib/workspace/rbac.ts      - Role-based access control
lib/workspace/store.ts     - Zustand state management
lib/tenant/context.ts      - Request-scoped tenant isolation`),

      heading2('4. Key Capabilities'),
      numberedItem('Workspace switching with plan-based features'),
      numberedItem('Team invitation with role assignment'),
      numberedItem('Permission-based UI rendering'),
      numberedItem('Tenant-scoped data queries'),
      numberedItem('Activity boundaries per plan'),

      heading2('5. ELI5 (Explain Like I\'m 5)'),
      callout('Think of it like an apartment building. Each apartment (workspace) has its own key, its own stuff inside, and its own family members who can come in. The building manager (system) makes sure nobody can accidentally walk into someone else\'s apartment.', '🧒'),

      heading2('6. Real-World Analogy'),
      callout('Like a co-working space: Each company rents their own private office (workspace), has their own employees (team members), their own files (data), and their own access cards (permissions). The building (PremiumRadar) provides shared infrastructure but keeps everything separate.', '🏬'),

      heading2('7. Explain to Different Audiences'),
      heading3('For Developers'),
      paragraph('Multi-tenant isolation via request-scoped TenantContext with automatic query scoping and permission guards.'),
      heading3('For Product Managers'),
      paragraph('Each customer gets their own isolated workspace with customizable team roles and plan-based feature access.'),
      heading3('For Executives'),
      paragraph('Enterprise-grade data isolation ensuring customer data never leaks between accounts, with audit trails for compliance.'),

      heading2('8. Innovation & Differentiation'),
      bulletItem('GCC-First: Regional data residency (UAE/KSA/GCC) built-in'),
      bulletItem('Flexible Isolation: Shared, dedicated, or isolated modes per customer'),
      bulletItem('Plan-Based Boundaries: Automatic usage limits and alerts by subscription tier'),
    ]
  },
  {
    title: `RBAC Permission System (Updated: ${TODAY})`,
    blocks: [
      callout('Role-Based Access Control with 4-tier hierarchy and granular permissions', '🔐'),
      tableOfContents(),
      divider(),

      heading2('1. Product Essentials'),
      paragraph('Hierarchical role system controlling what each team member can do within a workspace.'),

      heading2('2. Role Hierarchy'),
      numberedItem('Owner - Full control including billing, deletion, ownership transfer'),
      numberedItem('Admin - Team management, all features, no billing access'),
      numberedItem('Analyst - Use features, create outreach, export data'),
      numberedItem('Viewer - Read-only access to discovery and analytics'),

      heading2('3. Permission Categories'),
      codeBlock(`// 18 granular permissions across 6 categories:
Workspace: read, update, delete, billing
Team:      read, invite, remove, role:change
Discovery: read, export
Outreach:  read, create, send
Analytics: read, export
API:       read, create, revoke`),

      heading2('4. Key Capabilities'),
      bulletItem('Permission guards for API routes'),
      bulletItem('Role-based UI rendering (show/hide based on permissions)'),
      bulletItem('Hierarchical role management (can only manage lower roles)'),
      bulletItem('Assignable roles filtering (owners can assign admins, admins can assign analysts/viewers)'),

      heading2('5. ELI5'),
      callout('Like a school: Principal (owner) can do everything. Teachers (admin) can manage students but not fire other teachers. Class monitors (analyst) can help with activities. Students (viewer) can only watch and learn.', '🧒'),

      heading2('6. Real-World Analogy'),
      callout('Like a company org chart: CEO has all powers, Directors manage teams, Managers do the work, Interns observe and learn. Each level has specific permissions they can grant to those below them.', '📊'),

      heading2('7. Implementation'),
      codeBlock(`import { hasPermission, canManageRole } from '@/lib/workspace';

// Check permission
if (hasPermission(userRole, 'team:invite')) {
  // Show invite button
}

// Check role management
if (canManageRole(actorRole, targetRole)) {
  // Allow role change
}`, 'typescript'),

      heading2('8. Innovation'),
      bulletItem('Permission matrix is declarative and easily extensible'),
      bulletItem('Guards work on both server (API) and client (UI) side'),
      bulletItem('Role info includes display labels, descriptions, and colors for consistent UI'),
    ]
  },
  {
    title: `API Key Management (Updated: ${TODAY})`,
    blocks: [
      callout('Secure tenant-scoped API keys with scope presets and rate limits', '🔑'),
      tableOfContents(),
      divider(),

      heading2('1. Product Essentials'),
      paragraph('API keys allow programmatic access to PremiumRadar with tenant-scoped permissions and rate limits.'),

      heading2('2. Key Format'),
      codeBlock(`// Format: upr_[base64url random 32 bytes]
// Example: upr_abc123def456ghi789jkl012mno345pqr678

// Storage:
- Full key: Shown ONCE at creation (never stored)
- Key hash: SHA-256 hash stored in database
- Key prefix: First 12 chars for identification (upr_abc123de)`),

      heading2('3. Scope Presets'),
      bulletItem('read_only - View workspace, team, discovery, outreach, analytics'),
      bulletItem('discovery - Read and export discovery data only'),
      bulletItem('analytics - Read and export analytics only'),
      bulletItem('full_access - All read/write operations'),

      heading2('4. Key Capabilities'),
      numberedItem('Secure generation with crypto.randomBytes'),
      numberedItem('Hash-only storage (key never persisted)'),
      numberedItem('Tenant-scoped validation'),
      numberedItem('Automatic expiration handling'),
      numberedItem('Per-key rate limit overrides'),

      heading2('5. ELI5'),
      callout('Like a special password that lets computer programs talk to PremiumRadar. You create it, write it down once, and the program uses it to prove who it is - like a secret handshake!', '🧒'),

      heading2('6. Real-World Analogy'),
      callout('Like a valet key for your car: It lets someone drive your car (access your data) but won\'t open the trunk or glove box (restricted permissions). You can revoke it anytime.', '🚗'),

      heading2('7. Usage'),
      codeBlock(`// Create API key
const { apiKey, secretKey } = createApiKey({
  name: 'My Integration',
  permissions: ['discovery:read', 'analytics:read'],
  rateLimit: 100,
  expiresAt: new Date('2025-12-31')
});

// Validate incoming request
const key = validateApiKey(request.headers['x-api-key']);
if (!key || !apiKeyHasPermission(key, 'discovery:read')) {
  throw new UnauthorizedError();
}`, 'typescript'),

      heading2('8. Security Features'),
      bulletItem('Keys are hashed with SHA-256 before storage'),
      bulletItem('Automatic expiration checking on every request'),
      bulletItem('Revocation takes effect immediately'),
      bulletItem('Audit logging of all API key operations'),
    ]
  },
  {
    title: `Rate Limiting System (Updated: ${TODAY})`,
    blocks: [
      callout('Sliding window rate limiter with plan-based multipliers', '⏱️'),
      tableOfContents(),
      divider(),

      heading2('1. Product Essentials'),
      paragraph('Per-tenant rate limiting protects the system from abuse while ensuring fair usage across all customers.'),

      heading2('2. Default Limits'),
      codeBlock(`Endpoint              | Requests/Window
---------------------|----------------
/api/discovery/*     | 100/minute
/api/outreach/*      | 50/minute
/api/analytics/*     | 200/minute
/api/export/*        | 10/hour
/api/search          | 30/minute
/api/bulk/*          | 5/hour`),

      heading2('3. Plan Multipliers'),
      bulletItem('Free: 0.5x (50 discovery requests/min)'),
      bulletItem('Starter: 1x (100 discovery requests/min)'),
      bulletItem('Professional: 2x (200 discovery requests/min)'),
      bulletItem('Enterprise: 5x (500 discovery requests/min)'),

      heading2('4. Algorithm'),
      paragraph('Sliding window counter algorithm: Each request increments a counter. Counter resets when window expires. Requests denied when counter exceeds limit.'),

      heading2('5. ELI5'),
      callout('Like a water fountain with a timer. You can drink (make requests) but if you drink too much too fast, you have to wait for the timer to reset before drinking more!', '🧒'),

      heading2('6. HTTP Headers'),
      codeBlock(`X-RateLimit-Limit: 100      // Max requests in window
X-RateLimit-Remaining: 85   // Requests left
X-RateLimit-Reset: 1700000  // Unix timestamp when window resets
Retry-After: 45             // Seconds to wait (only when limited)`, 'http'),

      heading2('7. Middleware Usage'),
      codeBlock(`import { rateLimitMiddleware } from '@/lib/tenant';

export async function GET(request: Request) {
  const { allowed, status, headers } = rateLimitMiddleware('/api/discovery');

  if (!allowed) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers }
    );
  }

  // Process request...
}`, 'typescript'),

      heading2('8. Features'),
      bulletItem('Burst allowance for temporary spikes'),
      bulletItem('Skip failed requests option (don\'t count errors)'),
      bulletItem('Per-endpoint configuration'),
      bulletItem('Admin reset capability'),
    ]
  },
  {
    title: `Activity Boundaries (Updated: ${TODAY})`,
    blocks: [
      callout('Usage limits and alerts by subscription plan', '📊'),
      tableOfContents(),
      divider(),

      heading2('1. Product Essentials'),
      paragraph('Activity boundaries enforce usage limits based on subscription plan and alert administrators when approaching limits.'),

      heading2('2. Metrics Tracked'),
      bulletItem('api_calls - Total API requests per day'),
      bulletItem('exports - Data exports per month'),
      bulletItem('searches - Discovery searches per day'),
      bulletItem('outreach_sent - Outreach messages per month'),
      bulletItem('storage_mb - Storage used in megabytes'),
      bulletItem('active_users - Unique active team members'),

      heading2('3. Plan Limits'),
      codeBlock(`Metric        | Free    | Starter | Pro     | Enterprise
--------------|---------|---------|---------|------------
API calls/day | 1,000   | 10,000  | 100,000 | 1,000,000
Exports/month | 10      | 100     | 1,000   | 10,000
Searches/day  | 100     | 1,000   | 10,000  | 100,000
Outreach/mo   | 50      | 500     | 5,000   | 50,000
Storage (MB)  | 100     | 1,000   | 10,000  | 100,000
Team members  | 2       | 5       | 20      | 100`),

      heading2('4. Alert Thresholds'),
      bulletItem('Warning: 80% of limit - Yellow indicator, optional email'),
      bulletItem('Critical: 95% of limit - Red indicator, email notification'),
      bulletItem('Exceeded: 100% - Action taken (warn/block/notify)'),

      heading2('5. ELI5'),
      callout('Like a phone data plan. You get a certain amount each month. When you\'re running low, you get a warning. When you run out, you either get slowed down or have to wait for next month!', '🧒'),

      heading2('6. Actions'),
      bulletItem('warn - Show warning in UI, allow action'),
      bulletItem('block - Prevent action, show upgrade prompt'),
      bulletItem('notify - Allow action, send admin notification'),

      heading2('7. Usage'),
      codeBlock(`import { trackActivity, isActivityAllowed } from '@/lib/tenant';

// Check before action
if (!isActivityAllowed('exports', userPlan)) {
  throw new QuotaExceededError('Monthly export limit reached');
}

// Track after action
const result = trackActivity('exports', 1, userPlan);
if (result.status === 'warning') {
  showWarningToast('You\\'ve used 80% of your export quota');
}`, 'typescript'),

      heading2('8. Dashboard'),
      paragraph('Usage summary available via getUsageSummary() showing overall health status (healthy/warning/critical) across all metrics.'),
    ]
  }
];

async function createPages() {
  console.log('Creating rich Knowledge Pages...\n');

  for (const page of KNOWLEDGE_PAGES) {
    try {
      // Delete existing page with same title prefix
      const existing = await notion.search({
        query: page.title.split('(')[0].trim(),
        filter: { property: 'object', value: 'page' }
      });

      for (const result of existing.results) {
        if (result.parent?.page_id === dbIds.knowledge_page_id) {
          await notion.pages.update({ page_id: result.id, archived: true });
          console.log(`  Archived old: ${page.title.split('(')[0].trim()}`);
        }
      }

      // Create new page with rich blocks
      await notion.pages.create({
        parent: { page_id: dbIds.knowledge_page_id },
        properties: {
          title: { title: [{ text: { content: page.title } }] }
        },
        children: page.blocks
      });

      console.log(`✅ Created: ${page.title}`);
    } catch (err) {
      console.error(`❌ ${page.title}: ${err.message}`);
    }
  }
}

createPages().catch(console.error);
