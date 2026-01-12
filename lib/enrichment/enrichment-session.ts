/**
 * Enrichment Session Manager - S396
 *
 * ENRICHMENT IS A PROGRESSIVE, EVIDENCE-BOUND SYSTEM.
 * NOT A ONE-SHOT PROVIDER FETCH.
 *
 * RULES (LOCKED):
 * - Every enrichment creates a session (auditability)
 * - Raw provider data stored as evidence, never sent to UI
 * - Contacts scored via QTLE, not raw provider scores
 * - Provider-agnostic: Apollo is a source, not the engine
 *
 * STAGES:
 * - CONTACT_DISCOVERY_STARTED
 * - CONTACT_DISCOVERY_COMPLETE
 * - SCORING_STARTED
 * - SCORING_COMPLETE
 * - FAILED
 */

// =============================================================================
// TYPES
// =============================================================================

export type EnrichmentStage =
  | 'CONTACT_DISCOVERY_STARTED'
  | 'CONTACT_DISCOVERY_COMPLETE'
  | 'SCORING_STARTED'
  | 'SCORING_COMPLETE'
  | 'FAILED';

export interface EnrichmentSession {
  id: string;
  entityId: string;           // The company being enriched
  entityName: string;
  userId: string;
  tenantId: string;
  workspaceId: string;
  stage: EnrichmentStage;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  // Metrics
  contactsFound: number;
  contactsScored: number;
  providerCalls: number;
  totalCostCents: number;
}

export interface EnrichmentEvidence {
  id: string;
  sessionId: string;
  source: 'apollo' | 'linkedin' | 'clearbit' | 'manual';
  entityType: 'contact' | 'company' | 'signal';
  rawPayload: unknown;        // Never sent to UI
  normalizedData: unknown;    // Cleaned, normalized version
  createdAt: Date;
}

export interface ScoredContact {
  id: string;
  sessionId: string;
  // Identity
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  phone?: string;
  // Classification
  role: 'decision_maker' | 'influencer' | 'champion' | 'end_user';
  seniority: 'c_suite' | 'vp' | 'director' | 'manager' | 'individual';
  department: string;
  // Scoring
  qtleScore: number;          // 0-100
  scoreBreakdown: {
    quality: number;          // Data completeness
    timing: number;           // Freshness/relevance
    likelihood: number;       // Conversion probability
    engagement: number;       // Engagement potential
  };
  // Priority
  priority: 'primary' | 'secondary' | 'tertiary';
  priorityRank: number;       // 1, 2, 3...
  // Explanation
  whyRecommended: string;
  confidence: 'high' | 'medium' | 'low';
  // Source tracking
  sourceProvider: string;
  sourceId: string;
}

// =============================================================================
// SESSION MANAGEMENT (In-Memory for now, DB later)
// =============================================================================

const sessions = new Map<string, EnrichmentSession>();
const evidence = new Map<string, EnrichmentEvidence[]>();
const contacts = new Map<string, ScoredContact[]>();

/**
 * Create a new enrichment session
 */
export function createSession(params: {
  entityId: string;
  entityName: string;
  userId: string;
  tenantId: string;
  workspaceId: string;
}): EnrichmentSession {
  const session: EnrichmentSession = {
    id: `enr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    entityId: params.entityId,
    entityName: params.entityName,
    userId: params.userId,
    tenantId: params.tenantId,
    workspaceId: params.workspaceId,
    stage: 'CONTACT_DISCOVERY_STARTED',
    startedAt: new Date(),
    contactsFound: 0,
    contactsScored: 0,
    providerCalls: 0,
    totalCostCents: 0,
  };

  sessions.set(session.id, session);
  evidence.set(session.id, []);
  contacts.set(session.id, []);

  console.log('[EnrichmentSession] Created:', session.id, 'for entity:', params.entityName);

  return session;
}

/**
 * Update session stage
 */
export function updateSessionStage(
  sessionId: string,
  stage: EnrichmentStage,
  updates?: Partial<EnrichmentSession>
): EnrichmentSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.stage = stage;
  if (updates) {
    Object.assign(session, updates);
  }
  if (stage === 'SCORING_COMPLETE' || stage === 'FAILED') {
    session.completedAt = new Date();
  }

  console.log('[EnrichmentSession] Updated:', sessionId, '→', stage);

  return session;
}

/**
 * Store evidence from provider
 */
export function storeEvidence(params: {
  sessionId: string;
  source: EnrichmentEvidence['source'];
  entityType: EnrichmentEvidence['entityType'];
  rawPayload: unknown;
  normalizedData: unknown;
}): EnrichmentEvidence {
  const ev: EnrichmentEvidence = {
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sessionId: params.sessionId,
    source: params.source,
    entityType: params.entityType,
    rawPayload: params.rawPayload,
    normalizedData: params.normalizedData,
    createdAt: new Date(),
  };

  const sessionEvidence = evidence.get(params.sessionId) || [];
  sessionEvidence.push(ev);
  evidence.set(params.sessionId, sessionEvidence);

  // Update session metrics
  const session = sessions.get(params.sessionId);
  if (session) {
    session.providerCalls++;
  }

  console.log('[EnrichmentSession] Evidence stored:', ev.id, 'source:', params.source);

  return ev;
}

/**
 * Store scored contacts
 */
export function storeScoredContacts(
  sessionId: string,
  scoredContacts: ScoredContact[]
): void {
  contacts.set(sessionId, scoredContacts);

  // Update session metrics
  const session = sessions.get(sessionId);
  if (session) {
    session.contactsFound = scoredContacts.length;
    session.contactsScored = scoredContacts.length;
  }

  console.log('[EnrichmentSession] Stored', scoredContacts.length, 'scored contacts');
}

/**
 * Get session by ID
 */
export function getSession(sessionId: string): EnrichmentSession | null {
  return sessions.get(sessionId) || null;
}

/**
 * Get scored contacts for session
 */
export function getSessionContacts(sessionId: string): ScoredContact[] {
  return contacts.get(sessionId) || [];
}

/**
 * Get session by entity (for resuming)
 */
export function getSessionByEntity(entityId: string): EnrichmentSession | null {
  for (const session of sessions.values()) {
    if (session.entityId === entityId && session.stage !== 'FAILED') {
      return session;
    }
  }
  return null;
}
