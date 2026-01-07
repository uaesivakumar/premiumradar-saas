/**
 * Intelligence Layer Types - Stream 13
 *
 * Shared type definitions for the intelligence layer.
 * These types EXTEND (not replace) existing types from lib/agents/types.ts
 */

// S369: SIVAMessage removed from siva-store per WORKSPACE_UX_DECISION.md
import { AgentType, OutputObject } from '@/lib/stores/siva-store';
import { AgentContext, AgentResponse } from '@/lib/agents/types';

// =============================================================================
// S43: Intent Types
// =============================================================================

export type IntentType =
  // Discovery intents
  | 'discovery.search'
  | 'discovery.filter'
  | 'discovery.explore'
  | 'discovery.signal'
  // Ranking intents
  | 'ranking.score'
  | 'ranking.compare'
  | 'ranking.prioritize'
  | 'ranking.explain'
  // Outreach intents
  | 'outreach.email'
  | 'outreach.linkedin'
  | 'outreach.call'
  | 'outreach.followup'
  // Enrichment intents
  | 'enrichment.company'
  | 'enrichment.contact'
  | 'enrichment.tech'
  // Compound intents
  | 'compound.discovery_ranking'
  | 'compound.ranking_outreach'
  | 'compound.full_pipeline'
  // Meta intents
  | 'meta.help'
  | 'meta.settings'
  | 'meta.demo'
  | 'meta.unknown';

export interface Intent {
  type: IntentType;
  confidence: number;
  agents: AgentType[];
  entities: ExtractedEntity[];
  normalized: NormalizedQuery;
}

export interface ExtractedEntity {
  type: 'company' | 'sector' | 'region' | 'signal' | 'metric' | 'person' | 'date';
  value: string;
  confidence: number;
  span: [number, number]; // Character positions in original query
}

export interface NormalizedQuery {
  original: string;
  normalized: string;
  parameters: Record<string, unknown>;
}

export interface ContextMemoryEntry {
  id: string;
  query: string;
  intent: Intent;
  timestamp: Date;
  entities: ExtractedEntity[];
  resolved: Record<string, string>; // Pronoun resolutions
}

// =============================================================================
// S44: Evidence Types
// =============================================================================

export interface Evidence {
  id: string;
  type: 'signal' | 'metric' | 'news' | 'profile' | 'comparison' | 'trend' | 'social' | 'financial' | 'technology' | 'leadership';
  source: string;
  title?: string;
  content: string;
  confidence: number;
  relevance?: number;
  timestamp: Date;
  url?: string;
  metadata: Record<string, unknown>;
}

export interface ReasoningChain {
  steps: ReasoningChainStep[];
  conclusion: string;
  confidence: number;
  duration: number;
}

export interface ReasoningChainStep {
  step?: number;
  stage?: string;
  name?: string;
  description?: string;
  inputs?: string[];
  output: string;
  evidence: Evidence[];
  duration?: number;
}

export interface EvidencePack {
  type: 'ranking' | 'outreach' | 'discovery';
  target: string; // Company or entity name
  evidence: Evidence[];
  reasoning: ReasoningChain;
  confidence: number;
  generatedAt: Date;
}

export interface ScoreJustification {
  score: number;
  component: 'Q' | 'T' | 'L' | 'E' | 'overall';
  justification: string;
  evidence: Evidence[];
  factors: { name: string; contribution: number; evidence: Evidence }[];
}

// =============================================================================
// S45: Routing Types
// =============================================================================

export type RoutingMode =
  | 'single'      // Single agent execution
  | 'sequential'  // Multiple agents in sequence
  | 'parallel'    // Multiple agents in parallel
  | 'hybrid';     // Mix of sequential and parallel

export interface RoutingDecision {
  id: string;
  query: string;
  intent: Intent;
  selectedAgents: AgentType[];
  executionOrder: AgentType[];
  mode: RoutingMode;
  reasoning: string;
  confidence: number;
  timestamp: Date;
}

export interface ExecutionStep {
  id: string;
  agent: AgentType;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped';
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  duration?: number;
  error?: string;
}

export interface OrchestrationPlan {
  id: string;
  decision: RoutingDecision;
  steps: ExecutionStep[];
  fallbackPaths: FallbackPath[];
  estimatedDuration: number;
}

export interface FallbackPath {
  trigger: 'timeout' | 'error' | 'low_confidence' | 'user_cancel';
  fromAgent: AgentType;
  toAgent: AgentType | 'abort';
  message: string;
}

export interface AgentHandoff {
  from: AgentType;
  to: AgentType;
  context: Record<string, unknown>;
  reason: string;
  timestamp: Date;
}

// =============================================================================
// S46: Output Objects v2 Types
// =============================================================================

export interface LiveObject extends OutputObject {
  isLive: boolean;
  lastUpdate: Date;
  updateInterval?: number;
  linkedObjects: string[]; // IDs of linked objects
  threads: ObjectThread[];
  inspectorData: ObjectInspectorData;
}

export interface ObjectThread {
  id: string;
  title: string;
  messages: ThreadMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadMessage {
  id: string;
  role: 'siva' | 'system';
  content: string;
  timestamp: Date;
}

export interface ObjectInspectorData {
  metadata: Record<string, unknown>;
  signals: Evidence[];
  reasoning: ReasoningChain;
  history: ObjectHistoryEntry[];
}

export interface ObjectHistoryEntry {
  action: 'created' | 'updated' | 'linked' | 'pinned' | 'unpinned' | 'enriched' | 'unlinked' | 'archived' | 'restored' | 'refreshed';
  timestamp: Date;
  details: string;
}

export interface ObjectLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'derived' | 'related' | 'next_step';
  label: string;
}

