/**
 * Intelligence Layer - Stream 13
 *
 * SIVA Intelligence & Routing Layer
 * S43-S47: Intent, Evidence, Routing, Objects v2, Persona
 *
 * CRITICAL: This layer WRAPS existing functionality.
 * It does NOT replace or modify existing SIVA components.
 *
 * Architecture:
 *   Brain (Intelligence) → wraps → Muscles (Execution)
 *   lib/intelligence/*   → wraps → lib/agents/*, components/siva/*
 */

// Wrapper Hooks (Primary Integration Points)
export * from './hooks';

// S43: Intent & Contextual Understanding
export * from './intent';

// S44: Evidence & Signals Reasoning
export * from './evidence';

// S45: Tool Routing & Multi-Agent Orchestration
export * from './routing';

// S46: Output Object Engine v2
export * from './objects';

// S47: Agent Personality & Tone Pack System
export * from './persona';

// Shared types (S44-S47 - export only non-conflicting types)
// Note: Intent types are exported from ./intent
// Evidence, Routing, Objects, Persona types will be exported from their modules
export type {
  Evidence,
  ReasoningChain,
  ReasoningChainStep,
  EvidencePack,
  ScoreJustification,
  RoutingMode,
  RoutingDecision,
  ExecutionStep,
  OrchestrationPlan,
  FallbackPath,
  AgentHandoff,
  LiveObject,
  ObjectThread,
  ThreadMessage,
  ObjectInspectorData,
  ObjectHistoryEntry,
  ObjectLink,
  ObjectSession,
  ToneType,
  OutreachToneType,
  PersonaConfig,
  PersonaTrait,
  TonePack,
  ToneModifier,
  PersonalizationEntry,
  LearnedPattern,
  IntentWrapperResult,
  RoutingWrapperResult,
  EvidenceWrapperResult,
  PersonaWrapperResult,
} from './types';
