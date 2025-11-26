/**
 * Create Knowledge Pages for Stream 13: SIVA Intelligence & Routing Layer
 *
 * Topics:
 * 1. Intent Classification & NLP Kernel (S43)
 * 2. Evidence-Based Reasoning (S44)
 * 3. Multi-Agent Orchestration (S45)
 * 4. Live Objects & Threading (S46)
 * 5. Persona & Tone System (S47)
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const KNOWLEDGE_PAGE_ID = 'f1552250-cafc-4f5f-90b0-edc8419e578b';
const TODAY = new Date().toISOString().split('T')[0];

// Block Helpers
const coloredHeading = (text, color) => ({
  object: 'block',
  type: 'heading_2',
  heading_2: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: color
  }
});

const yellowCallout = (text, emoji = '💡') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji },
    color: 'yellow_background'
  }
});

const greenQuote = (text) => ({
  object: 'block',
  type: 'quote',
  quote: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: 'green_background'
  }
});

const paragraph = (text) => ({
  object: 'block',
  type: 'paragraph',
  paragraph: {
    rich_text: [{ type: 'text', text: { content: text } }]
  }
});

const bullet = (text) => ({
  object: 'block',
  type: 'bulleted_list_item',
  bulleted_list_item: {
    rich_text: [{ type: 'text', text: { content: text } }]
  }
});

const divider = () => ({
  object: 'block',
  type: 'divider',
  divider: {}
});

// Knowledge Pages Data
const KNOWLEDGE_PAGES = [
  {
    emoji: '🧠',
    title: `Intent Classification & NLP Kernel (Updated: ${TODAY})`,
    eli5: `When you type a question to SIVA, the NLP Kernel figures out WHAT you actually want. It's like a smart translator that understands "find me fintech companies in Dubai" means you want to DISCOVER companies, in the FINTECH sector, located in DUBAI. It breaks down your words into intent (discover), entities (fintech, Dubai), and remembers context so you can say "show me more like that" and it knows what "that" means.`,
    analogy: `Imagine a restaurant waiter who's worked there for 20 years. When you say "the usual but spicier", they know exactly what you mean - your regular order, but with extra chili. The NLP Kernel is that waiter for SIVA. It understands your shorthand, remembers your previous orders (context memory), and translates your casual requests into precise kitchen instructions (normalized queries for agents).`,
    technical: `The Intent Classification system uses a multi-stage pipeline:

1. IntentClassifier: Pattern-based classification matching queries against 20+ intent types (discovery.search, ranking.score, outreach.email, etc.). Returns primary and secondary intents with confidence scores.

2. EntityExtractor: Identifies companies, sectors, regions, signals, and metrics from natural language. Uses pattern matching with span tracking for highlighting.

3. ContextMemory: Maintains conversation history with pronoun resolution. When you say "rank them", it resolves "them" to the companies from your previous query.

4. QueryNormalizer: Transforms free-form text into structured parameters that agents can process directly.`,
    files: [
      'lib/intelligence/intent/IntentClassifier.ts - Pattern-based intent detection',
      'lib/intelligence/intent/EntityExtractor.ts - Entity recognition with span tracking',
      'lib/intelligence/intent/ContextMemory.ts - Conversation memory & pronoun resolution',
      'lib/intelligence/intent/QueryNormalizer.ts - Query to parameters transformation',
      'lib/stores/intent-store.ts - Zustand store for intent state',
      'lib/hooks/useIntentWrapper.ts - React hook for intent processing'
    ]
  },
  {
    emoji: '🔍',
    title: `Evidence-Based Reasoning Engine (Updated: ${TODAY})`,
    eli5: `Instead of SIVA just saying "this company scores 85", the Evidence Engine explains WHY. It collects proof (signals, news, metrics), chains that proof together through a 5-stage reasoning process, and justifies each part of the score. So you see "85 because: recent $50M funding (Timing +15), UAE expansion announced (Location +20), matches your ICP (Quality +30)".`,
    analogy: `Think of a detective building a case. They don't just say "this person is guilty" - they gather evidence (fingerprints, witnesses, footage), filter out irrelevant clues, weigh each piece by reliability, combine them into a coherent story, and then justify their conclusion. The Evidence Engine does this for every recommendation SIVA makes.`,
    technical: `The Evidence Engine implements a 5-stage reasoning chain:

1. GATHER: EvidenceCollector pulls signals from UAE banking templates, news, funding data, tech stack, and leadership changes.

2. FILTER: SignalReasoner removes low-relevance evidence (below threshold) and duplicates.

3. WEIGHT: Each evidence piece is scored by confidence, recency, and source reliability.

4. COMBINE: Weighted evidence is aggregated into component scores.

5. JUSTIFY: ScoreJustifier generates human-readable explanations for Q/T/L/E scores:
   - Q (Quality): ICP fit, revenue, employee count
   - T (Timing): Funding, hiring, expansion signals
   - L (Location): Regional presence, UAE focus
   - E (Engagement): Social signals, news mentions`,
    files: [
      'lib/intelligence/evidence/EvidenceCollector.ts - Signal gathering with UAE templates',
      'lib/intelligence/evidence/SignalReasoner.ts - 5-stage reasoning chain',
      'lib/intelligence/evidence/ScoreJustifier.ts - Q/T/L/E score justification',
      'lib/intelligence/evidence/types.ts - Evidence, ReasoningChain types',
      'lib/stores/evidence-store.ts - Zustand store for evidence state'
    ]
  },
  {
    emoji: '🎭',
    title: `Multi-Agent Orchestration (Updated: ${TODAY})`,
    eli5: `SIVA isn't one AI - it's a team of 5 specialized agents (Discovery, Ranking, Outreach, Enrichment, Demo). The Orchestrator is the team manager who decides WHO handles your request. Simple query? One agent. Complex request? Multiple agents working together, sometimes in parallel (at the same time) or sequential (one after another).`,
    analogy: `Picture a hospital emergency room. A patient arrives and the triage nurse (ToolRouter) quickly assesses: "Broken arm? Orthopedics. Chest pain? Cardiology AND Radiology." Sometimes they send you to one specialist, sometimes multiple work on you simultaneously, sometimes one hands off to another. The Orchestrator is that triage system - routing you to the right specialists in the right order.`,
    technical: `The routing system has three layers:

1. AgentRegistry: Defines capabilities for each agent type:
   - Discovery: Finding companies, filtering, exploring
   - Ranking: Scoring, comparing, prioritizing
   - Outreach: Email/LinkedIn generation, call scripts
   - Enrichment: Company/contact research, tech stack
   - Demo: Help, tutorials, feature demos

2. ToolRouter: Makes routing decisions based on intent:
   - Analyzes primary/secondary intents
   - Checks entity coverage for each agent
   - Calculates confidence scores
   - Determines execution mode (single/parallel/sequential/hybrid)

3. Orchestrator: Executes the plan:
   - Creates execution steps with dependencies
   - Manages parallel groups for concurrent execution
   - Handles fallbacks on errors/timeouts
   - Tracks progress and aggregates results`,
    files: [
      'lib/intelligence/routing/AgentRegistry.ts - Agent capabilities & selection',
      'lib/intelligence/routing/ToolRouter.ts - Intent-based routing decisions',
      'lib/intelligence/routing/Orchestrator.ts - Plan execution & progress',
      'lib/intelligence/routing/types.ts - RoutingDecision, ExecutionStep types',
      'lib/stores/routing-store.ts - Zustand store for routing state'
    ]
  },
  {
    emoji: '📦',
    title: `Live Objects & Threading (Updated: ${TODAY})`,
    eli5: `When SIVA shows you a company card or outreach draft, that's an "Output Object". Live Objects are OUTPUT objects that stay alive - they can update, link to other objects, and have their own conversation threads. You can ask follow-up questions about a specific company card, and SIVA remembers the context of THAT object.`,
    analogy: `Think of a sticky note vs a living document. A sticky note is static - once written, it's done. A living document (like a Google Doc) can be updated, commented on, linked to other docs, and has version history. Live Objects transform SIVA's outputs from sticky notes into living documents that evolve with your conversation.`,
    technical: `The Live Object system extends base OutputObjects with:

1. LiveObjectFactory: Creates enriched objects with:
   - isLive flag for real-time updates
   - updateFrequency for auto-refresh
   - linkedObjects for relationship tracking
   - inspectorData for transparency

2. ThreadManager: Object-centric conversations:
   - createThread: Attach discussions to objects
   - addUserMessage/addAssistantMessage: Build conversation
   - resolveThread/archiveThread: Lifecycle management

3. ObjectInspector: Transparency layer showing:
   - Metadata: Raw data powering the object
   - Signals: Evidence that influenced creation
   - Reasoning: The chain of logic used
   - History: Full audit trail of changes

4. ObjectLinks: Relationship graph:
   - derived_from: Parent-child relationships
   - related_to: Peer associations
   - next_step: Workflow progression`,
    files: [
      'lib/intelligence/objects/LiveObjectFactory.ts - Live object creation & enrichment',
      'lib/intelligence/objects/ThreadManager.ts - Object conversation threads',
      'lib/intelligence/objects/ObjectInspector.ts - Transparency views',
      'lib/intelligence/objects/types.ts - LiveObject, ObjectThread types',
      'lib/stores/object-store.ts - Zustand store for object state'
    ]
  },
  {
    emoji: '🎨',
    title: `Persona & Tone System (Updated: ${TODAY})`,
    eli5: `SIVA can speak in different voices. Professional for formal reports. Friendly for casual chat. Executive for C-suite emails. The Persona System applies consistent personality traits and vocabulary to everything SIVA says, so it sounds like the same person across all interactions - just adjusting formality based on context.`,
    analogy: `Think of a professional actor who can play any role but always brings their unique presence. Whether they're in a comedy or drama, speaking formally or casually, there's something distinctly "them" in every performance. The Persona System is SIVA's acting coach - it ensures SIVA adapts tone to context while maintaining consistent character traits.`,
    technical: `The Persona System has two components:

1. TonePackRegistry: Pre-defined voice profiles:
   - Base tones: professional, friendly, concise, detailed, technical, casual
   - Outreach tones: executive, consultative, challenger, relationship, value-driven
   - Each pack includes vocabulary replacements and style modifiers

2. PersonaEngine: Applies persona to content:
   - applyPersona: Transforms text using tone pack rules
   - calculateToneMetrics: Measures formality, brevity, warmth, technicality
   - suggestTone: Recommends tone based on context (recipient role, urgency, relationship)

Tone application uses cascading rules:
1. Vocabulary replacements (e.g., "utilize" → "use" for concise)
2. Trait modifiers (e.g., add confidence markers for executive)
3. Sentence restructuring (e.g., shorter sentences for concise)
4. Formality adjustment (contractions, hedging language)`,
    files: [
      'lib/intelligence/persona/TonePackRegistry.ts - 6 base + 5 outreach tone packs',
      'lib/intelligence/persona/PersonaEngine.ts - Tone application & metrics',
      'lib/intelligence/persona/types.ts - ToneType, PersonaConfig types',
      'lib/stores/persona-store.ts - Zustand store for persona state',
      'lib/hooks/usePersonaWrapper.ts - React hook for tone control'
    ]
  }
];

async function createKnowledgePages() {
  console.log('Creating Knowledge Pages for Stream 13...\n');

  for (const page of KNOWLEDGE_PAGES) {
    console.log(`Creating: ${page.emoji} ${page.title}...`);

    const children = [
      // ELI5 Section
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(page.eli5, '💡'),
      divider(),

      // Analogy Section
      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(page.analogy),
      divider(),

      // Technical Section
      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(page.technical),
      divider(),

      // Implementation Section
      coloredHeading('🛠️ Implementation Details', 'blue'),
      ...page.files.map(f => bullet(f))
    ];

    await notion.pages.create({
      parent: { page_id: KNOWLEDGE_PAGE_ID },
      icon: { emoji: page.emoji },
      properties: {
        title: { title: [{ text: { content: page.title } }] }
      },
      children: children
    });

    console.log(`  ✅ Created`);
  }

  console.log('\n✅ All Knowledge Pages created!');
  console.log('\n📚 Stream 13 Knowledge Pages:');
  KNOWLEDGE_PAGES.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.emoji} ${p.title}`);
  });
}

createKnowledgePages().catch(console.error);
