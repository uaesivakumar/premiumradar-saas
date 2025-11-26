/**
 * Intelligence Layer Types - Stream 13
 *
 * Shared type definitions for the intelligence layer.
 * These types EXTEND (not replace) existing types from lib/agents/types.ts
 */

import { AgentType, OutputObject, SIVAMessage } from '@/lib/stores/siva-store';
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
  type: 'signal' | 'metric' | 'news' | 'profile' | 'comparison' | 'trend';
  source: string;
  content: string;
  confidence: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface ReasoningChain {
  steps: ReasoningChainStep[];
  conclusion: string;
  confidence: number;
  duration: number;
}

export interface ReasoningChainStep {
  step: number;
  name: string;
  description: string;
  inputs: string[];
  output: string;
  evidence: Evidence[];
  duration: number;
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

export type RoutingMode = 'autonomous' | 'step-by-step' | 'manual';

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
  action: 'created' | 'updated' | 'linked' | 'pinned' | 'unpinned';
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
  | 'formal'
  | 'friendly'
  | 'executive'
  | 'banking_sales'
  | 'technical';

export type OutreachToneType =
  | 'email_formal'
  | 'email_casual'
  | 'linkedin_connection'
  | 'linkedin_inmail'
  | 'call_script_short'
  | 'call_script_detailed';

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
  routeToAgent: (intent: Intent) => Promise<RoutingDecision>;
  currentPlan: OrchestrationPlan | null;
  mode: RoutingMode;
  setMode: (mode: RoutingMode) => void;
}

export interface EvidenceWrapperResult {
  enrichOutput: (object: OutputObject) => Promise<LiveObject>;
  collectEvidence: (target: string) => Promise<EvidencePack>;
  currentEvidence: EvidencePack | null;
}

export interface PersonaWrapperResult {
  applyTone: (message: string) => string;
  currentTone: ToneType;
  setTone: (tone: ToneType) => void;
  persona: PersonaConfig;
}
