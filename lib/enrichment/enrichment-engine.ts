/**
 * Enrichment Engine - S396
 *
 * PROVIDER-AGNOSTIC ENRICHMENT PIPELINE
 *
 * Flow:
 * 1. Create enrichment session (auditability)
 * 2. Call provider(s) with role-scoped filters
 * 3. Store raw response as evidence
 * 4. Normalize and score contacts via QTLE
 * 5. Return ranked contacts for UI
 *
 * RULES (LOCKED):
 * - Apollo is a SOURCE, not the engine
 * - Raw provider data NEVER goes to UI
 * - Every enrichment is auditable via session
 * - Contacts scored by QTLE, not provider scores
 *
 * PERSISTENCE (S396 Update):
 * - Sessions and contacts persisted to PostgreSQL
 * - Idempotent: returns cached contacts from DB if already enriched
 * - Pay Apollo once, use contacts forever
 */

import {
  createSession,
  updateSessionStage,
  storeEvidence,
  storeScoredContacts,
  getSession,
  getSessionContacts,
  getSessionByEntity,
  getContactsByEntity,
  type EnrichmentSession,
  type ScoredContact,
} from './enrichment-session';
import { scoreContacts, getScoringContext } from './contact-scorer';
import { searchHRContacts, type ApolloContact } from '@/lib/integrations/apollo';

// =============================================================================
// TYPES
// =============================================================================

export interface EnrichmentRequest {
  entityId: string;
  entityName: string;
  entityDomain?: string;
  userId: string;
  tenantId: string;
  workspaceId: string;
  subVertical: string;
  /**
   * LEAD CONTEXT (S396): Discovery region is MANDATORY.
   * Used to filter Apollo contacts to the same region where company was discovered.
   * This prevents credit waste from fetching geographically irrelevant contacts.
   */
  region: string; // MANDATORY - no longer optional
  maxContacts?: number;
}

export interface EnrichmentResult {
  success: boolean;
  sessionId: string;
  session: EnrichmentSession;
  contacts: ScoredContact[];
  error?: string;
}

// =============================================================================
// NORMALIZATION
// =============================================================================

interface NormalizedContact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  phone?: string;
  seniority?: string;
  departments?: string[];
  sourceProvider: string;
  sourceId: string;
}

/**
 * Normalize Apollo contacts to provider-agnostic format
 */
function normalizeApolloContacts(contacts: ApolloContact[]): NormalizedContact[] {
  return contacts.map(contact => ({
    id: `norm_${contact.id}`,
    firstName: contact.first_name || '',
    lastName: contact.last_name || '',
    title: contact.title || 'Unknown',
    email: contact.email,
    linkedinUrl: contact.linkedin_url,
    phone: contact.phone_numbers?.[0]?.number,
    seniority: contact.seniority,
    departments: contact.departments,
    sourceProvider: 'apollo',
    sourceId: contact.id,
  }));
}

// =============================================================================
// MAIN ENRICHMENT FUNCTION
// =============================================================================

/**
 * Enrich a company to find individual leads/contacts
 *
 * This is the main entry point for the Enrich button.
 *
 * IDEMPOTENCY (MANDATORY):
 * - If session exists and is COMPLETE → return cached result from DB (no Apollo call)
 * - If session exists and is IN_PROGRESS → return in-progress status (no Apollo call)
 * - Only create new session if no existing session or previous session FAILED
 *
 * PERSISTENCE:
 * - Sessions and contacts are persisted to PostgreSQL
 * - After server restart, contacts are loaded from DB (not re-fetched from Apollo)
 * - Pay Apollo once, use contacts forever
 *
 * This prevents:
 * - Double Apollo calls on rapid clicks
 * - Credit burns on retry
 * - Duplicate sessions for same entity
 * - Re-fetching after server restart (costs money!)
 */
