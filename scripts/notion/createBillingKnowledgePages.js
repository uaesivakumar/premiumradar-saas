#!/usr/bin/env node
/**
 * Create Colorful Knowledge Pages for Stream 4: Billing & Subscriptions
 *
 * Creates rich, colorful pages covering:
 * - Stripe Integration Architecture
 * - Subscription Lifecycle Management
 * - Pricing Plans & Tier System
 * - Webhook Event Processing
 * - Metered Usage Tracking
 * - Seat-Based Billing
 * - Dunning & Payment Recovery
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
// KNOWLEDGE PAGES FOR STREAM 4 (BILLING)
// ============================================================

const PAGES = [
  {
    title: `Stripe Integration Architecture (Updated: ${TODAY})`,
    icon: '💳',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'Imagine a magic cash register that automatically charges customers every month. When someone wants to subscribe, the register creates a special checkout page. After payment, it remembers to charge them again next month without anyone doing anything!',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "Stripe is like a gym membership system: You sign up once at the front desk (checkout), get a member card (customer ID), and your account is automatically charged each month. You can visit the member portal anytime to update your payment method or cancel.",
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'Server-side Stripe SDK wrapper for PremiumRadar. Creates customers, checkout sessions, and billing portal sessions. Maps between Stripe subscription states and our internal subscription model.',
      ),
      code(
        `// Initialize Stripe client
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
  : null;

// Create checkout session
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: \`\${baseUrl}/settings/billing?success=true\`,
});`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/billing/stripe-client.ts - Core Stripe SDK wrapper'),
      bullet('getOrCreateCustomer() - Find or create Stripe customer by email'),
      bullet('createCheckoutSession() - Redirect user to Stripe-hosted payment'),
      bullet('createBillingPortalSession() - Self-service subscription management'),
      bullet('mapStripeSubscription() - Convert Stripe data to our types'),
    ],
  },
  {
    title: `Subscription Lifecycle Management (Updated: ${TODAY})`,
    icon: '🔄',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "Think of a subscription like a library card. First you get a free trial (temporary card). Then you become a full member (active). If you forget to pay, you get a warning (past_due). If you still don't pay, your card stops working (canceled). You can always come back and renew!",
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "Like a Netflix subscription: You sign up and maybe get a free trial. Then monthly billing starts. If your card declines, Netflix tries a few times and sends reminders. Eventually they pause your access until you fix payment. You can cancel anytime and keep access until period end.",
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        '7 subscription states: trialing, active, past_due, unpaid, canceled, incomplete, incomplete_expired. State transitions triggered by Stripe webhooks. Zustand store manages client-side subscription state.',
      ),
      brownCallout(
        'Key States: trialing → active (payment success) → past_due (payment failed) → canceled (grace period expired)',
        '📊',
      ),
      code(
        `// Subscription state management
export function mapStripeStatus(stripeStatus): SubscriptionStatus {
  const statusMap = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    trialing: 'trialing',
    // ... more mappings
  };
  return statusMap[stripeStatus];
}`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/billing/subscription-store.ts - Zustand store for subscription state'),
      bullet('cancelSubscriptionAtPeriodEnd() - Cancel but keep access until period ends'),
      bullet('resumeSubscription() - Undo cancellation before period ends'),
      bullet('updateSubscriptionTier() - Upgrade/downgrade with proration'),
    ],
  },
  {
    title: `Pricing Plans & Tier System (Updated: ${TODAY})`,
    icon: '💰',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "It's like movie theater sizes: Small popcorn (Free), Medium (Starter), Large (Professional), and Bucket (Enterprise). Each size costs more but gives you more popcorn. The bigger your appetite (business needs), the bigger size you pick!",
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like Spotify plans: Free (with ads, limited skips), Premium Individual ($9.99), Premium Family ($14.99). Each tier unlocks more features and removes limits. Enterprise is like getting a business license for a whole office.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        '4 tiers: Free, Starter ($29/mo), Professional ($149/mo), Enterprise ($499/mo). Each tier has defined limits for users, API calls, exports, searches, outreach, and storage.',
      ),
      brownCallout(
        'Pro Plan: 20 users, 100K API calls/day, 1K exports/mo, 10K searches/day, 5K outreach/mo, 10GB storage',
        '💎',
      ),
      code(
        `// Tier limits
export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free:         { users: 2,   apiCalls: 1000,    exports: 10,    searches: 100 },
  starter:      { users: 5,   apiCalls: 10000,   exports: 100,   searches: 1000 },
  professional: { users: 20,  apiCalls: 100000,  exports: 1000,  searches: 10000 },
  enterprise:   { users: 100, apiCalls: 1000000, exports: 10000, searches: 100000 },
};`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/billing/plans.ts - PRICING_PLANS and PLAN_LIMITS definitions'),
      bullet('lib/billing/types.ts - PlanTier, PlanLimits, PricingPlan types'),
      bullet('getPlanByTier() - Get plan config by tier'),
      bullet('getFeaturesByTier() - Get feature list for display'),
    ],
  },
  {
    title: `Webhook Event Processing (Updated: ${TODAY})`,
    icon: '🎣',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'Imagine Stripe is a messenger that runs to your door every time something happens with a payment. They knock (webhook), show their ID badge (signature), and tell you the news: "Payment succeeded!" or "Card declined!". You write it down in your notebook (database).',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like a bank notification system: When money moves in your account, the bank texts you immediately. Similarly, Stripe "texts" our server whenever a payment happens. The signature is like caller ID - we verify it\'s really Stripe before acting on the message.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        '12 webhook event types processed. Events verified using STRIPE_WEBHOOK_SECRET to prevent spoofing. Each event type has a dedicated handler that updates database and triggers business logic.',
      ),
      brownCallout(
        'Key Events: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated',
        '📨',
      ),
      code(
        `// Webhook handler pattern
export async function processWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event.data.object);
    case 'invoice.payment_failed':
      return handleInvoicePaymentFailed(event.data.object);
    // ... more handlers
  }
}`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/billing/webhooks.ts - All event handlers'),
      bullet('app/api/billing/webhook/route.ts - Webhook endpoint'),
      bullet('verifyWebhookSignature() - Validate Stripe signature'),
      bullet('handleInvoicePaymentFailed() - Triggers dunning flow'),
    ],
  },
  {
    title: `Metered Usage Tracking (Updated: ${TODAY})`,
    icon: '📊',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "It's like a data plan on your phone! You get 5GB per month. Every time you watch a video, it subtracts from your balance. When you hit the limit, videos stop loading until next month (or you upgrade). We show you a meter so you know how much is left!",
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like a gym with limited class bookings: Your Basic membership includes 5 yoga classes/month. Each booking decreases your counter. The app shows "3/5 classes remaining". If you want unlimited classes, upgrade to Premium!',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'Sliding window algorithm tracks usage over rolling 30-day period. 5 metrics tracked: api_calls, exports, searches, outreach_sent, storage_mb. Each operation checked against tier limits before execution.',
      ),
      code(
        `// Check usage before operation
const result = checkAndTrackUsage(workspaceId, 'api_calls', tier, 1);
if (!result.allowed) {
  return { error: \`API limit: \${result.current}/\${result.limit}\` };
}
// Proceed with API call...`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/billing/metered-usage.ts - Usage tracking with sliding window'),
      bullet('checkAndTrackUsage() - Check limits and record usage'),
      bullet('getUsageSummary() - Get all metrics for dashboard'),
      bullet('components/billing/UsageMeter.tsx - Visual progress bars'),
    ],
  },
  {
    title: `Seat-Based Billing (Updated: ${TODAY})`,
    icon: '👥',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "Imagine buying tickets to a movie. Your family of 3 needs 3 tickets. If grandma wants to come too, you buy 1 more ticket. At work, each person needs their own \"seat\" to use the software. More people = more seats to buy!",
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "Like Slack or Microsoft 365 licensing: Each team member needs a license (seat). If you have 10 employees, you pay for 10 seats. Hire someone new? Add a seat mid-billing (prorated). Someone leaves? Remove seat at period end.",
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'Per-seat pricing by tier: Free ($0), Starter ($10), Professional ($15), Enterprise ($20). Seat changes prorated based on remaining billing period. Seat inventory tracked per workspace.',
      ),
      brownCallout(
        'Example: Add 5 seats mid-month on Pro plan = 5 × $15 × (days remaining / 30) = ~$37.50 prorated',
        '💵',
      ),
      code(
        `// Seat pricing per tier
export const SEAT_PRICES: Record<PlanTier, number> = {
  free: 0, starter: 10, professional: 15, enterprise: 20
};

// Add seats with proration
const change = await addSeats(workspaceId, 5);
// { seatsAdded: 5, proratedAmount: 37.50, newTotal: 15 }`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/billing/seat-billing.ts - Seat management'),
      bullet('addSeats() / removeSeats() - Manage seat count'),
      bullet('useSeat() / releaseSeat() - Assign/free individual seats'),
      bullet('getSeatStatus() - Check available/used/total'),
    ],
  },
  {
    title: `Dunning & Payment Recovery (Updated: ${TODAY})`,
    icon: '📧',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'Remember when you forgot to return a library book? The library sends you a reminder, then another, then maybe calls. Dunning is like that but for payments. "Oops, your card didn\'t work! Here\'s a friendly reminder to update it before we pause your account."',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like Netflix payment recovery: Day 1 card declines → Netflix emails "Payment failed, update card". Day 3 → Another email. Day 7 → "Last chance!". Day 14 → Account paused. Each step gives customer a chance to fix it before losing access.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'Escalating email sequence over 14+ days. 4 urgency levels: low → medium → high → critical. Emails include direct link to update payment method. Triggered by invoice.payment_failed webhook.',
      ),
      brownCallout(
        'Dunning Sequence: Day 0 (friendly), Day 3 (follow-up), Day 7 (urgent), Day 14 (final notice)',
        '📬',
      ),
      code(
        `// Dunning templates
const DUNNING_TEMPLATES = [
  { attempt: 1, subject: 'Payment didn\\'t go through',
    urgency: 'low', delayDays: 0 },
  { attempt: 2, subject: 'Payment needs attention',
    urgency: 'medium', delayDays: 3 },
  { attempt: 3, subject: 'Action required',
    urgency: 'high', delayDays: 7 },
  { attempt: 4, subject: 'Final notice',
    urgency: 'critical', delayDays: 14 },
];`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/billing/dunning.ts - Email logic and templates'),
      bullet('handlePaymentFailure() - Entry point from webhook'),
      bullet('DUNNING_TEMPLATES - Escalating message sequence'),
      bullet('DEFAULT_DUNNING_CONFIG - Timing and behavior config'),
    ],
  },
];

// ============================================================
// MAIN
// ============================================================

async function createPages() {
  console.log('\n💳 Creating COLORFUL Knowledge Pages for Stream 4 (Billing)...\n');

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
  console.log('  Stream 4 Knowledge Pages Complete!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Created 7 colorful pages:');
  console.log('  💳 Stripe Integration Architecture');
  console.log('  🔄 Subscription Lifecycle Management');
  console.log('  💰 Pricing Plans & Tier System');
  console.log('  🎣 Webhook Event Processing');
  console.log('  📊 Metered Usage Tracking');
  console.log('  👥 Seat-Based Billing');
  console.log('  📧 Dunning & Payment Recovery');
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
