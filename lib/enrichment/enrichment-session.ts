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
 *
 * PERSISTENCE (S396 Update):
 * - Sessions and contacts are persisted to PostgreSQL
 * - In-memory cache for fast reads during active enrichment
 * - DB as source of truth for completed sessions
 * - Pay Apollo once, use contacts forever
 */

import * as db from '@/lib/db/enrichment';

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
// IN-MEMORY CACHE (for active enrichment sessions)
// =============================================================================

const sessionsCache = new Map<string, EnrichmentSession>();
const evidenceCache = new Map<string, EnrichmentEvidence[]>();
const contactsCache = new Map<string, ScoredContact[]>();

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Create a new enrichment session
 * Creates in both memory (fast access) and database (persistence)
 */
export async function createSession(params: {
  entityId: string;
  entityName: string;
  userId: string;
  tenantId: string;
  workspaceId: string;
}): Promise<EnrichmentSession> {
  const sessionId = `enr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const session: EnrichmentSession = {
    id: sessionId,
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

  // Store in memory cache
  sessionsCache.set(session.id, session);
  evidenceCache.set(session.id, []);
  contactsCache.set(session.id, []);

  // Persist to database
  try {
    await db.createEnrichmentSession({
      id: sessionId,
      entityId: params.entityId,
      entityName: params.entityName,
      userId: params.userId,
      tenantId: params.tenantId,
      workspaceId: params.workspaceId,
    });
    console.log('[EnrichmentSession] Created (DB + cache):', session.id, 'for entity:', params.entityName);
  } catch (error) {
    // Log but don't fail - memory cache will still work
    console.warn('[EnrichmentSession] Failed to persist to DB:', error);
    console.log('[EnrichmentSession] Created (cache only):', session.id, 'for entity:', params.entityName);
  }

  return session;
}

/**
 * Synchronous version for backwards compatibility
 * Creates session in memory only, DB persistence happens async
 */
export function createSessionSync(params: {
  entityId: string;
  entityName: string;
  userId: string;
  tenantId: string;
  workspaceId: string;
}): EnrichmentSession {
  const sessionId = `enr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const session: EnrichmentSession = {
    id: sessionId,
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

  // Store in memory cache
  sessionsCache.set(session.id, session);
  evidenceCache.set(session.id, []);
  contactsCache.set(session.id, []);

  // Fire-and-forget DB persistence
  db.createEnrichmentSession({
    id: sessionId,
    entityId: params.entityId,
    entityName: params.entityName,
    userId: params.userId,
    tenantId: params.tenantId,
    workspaceId: params.workspaceId,
  }).catch(error => {
    console.warn('[EnrichmentSession] Async DB persist failed:', error);
  });

  console.log('[EnrichmentSession] Created:', session.id, 'for entity:', params.entityName);
  return session;
}

/**
 * Update session stage
 * Updates both memory cache and database
 */
export async function updateSessionStage(
  sessionId: string,
  stage: EnrichmentStage,
  updates?: Partial<EnrichmentSession>
): Promise<EnrichmentSession | null> {
  // Update memory cache
  let session = sessionsCache.get(sessionId);

  if (!session) {
    // Try to load from database
    const dbSession = await db.getEnrichmentSession(sessionId);
    if (dbSession) {
      session = db.dbSessionToApiFormat(dbSession) as EnrichmentSession;
      sessionsCache.set(sessionId, session);
    } else {
      return null;
    }
  }

  session.stage = stage;
  if (updates) {
    Object.assign(session, updates);
  }
  if (stage === 'SCORING_COMPLETE' || stage === 'FAILED') {
    session.completedAt = new Date();
  }

  // Persist to database
  try {
    await db.updateEnrichmentSessionStage(sessionId, stage, {
      contactsFound: session.contactsFound,
      contactsScored: session.contactsScored,
      providerCalls: session.providerCalls,
      totalCostCents: session.totalCostCents,
      error: session.error,
    });
  } catch (error) {
    console.warn('[EnrichmentSession] Failed to update DB:', error);
  }

  console.log('[EnrichmentSession] Updated:', sessionId, '→', stage);
  return session;
}

/**
 * Synchronous update for backwards compatibility
 */
export function updateSessionStageSync(
  sessionId: string,
  stage: EnrichmentStage,
  updates?: Partial<EnrichmentSession>
): EnrichmentSession | null {
  const session = sessionsCache.get(sessionId);
  if (!session) return null;

  session.stage = stage;
  if (updates) {
    Object.assign(session, updates);
  }
  if (stage === 'SCORING_COMPLETE' || stage === 'FAILED') {
    session.completedAt = new Date();
  }

  // Fire-and-forget DB update
  db.updateEnrichmentSessionStage(sessionId, stage, {
    contactsFound: session.contactsFound,
    contactsScored: session.contactsScored,
    providerCalls: session.providerCalls,
    totalCostCents: session.totalCostCents,
    error: session.error,
  }).catch(error => {
    console.warn('[EnrichmentSession] Async DB update failed:', error);
  });

  console.log('[EnrichmentSession] Updated:', sessionId, '→', stage);
  return session;
}

/**
 * Store evidence from provider
 * Stored in both memory and database
 */
export async function storeEvidence(params: {
  sessionId: string;
  source: EnrichmentEvidence['source'];
  entityType: EnrichmentEvidence['entityType'];
  rawPayload: unknown;
  normalizedData: unknown;
}): Promise<EnrichmentEvidence> {
  const ev: EnrichmentEvidence = {
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sessionId: params.sessionId,
    source: params.source,
    entityType: params.entityType,
    rawPayload: params.rawPayload,
    normalizedData: params.normalizedData,
    createdAt: new Date(),
  };

  // Update memory cache
  const sessionEvidence = evidenceCache.get(params.sessionId) || [];
  sessionEvidence.push(ev);
  evidenceCache.set(params.sessionId, sessionEvidence);

  // Update session metrics in cache
  const session = sessionsCache.get(params.sessionId);
  if (session) {
    session.providerCalls++;
  }

  // Persist evidence to database
  try {
    await db.storeEnrichmentEvidence({
      id: ev.id,
      sessionId: params.sessionId,
      source: params.source,
      entityType: params.entityType,
      rawPayload: params.rawPayload,
      normalizedData: params.normalizedData,
    });
  } catch (error) {
    console.warn('[EnrichmentSession] Failed to persist evidence:', error);
  }

  console.log('[EnrichmentSession] Evidence stored:', ev.id, 'source:', params.source);
  return ev;
}

/**
 * Synchronous evidence storage
 */
export function storeEvidenceSync(params: {
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

  const sessionEvidence = evidenceCache.get(params.sessionId) || [];
  sessionEvidence.push(ev);
  evidenceCache.set(params.sessionId, sessionEvidence);

  const session = sessionsCache.get(params.sessionId);
  if (session) {
    session.providerCalls++;
  }

  // Fire-and-forget DB persist
  db.storeEnrichmentEvidence({
    id: ev.id,
    sessionId: params.sessionId,
    source: params.source,
    entityType: params.entityType,
    rawPayload: params.rawPayload,
    normalizedData: params.normalizedData,
  }).catch(error => {
    console.warn('[EnrichmentSession] Async evidence persist failed:', error);
  });

  console.log('[EnrichmentSession] Evidence stored:', ev.id, 'source:', params.source);
  return ev;
}

/**
 * Store scored contacts
 * Stores in both memory cache and database for persistence
 */
export async function storeScoredContacts(
  sessionId: string,
  scoredContacts: ScoredContact[]
): Promise<void> {
  // Update memory cache
  contactsCache.set(sessionId, scoredContacts);

  // Update session metrics in cache
  const session = sessionsCache.get(sessionId);
  if (session) {
    session.contactsFound = scoredContacts.length;
    session.contactsScored = scoredContacts.length;
  }

  // Persist contacts to database
  try {
    await db.saveEnrichedContacts(
      sessionId,
      session?.entityId || '',
      scoredContacts.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: c.fullName,
        title: c.title,
        email: c.email,
        linkedinUrl: c.linkedinUrl,
        phone: c.phone,
        role: c.role,
        seniority: c.seniority,
        department: c.department,
        qtleScore: c.qtleScore,
        scoreBreakdown: c.scoreBreakdown,
        priority: c.priority,
        priorityRank: c.priorityRank,
        whyRecommended: c.whyRecommended,
        confidence: c.confidence,
        sourceProvider: c.sourceProvider,
        sourceId: c.sourceId,
      }))
    );
    console.log('[EnrichmentSession] Contacts persisted to DB:', scoredContacts.length);
  } catch (error) {
    console.warn('[EnrichmentSession] Failed to persist contacts:', error);
  }

  console.log('[EnrichmentSession] Stored', scoredContacts.length, 'scored contacts');
}