export async function enrichCompanyContacts(
  request: EnrichmentRequest
): Promise<EnrichmentResult> {
  console.log('[EnrichmentEngine] Starting enrichment for:', request.entityName);

  // IDEMPOTENCY CHECK: Look for existing session for this entity (checks DB!)
  const existingSession = await getSessionByEntity(request.entityId);

  if (existingSession) {
    // CASE 1: Enrichment already complete → return cached result from DB
    if (existingSession.stage === 'SCORING_COMPLETE') {
      console.log('[EnrichmentEngine] IDEMPOTENT: Returning cached session from DB:', existingSession.id);
      const cachedContacts = await getSessionContacts(existingSession.id);
      return {
        success: true,
        sessionId: existingSession.id,
        session: existingSession,
        contacts: cachedContacts,
      };
    }

    // CASE 2: Enrichment in progress → return in-progress status (NO new Apollo call)
    if (
      existingSession.stage === 'CONTACT_DISCOVERY_STARTED' ||
      existingSession.stage === 'CONTACT_DISCOVERY_COMPLETE' ||
      existingSession.stage === 'SCORING_STARTED'
    ) {
      console.log('[EnrichmentEngine] IDEMPOTENT: Enrichment in progress:', existingSession.id, existingSession.stage);
      return {
        success: true,
        sessionId: existingSession.id,
        session: existingSession,
        contacts: [], // Not yet available
      };
    }

    // CASE 3: Previous session FAILED → will create new session below
    console.log('[EnrichmentEngine] Previous session failed, creating new:', existingSession.id);
  }

  // Step 1: Create enrichment session (persisted to DB)
  const session = await createSession({
    entityId: request.entityId,
    entityName: request.entityName,
    userId: request.userId,
    tenantId: request.tenantId,
    workspaceId: request.workspaceId,
  });

  try {
    // Step 2: Role-scoped contact discovery with LEAD CONTEXT
    // LEAD CONTEXT (S396): Pass discovery region to filter contacts geographically
    console.log('[EnrichmentEngine] Calling Apollo for HR contacts in region:', request.region);

    const apolloContacts = await searchHRContacts(request.entityName, request.region);

    // Store raw response as evidence (NEVER sent to UI, persisted to DB)
    await storeEvidence({
      sessionId: session.id,
      source: 'apollo',
      entityType: 'contact',
      rawPayload: apolloContacts, // Raw provider data
      normalizedData: null, // Will be populated after normalization
    });

    await updateSessionStage(session.id, 'CONTACT_DISCOVERY_COMPLETE', {
      contactsFound: apolloContacts.length,
    });

    if (apolloContacts.length === 0) {
      console.log('[EnrichmentEngine] No contacts found for:', request.entityName);
      await updateSessionStage(session.id, 'SCORING_COMPLETE', {
        contactsScored: 0,
      });

      const updatedSession = await getSession(session.id);
      return {
        success: true,
        sessionId: session.id,
        session: updatedSession || session,
        contacts: [],
      };
    }

    // Step 3: Normalize provider data
    console.log('[EnrichmentEngine] Normalizing', apolloContacts.length, 'contacts...');

    const normalizedContacts = normalizeApolloContacts(apolloContacts);

    // Update evidence with normalized data
    await storeEvidence({
      sessionId: session.id,
      source: 'apollo',
      entityType: 'contact',
      rawPayload: null,
      normalizedData: normalizedContacts,
    });

    // Step 4: Score contacts via QTLE with company context
    console.log('[EnrichmentEngine] Scoring contacts via QTLE...');

    await updateSessionStage(session.id, 'SCORING_STARTED');

    // Extract company headcount from Apollo response (if available)
    // Apollo contacts include organization data with employee count
    const companyData = apolloContacts[0]?.organization;
    const companyContext = companyData ? {
      headcount: companyData.estimated_num_employees || companyData.employee_count,
      hiringVelocity: companyData.hiring_velocity,
      industry: companyData.industry,
    } : undefined;

    console.log('[EnrichmentEngine] Company context for scoring:', {
      entityName: request.entityName,
      headcount: companyContext?.headcount,
      hiringVelocity: companyContext?.hiringVelocity,
    });

    const scoringContext = getScoringContext(request.subVertical, companyContext);
    const scoredContacts = scoreContacts(normalizedContacts, session.id, scoringContext);

    // Limit to max contacts if specified
    const maxContacts = request.maxContacts || 10;
    const topContacts = scoredContacts.slice(0, maxContacts);

    // Store scored contacts (persisted to DB)
    await storeScoredContacts(session.id, topContacts);

    await updateSessionStage(session.id, 'SCORING_COMPLETE', {
      contactsScored: topContacts.length,
    });

    const finalSession = await getSession(session.id);

    console.log('[EnrichmentEngine] Enrichment complete:', {
      sessionId: session.id,
      contactsFound: apolloContacts.length,
      contactsScored: topContacts.length,
      topContact: topContacts[0]?.fullName,
    });

    return {
      success: true,
      sessionId: session.id,
      session: finalSession || session,
      contacts: topContacts,
    };

  } catch (error) {
    console.error('[EnrichmentEngine] Enrichment failed:', error);

    await updateSessionStage(session.id, 'FAILED', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const failedSession = await getSession(session.id);
    return {
      success: false,
      sessionId: session.id,
      session: failedSession || session,
      contacts: [],
      error: error instanceof Error ? error.message : 'Enrichment failed',
    };
  }
}

/**
 * Get enrichment result by session ID
 * Loads from database if not in memory cache
 */
export async function getEnrichmentResult(sessionId: string): Promise<EnrichmentResult | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const contacts = await getSessionContacts(sessionId);

  return {
    success: session.stage === 'SCORING_COMPLETE',
    sessionId: session.id,
    session,
    contacts,
    error: session.error,
  };
}

/**
 * Get enrichment result by entity ID
 * Convenience method to get contacts for a company without knowing the session ID
 */
export async function getEnrichmentResultByEntity(entityId: string): Promise<EnrichmentResult | null> {
  const session = await getSessionByEntity(entityId);
  if (!session) return null;

  const contacts = await getSessionContacts(session.id);

  return {
    success: session.stage === 'SCORING_COMPLETE',
    sessionId: session.id,
    session,
    contacts,
    error: session.error,
  };
}

// Re-export types
export type { EnrichmentSession, ScoredContact } from './enrichment-session';