export interface ObjectSession {
  id: string;
  name: string;
  objects: string[]; // Object IDs
  links: ObjectLink[];
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// S47: Persona Types
// =============================================================================

export type ToneType =
  | 'professional'    // Formal, business-appropriate
  | 'friendly'        // Warm, approachable
  | 'concise'         // Brief, to-the-point
  | 'detailed'        // Comprehensive, thorough
  | 'technical'       // Technical language, precise
  | 'casual';         // Relaxed, conversational

export type OutreachToneType =
  | 'executive'       // C-suite appropriate
  | 'consultative'    // Advisory, problem-solving
  | 'challenger'      // Thought-provoking
  | 'relationship'    // Connection-focused
  | 'value-driven';   // ROI and benefits focused

export interface PersonaConfig {
  id: string;
  name: string;
  basePersonality: string;
  toneDefault: ToneType;
  outreachToneDefault: OutreachToneType;
  traits: PersonaTrait[];
  vocabulary: string[];
  avoidWords: string[];
}

export interface PersonaTrait {
  name: string;
  description: string;
  weight: number; // 0-1
}

export interface TonePack {
  id: ToneType;
  name: string;
  description: string;
  examples: string[];
  modifiers: ToneModifier[];
}

export interface ToneModifier {
  type: 'prefix' | 'suffix' | 'replacement';
  pattern: string;
  replacement: string;
}

export interface PersonalizationEntry {
  userId: string;
  preferences: {
    tone: ToneType;
    outreachTone: OutreachToneType;
    verbosity: 'concise' | 'detailed' | 'comprehensive';
    formality: number; // 0-1
  };
  learnedPatterns: LearnedPattern[];
  updatedAt: Date;
}

export interface LearnedPattern {
  type: 'phrase' | 'greeting' | 'signoff' | 'style';
  pattern: string;
  frequency: number;
  lastUsed: Date;
}

export interface PersonaApplicationResult {
  original: string;
  modified: string;
  appliedRules: string[];
  toneMetrics: {
    formality: number;
    brevity: number;
    warmth: number;
    technicality: number;
    readability: number;
    wordCount: number;
  };
}

// =============================================================================
// Wrapper Hook Types
// =============================================================================

export interface IntentWrapperResult {
  processQuery: (query: string) => Promise<void>;
  currentIntent: Intent | null;
  contextMemory: ContextMemoryEntry[];
  isProcessing: boolean;
}

export interface RoutingWrapperResult {
  // Core routing - uses 'any' for RoutingDecision to avoid import conflicts
  routeToAgent: (intent: {
    type: string;
    confidence: number;
    agents: string[];
    normalized: { original: string };
  }) => Promise<unknown>;
  routeCurrentIntent: (query: string) => unknown;
  quickRoute: (intentType: string) => AgentType;

  // Plan management - uses 'unknown' for OrchestrationPlan to avoid import conflicts
  currentPlan: unknown;
  executePlan: () => Promise<unknown>;

  // Mode
  mode: RoutingMode;
  setMode: (mode: RoutingMode) => void;

  // Status
  routingSummary: {
    primaryAgent: AgentType;
    supportingAgents: AgentType[];
    mode: RoutingMode;
    confidence: number;
    reasoning: string;
  } | null;
  executionStatus: {
    isExecuting: boolean;
    status: string;
    progress: number;
    currentStep: string | null;
  };
  isRouting: boolean;
  error: string | null;
}

export interface EvidenceWrapperResult {
  enrichOutput: (object: OutputObject) => Promise<LiveObject>;
  collectEvidence: (target: string) => Promise<EvidencePack>;
  currentEvidence: EvidencePack | null;
}

export interface PersonaWrapperResult {
  // Core functions
  applyTone: (message: string, context?: { isOutreach?: boolean; agentType?: string; intentType?: string }) => string;
  applyToneWithDetails: (message: string, context?: { isOutreach?: boolean; agentType?: string; intentType?: string }) => PersonaApplicationResult;
  setTone: (tone: ToneType | OutreachToneType) => void;
  suggestToneFor: (context: { isOutreach: boolean; recipientRole?: string; urgency?: 'low' | 'medium' | 'high'; relationship?: 'new' | 'warm' | 'existing' }) => ToneType | OutreachToneType;

  // Current state
  currentTone: ToneType;
  persona: PersonaConfig;
  toneInfo: { id: string; name: string; tone: string } | null;
  availableTones: { base: ToneType[]; outreach: OutreachToneType[] };

  // Vertical-aware persona (SIVA switches dynamically based on salesContext)
  verticalPersona: {
    id: string;
    name: string;
    vertical: string;
    subVertical: string | undefined;
    baseTone: 'professional' | 'friendly' | 'concise' | 'detailed';
    outreachTone: 'executive' | 'consultative';
    communicationStyle: {
      formality: 'formal' | 'semi-formal' | 'casual';
      pace: 'fast' | 'measured' | 'thorough';
      focus: 'data-driven' | 'relationship-focused' | 'outcome-focused';
    };
  };

  // Status
  isApplying: boolean;
  error: string | null;
}