/**
 * Synchronous contact storage
 */
export function storeScoredContactsSync(
  sessionId: string,
  scoredContacts: ScoredContact[]
): void {
  contactsCache.set(sessionId, scoredContacts);

  const session = sessionsCache.get(sessionId);
  if (session) {
    session.contactsFound = scoredContacts.length;
    session.contactsScored = scoredContacts.length;
  }

  // Fire-and-forget DB persist
  db.saveEnrichedContacts(
    sessionId,
    session?.entityId || '',
    scoredContacts.map(c => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      fullName: c.fullName,
      title: c.title,
      email: c.email,
      linkedinUrl: c.linkedinUrl,
      phone: c.phone,
      role: c.role,
      seniority: c.seniority,
      department: c.department,
      qtleScore: c.qtleScore,
      scoreBreakdown: c.scoreBreakdown,
      priority: c.priority,
      priorityRank: c.priorityRank,
      whyRecommended: c.whyRecommended,
      confidence: c.confidence,
      sourceProvider: c.sourceProvider,
      sourceId: c.sourceId,
    }))
  ).catch(error => {
    console.warn('[EnrichmentSession] Async contacts persist failed:', error);
  });

  console.log('[EnrichmentSession] Stored', scoredContacts.length, 'scored contacts');
}

/**
 * Get session by ID
 * Checks memory cache first, then database
 */
