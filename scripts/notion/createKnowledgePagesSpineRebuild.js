#!/usr/bin/env node
/**
 * Knowledge Pages - Stream 11 User Journey Spine Rebuild (S31-S36)
 * Creates 8 sub-pages under Knowledge Page following SKC learning format
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const KNOWLEDGE_PAGE_ID = 'f1552250-cafc-4f5f-90b0-edc8419e578b';
const TODAY = new Date().toISOString().split('T')[0];

// Helper functions for block creation
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

const paragraph = (text) => ({
  object: 'block',
  type: 'paragraph',
  paragraph: {
    rich_text: [{ type: 'text', text: { content: text } }],
  },
});

const bullet = (text) => ({
  object: 'block',
  type: 'bulleted_list_item',
  bulleted_list_item: {
    rich_text: [{ type: 'text', text: { content: text } }],
  },
});

const divider = () => ({
  object: 'block',
  type: 'divider',
  divider: {},
});

// Knowledge Pages to create
const KNOWLEDGE_PAGES = [
  {
    emoji: '🔐',
    title: 'AI-First Authentication (S31)',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "When you log into PremiumRadar, you don't see a boring white form. Instead, you're greeted by a beautiful dark screen with floating lights and glowing input fields. It looks like you're entering a spaceship cockpit, not a software product. The buttons glow when you hover, and the whole thing feels alive.",
        '💡'
      ),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "Imagine checking into a luxury hotel. Traditional SaaS login is like a budget motel lobby - fluorescent lights, plastic chairs, a bored clerk. PremiumRadar's AI-First Auth is like entering the Burj Al Arab - dimmed ambient lighting, subtle music, a concierge who greets you by name, everything designed to make you feel important before you've even reached your room."
      ),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'The auth system uses SIVAAuthFrame as the container - a full-screen component with animated neural mesh background (same as SIVA Surface). AnimatedInput provides magnetic focus effects using Framer Motion - when you click an input, the label floats up, a glow appears around the field, and a subtle line animates at the bottom. AuthScaffold handles the social login buttons (Google, Microsoft, GitHub) with 2030 styling and provides the layout structure shared between login and signup.'
      ),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('SIVAAuthFrame.tsx - Neural mesh background container'),
      bullet('AnimatedInput.tsx - Magnetic focus with floating labels'),
      bullet('AuthScaffold.tsx - Social login + form structure'),
      bullet('SIVALoginPage.tsx - Complete login flow'),
      bullet('SIVASignupPage.tsx - Complete signup with password validation'),
      bullet('Routes: /login, /signup, /register'),
    ],
  },
  {
    emoji: '👋',
    title: 'SIVA Greeting System (S32)',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "After you sign up, SIVA (our AI) personally welcomes you. You see a glowing orb and text that types itself out letter by letter: 'Hello... I'm SIVA... Your AI Intelligence Partner...' It's like the AI is actually talking to you, not just showing you a form to fill out.",
        '💡'
      ),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "It's like the difference between walking into an empty store vs. being greeted by a friendly shop owner who says 'Welcome! I'm here to help you find exactly what you need.' The typewriter effect creates anticipation - you're watching SIVA 'speak' to you in real-time, which builds an emotional connection before you've done anything."
      ),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'SIVAGreeting uses a phased typewriter effect - it cycles through 5 messages, revealing each character by character (50ms per char), pausing 1 second between messages. The effect is achieved with useEffect and setInterval, with phase state tracking which message is being typed. Once all messages complete, the "Let\'s begin" button fades in. The greeting orb pulses continuously with scale and boxShadow animations.'
      ),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('SIVAGreeting.tsx - Typewriter animation component'),
      bullet('IdentityForm.tsx - Name, role, region capture'),
      bullet('OnboardingFrame.tsx - Shared progress indicator'),
      bullet('onboarding-store.ts - Zustand store with persist'),
      bullet('Route: /onboarding/welcome'),
    ],
  },
  {
    emoji: '🏢',
    title: 'Workspace Creation UX (S33)',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "Instead of asking you to fill out a form with 'Workspace Name: ____', SIVA asks you conversationally: 'What shall we name your workspace?' First, you pick if it's for just you (Personal) or your team (Organization) by clicking on big beautiful cards. Then you type a name and it saves.",
        '💡'
      ),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "Traditional workspace creation is like filling out a government form - check boxes, text fields, submit button. Our approach is like an architect meeting: 'So, are you building this for yourself or for your whole company? Great! What should we call this project?' The conversation makes a boring admin task feel like creative collaboration."
      ),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'WorkspaceCreator uses a two-phase UX pattern: Phase 1 shows two large cards (Personal vs Organization) with icons, descriptions, and selection animations. Once selected, Phase 2 slides in with the naming input. For personal workspaces, it auto-suggests "[Name]\'s Workspace" based on the profile captured earlier. The workspace is saved to the onboarding store with a UUID, type, and timestamp.'
      ),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('WorkspaceCreator.tsx - Two-phase flow component'),
      bullet('Phase 1: Type selection with magnetic card hover'),
      bullet('Phase 2: Name input with auto-suggestion'),
      bullet('Workspace stored: { id, name, type, createdAt }'),
      bullet('Route: /onboarding/workspace'),
    ],
  },
  {
    emoji: '🏦',
    title: 'Industry Vertical Selection (S34)',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "You pick which industry you work in - Banking, FinTech, Insurance, Real Estate, or Consulting. But instead of a boring dropdown, you see a beautiful grid of cards. When you hover or select one, SIVA explains what intelligence it will load for you: 'I\'ll help you identify banks ready for digital transformation...'",
        '💡'
      ),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "It's like going to a specialty restaurant that changes its entire menu based on what you order. Tell them you want seafood, and the chef explains 'I\'ll prepare fresh catches with techniques from the Mediterranean.' Choose steak, and they describe their aging process. The industry selection doesn't just categorize you - it customizes SIVA's entire personality and capabilities for your world."
      ),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'VerticalSelector renders a responsive grid of 5 industry cards, each with its own color scheme (Banking: blue #1e40af, FinTech: purple #7c3aed, etc.). On hover/select, an explainer panel appears with the SIVA message, description, and signal badges (e.g., "Core banking modernization", "Open banking APIs"). The selected vertical is stored and will be used in the transition sequence to show industry-specific loading steps.'
      ),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('VerticalSelector.tsx - Cinematic selection grid'),
      bullet('5 verticals with custom colors and signals'),
      bullet('Hover explainer with SIVA messaging'),
      bullet('Signal badges show what intelligence loads'),
      bullet('Route: /onboarding/vertical'),
    ],
  },
  {
    emoji: '🚀',
    title: 'Cinematic Transition Sequence (S35)',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "After you pick your industry, you don't just get dumped into the dashboard. Instead, you see a beautiful loading screen that says 'Configuring your intelligence layer...' with progress bars that show SIVA actually loading things specific to your industry. When it's done, SIVA asks 'Ready to begin?' with a glowing button.",
        '💡'
      ),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "Imagine buying a new Tesla. Instead of just handing you the keys, they walk you through a personalized delivery experience - 'We\'re configuring your seats to your saved preferences... Loading your music... Setting up your driving profile...' The waiting becomes exciting because you see the car becoming YOURS. That's what our transition does - you watch SIVA become specifically tuned for YOUR industry."
      ),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'TransitionSequence shows 4 vertical-specific loading steps (e.g., for Banking: "Connecting to banking intelligence network", "Loading digital transformation signals", "Configuring regulatory intelligence", "Training SIVA on banking context"). Each step has an icon, progress bar, and timed duration (1-2 seconds each). The overall progress is tracked and when complete, a "Ready to begin" button appears with a pulsing glow animation. Clicking it calls completeOnboarding() and redirects to /dashboard.'
      ),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('TransitionSequence.tsx - Full-screen loading'),
      bullet('5 vertical-specific step configurations'),
      bullet('Per-step progress bars with timed animations'),
      bullet('Overall progress tracking'),
      bullet('completeOnboarding() marks onboarding done'),
      bullet('Route: /onboarding/transition'),
    ],
  },
  {
    emoji: '🔒',
    title: 'Route Protection Middleware (S36)',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "Once you start onboarding, you can't skip steps. If you try to go directly to /dashboard without finishing onboarding, the system automatically sends you back to wherever you left off. It's like a security guard who politely redirects you: 'I see you haven't finished step 3. Let me take you there.'",
        '💡'
      ),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "It's like airport security. You can't just skip passport control and go to the gate. But unlike frustrating airport security, our middleware is smart - it knows exactly where you were and takes you directly there. It's protection that helps you, not blocks you."
      ),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'Next.js middleware runs on every request before the page loads. It reads the onboarding cookie (persisted by Zustand), checks isComplete and currentStep, then applies routing rules: 1) Dashboard routes check onboarding completion, 2) Onboarding routes check if already complete (redirect to dashboard), 3) Auth routes check if already onboarded. The middleware exports a config matcher to only run on page routes, not API/static.'
      ),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('middleware.ts - Next.js Edge Middleware'),
      bullet('Reads premiumradar-onboarding cookie'),
      bullet('Checks isComplete, currentStep, startedAt'),
      bullet('Redirects to correct onboarding step if incomplete'),
      bullet('Config matcher excludes API and static files'),
    ],
  },
  {
    emoji: '🎨',
    title: 'Neural Mesh Design System (S31-S36)',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "Every screen in the onboarding looks like it belongs to the same product. Same dark background (slate-950), same floating colorful blobs, same glowing effects. When you move from Login to Welcome to Workspace to Dashboard, it feels like one continuous experience - like walking through rooms of the same building, not jumping between different apps.",
        '💡'
      ),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "Think of a high-end spa. From the moment you enter the lobby, through the changing rooms, to the treatment areas, to the relaxation lounge - everything uses the same calming colors, same scent, same style of furniture. You never feel jarred by a sudden change. Our Neural Mesh Design System is that consistent atmosphere applied to software."
      ),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'The design system uses: 1) Background: Always slate-950 with gradient orbs using industryConfig.primaryColor/secondaryColor at 10-15% opacity, 2) Cards: bg-white/5 or bg-white/10 with border-white/10, 3) Typography: Inter font, text-white for headers, text-gray-400 for descriptions, text-gray-500 for secondary, 4) Motion: Framer Motion with duration 0.2-0.5s, easeOut/easeInOut, 5) Orbs: Animated with scale and position keyframes over 8-15 seconds.'
      ),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('SIVAAuthFrame, OnboardingFrame - Neural mesh containers'),
      bullet('All surfaces use industryConfig for colors'),
      bullet('Consistent padding: px-4/8, py-4/8'),
      bullet('Consistent motion: Framer Motion defaults'),
      bullet('8 surfaces verified for zero design discontinuity'),
    ],
  },
  {
    emoji: '📊',
    title: 'Onboarding State Management (S32-S35)',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        "Everything you do during onboarding - your name, your role, your workspace name, your industry - gets saved automatically. If you close the browser and come back later, you pick up exactly where you left off. Nothing is lost, and you never have to re-enter information.",
        '💡'
      ),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        "It's like a hotel that remembers everything about you across visits. You checked in once and mentioned you like a firm pillow? Next visit, firm pillow is already on your bed. You prefer a high floor? They always book you there. Our onboarding store is that hotel concierge's legendary memory - but for your product setup."
      ),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'onboarding-store.ts uses Zustand with the persist middleware, which automatically serializes state to localStorage under key "premiumradar-onboarding". The store tracks: currentStep (where you are), completedSteps (what you\'ve finished), profile (name, role, region), workspace (id, name, type), selectedVertical (industry), and isComplete (boolean). Helper functions like getNextStep() and isStepAccessible() enable the progress UI and middleware logic.'
      ),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/stores/onboarding-store.ts - Zustand + persist'),
      bullet('5 step types: welcome, identity, workspace, vertical, transition'),
      bullet('Profile: { name, email, role, region }'),
      bullet('Workspace: { id, name, type, createdAt }'),
      bullet('Persisted to localStorage, survives browser close'),
    ],
  },
];

async function createKnowledgePage(pageConfig) {
  console.log(`Creating: ${pageConfig.emoji} ${pageConfig.title}...`);

  try {
    const page = await notion.pages.create({
      parent: { page_id: KNOWLEDGE_PAGE_ID },
      icon: { emoji: pageConfig.emoji },
      properties: {
        title: {
          title: [
            {
              text: {
                content: `${pageConfig.title} (Updated: ${TODAY})`,
              },
            },
          ],
        },
      },
      children: pageConfig.blocks,
    });

    console.log(`  ✓ Created: ${page.id}`);
    return page;
  } catch (error) {
    console.error(`  ✗ Failed:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Knowledge Page Update - Stream 11 Spine Rebuild (S31-S36)');
  console.log('  Creating 8 learning sub-pages');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const pageConfig of KNOWLEDGE_PAGES) {
    await createKnowledgePage(pageConfig);
    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ KNOWLEDGE PAGE UPDATE COMPLETE');
  console.log(`  Created ${KNOWLEDGE_PAGES.length} sub-pages`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('Pages created:');
  KNOWLEDGE_PAGES.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.emoji} ${p.title} (Updated: ${TODAY})`);
  });
}

main().catch(console.error);
