/**
 * Journey Replay API Routes
 * Sprint S52: Replay Engine
 *
 * POST /api/journeys/:journeyId/runs/:runId/replay - Start replay
 * GET  /api/journeys/:journeyId/runs/:runId/replay/summary - Get replay summary
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runReplay, buildReplaySummary, buildReplayTimeline } from '@/lib/journey-replay';
import type { ReplayConfig, StartReplayResponse, GetReplaySummaryResponse } from '@/lib/journey-replay';
import type { JourneyRunDetails } from '@/lib/journey-runs';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ReplayRequestSchema = z.object({
  speed: z.enum(['0.25x', '0.5x', '1x', '2x', '4x', 'instant']).optional(),
  stopAtStep: z.string().optional(),
  startFromStep: z.string().optional(),
  includeMetrics: z.boolean().optional(),
  includeContextDiffs: z.boolean().optional(),
  includeAILogs: z.boolean().optional(),
});

// =============================================================================
// MOCK DATA GENERATOR (for development)
// =============================================================================

function generateMockRunDetails(journeyId: string, runId: string): JourneyRunDetails {
  const now = new Date();
  const startTime = new Date(now.getTime() - 60000); // 1 minute ago

  const steps = [
    {
      id: 'step-1',
      runId,
      stepId: 'enrich-company',
      stepName: 'Enrich Company',
      stepType: 'enrichment',
      status: 'completed' as const,
      queuedAt: new Date(startTime.getTime()),
      startedAt: new Date(startTime.getTime() + 100),
      completedAt: new Date(startTime.getTime() + 5000),
      durationMs: 4900,
      inputData: { companyId: 'acme-corp' },
      outputData: { industry: 'Technology', employees: 500 },
      executionOrder: 0,
      retryCount: 0,
      maxRetries: 3,
      fallbackTriggered: false,
      metadata: {},
      createdAt: startTime,
    },
    {
      id: 'step-2',
      runId,
      stepId: 'ai-qualify',
      stepName: 'AI Qualification',
      stepType: 'ai',
      status: 'completed' as const,
      queuedAt: new Date(startTime.getTime() + 5100),
      startedAt: new Date(startTime.getTime() + 5200),
      completedAt: new Date(startTime.getTime() + 12000),
      durationMs: 6800,
      inputData: { companyData: { industry: 'Technology', employees: 500 } },
      outputData: { qualified: true, score: 85 },
      decision: { outcome: 'qualified', confidence: 0.85 },
      decisionReason: 'Company meets all qualification criteria',
      executionOrder: 1,
      retryCount: 0,
      maxRetries: 3,
      fallbackTriggered: false,
      metadata: {},
      createdAt: new Date(startTime.getTime() + 5100),
    },
    {
      id: 'step-3',
      runId,
      stepId: 'decision-branch',
      stepName: 'Decision: Next Action',
      stepType: 'decision',
      status: 'completed' as const,
      queuedAt: new Date(startTime.getTime() + 12100),
      startedAt: new Date(startTime.getTime() + 12200),
      completedAt: new Date(startTime.getTime() + 18000),
      durationMs: 5800,
      inputData: { qualified: true, score: 85 },
      outputData: { nextAction: 'schedule-meeting' },
      decision: { selectedBranch: 'high-intent' },
      decisionReason: 'Score above 80 indicates high intent',
      executionOrder: 2,
      retryCount: 0,
      maxRetries: 3,
      fallbackTriggered: false,
      metadata: {},
      createdAt: new Date(startTime.getTime() + 12100),
    },
    {
      id: 'step-4',
      runId,
      stepId: 'generate-outreach',
      stepName: 'Generate Outreach',
      stepType: 'ai',
      status: 'completed' as const,
      queuedAt: new Date(startTime.getTime() + 18100),
      startedAt: new Date(startTime.getTime() + 18200),
      completedAt: new Date(startTime.getTime() + 28000),
      durationMs: 9800,
      inputData: { companyName: 'Acme Corp', contactName: 'John Doe' },
      outputData: { emailDraft: 'Dear John...' },
      executionOrder: 3,
      retryCount: 0,
      maxRetries: 3,
      fallbackTriggered: false,
      metadata: {},
      createdAt: new Date(startTime.getTime() + 18100),
    },
    {
      id: 'step-5',
      runId,
      stepId: 'checkpoint-review',
      stepName: 'Human Review',
      stepType: 'checkpoint',
      status: 'completed' as const,
      queuedAt: new Date(startTime.getTime() + 28100),
      startedAt: new Date(startTime.getTime() + 28200),
      completedAt: new Date(startTime.getTime() + 45000),
      durationMs: 16800,
      inputData: { emailDraft: 'Dear John...' },
      outputData: { approved: true },
      executionOrder: 4,
      retryCount: 0,
      maxRetries: 3,
      fallbackTriggered: false,
      metadata: {},
      createdAt: new Date(startTime.getTime() + 28100),
    },
  ];

  const aiLogs = [
    {
      id: 'ai-log-1',
      runId,
      stepId: 'ai-qualify',
      systemPrompt: 'You are a sales qualification expert...',
      userPrompt: 'Evaluate this company for sales potential: Technology, 500 employees',
      response: 'Based on the company profile, I recommend QUALIFIED with score 85...',
      responseParsed: { qualified: true, score: 85, reasons: ['Good size', 'Right industry'] },
      modelId: 'claude-3-sonnet',
      inputTokens: 250,
      outputTokens: 150,
      totalTokens: 400,
      costMicros: 1200,
      latencyMs: 2500,
      selectedOutcome: 'qualified',
      confidence: 0.85,
      reasoning: 'Company meets all qualification criteria',
      checkpointRequired: false,
      createdAt: new Date(startTime.getTime() + 6000),
    },
    {
      id: 'ai-log-2',
      runId,
      stepId: 'decision-branch',
      systemPrompt: 'Determine the best next action based on qualification...',
      userPrompt: 'Lead is qualified with score 85. What is the recommended next action?',
      response: 'Recommend scheduling a meeting due to high intent...',
      responseParsed: { action: 'schedule-meeting', priority: 'high' },
      modelId: 'claude-3-haiku',
      inputTokens: 180,
      outputTokens: 80,
      totalTokens: 260,
      costMicros: 400,
      latencyMs: 800,
      selectedOutcome: 'high-intent',
      confidence: 0.92,
      reasoning: 'Score above 80 indicates high intent',
      checkpointRequired: false,
      createdAt: new Date(startTime.getTime() + 13000),
    },
    {
      id: 'ai-log-3',
      runId,
      stepId: 'generate-outreach',
      systemPrompt: 'Generate a personalized outreach email...',
      userPrompt: 'Write an email to John Doe at Acme Corp about our product...',
      response: 'Dear John,\n\nI noticed Acme Corp has been growing rapidly...',
      responseParsed: { subject: 'Partnership Opportunity', body: 'Dear John...' },
      modelId: 'claude-3-sonnet',
      inputTokens: 320,
      outputTokens: 280,
      totalTokens: 600,
      costMicros: 1800,
      latencyMs: 4200,
      checkpointRequired: true,
      checkpointId: 'cp-1',
      createdAt: new Date(startTime.getTime() + 20000),
    },
  ];

  const contextSnapshots = [
    {
      id: 'ctx-1',
      runId,
      stepId: 'enrich-company',
      snapshotType: 'step' as const,
      contextJson: {
        company: { id: 'acme-corp', name: 'Acme Corp' },
        stage: 'enrichment',
      },
      estimatedTokens: 100,
      createdAt: new Date(startTime.getTime() + 1000),
    },
    {
      id: 'ctx-2',
      runId,
      stepId: 'ai-qualify',
      snapshotType: 'step' as const,
      contextJson: {
        company: { id: 'acme-corp', name: 'Acme Corp', industry: 'Technology', employees: 500 },
        stage: 'qualification',
        enrichmentComplete: true,
      },
      changesFromPrevious: { industry: 'Technology', employees: 500 },
      estimatedTokens: 180,
      createdAt: new Date(startTime.getTime() + 6000),
    },
    {
      id: 'ctx-3',
      runId,
      stepId: 'decision-branch',
      snapshotType: 'decision' as const,
      contextJson: {
        company: { id: 'acme-corp', name: 'Acme Corp', industry: 'Technology', employees: 500 },
        stage: 'decision',
        qualification: { qualified: true, score: 85 },
      },
      changesFromPrevious: { qualification: { qualified: true, score: 85 } },
      estimatedTokens: 220,
      createdAt: new Date(startTime.getTime() + 13000),
    },
  ];

  const transitions = [
    {
      id: 'trans-1',
      runId,
      transitionId: 't1',
      fromStepId: 'enrich-company',
      toStepId: 'ai-qualify',
      conditionMet: true,
      taken: true,
      evaluatedAt: new Date(startTime.getTime() + 5000),
    },
    {
      id: 'trans-2',
      runId,
      transitionId: 't2',
      fromStepId: 'ai-qualify',
      toStepId: 'decision-branch',
      conditionEvaluated: { qualified: true },
      conditionMet: true,
      evaluationReason: 'Lead is qualified',
      taken: true,
      evaluatedAt: new Date(startTime.getTime() + 12000),
    },
    {
      id: 'trans-3',
      runId,
      transitionId: 't3-high',
      fromStepId: 'decision-branch',
      toStepId: 'generate-outreach',
      conditionEvaluated: { score: { $gt: 80 } },
      conditionMet: true,
      evaluationReason: 'Score 85 > 80',
      taken: true,
      evaluatedAt: new Date(startTime.getTime() + 18000),
    },
    {
      id: 'trans-4',
      runId,
      transitionId: 't3-low',
      fromStepId: 'decision-branch',
      toStepId: 'nurture-sequence',
      conditionEvaluated: { score: { $lte: 80 } },
      conditionMet: false,
      evaluationReason: 'Score 85 > 80, condition not met',
      taken: false,
      evaluatedAt: new Date(startTime.getTime() + 18000),
    },
    {
      id: 'trans-5',
      runId,
      transitionId: 't4',
      fromStepId: 'generate-outreach',
      toStepId: 'checkpoint-review',
      conditionMet: true,
      taken: true,
      evaluatedAt: new Date(startTime.getTime() + 28000),
    },
  ];

  const checkpoints = [
    {
      id: 'cp-1',
      runId,
      stepId: 'checkpoint-review',
      status: 'approved' as const,
      checkpointType: 'human-review',
      riskLevel: 'medium',
      description: 'Review outreach email before sending',
      proposedAction: { action: 'send-email', target: 'john@acme.com' },
      reviewedBy: 'user-123',
      reviewedAt: new Date(startTime.getTime() + 42000),
      reviewNotes: 'Approved with minor edits',
      createdAt: new Date(startTime.getTime() + 28500),
    },
  ];

  const osCalls = [
    {
      id: 'os-call-1',
      runId,
      stepId: 'enrich-company',
      endpoint: '/api/os/enrich/company',
      method: 'POST',
      requestBody: { companyId: 'acme-corp' },
      responseBody: { industry: 'Technology', employees: 500, revenue: '50M' },
      responseStatus: 200,
      latencyMs: 1200,
      osCapability: 'company-enrichment',
      createdAt: new Date(startTime.getTime() + 2000),
    },
  ];

  return {
    run: {
      id: runId,
      journeyId,
      tenantId: 'tenant-123',
      status: 'success',
      startedAt: startTime,
      endedAt: new Date(startTime.getTime() + 45000),
      triggeredBy: 'user',
      totalSteps: 5,
      completedSteps: 5,
      failedSteps: 0,
      skippedSteps: 0,
      totalDurationMs: 45000,
      totalCostMicros: 3400,
      totalTokens: 1260,
      inputData: { companyId: 'acme-corp' },
      outputData: { result: 'outreach-sent' },
      metadata: {},
      tags: ['demo'],
      createdAt: startTime,
      updatedAt: new Date(startTime.getTime() + 45000),
    },
    steps,
    aiLogs,
    contextSnapshots,
    errors: [],
    checkpoints,
    transitions,
    osCalls,
  };
}

// =============================================================================
// POST /api/journeys/:journeyId/runs/:runId/replay
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { journeyId: string; runId: string } }
): Promise<NextResponse<StartReplayResponse>> {
  try {
    const { journeyId, runId } = params;

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validationResult = ReplayRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          timeline: null as any,
          events: [],
          error: `Invalid request: ${validationResult.error.message}`,
        },
        { status: 400 }
      );
    }

    const config: Partial<ReplayConfig> = validationResult.data;

    // In production, fetch from database
    // For now, generate mock data
    const details = generateMockRunDetails(journeyId, runId);

    // Run replay to generate timeline and events
    const result = await runReplay(details, config);

    return NextResponse.json({
      success: true,
      timeline: result.timeline,
      events: result.events,
    });
  } catch (error) {
    console.error('Replay API error:', error);
    return NextResponse.json(
      {
        success: false,
        timeline: null as any,
        events: [],
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET /api/journeys/:journeyId/runs/:runId/replay/summary
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { journeyId: string; runId: string } }
): Promise<NextResponse<GetReplaySummaryResponse>> {
  try {
    const { journeyId, runId } = params;

    // In production, fetch from database
    const details = generateMockRunDetails(journeyId, runId);

    // Build timeline and summary
    const timeline = buildReplayTimeline(details);
    const summary = buildReplaySummary(details, timeline);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Replay summary API error:', error);
    return NextResponse.json(
      {
        success: false,
        summary: null as any,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
