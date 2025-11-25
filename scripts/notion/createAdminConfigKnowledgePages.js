#!/usr/bin/env node
/**
 * Create Colorful Knowledge Pages for Stream 5: Admin & Configuration
 *
 * Creates rich, colorful pages covering:
 * - Tenant Impersonation Mode
 * - User Management System
 * - Feature Flags System
 * - Scoring Parameters
 * - Vertical Registry
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TODAY = '2025-11-25';

// ============================================================
// BLOCK HELPERS (Following UPR Template)
// ============================================================

const coloredHeading = (text, color) => ({
  object: 'block',
  type: 'heading_2',
  heading_2: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: color,
  },
});

const yellowCallout = (text, emoji = '💡') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji },
    color: 'yellow_background',
  },
});

const greenQuote = (text) => ({
  object: 'block',
  type: 'quote',
  quote: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: 'green_background',
  },
});

const brownCallout = (text, emoji = '📌') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji },
    color: 'brown_background',
  },
});

const paragraph = (text) => ({
  object: 'block',
  type: 'paragraph',
  paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
});

const bullet = (text) => ({
  object: 'block',
  type: 'bulleted_list_item',
  bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] },
});

const code = (text, language = 'typescript') => ({
  object: 'block',
  type: 'code',
  code: {
    rich_text: [{ type: 'text', text: { content: text } }],
    language: language,
  },
});

const divider = () => ({ object: 'block', type: 'divider', divider: {} });

// ============================================================
// KNOWLEDGE PAGES FOR STREAM 5 (ADMIN & CONFIG)
// ============================================================

const PAGES = [
  {
    title: `Tenant Impersonation Mode (Updated: ${TODAY})`,
    icon: '👁️',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'Imagine you work at a hotel front desk and a guest calls saying their room TV isn\'t working. You can\'t go to their room, but you have a special screen that shows exactly what they see in their room. You can help them fix the TV while seeing everything they see! That\'s impersonation - support staff can "see" a customer\'s account to help them.',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like a tech support agent using screen sharing: They can see your screen to help troubleshoot, but they announce "I\'m viewing your screen now" and there\'s a visible indicator. They can look but have limited actions. When done, they say "I\'m disconnecting" and it\'s logged for security. Same concept for admin viewing a customer\'s account.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'Admins can temporarily view the application as a specific tenant. Sessions have time limits (30 min default, 2 hr max), require a reason, and log all actions. Certain destructive actions are blocked during impersonation.',
      ),
      brownCallout(
        'Security: All impersonation sessions create immutable audit logs with admin ID, tenant ID, timestamp, reason, and all actions performed.',
        '🔒',
      ),
      code(
        `// Start impersonation
const session = await startImpersonation({
  targetTenantId: 'tenant_123',
  reason: 'Support ticket #5678 - Cannot see reports'
}, adminId, adminEmail);

// Session includes:
// - 30 minute expiry (extendable)
// - Action restrictions
// - Full audit trail`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/admin/impersonation.ts - Core impersonation logic'),
      bullet('useImpersonationStore() - Zustand store for session state'),
      bullet('ImpersonationBanner - Visual indicator when impersonating'),
      bullet('Restricted actions: delete, billing changes, API key management'),
      bullet('Persisted to sessionStorage for page refresh continuity'),
    ],
  },
  {
    title: `User Management System (Updated: ${TODAY})`,
    icon: '👥',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'Remember in school when someone misbehaved? Teacher could give detention (disable), suspend them for a week (ban), or in extreme cases, expel them (delete). But if there was a mistake, they could come back! User management is the same - admins can disable, ban, or delete user accounts, and undo these actions if needed.',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like social media account moderation: If someone violates rules, moderators can temporarily disable their account (cooling off period), ban them for a specific time or permanently, or delete their account entirely. Each action is logged, and there\'s usually an appeal process to restore access.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        '5 user states: active, disabled, banned, pending, deleted. Each state has specific transitions and associated metadata (reason, expiry, timestamp). Supports both individual and bulk actions.',
      ),
      brownCallout(
        'User States: active → disabled (temporary, reversible) → banned (with optional expiry) → deleted (soft delete, restorable)',
        '📊',
      ),
      code(
        `// User state transitions
await disableUser(userId, {
  reason: 'Suspicious activity detected',
  notifyUser: true
}, adminId);

await banUser(userId, {
  reason: 'Terms of service violation',
  permanent: false,
  expiresAt: new Date('2025-12-31'),
  notifyUser: true
}, adminId);`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/admin/user-management.ts - User lifecycle management'),
      bullet('disableUser() / enableUser() - Temporary access control'),
      bullet('banUser() / unbanUser() - Punitive action with optional expiry'),
      bullet('deleteUser() / restoreUser() - Soft delete with recovery'),
      bullet('bulkUserAction() - Apply actions to multiple users'),
    ],
  },
  {
    title: `Feature Flags System (Updated: ${TODAY})`,
    icon: '🎛️',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'Imagine you\'re decorating for a party but not sure if guests will like the disco ball. So you install it with an ON/OFF switch. If guests don\'t like it, flip the switch - no climbing on ladders! Feature flags are ON/OFF switches for software features. Don\'t like the new button? Flip the switch, it\'s gone!',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like a restaurant\'s seasonal menu: The kitchen can prepare dishes for summer or winter, but which ones appear on the menu depends on the season toggle. Some items might be "chef\'s special" only for VIP tables. Feature flags control which features show to which customers, without changing the kitchen (code).',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        '4 flag types: boolean (on/off), percentage (gradual rollout), user_list (whitelist), plan_based (by subscription tier). Environment-specific overrides for dev/staging/prod.',
      ),
      brownCallout(
        'Flag Types: Boolean (simple toggle), Percentage (50% of users), User List (specific users), Plan Based (Pro+ only)',
        '🎚️',
      ),
      code(
        `// Feature flag evaluation
const { enabled, reason } = store.evaluateFlag('ai_analysis_v2', {
  userId: 'user_123',
  userPlan: 'professional',
  environment: 'production'
});

// Result: { enabled: true, reason: 'percentage_rollout_50%' }`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/config/feature-flags.ts - Flag management system'),
      bullet('useFeatureFlagStore() - Zustand store for flag state'),
      bullet('evaluateFlag() - Evaluate flag for specific context'),
      bullet('useFeatureFlag() - React hook for components'),
      bullet('Audit log tracks all flag changes'),
    ],
  },
  {
    title: `Q/T/L/E Scoring Parameters (Updated: ${TODAY})`,
    icon: '📊',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'When judging a talent show, different judges care about different things. One cares 50% about singing, 30% dancing, 20% costume. Another might be 40% singing, 40% dancing, 20% costume. The final score depends on these "weights". Our domain scoring works the same - we can adjust how much each factor matters!',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like a university admission formula: 40% academics + 30% extracurriculars + 20% essays + 10% interviews = admission score. Universities can adjust these weights based on what they value most. Similarly, PremiumRadar can tune scoring weights to match market conditions or client preferences.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'Q/T/L/E = Quality, Traffic, Liquidity, End-User Value. Each category has weighted sub-factors that sum to 1.0. Thresholds define high/medium/low. Modifiers add bonuses/penalties for specific attributes.',
      ),
      brownCallout(
        'Quality weights: length (0.25) + memorability (0.25) + pronunciation (0.20) + typoResistance (0.15) + brandability (0.15) = 1.0',
        '⚖️',
      ),
      code(
        `// Scoring parameters structure
qualityWeights: {
  length: 0.25,        // Domain length impact
  memorability: 0.25,  // How easy to remember
  pronunciation: 0.20, // Ease of pronunciation
  typoResistance: 0.15, // Typo resistance
  brandability: 0.15   // Brand potential
}
// All weights must sum to 1.0`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/config/scoring-params.ts - Scoring parameter management'),
      bullet('qualityWeights, trafficWeights, liquidityWeights, endUserWeights'),
      bullet('thresholds - Define high/medium/low boundaries'),
      bullet('modifiers - Bonuses (premium TLD) and penalties (hyphens)'),
      bullet('Validation ensures weights always sum to 1.0'),
    ],
  },
  {
    title: `Vertical Registry (Updated: ${TODAY})`,
    icon: '🏷️',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'At a job fair, there are different booths for different industries - Tech, Healthcare, Finance. Each booth knows what skills that industry values. A "Python" skill matters more at Tech booth than Healthcare booth. Vertical Registry is our list of industry booths, each knowing what makes a domain valuable for THAT industry!',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like LinkedIn industry filters: When you search for jobs, selecting "Technology" vs "Healthcare" changes which results appear. Each industry has its own keywords, required skills, and salary expectations. Similarly, selecting a vertical in PremiumRadar changes which domains score highly and which keywords matter.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        '8 pre-defined verticals: Technology, Finance, Healthcare, E-Commerce, Real Estate, Crypto, Education, Travel. Each has keywords, preferred TLDs, and scoring overrides. Status can be active, beta, deprecated, or disabled.',
      ),
      brownCallout(
        'Vertical config: keywords (matches boost score), excludedKeywords (filter out), preferredTlds (.com, .io), scoringOverrides (custom weights)',
        '🎯',
      ),
      code(
        `// Vertical structure
{
  key: 'technology',
  name: 'Technology',
  keywords: ['tech', 'software', 'ai', 'cloud', 'data'],
  preferredTlds: ['.com', '.io', '.tech', '.ai'],
  scoringOverrides: {
    modifiers: { shortLengthBonus: 20 }
  }
}`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/config/vertical-registry.ts - Vertical management'),
      bullet('DEFAULT_VERTICALS - 8 pre-configured industry verticals'),
      bullet('matchesVertical() - Check if domain fits a vertical'),
      bullet('findBestVertical() - Auto-detect best matching vertical'),
      bullet('scoringOverrides - Vertical-specific scoring adjustments'),
    ],
  },
];

// ============================================================
// MAIN
// ============================================================

async function createPages() {
  console.log('\n⚙️ Creating COLORFUL Knowledge Pages for Stream 5 (Admin & Config)...\n');

  for (const page of PAGES) {
    try {
      // Archive existing pages with same base title
      const baseTitle = page.title.split('(')[0].trim();
      const existing = await notion.search({
        query: baseTitle,
        filter: { property: 'object', value: 'page' },
      });

      for (const result of existing.results) {
        if (result.parent?.page_id === dbIds.knowledge_page_id) {
          await notion.pages.update({ page_id: result.id, archived: true });
          console.log(`  📦 Archived old: ${baseTitle}`);
        }
      }

      // Create new page under Knowledge parent
      await notion.pages.create({
        parent: { page_id: dbIds.knowledge_page_id },
        icon: { type: 'emoji', emoji: page.icon },
        properties: {
          title: { title: [{ text: { content: page.title } }] },
        },
        children: page.blocks,
      });

      console.log(`✅ ${page.icon} ${page.title}`);
    } catch (err) {
      console.error(`❌ ${page.title}: ${err.message}`);
    }
  }

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Stream 5 Knowledge Pages Complete!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Created 5 colorful pages:');
  console.log('  👁️ Tenant Impersonation Mode');
  console.log('  👥 User Management System');
  console.log('  🎛️ Feature Flags System');
  console.log('  📊 Q/T/L/E Scoring Parameters');
  console.log('  🏷️ Vertical Registry');
  console.log('');
  console.log('Each page includes:');
  console.log('  🟠 Orange headers for ELI5');
  console.log('  🟢 Green sections for Analogies');
  console.log('  🟣 Purple sections for Technical Details');
  console.log('  🔵 Blue sections for Implementation');
  console.log('  🟡 Yellow callouts for key insights');
  console.log('');
}

createPages().catch(console.error);
