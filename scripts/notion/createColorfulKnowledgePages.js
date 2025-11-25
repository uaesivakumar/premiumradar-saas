/**
 * Create Colorful Knowledge Pages for Stream 3
 *
 * Following the exact UPR template with colored headings, callouts, and quotes.
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TODAY = '2025-11-25';

// ============================================================
// BLOCK HELPERS (Following UPR Template)
// ============================================================

// Colored heading (orange, green, purple, blue)
const coloredHeading = (text, color) => ({
  object: 'block',
  type: 'heading_2',
  heading_2: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: color
  }
});

// Yellow callout for ELI5
const yellowCallout = (text, emoji = '💡') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji },
    color: 'yellow_background'
  }
});

// Green quote for analogies
const greenQuote = (text) => ({
  object: 'block',
  type: 'quote',
  quote: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: 'green_background'
  }
});

// Brown callout for important notes
const brownCallout = (text, emoji = '📌') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji },
    color: 'brown_background'
  }
});

// Plain paragraph
const paragraph = (text) => ({
  object: 'block',
  type: 'paragraph',
  paragraph: { rich_text: [{ type: 'text', text: { content: text } }] }
});

// Bullet item
const bullet = (text) => ({
  object: 'block',
  type: 'bulleted_list_item',
  bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] }
});

// Code block
const code = (text, language = 'typescript') => ({
  object: 'block',
  type: 'code',
  code: {
    rich_text: [{ type: 'text', text: { content: text } }],
    language: language
  }
});

// Divider
const divider = () => ({ object: 'block', type: 'divider', divider: {} });

// ============================================================
// KNOWLEDGE PAGES
// ============================================================

const PAGES = [
  {
    title: `Multi-Tenant Architecture (Updated: ${TODAY})`,
    icon: '🏢',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout('Think of it like an apartment building. Each apartment (workspace) has its own key, its own stuff inside, and its own family members who can come in. The building manager (PremiumRadar) makes sure nobody can accidentally walk into someone else\'s apartment. Your data is YOUR data.'),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote('Like a co-working space: Each company rents their own private office (workspace), has their own employees (team members), their own files (data), and their own access cards (permissions). The building provides shared infrastructure (servers, APIs) but keeps everything completely separate between tenants.'),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph('Multi-tenant architecture with workspace-level isolation. Each workspace maps 1:1 with a tenant. Request-scoped TenantContext ensures all database queries are automatically filtered by tenant_id. Three isolation levels supported: shared (logical), dedicated (schema), isolated (physical).'),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/workspace/types.ts - Workspace, Team, Permission types'),
      bullet('lib/tenant/tenant-context.ts - Request-scoped isolation'),
      bullet('lib/tenant/isolation-policy.ts - Policy engine with rules'),
      bullet('TenantContext set at request start, cleared at end'),
      bullet('All queries auto-scoped via getTenantWhereClause()'),
    ]
  },
  {
    title: `Role-Based Access Control (Updated: ${TODAY})`,
    icon: '🔐',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout('Like a school! Principal (owner) can do everything. Teachers (admin) can manage students but can\'t fire other teachers. Class monitors (analyst) can help with activities. Students (viewer) can only watch and learn. Each person has their own set of permissions based on their role.'),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote('Like a company org chart: CEO has all powers, Directors manage teams, Managers do the work, Interns observe and learn. Each level has specific permissions and can only grant permissions to those below them. Nobody can promote themselves.'),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph('4-tier role hierarchy: owner > admin > analyst > viewer. Permission matrix with 18 granular permissions across 6 categories (workspace, team, discovery, outreach, analytics, api). Role guards for both API routes and UI components.'),
      code('// Permission check\nif (hasPermission(userRole, \'team:invite\')) {\n  showInviteButton();\n}\n\n// Role management\nif (canManageRole(actorRole, targetRole)) {\n  allowRoleChange();\n}', 'typescript'),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/workspace/rbac.ts - PERMISSION_MATRIX, ROLE_HIERARCHY'),
      bullet('hasPermission() - Check if role has specific permission'),
      bullet('canManageRole() - Check if actor can manage target role'),
      bullet('getAssignableRoles() - Get roles actor can assign'),
      bullet('createPermissionGuard() - Factory for route guards'),
    ]
  },
  {
    title: `API Key Management (Updated: ${TODAY})`,
    icon: '🔑',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout('Like a special password that lets computer programs talk to PremiumRadar. You create it, write it down ONCE (we don\'t save it!), and the program uses it to prove who it is. Like a secret handshake that only you and the computer know!'),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote('Like a valet key for your car: It lets someone drive your car (access your data) but won\'t open the trunk or glove box (restricted permissions). You can revoke it anytime, and it expires automatically after a set period.'),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph('API keys use format: upr_[base64url 32 bytes]. Only SHA-256 hash stored in database - full key shown once at creation. Scope presets: read_only, discovery, analytics, full_access. Per-key rate limits and expiration.'),
      code('// Key generation\nconst { key, prefix, hash } = generateApiKey();\n// key = "upr_abc123..." (shown once)\n// prefix = "upr_abc123de" (stored)\n// hash = "sha256..." (stored)', 'typescript'),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/tenant/api-keys.ts - Full key lifecycle management'),
      bullet('generateApiKey() - Crypto-secure key generation'),
      bullet('validateApiKey() - Hash comparison + expiry check'),
      bullet('revokeApiKey() - Immediate revocation'),
      bullet('API_KEY_SCOPE_PRESETS - Pre-defined permission sets'),
    ]
  },
  {
    title: `Rate Limiting System (Updated: ${TODAY})`,
    icon: '⏱️',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout('Like a water fountain with a timer! You can drink (make requests) but if you drink too much too fast, you have to wait for the timer to reset. Different people (plans) get different sized cups - Enterprise gets a big jug, Free gets a small cup.'),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote('Like a theme park FastPass: Everyone gets a certain number of "fast" rides per hour. If you use them all, you wait in the regular line. VIP members get more passes. The system tracks your passes and tells you how many you have left.'),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph('Sliding window counter algorithm. Default limits: discovery 100/min, outreach 50/min, analytics 200/min, exports 10/hour. Plan multipliers: Free 0.5x, Starter 1x, Pro 2x, Enterprise 5x. HTTP headers expose remaining quota.'),
      code('// Headers returned\nX-RateLimit-Limit: 100\nX-RateLimit-Remaining: 85\nX-RateLimit-Reset: 1700000000\nRetry-After: 45  // only when limited', 'plain text'),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/tenant/rate-limiter.ts - Full rate limiting system'),
      bullet('checkRateLimit() - Check without consuming'),
      bullet('consumeRateLimit() - Check and consume token'),
      bullet('rateLimitMiddleware() - Ready-to-use middleware'),
      bullet('getRateLimitHeaders() - Generate HTTP headers'),
    ]
  },
  {
    title: `Activity Boundaries (Updated: ${TODAY})`,
    icon: '📊',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout('Like a phone data plan! You get a certain amount each month. When you\'re running low (80%), you get a warning. When you\'re almost out (95%), you get an urgent alert. When you run out, you either get slowed down or have to upgrade!'),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote('Like a gym membership tier: Basic members get 10 classes/month, Premium gets 30, VIP gets unlimited. The gym tracks your visits and warns you when you\'re running low. Going over might mean waiting until next month or upgrading your membership.'),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph('6 tracked metrics: api_calls (daily), exports (monthly), searches (daily), outreach_sent (monthly), storage_mb, active_users. Alert thresholds at 80% (warning) and 95% (critical). Actions: warn (show UI), block (prevent), notify (email admin).'),
      brownCallout('Pro Plan Limits: 100K API calls/day, 1K exports/mo, 10K searches/day, 5K outreach/mo, 10GB storage, 20 users'),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/tenant/activity-boundary.ts - Full boundary system'),
      bullet('PLAN_BOUNDARIES - Limits by plan (free/starter/pro/enterprise)'),
      bullet('trackActivity() - Increment counter and check bounds'),
      bullet('isActivityAllowed() - Pre-check before action'),
      bullet('getUsageSummary() - Dashboard-ready status'),
    ]
  }
];

// ============================================================
// MAIN
// ============================================================

async function createPages() {
  console.log('\\n🎨 Creating COLORFUL Knowledge Pages...\\n');

  for (const page of PAGES) {
    try {
      // Archive existing
      const existing = await notion.search({
        query: page.title.split('(')[0].trim(),
        filter: { property: 'object', value: 'page' }
      });

      for (const result of existing.results) {
        if (result.parent?.page_id === dbIds.knowledge_page_id) {
          await notion.pages.update({ page_id: result.id, archived: true });
        }
      }

      // Create with icon and colored blocks
      await notion.pages.create({
        parent: { page_id: dbIds.knowledge_page_id },
        icon: { type: 'emoji', emoji: page.icon },
        properties: {
          title: { title: [{ text: { content: page.title } }] }
        },
        children: page.blocks
      });

      console.log(`✅ ${page.icon} ${page.title}`);
    } catch (err) {
      console.error(`❌ ${page.title}: ${err.message}`);
    }
  }

  console.log('\\n✨ Done! All pages created with colors.');
}

createPages().catch(console.error);
