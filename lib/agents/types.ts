/**
 * Agent Types - Sprint S28
 * Type definitions for multi-agent orchestration
 */

import { AgentType, PartialOutputObject, ReasoningStep } from '@/lib/stores/siva-store';

// Agent capability definition
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
}

// Agent configuration
export interface AgentConfig {
  id: AgentType;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  capabilities: AgentCapability[];
  keywords: string[];
  priority: number; // Higher = matched first
}

// Agent execution context
export interface AgentContext {
  query: string;
  industry: string;
  region?: string;
  previousResults?: unknown[];
  userPreferences?: Record<string, unknown>;
}

// Agent response
export interface AgentResponse {
  message: string;
  objects: PartialOutputObject[];
  reasoningSteps: Omit<ReasoningStep, 'id'>[];
  followUpSuggestions?: string[];
  metadata?: Record<string, unknown>;
}

// Base agent interface
export interface Agent {
  config: AgentConfig;
  execute(context: AgentContext): Promise<AgentResponse>;
  canHandle(query: string): boolean;
  getConfidence(query: string): number;
}
