/**
 * Journey Builder Types
 * Sprint S62: Journey Builder UI + AI Trust Layer
 *
 * Visual drag-and-drop journey creation with:
 * - Step nodes and transitions
 * - Condition builder
 * - Preview mode
 * - Import/Export JSON
 */
import { z } from 'zod';

// =============================================================================
// STEP TYPES
// =============================================================================

export const StepTypeEnum = z.enum([
  'discovery',
  'enrichment',
  'scoring',
  'validation',
  'wait',
  'outreach',
  'decision',
  'action',
]);
export type StepType = z.infer<typeof StepTypeEnum>;

export const StepStatusEnum = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'skipped',
]);
export type StepStatus = z.infer<typeof StepStatusEnum>;

// =============================================================================
// POSITION & LAYOUT
// =============================================================================

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Position = z.infer<typeof PositionSchema>;

export const NodeDimensionsSchema = z.object({
  width: z.number().default(200),
  height: z.number().default(100),
});
export type NodeDimensions = z.infer<typeof NodeDimensionsSchema>;

// =============================================================================
// STEP NODE
// =============================================================================

export const StepConfigSchema = z.record(z.string(), z.unknown());
export type StepConfig = z.infer<typeof StepConfigSchema>;

export const StepNodeSchema = z.object({
  id: z.string(),
  type: StepTypeEnum,
  label: z.string(),
  description: z.string().optional(),

  // Position on canvas
  position: PositionSchema,
  dimensions: NodeDimensionsSchema.optional(),

  // Configuration
  config: StepConfigSchema,

  // Connections
  inputs: z.array(z.string()).default([]), // IDs of incoming transitions
  outputs: z.array(z.string()).default([]), // IDs of outgoing transitions

  // Metadata
  icon: z.string().optional(),
  color: z.string().optional(),
  isStart: z.boolean().default(false),
  isEnd: z.boolean().default(false),
});
export type StepNode = z.infer<typeof StepNodeSchema>;

// =============================================================================
// TRANSITION CONDITIONS
// =============================================================================

export const ConditionOperatorEnum = z.enum([
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'contains',
  'not_contains',
  'is_empty',
  'is_not_empty',
  'matches_regex',
]);
export type ConditionOperator = z.infer<typeof ConditionOperatorEnum>;

export const ConditionSchema = z.object({
  field: z.string(),
  operator: ConditionOperatorEnum,
  value: z.unknown(),
});
export type Condition = z.infer<typeof ConditionSchema>;

export const ConditionGroupSchema = z.object({
  logic: z.enum(['and', 'or']),
  conditions: z.array(ConditionSchema),
});
export type ConditionGroup = z.infer<typeof ConditionGroupSchema>;

// =============================================================================
// TRANSITION
// =============================================================================

export const TransitionSchema = z.object({
  id: z.string(),
  fromStepId: z.string(),
  toStepId: z.string(),

  // Condition for this transition (optional)
  condition: ConditionGroupSchema.optional(),

  // Visual properties
  label: z.string().optional(),
  color: z.string().optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),

  // Priority (for multiple transitions from same node)
  priority: z.number().default(0),
});
export type Transition = z.infer<typeof TransitionSchema>;

// =============================================================================
// JOURNEY DEFINITION
// =============================================================================

export const JourneyDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  version: z.number().default(1),

  // Canvas
  steps: z.array(StepNodeSchema),
  transitions: z.array(TransitionSchema),

  // Metadata
  vertical: z.string().optional(),
  subVertical: z.string().optional(),
  region: z.string().optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
});
export type JourneyDefinition = z.infer<typeof JourneyDefinitionSchema>;

// =============================================================================
// JOURNEY CANVAS STATE
// =============================================================================

export const CanvasStateSchema = z.object({
  zoom: z.number().min(0.1).max(3).default(1),
  panX: z.number().default(0),
  panY: z.number().default(0),
  selectedNodeId: z.string().nullable().default(null),
  selectedTransitionId: z.string().nullable().default(null),
  isDragging: z.boolean().default(false),
  isConnecting: z.boolean().default(false),
  connectingFromId: z.string().nullable().default(null),
});
export type CanvasState = z.infer<typeof CanvasStateSchema>;

// =============================================================================
// PREVIEW MODE
// =============================================================================

export const PreviewStateSchema = z.object({
  isActive: z.boolean().default(false),
  currentStepId: z.string().nullable().default(null),
  executedSteps: z.array(z.string()).default([]),
  stepResults: z.record(z.string(), z.unknown()).default({}),
  mockData: z.record(z.string(), z.unknown()).default({}),
});
export type PreviewState = z.infer<typeof PreviewStateSchema>;

