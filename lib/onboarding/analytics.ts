/**
 * Onboarding Analytics & SIVA Initialization - Sprint S134/S135
 *
 * - Every onboarding step emits an analytics event
 * - Dropoffs route to Self-Healing Engine
 * - Fields initialize SIVA persona + SalesContext
 */

import type { Vertical, SubVertical } from '@/lib/intelligence/context/types';
import type { OnboardingStep } from '@/lib/stores/onboarding-store';

// =============================================================================
// Types
// =============================================================================

export interface OnboardingEvent {
  type: OnboardingEventType;
  step: OnboardingStep;
  timestamp: string;
  sessionId: string;

  // User identity
  userId?: string;
  email?: string;

  // Context at time of event
  vertical?: Vertical | null;
  subVertical?: SubVertical | null;
  regions?: string[];

  // Step-specific data
  data?: Record<string, unknown>;

  // Timing metrics
  timeOnStep?: number; // milliseconds
  totalTimeElapsed?: number;

  // Device/session info
  device?: 'mobile' | 'tablet' | 'desktop';
  userAgent?: string;
}

export type OnboardingEventType =
  | 'step_started'
  | 'step_completed'
  | 'step_abandoned'
  | 'step_error'
  | 'field_interaction'
  | 'field_error'
  | 'back_navigation'
  | 'confusion_pattern'
  | 'vertical_changed'
  | 'region_changed'
  | 'onboarding_completed'
  | 'onboarding_abandoned';

export interface DropoffData {
  step: OnboardingStep;
  timeOnStep: number;
  previousSteps: OnboardingStep[];
  confusionPatterns: ConfusionPattern[];
  lastInteraction: string;
  device: string;
  timestamp: string;
}

export interface ConfusionPattern {
  type: 'repeated_back' | 'field_refill' | 'long_pause' | 'error_loop' | 'help_click';
  count: number;
  field?: string;
  timestamp: string;
}

// =============================================================================
// SIVA Persona Initialization
// =============================================================================

export interface InitialSIVAContext {
  // From onboarding
  vertical: Vertical;
  subVertical: SubVertical;
  regions: string[];

  // User profile
  userName: string;
  userEmail: string;
  userRole: string;

  // Company info
  companyName?: string;
  companyDomain?: string;
  companyIndustry?: string;

  // Preferences (from onboarding or inferred)
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'executive';
  tonePreference?: 'formal' | 'conversational' | 'direct';
  primaryGoal?: 'pipeline_building' | 'conversions' | 'prospecting' | 'account_management';

  // Pack assignment
  packTemplate: string;
  personaId: string;

  // Derived
  targetEntity: 'companies' | 'individuals' | 'families' | 'candidates';
}

export function buildInitialSIVAContext(params: {
  vertical: Vertical;
  subVertical: SubVertical;
  regions: string[];
  profile: {
    name: string;
    email: string;
    role: string;
  };
  company?: {
    name?: string;
    domain?: string;
    industry?: string;
  };
  packTemplate?: string;
  personaId?: string;
}): InitialSIVAContext {
  // Determine target entity based on vertical
  const targetEntityMap: Record<Vertical, 'companies' | 'individuals' | 'families' | 'candidates'> = {
    'banking': 'companies',
    'insurance': 'individuals',
    'real-estate': 'families',
    'recruitment': 'candidates',
    'saas-sales': 'companies',
  };

  // Infer experience level from role
  const experienceLevel = inferExperienceLevel(params.profile.role);

  // Default pack and persona based on vertical/sub-vertical
  const packTemplate = params.packTemplate || `${params.vertical}-${params.subVertical}-default`;
  const personaId = params.personaId || `${params.subVertical}-standard`;

  return {
    vertical: params.vertical,
    subVertical: params.subVertical,
    regions: params.regions,
    userName: params.profile.name,
    userEmail: params.profile.email,
    userRole: params.profile.role,
    companyName: params.company?.name,
    companyDomain: params.company?.domain,
    companyIndustry: params.company?.industry,
    experienceLevel,
    tonePreference: experienceLevel === 'executive' ? 'direct' : 'conversational',
    primaryGoal: 'prospecting', // Default, can be updated in settings
    packTemplate,
    personaId,
    targetEntity: targetEntityMap[params.vertical],
  };
}