export async function getSession(sessionId: string): Promise<EnrichmentSession | null> {
  // Check memory cache first
  const cached = sessionsCache.get(sessionId);
  if (cached) return cached;

  // Load from database
  try {
    const dbSession = await db.getEnrichmentSession(sessionId);
    if (dbSession) {
      const session = db.dbSessionToApiFormat(dbSession) as EnrichmentSession;
      sessionsCache.set(sessionId, session);
      return session;
    }
  } catch (error) {
    console.warn('[EnrichmentSession] Failed to load from DB:', error);
  }

  return null;
}

/**
 * Synchronous session get (cache only)
 */
export function getSessionSync(sessionId: string): EnrichmentSession | null {
  return sessionsCache.get(sessionId) || null;
}

/**
 * Get scored contacts for session
 * Checks memory cache first, then database
 */
export async function getSessionContacts(sessionId: string): Promise<ScoredContact[]> {
  // Check memory cache first
  const cached = contactsCache.get(sessionId);
  if (cached && cached.length > 0) return cached;

  // Load from database
  try {
    const dbContacts = await db.getContactsBySession(sessionId);
    if (dbContacts.length > 0) {
      const contacts = dbContacts.map(c => ({
        id: c.id,
        sessionId: c.session_id,
        firstName: c.first_name,
        lastName: c.last_name,
        fullName: c.full_name,
        title: c.title,
        email: c.email || undefined,
        linkedinUrl: c.linkedin_url || undefined,
        phone: c.phone || undefined,
        role: c.role as ScoredContact['role'],
        seniority: c.seniority as ScoredContact['seniority'],
        department: c.department,
        qtleScore: c.qtle_score,
        scoreBreakdown: c.score_breakdown,
        priority: c.priority as ScoredContact['priority'],
        priorityRank: c.priority_rank,
        whyRecommended: c.why_recommended,
        confidence: c.confidence as ScoredContact['confidence'],
        sourceProvider: c.source_provider,
        sourceId: c.source_id || '',
      }));
      contactsCache.set(sessionId, contacts);
      console.log('[EnrichmentSession] Loaded', contacts.length, 'contacts from DB');
      return contacts;
    }
  } catch (error) {
    console.warn('[EnrichmentSession] Failed to load contacts from DB:', error);
  }

  return [];
}