// =============================================================================
// AI TRUST & AUDIT (S62)
// =============================================================================

export const CitationSchema = z.object({
  id: z.string(),
  source: z.string(),
  url: z.string().url().optional(),
  excerpt: z.string(),
  confidence: z.number().min(0).max(1),
  timestamp: z.date(),
});
export type Citation = z.infer<typeof CitationSchema>;

export const ReasoningStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  evidence: z.array(CitationSchema),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(z.string()).optional(),
});
export type ReasoningStep = z.infer<typeof ReasoningStepSchema>;

export const AuditEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  action: z.enum([
    'journey_created',
    'journey_updated',
    'step_added',
    'step_removed',
    'step_configured',
    'transition_added',
    'transition_removed',
    'journey_executed',
    'journey_exported',
    'journey_imported',
  ]),
  userId: z.string(),
  details: z.record(z.string(), z.unknown()),
  ipAddress: z.string().optional(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const ComplianceCheckSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  ruleName: z.string(),
  passed: z.boolean(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
});
export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>;

export const AITransparencySchema = z.object({
  reasoning: z.array(ReasoningStepSchema),
  citations: z.array(CitationSchema),
  complianceChecks: z.array(ComplianceCheckSchema),
  overallConfidence: z.number().min(0).max(1),
  generatedAt: z.date(),
});
export type AITransparency = z.infer<typeof AITransparencySchema>;

// =============================================================================
// STEP TEMPLATES
// =============================================================================

export interface StepTemplate {
  type: StepType;
  label: string;
  description: string;
  icon: string;
  color: string;
  defaultConfig: StepConfig;
  configSchema: z.ZodSchema;
}

export const STEP_TEMPLATES: StepTemplate[] = [
  {
    type: 'discovery',
    label: 'Discovery',
    description: 'Find companies matching criteria',
    icon: '🔍',
    color: '#3B82F6',
    defaultConfig: { signalTypes: [], regions: [], limit: 100 },
    configSchema: z.object({
      signalTypes: z.array(z.string()),
      regions: z.array(z.string()),
      limit: z.number(),
    }),
  },
  {
    type: 'enrichment',
    label: 'Enrichment',
    description: 'Add firmographic data',
    icon: '📊',
    color: '#10B981',
    defaultConfig: { sources: ['apollo', 'linkedin'], fields: [] },
    configSchema: z.object({
      sources: z.array(z.string()),
      fields: z.array(z.string()),
    }),
  },
  {
    type: 'scoring',
    label: 'Scoring',
    description: 'Calculate fit scores',
    icon: '⭐',
    color: '#F59E0B',
    defaultConfig: { weights: {}, threshold: 0.7 },
    configSchema: z.object({
      weights: z.record(z.string(), z.number()),
      threshold: z.number(),
    }),
  },
  {
    type: 'validation',
    label: 'Validation',
    description: 'Check data quality',
    icon: '✅',
    color: '#8B5CF6',
    defaultConfig: { rules: [] },
    configSchema: z.object({
      rules: z.array(z.object({
        field: z.string(),
        check: z.string(),
      })),
    }),
  },
  {
    type: 'wait',
    label: 'Wait',
    description: 'Pause for time or condition',
    icon: '⏱️',
    color: '#6B7280',
    defaultConfig: { duration: 3600, unit: 'seconds' },
    configSchema: z.object({
      duration: z.number(),
      unit: z.enum(['seconds', 'minutes', 'hours', 'days']),
    }),
  },
  {
    type: 'outreach',
    label: 'Outreach',
    description: 'Send personalized message',
    icon: '📧',
    color: '#EC4899',
    defaultConfig: { channel: 'email', templateId: null },
    configSchema: z.object({
      channel: z.enum(['email', 'linkedin', 'phone']),
      templateId: z.string().nullable(),
    }),
  },
  {
    type: 'decision',
    label: 'Decision',
    description: 'Branch based on conditions',
    icon: '🔀',
    color: '#14B8A6',
    defaultConfig: { branches: [] },
    configSchema: z.object({
      branches: z.array(z.object({
        label: z.string(),
        condition: ConditionGroupSchema,
      })),
    }),
  },
  {
    type: 'action',
    label: 'Action',
    description: 'Execute custom action',
    icon: '⚡',
    color: '#EF4444',
    defaultConfig: { actionType: 'webhook', url: '' },
    configSchema: z.object({
      actionType: z.enum(['webhook', 'crm_update', 'notification']),
      url: z.string().optional(),
    }),
  },
];
