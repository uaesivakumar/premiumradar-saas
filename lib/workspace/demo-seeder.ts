/**
 * Demo Seeder - S378: Demo Hardening
 *
 * Seeds realistic demo data for workspace demonstration.
 *
 * DEMO SCENARIOS:
 * 1. Fresh workspace with NBA and signals
 * 2. Active pipeline with saved leads
 * 3. Decision recall demonstration
 */

import { useCardStore } from '@/lib/stores/card-store';
import { getExpiryTime } from './ttl-engine';
import { Card, CardAction } from './card-state';

// =============================================================================
// DEMO SCENARIOS
// =============================================================================

export type DemoScenario =
  | 'fresh'           // Fresh workspace, just starting
  | 'active_pipeline' // Active pipeline with saved leads
  | 'recall_demo'     // Demo showing decision recall
  | 'silent_day';     // No signals today (silence state)

// =============================================================================
// DEMO COMPANIES
// =============================================================================

const DEMO_COMPANIES = {
  // High-quality leads
  highQuality: [
    {
      name: 'TechCorp DMCC',
      id: 'demo-techcorp-001',
      signal: 'Hiring 50+ employees in Dubai (hiring-expansion)',
      score: 92,
      reason: 'Rapid headcount growth matches employee banking target profile',
    },
    {
      name: 'FinTech Solutions Ltd',
      id: 'demo-fintech-002',
      signal: 'Series B funding announced ($25M)',
      score: 88,
      reason: 'Fresh capital indicates treasury and corporate banking needs',
    },
    {
      name: 'Gulf Manufacturing Co',
      id: 'demo-gulf-003',
      signal: 'New factory opening in Jebel Ali',
      score: 85,
      reason: 'Facility expansion signals payroll scaling opportunity',
    },
  ],
  // Medium-quality leads
  mediumQuality: [
    {
      name: 'StartupXYZ',
      id: 'demo-startup-004',
      signal: 'Seed funding ($2M)',
      score: 68,
      reason: 'Early-stage, may not have immediate banking needs',
    },
    {
      name: 'Regional Trading LLC',
      id: 'demo-trading-005',
      signal: 'Hiring 10 employees',
      score: 62,
      reason: 'Moderate growth, existing bank relationship likely',
    },
  ],
  // Already contacted/rejected
  past: [
    {
      name: 'OldClient Corp',
      id: 'demo-oldclient-006',
      decision: 'reject',
      reason: 'Recently switched to ADCB, not open to change',
      decisionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
    {
      name: 'SavedLead Inc',
      id: 'demo-savedlead-007',
      decision: 'save',
      reason: 'Strong fit, waiting for Q2 budget approval',
      decisionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  ],
};

// =============================================================================
// CARD GENERATORS
// =============================================================================

function createDemoNBACard(): Omit<Card, 'id' | 'createdAt' | 'status'> {
  const lead = DEMO_COMPANIES.highQuality[0];

  return {
    type: 'nba',
    priority: 1000,
    title: `Contact ${lead.name}`,
    summary: `${lead.signal}. High confidence (${lead.score}%). Reach out before competitors.`,
    expandedContent: {
      companyName: lead.name,
      signal: lead.signal,
      score: lead.score,
      reasoning: lead.reason,
      contacts: [
        { name: 'Ahmed Al-Rashid', role: 'CFO', email: 'ahmed@techcorp.ae' },
        { name: 'Sara Khan', role: 'HR Director', email: 'sara@techcorp.ae' },
      ],
    },
    expiresAt: getExpiryTime('nba'),
    sourceType: 'nba',
    entityId: lead.id,
    entityName: lead.name,
    entityType: 'company',
    reasoning: [lead.reason],
    actions: [
      { id: 'pursue', label: 'Pursue', type: 'primary', handler: 'nba.execute' },
      { id: 'defer', label: 'Defer', type: 'secondary', handler: 'nba.defer' },
      { id: 'dismiss', label: 'Not Now', type: 'dismiss', handler: 'nba.dismiss' },
    ],
    tags: ['nba', 'high-priority'],
  };
}

function createDemoSignalCards(): Omit<Card, 'id' | 'createdAt' | 'status'>[] {
  const highQualityCards = DEMO_COMPANIES.highQuality.slice(1).map((lead, index) => ({
    type: 'signal' as const,
    priority: 800 - index * 50,
    title: lead.name,
    summary: lead.signal,
    expandedContent: {
      score: lead.score,
      reasoning: lead.reason,
    },
    expiresAt: getExpiryTime('signal'),
    sourceType: 'signal' as const,
    entityId: lead.id,
    entityName: lead.name,
    entityType: 'company' as const,
    reasoning: [lead.reason],
    actions: [
      { id: 'evaluate', label: 'Evaluate', type: 'primary' as const, handler: 'signal.evaluate' },
      { id: 'save', label: 'Save', type: 'secondary' as const, handler: 'signal.save' },
      { id: 'dismiss', label: 'Not Interested', type: 'dismiss' as const, handler: 'signal.dismiss' },
    ] as CardAction[],
    tags: ['signal', `score-${lead.score}`],
  }));

  const mediumQualityCards = DEMO_COMPANIES.mediumQuality.map((lead, index) => ({
    type: 'signal' as const,
    priority: 500 - index * 50,
    title: lead.name,
    summary: lead.signal,
    expandedContent: {
      score: lead.score,
      reasoning: lead.reason,
    },
    expiresAt: getExpiryTime('signal'),
    sourceType: 'signal' as const,
    entityId: lead.id,
    entityName: lead.name,
    entityType: 'company' as const,
    reasoning: [lead.reason],
    actions: [
      { id: 'evaluate', label: 'Evaluate', type: 'primary' as const, handler: 'signal.evaluate' },
      { id: 'dismiss', label: 'Skip', type: 'dismiss' as const, handler: 'signal.dismiss' },
    ] as CardAction[],
    tags: ['signal', 'borderline', `score-${lead.score}`],
  }));

  return [...highQualityCards, ...mediumQualityCards];
}

function createDemoSavedLeadCards(): Omit<Card, 'id' | 'createdAt' | 'status'>[] {
  return [
    {
      type: 'decision' as const,
      priority: 600,
      title: 'SavedLead Inc',
      summary: 'Saved for follow-up. Waiting for Q2 budget approval.',
      expiresAt: null, // Decisions never expire
      sourceType: 'decision' as const,
      entityId: 'demo-savedlead-007',
      entityName: 'SavedLead Inc',
      entityType: 'company' as const,
      actions: [
        { id: 'follow-up', label: 'Follow Up Now', type: 'primary' as const, handler: 'decision.followUp' },
        { id: 'view', label: 'View Details', type: 'secondary' as const, handler: 'decision.view' },
      ] as CardAction[],
      tags: ['saved', 'follow-up'],
    },
  ];
}

function createDemoRecallCards(): Omit<Card, 'id' | 'createdAt' | 'status'>[] {
  return DEMO_COMPANIES.past.map((company) => ({
    type: 'recall' as const,
    priority: 300,
    title: `Previous: ${company.name}`,
    summary: `${company.decision === 'reject' ? 'Rejected' : 'Saved'}: ${company.reason}`,
    expiresAt: getExpiryTime('recall'),
    sourceType: 'recall' as const,
    entityId: company.id,
    entityName: company.name,
    entityType: 'company' as const,
    actions: [
      { id: 're-evaluate', label: 'Re-evaluate', type: 'secondary' as const, handler: 'recall.reEvaluate' },
      { id: 'dismiss', label: 'Dismiss', type: 'dismiss' as const, handler: 'recall.dismiss' },
    ] as CardAction[],
    tags: ['recall', company.decision],
  }));
}

// =============================================================================
// SEEDER FUNCTIONS
// =============================================================================

/**
 * Seed workspace with demo data for a specific scenario
 */
export function seedDemoData(scenario: DemoScenario): void {
  const store = useCardStore.getState();

  // Clear existing cards
  store.clear();

  console.log(`[DemoSeeder] Seeding scenario: ${scenario}`);

  switch (scenario) {
    case 'fresh':
      // Fresh workspace: NBA + 2-3 signals
      store.addCard(createDemoNBACard());
      createDemoSignalCards().slice(0, 3).forEach((card) => store.addCard(card));
      break;

    case 'active_pipeline':
      // Active pipeline: NBA + signals + saved leads
      store.addCard(createDemoNBACard());
      createDemoSignalCards().forEach((card) => store.addCard(card));
      createDemoSavedLeadCards().forEach((card) => store.addCard(card));
      break;

    case 'recall_demo':
      // Recall demo: Past decisions + current NBA
      store.addCard(createDemoNBACard());
      createDemoRecallCards().forEach((card) => store.addCard(card));
      break;

    case 'silent_day':
      // Silent day: No cards (system shows "No new signals")
      // Just clear - no cards added
      break;
  }

  console.log(`[DemoSeeder] Seeded ${store.cards.length} cards`);
}

/**
 * Get available demo scenarios
 */
export function getDemoScenarios(): { key: DemoScenario; label: string; description: string }[] {
  return [
    {
      key: 'fresh',
      label: 'Fresh Start',
      description: 'New workspace with NBA and a few signals',
    },
    {
      key: 'active_pipeline',
      label: 'Active Pipeline',
      description: 'Working pipeline with saved leads and follow-ups',
    },
    {
      key: 'recall_demo',
      label: 'Decision Recall',
      description: 'Demonstrates past decision recall',
    },
    {
      key: 'silent_day',
      label: 'Silent Day',
      description: 'No new signals (shows silence state)',
    },
  ];
}

/**
 * Check if demo data is currently seeded
 */
export function isDemoSeeded(): boolean {
  const cards = useCardStore.getState().cards;
  return cards.some((card) => card.entityId?.startsWith('demo-'));
}

/**
 * Clear demo data
 */
export function clearDemoData(): void {
  useCardStore.getState().clear();
  console.log('[DemoSeeder] Demo data cleared');
}
