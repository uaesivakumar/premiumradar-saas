/**
 * Create Multiple Knowledge Pages (Learning-Focused)
 *
 * For 4 sprints, we need multiple learning topics:
 * 1. What is PremiumRadar? (Product Overview)
 * 2. The AI Orb Interaction Model
 * 3. Vertical Morphing Engine
 * 4. Demo-Before-Signup Architecture
 * 5. SaaS Shell & Dashboard
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const KNOWLEDGE_PAGE_ID = dbIds.knowledge_page_id;

// Helper to create a child page under the Knowledge Page
async function createKnowledgePage(title, icon, content) {
  console.log(`Creating: ${title}...`);

  const page = await notion.pages.create({
    parent: { page_id: KNOWLEDGE_PAGE_ID },
    icon: { emoji: icon },
    properties: {
      title: { title: [{ text: { content: title } }] }
    },
    children: content
  });

  console.log(`  ✓ Created`);
  return page;
}

// ============================================================
// KNOWLEDGE PAGE 1: What is PremiumRadar?
// ============================================================
const page1_WhatIsPremiumRadar = [
  // ELI5
  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🎈 Simple Explanation (ELI5)' } }], color: 'orange' }
  },
  {
    type: 'callout',
    callout: {
      icon: { emoji: '💡' },
      color: 'yellow_background',
      rich_text: [{ text: { content: 'PremiumRadar is an AI-powered competitive intelligence platform that helps sales teams find and win deals faster. Instead of manually researching competitors, the AI does it for you - tracking pricing changes, product launches, and market movements in real-time.' } }]
    }
  },

  // Analogy
  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🌍 Real-World Analogy' } }], color: 'green' }
  },
  {
    type: 'quote',
    quote: {
      rich_text: [{ text: { content: 'Imagine you\'re a restaurant owner. Instead of personally visiting every competitor restaurant to check their prices and new dishes, you have a smart assistant who visits them all daily and reports back: "The place next door just lowered their pasta price, the new Thai restaurant is getting 5-star reviews, and a food truck is opening nearby." That\'s PremiumRadar for B2B sales.' } }],
      color: 'green_background'
    }
  },

  // Technical
  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '⚙️ Technical Explanation' } }], color: 'purple' }
  },
  {
    type: 'paragraph',
    paragraph: {
      rich_text: [{ text: { content: 'PremiumRadar is a Next.js 14 SaaS application with an AI-first interaction model. Users interact with an "AI Orb" that detects their industry through conversation, then morphs the entire UI to match their vertical. Built on Zustand for state and Framer Motion for animations.' } }]
    }
  },

  // Why Created
  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '❓ Why It Was Created' } }], color: 'red' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Problem: Sales teams spend 15+ hours/week manually tracking competitors' }, annotations: { bold: false } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Solution: AI-powered monitoring that tracks competitor activities 24/7' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Impact: GCC-focused with Arabic RTL, vertical intelligence, enterprise security' } }] } },

  // Technologies
  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '💻 Technologies' } }], color: 'pink' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Next.js 14 + React 18 (App Router)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'TypeScript + Zustand + Framer Motion' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Tailwind CSS + i18n (EN/AR RTL)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Cloud Run (auto-scaling)' } }] } },

  // Audiences
  { type: 'divider', divider: {} },
  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🎭 Explain to Different Audiences' } }], color: 'purple' }
  },
  {
    type: 'toggle',
    toggle: {
      rich_text: [{ text: { content: '💰 To Investor' } }],
      color: 'yellow_background',
      children: [{ type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'PremiumRadar addresses a $15B competitive intelligence market, starting with the underserved GCC region. AI-first approach reduces CAC by 60%. Vertical morphing creates perceived product-market fit for every industry. GCC-first gives us 2-year head start.' } }] } }]
    }
  },
  {
    type: 'toggle',
    toggle: {
      rich_text: [{ text: { content: '🏦 To Client' } }],
      color: 'green_background',
      children: [{ type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Your team spends 15+ hours/week tracking competitors manually. PremiumRadar does this automatically - monitoring pricing, launches, and market signals 24/7. The AI surfaces only relevant insights. Arabic support and regional intelligence that US tools don\'t have.' } }] } }]
    }
  },
  {
    type: 'toggle',
    toggle: {
      rich_text: [{ text: { content: '💼 To Hiring Manager' } }],
      color: 'pink_background',
      children: [{ type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Built entire frontend: Next.js 14 App Router, TypeScript, Zustand, Framer Motion, Tailwind. Key: AI Orb with 5 states, industry detection with vertical UI adaptation, Arabic RTL, chat demo flow, responsive SaaS shell. 29 features, ~6,800 LOC.' } }] } }]
    }
  },
];

// ============================================================
// KNOWLEDGE PAGE 2: The AI Orb Interaction Model
// ============================================================
const page2_AIOrb = [
  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🎈 Simple Explanation (ELI5)' } }], color: 'orange' }
  },
  {
    type: 'callout',
    callout: {
      icon: { emoji: '💡' },
      color: 'yellow_background',
      rich_text: [{ text: { content: 'The AI Orb is like a magic crystal ball on the landing page. When you click it, it listens to what you say and changes colors based on your industry. Blue for banks, green for healthcare, purple for tech. It\'s the first thing users interact with - no forms, no sign-up buttons, just a conversation.' } }]
    }
  },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🌍 Real-World Analogy' } }], color: 'green' }
  },
  {
    type: 'quote',
    quote: {
      rich_text: [{ text: { content: 'Like walking into a high-end hotel. The concierge greets you, asks what you need, and the entire lobby transforms - music, lighting, even the menu changes based on whether you\'re there for business or vacation. The AI Orb is that concierge for our platform.' } }],
      color: 'green_background'
    }
  },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '⚙️ How It Works' } }], color: 'purple' }
  },
  {
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ text: { content: 'User clicks the Orb → State: "listening"' } }] }
  },
  {
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ text: { content: 'User types or speaks → Industry keywords detected' } }] }
  },
  {
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ text: { content: 'State: "thinking" → Keyword matching runs' } }] }
  },
  {
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ text: { content: 'Industry detected → State: "detected"' } }] }
  },
  {
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ text: { content: 'Orb color morphs → Entire UI adapts to industry' } }] }
  },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🎯 The 5 States' } }], color: 'blue' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Idle - Gentle pulsing, waiting for interaction' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Listening - Active pulsing, mic icon, ready for input' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Thinking - Rotating animation, processing input' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Responding - Steady glow, showing response' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Detected - Celebration pulse, industry confirmed' } }] } },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '💻 Implementation' } }], color: 'pink' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'File: components/ai-orb/AIOrb.tsx (367 lines)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Framer Motion for all animations' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Zustand store for industry state' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'CSS variables for dynamic colors' } }] } },
];

// ============================================================
// KNOWLEDGE PAGE 3: Vertical Morphing Engine
// ============================================================
const page3_VerticalMorphing = [
  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🎈 Simple Explanation (ELI5)' } }], color: 'orange' }
  },
  {
    type: 'callout',
    callout: {
      icon: { emoji: '💡' },
      color: 'yellow_background',
      rich_text: [{ text: { content: 'When you tell PremiumRadar "I work in banking", the whole website transforms - colors turn blue, icons show bank symbols, and features change to banking-specific ones. It\'s like having 8 different websites that magically appear based on who you are.' } }]
    }
  },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🌍 Real-World Analogy' } }], color: 'green' }
  },
  {
    type: 'quote',
    quote: {
      rich_text: [{ text: { content: 'Like a chameleon that changes color based on its environment. Or a smart TV that changes its interface when different family members log in - kids see cartoons, adults see news, gamers see the game library. The platform adapts to YOU.' } }],
      color: 'green_background'
    }
  },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🎯 The 8 Industries' } }], color: 'blue' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '🏦 Banking & Finance → Blue (#1e40af)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '🏥 Healthcare → Green (#059669)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '💻 Technology → Purple (#7c3aed)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '🛒 Retail & E-Commerce → Red (#dc2626)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '🏭 Manufacturing → Orange (#d97706)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '🏢 Real Estate → Cyan (#0891b2)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '💼 Professional Services → Indigo (#4f46e5)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '🌐 General → Blue (#3b82f6)' } }] } },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '⚙️ What Morphs' } }], color: 'purple' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Primary & secondary colors' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Icons and visual elements' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Taglines and copy' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Feature lists and use cases' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Demo prompts in chat' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'AI response content' } }] } },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '💻 Implementation' } }], color: 'pink' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'File: lib/stores/industry-store.ts (231 lines)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'INDUSTRY_CONFIGS: Object with all 8 industry configs' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'detectFromInput(): Keyword-based industry detection' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'getIndustryConfig(): Returns config for any industry' } }] } },
];

// ============================================================
// KNOWLEDGE PAGE 4: Demo-Before-Signup Architecture
// ============================================================
const page4_DemoFirst = [
  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🎈 Simple Explanation (ELI5)' } }], color: 'orange' }
  },
  {
    type: 'callout',
    callout: {
      icon: { emoji: '💡' },
      color: 'yellow_background',
      rich_text: [{ text: { content: 'Most SaaS products make you sign up before you can try anything. PremiumRadar is different - you can chat with the AI, see how it works, and experience value BEFORE entering your email. Like test-driving a car before buying.' } }]
    }
  },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🌍 Real-World Analogy' } }], color: 'green' }
  },
  {
    type: 'quote',
    quote: {
      rich_text: [{ text: { content: 'Like Costco giving you food samples before you buy. Or a gym offering a free trial week. You experience the value first, then decide to commit. No pressure, no forms, just value upfront.' } }],
      color: 'green_background'
    }
  },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '⚙️ How It Works' } }], color: 'purple' }
  },
  {
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ text: { content: 'User lands on page → AI Orb greets them' } }] }
  },
  {
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ text: { content: 'Click Orb → Chat interface opens' } }] }
  },
  {
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ text: { content: 'User interacts → Mock AI responds with industry insights' } }] }
  },
  {
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ text: { content: 'User sees value → Decides to sign up' } }] }
  },
  {
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ text: { content: 'Sign up → Full dashboard access' } }] }
  },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '❓ Why This Matters' } }], color: 'red' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Reduces friction: No signup wall before value' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Builds trust: User sees what they\'re getting' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Higher conversion: Only interested users sign up' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Better retention: Users who sign up already understand the product' } }] } },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '💻 Implementation' } }], color: 'pink' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'ChatInterface: Floating bottom sheet (components/chat/)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'QuickIntentCards: Industry-specific demo prompts' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'MockAI: Contextual responses (lib/utils/mock-ai.ts)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'No auth required on landing page' } }] } },
];

// ============================================================
// KNOWLEDGE PAGE 5: SaaS Shell & Dashboard
// ============================================================
const page5_SaaSShell = [
  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🎈 Simple Explanation (ELI5)' } }], color: 'orange' }
  },
  {
    type: 'callout',
    callout: {
      icon: { emoji: '💡' },
      color: 'yellow_background',
      rich_text: [{ text: { content: 'After you sign up, you enter the "office" - a dashboard with a sidebar menu, header with your profile, and a main area showing your competitive intelligence. It\'s like Gmail or Slack - a familiar layout where everything has its place.' } }]
    }
  },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🌍 Real-World Analogy' } }], color: 'green' }
  },
  {
    type: 'quote',
    quote: {
      rich_text: [{ text: { content: 'Like walking into your office. There\'s a reception desk (header), hallways to different rooms (sidebar), and your main workspace (content area). The workspace drawer is like a filing cabinet you can slide open when you need to switch projects.' } }],
      color: 'green_background'
    }
  },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '🏗️ Components' } }], color: 'purple' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'AppShell: Main layout wrapper' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Sidebar: Navigation (collapsible, responsive)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'AppHeader: Search, notifications, user menu' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Dashboard: Stats, AI insights, activity table' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'WorkspaceDrawer: Multi-tenant workspace switching' } }] } },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '📊 Dashboard Features' } }], color: 'blue' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Stats Cards: KPIs with trend indicators (up/down arrows)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'AI Insights Panel: Priority-based intelligence alerts' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Activity Table: Recent competitor movements' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Industry Theming: Colors match detected industry' } }] } },

  {
    type: 'heading_2',
    heading_2: { rich_text: [{ text: { content: '💻 Implementation' } }], color: 'pink' }
  },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'components/shell/AppShell.tsx (75 lines)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'components/shell/Sidebar.tsx (175 lines)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'components/shell/AppHeader.tsx (195 lines)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'app/dashboard/page.tsx (215 lines)' } }] } },
  { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'components/dashboard/WorkspaceDrawer.tsx (185 lines)' } }] } },
];

// ============================================================
// MAIN EXECUTION
// ============================================================
async function main() {
  console.log('='.repeat(60));
  console.log('CREATING KNOWLEDGE PAGES (5 Learning Topics)');
  console.log('='.repeat(60));
  console.log('');

  // First, clear any existing content on the main Knowledge Page
  console.log('Step 1: Clearing main Knowledge Page...');
  const existingChildren = await notion.blocks.children.list({
    block_id: KNOWLEDGE_PAGE_ID,
    page_size: 100
  });
  for (const block of existingChildren.results) {
    try {
      await notion.blocks.delete({ block_id: block.id });
    } catch (e) {
      // Ignore
    }
  }
  console.log('  ✓ Cleared\n');

  // Create the 5 knowledge pages
  console.log('Step 2: Creating Knowledge Pages...\n');

  await createKnowledgePage('What is PremiumRadar?', '🚀', page1_WhatIsPremiumRadar);
  await createKnowledgePage('The AI Orb Interaction Model', '🔮', page2_AIOrb);
  await createKnowledgePage('Vertical Morphing Engine', '🎨', page3_VerticalMorphing);
  await createKnowledgePage('Demo-Before-Signup Architecture', '🎯', page4_DemoFirst);
  await createKnowledgePage('SaaS Shell & Dashboard', '🏠', page5_SaaSShell);

  console.log('');
  console.log('='.repeat(60));
  console.log('KNOWLEDGE PAGES CREATED');
  console.log('='.repeat(60));
  console.log('');
  console.log('5 Learning Topics:');
  console.log('  1. 🚀 What is PremiumRadar? (Product Overview)');
  console.log('  2. 🔮 The AI Orb Interaction Model (Sprint 1)');
  console.log('  3. 🎨 Vertical Morphing Engine (Sprint 1)');
  console.log('  4. 🎯 Demo-Before-Signup Architecture (Sprint 2)');
  console.log('  5. 🏠 SaaS Shell & Dashboard (Sprint 3-4)');
  console.log('');
  console.log('Each page has: ELI5 + Analogy + Technical + Implementation');
}

main().catch(console.error);