function inferExperienceLevel(role: string): 'junior' | 'mid' | 'senior' | 'executive' {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('ceo') || roleLower.includes('cfo') ||
      roleLower.includes('chief') || roleLower.includes('vp') ||
      roleLower.includes('director') || roleLower.includes('head of')) {
    return 'executive';
  }

  if (roleLower.includes('senior') || roleLower.includes('lead') ||
      roleLower.includes('manager') || roleLower.includes('principal')) {
    return 'senior';
  }

  if (roleLower.includes('junior') || roleLower.includes('associate') ||
      roleLower.includes('trainee') || roleLower.includes('intern')) {
    return 'junior';
  }

  return 'mid';
}

// =============================================================================
// Analytics Event Emission
// =============================================================================

let sessionId: string | null = null;
let stepStartTime: number | null = null;
let onboardingStartTime: number | null = null;
let confusionPatterns: ConfusionPattern[] = [];

export function initOnboardingSession(): string {
  sessionId = `ob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  onboardingStartTime = Date.now();
  confusionPatterns = [];

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('onboarding_session_id', sessionId);
    sessionStorage.setItem('onboarding_start_time', onboardingStartTime.toString());
  }

  return sessionId;
}

export function getSessionId(): string {
  if (sessionId) return sessionId;

  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('onboarding_session_id');
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
  }

  return initOnboardingSession();
}

export function startStep(step: OnboardingStep): void {
  stepStartTime = Date.now();

  emitEvent({
    type: 'step_started',
    step,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  });
}

export function completeStep(
  step: OnboardingStep,
  data?: Record<string, unknown>
): void {
  const timeOnStep = stepStartTime ? Date.now() - stepStartTime : 0;
  const totalTimeElapsed = onboardingStartTime ? Date.now() - onboardingStartTime : 0;

  emitEvent({
    type: 'step_completed',
    step,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    data,
    timeOnStep,
    totalTimeElapsed,
  });

  stepStartTime = null;
}

export function recordBackNavigation(from: OnboardingStep, to: OnboardingStep): void {
  // Track as potential confusion
  confusionPatterns.push({
    type: 'repeated_back',
    count: 1,
    timestamp: new Date().toISOString(),
  });

  emitEvent({
    type: 'back_navigation',
    step: from,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    data: { from, to },
  });

  // Check for confusion threshold
  const backCount = confusionPatterns.filter(p => p.type === 'repeated_back').length;
  if (backCount >= 3) {
    recordConfusionPattern('repeated_back', from);
  }
}

export function recordFieldError(step: OnboardingStep, field: string, error: string): void {
  emitEvent({
    type: 'field_error',
    step,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    data: { field, error },
  });

  confusionPatterns.push({
    type: 'error_loop',
    count: 1,
    field,
    timestamp: new Date().toISOString(),
  });
}

export function recordConfusionPattern(type: ConfusionPattern['type'], step: OnboardingStep): void {
  emitEvent({
    type: 'confusion_pattern',
    step,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    data: {
      patternType: type,
      patterns: confusionPatterns,
    },
  });

  // Route to Self-Healing Engine
  routeToSelfHealing(step, type);
}

export function recordDropoff(step: OnboardingStep, previousSteps: OnboardingStep[]): void {
  const timeOnStep = stepStartTime ? Date.now() - stepStartTime : 0;

  const dropoffData: DropoffData = {
    step,
    timeOnStep,
    previousSteps,
    confusionPatterns,
    lastInteraction: new Date().toISOString(),
    device: getDeviceType(),
    timestamp: new Date().toISOString(),
  };

  emitEvent({
    type: 'onboarding_abandoned',
    step,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    data: dropoffData as unknown as Record<string, unknown>,
  });

  // Route to Self-Healing Engine
  routeToSelfHealing(step, 'dropoff', dropoffData);
}

export function completeOnboarding(context: InitialSIVAContext): void {
  const totalTimeElapsed = onboardingStartTime ? Date.now() - onboardingStartTime : 0;

  emitEvent({
    type: 'onboarding_completed',
    step: 'complete',
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    vertical: context.vertical,
    subVertical: context.subVertical,
    regions: context.regions,
    data: {
      sivaContext: context,
      totalTimeElapsed,
      confusionCount: confusionPatterns.length,
    },
    totalTimeElapsed,
  });

  // Initialize SIVA with context
  initializeSIVA(context);
}

// =============================================================================
// Self-Healing Engine Integration
// =============================================================================

interface SelfHealingRequest {
  source: 'onboarding';
  trigger: 'confusion' | 'dropoff' | 'error';
  step: OnboardingStep;
  patternType?: string;
  data?: unknown;
  timestamp: string;
  sessionId: string;
}

async function routeToSelfHealing(
  step: OnboardingStep,
  trigger: 'confusion' | 'dropoff' | 'error' | ConfusionPattern['type'],
  data?: unknown
): Promise<void> {
  const request: SelfHealingRequest = {
    source: 'onboarding',
    trigger: trigger === 'dropoff' ? 'dropoff' : trigger === 'error' ? 'error' : 'confusion',
    step,
    patternType: trigger,
    data,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  };

  try {
    // Send to Self-Healing Engine API
    await fetch('/api/self-healing/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }).catch(() => {
      // Non-blocking - log but don't fail
      console.warn('[Self-Healing] Failed to route event');
    });

    // Also store locally for analytics
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('self_healing_events') || '[]';
      const events = JSON.parse(stored);
      events.push(request);
      sessionStorage.setItem('self_healing_events', JSON.stringify(events));
    }
  } catch (error) {
    console.error('[Self-Healing] Error routing to engine:', error);
  }
}

// =============================================================================
// SIVA Initialization
// =============================================================================

async function initializeSIVA(context: InitialSIVAContext): Promise<void> {
  try {
    // Store context for SIVA to use
    if (typeof window !== 'undefined') {
      localStorage.setItem('siva_initial_context', JSON.stringify(context));
    }

    // Call SIVA initialization API
    await fetch('/api/siva/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Non-blocking
      console.warn('[SIVA] Failed to initialize - will retry on first interaction');
    });
  } catch (error) {
    console.error('[SIVA] Initialization error:', error);
  }
}

// =============================================================================
// Event Emission
// =============================================================================

async function emitEvent(event: OnboardingEvent): Promise<void> {
  // Add device info
  event.device = getDeviceType();
  if (typeof navigator !== 'undefined') {
    event.userAgent = navigator.userAgent;
  }

  try {
    // Send to analytics API
    await fetch('/api/analytics/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {
      // Non-blocking - store locally as fallback
      storeEventLocally(event);
    });

    // Dev logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Onboarding Event]', event.type, event.step, event.data);
    }
  } catch (error) {
    console.error('[Analytics] Event emission failed:', error);
    storeEventLocally(event);
  }
}

function storeEventLocally(event: OnboardingEvent): void {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('onboarding_events') || '[]';
    const events = JSON.parse(stored);
    events.push(event);
    sessionStorage.setItem('onboarding_events', JSON.stringify(events));
  }
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// =============================================================================
// Flush pending events (call on page unload)
// =============================================================================

export async function flushPendingEvents(): Promise<void> {
  if (typeof window === 'undefined') return;

  const storedEvents = sessionStorage.getItem('onboarding_events');
  if (!storedEvents) return;

  const events = JSON.parse(storedEvents);
  if (events.length === 0) return;

  try {
    await fetch('/api/analytics/onboarding/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true, // Ensure request completes even on page unload
    });

    sessionStorage.removeItem('onboarding_events');
  } catch {
    // Keep events for next session
  }
}

// Register flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingEvents);
  window.addEventListener('pagehide', flushPendingEvents);
}

export default {
  initOnboardingSession,
  startStep,
  completeStep,
  recordBackNavigation,
  recordFieldError,
  recordConfusionPattern,
  recordDropoff,
  completeOnboarding,
  buildInitialSIVAContext,
  flushPendingEvents,
};