/**
 * Synchronous contacts get (cache only)
 */
export function getSessionContactsSync(sessionId: string): ScoredContact[] {
  return contactsCache.get(sessionId) || [];
}

/**
 * Get session by entity (for resuming)
 * Checks memory cache first, then database
 */
export async function getSessionByEntity(entityId: string): Promise<EnrichmentSession | null> {
  // Check memory cache first
  for (const session of sessionsCache.values()) {
    if (session.entityId === entityId && session.stage !== 'FAILED') {
      return session;
    }
  }

  // Load from database
  try {
    const dbSession = await db.getEnrichmentSessionByEntity(entityId);
    if (dbSession) {
      const session = db.dbSessionToApiFormat(dbSession) as EnrichmentSession;
      sessionsCache.set(session.id, session);
      return session;
    }
  } catch (error) {
    console.warn('[EnrichmentSession] Failed to load session by entity:', error);
  }

  return null;
}

/**
 * Synchronous entity lookup (cache only)
 */
export function getSessionByEntitySync(entityId: string): EnrichmentSession | null {
  for (const session of sessionsCache.values()) {
    if (session.entityId === entityId && session.stage !== 'FAILED') {
      return session;
    }
  }
  return null;
}

/**
 * Get contacts by entity ID (convenience method)
 * Finds the most recent session and returns its contacts
 */
export async function getContactsByEntity(entityId: string): Promise<ScoredContact[]> {
  // Try to find session in cache
  const session = await getSessionByEntity(entityId);
  if (session) {
    return getSessionContacts(session.id);
  }

  // Direct DB lookup
  try {
    const dbContacts = await db.getContactsByEntity(entityId);
    if (dbContacts.length > 0) {
      return dbContacts.map(c => ({
        id: c.id,
        sessionId: c.session_id,
        firstName: c.first_name,
        lastName: c.last_name,
        fullName: c.full_name,
        title: c.title,
        email: c.email || undefined,
        linkedinUrl: c.linkedin_url || undefined,
        phone: c.phone || undefined,
        role: c.role as ScoredContact['role'],
        seniority: c.seniority as ScoredContact['seniority'],
        department: c.department,
        qtleScore: c.qtle_score,
        scoreBreakdown: c.score_breakdown,
        priority: c.priority as ScoredContact['priority'],
        priorityRank: c.priority_rank,
        whyRecommended: c.why_recommended,
        confidence: c.confidence as ScoredContact['confidence'],
        sourceProvider: c.source_provider,
        sourceId: c.source_id || '',
      }));
    }
  } catch (error) {
    console.warn('[EnrichmentSession] Failed to load contacts by entity:', error);
  }

  return [];
}

/**
 * Check if entity has been enriched
 */
export async function hasBeenEnriched(entityId: string): Promise<boolean> {
  // Check cache
  for (const session of sessionsCache.values()) {
    if (session.entityId === entityId && session.stage === 'SCORING_COMPLETE') {
      return true;
    }
  }

  // Check database
  try {
    return await db.hasEnrichedContacts(entityId);
  } catch (error) {
    console.warn('[EnrichmentSession] Failed to check enrichment status:', error);
    return false;
  }
}
