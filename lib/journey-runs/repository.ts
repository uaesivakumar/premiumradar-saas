/**
 * Journey Runs Repository
 * Sprint S50: Journey Execution Viewer
 *
 * Data access layer for journey run history.
 * Read-only from UI perspective.
 */
import { query, queryOne } from '@/lib/db';
import type {
  JourneyRun,
  JourneyRunStep,
  JourneyRunAILog,
  JourneyRunError,
  JourneyRunCheckpoint,
  JourneyRunContextSnapshot,
  JourneyRunTransition,
  JourneyRunOSCall,
  JourneyRunSummary,
  JourneyRunDetails,
  AIUsageMetrics,
  JourneyRunStatus,
  JourneyRunTrigger,
} from './types';
import {
  mapRowToJourneyRun,
  mapRowToJourneyRunStep,
  mapRowToJourneyRunAILog,
  mapRowToJourneyRunError,
  mapRowToJourneyRunCheckpoint,
  mapRowToJourneyRunContextSnapshot,
  mapRowToJourneyRunTransition,
  mapRowToJourneyRunOSCall,
} from './types';

// =============================================================================
// LIST RUNS
// =============================================================================

export interface ListRunsFilters {
  journeyId: string;
  tenantId: string;
  status?: JourneyRunStatus;
  triggeredBy?: JourneyRunTrigger;
  startedAfter?: Date;
  startedBefore?: Date;
  limit?: number;
  offset?: number;
}

export async function listRuns(filters: ListRunsFilters): Promise<{
  runs: JourneyRunSummary[];
  total: number;
}> {
  const {
    journeyId,
    tenantId,
    status,
    triggeredBy,
    startedAfter,
    startedBefore,
    limit = 20,
    offset = 0,
  } = filters;

  // Build WHERE clause
  const conditions: string[] = ['r.journey_id = $1', 'r.tenant_id = $2'];
  const params: unknown[] = [journeyId, tenantId];
  let paramIndex = 3;

  if (status) {
    conditions.push(`r.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (triggeredBy) {
    conditions.push(`r.triggered_by = $${paramIndex}`);
    params.push(triggeredBy);
    paramIndex++;
  }

  if (startedAfter) {
    conditions.push(`r.started_at >= $${paramIndex}`);
    params.push(startedAfter);
    paramIndex++;
  }

  if (startedBefore) {
    conditions.push(`r.started_at <= $${paramIndex}`);
    params.push(startedBefore);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as count
    FROM journey_runs r
    WHERE ${whereClause}
  `;
  const countResult = await queryOne<{ count: string }>(countQuery, params);
  const total = parseInt(countResult?.count || '0', 10);

  // Get runs with error and checkpoint counts
  const runsQuery = `
    SELECT
      r.id,
      r.journey_id,
      r.status,
      r.triggered_by,
      r.started_at,
      r.ended_at,
      r.total_duration_ms,
      r.completed_steps,
      r.total_steps,
      r.total_cost_micros,
      r.total_tokens,
      r.summary,
      (SELECT COUNT(*) FROM journey_run_errors e WHERE e.run_id = r.id) AS error_count,
      (SELECT COUNT(*) FROM journey_run_checkpoints c WHERE c.run_id = r.id AND c.status = 'pending') AS pending_checkpoints
    FROM journey_runs r
    WHERE ${whereClause}
    ORDER BY r.started_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const rows = await query<Record<string, unknown>>(runsQuery, params);

  const runs: JourneyRunSummary[] = rows.map((row) => ({
    id: row.id as string,
    journeyId: row.journey_id as string,
    status: row.status as JourneyRunStatus,
    triggeredBy: row.triggered_by as JourneyRunTrigger,
    startedAt: new Date(row.started_at as string),
    endedAt: row.ended_at ? new Date(row.ended_at as string) : undefined,
    totalDurationMs: row.total_duration_ms as number | undefined,
    completedSteps: (row.completed_steps as number) || 0,
    totalSteps: (row.total_steps as number) || 0,
    totalCostMicros: (row.total_cost_micros as number) || 0,
    totalTokens: (row.total_tokens as number) || 0,
    summary: row.summary as string | undefined,
    errorCount: parseInt(row.error_count as string, 10) || 0,
    pendingCheckpoints: parseInt(row.pending_checkpoints as string, 10) || 0,
  }));

  return { runs, total };
}

// =============================================================================
// GET RUN DETAILS
// =============================================================================

export async function getRunById(
  runId: string,
  tenantId: string
): Promise<JourneyRun | null> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM journey_runs WHERE id = $1 AND tenant_id = $2`,
    [runId, tenantId]
  );

  return row ? mapRowToJourneyRun(row) : null;
}

export async function getRunDetails(
  runId: string,
  tenantId: string
): Promise<JourneyRunDetails | null> {
  // Get the main run record
  const run = await getRunById(runId, tenantId);
  if (!run) return null;

  // Fetch all related data in parallel
  const [steps, aiLogs, contextSnapshots, errors, checkpoints, transitions, osCalls] =
    await Promise.all([
      getRunSteps(runId),
      getRunAILogs(runId),
      getRunContextSnapshots(runId),
      getRunErrors(runId),
      getRunCheckpoints(runId),
      getRunTransitions(runId),
      getRunOSCalls(runId),
    ]);

  return {
    run,
    steps,
    aiLogs,
    contextSnapshots,
    errors,
    checkpoints,
    transitions,
    osCalls,
  };
}

// =============================================================================
// GET RELATED DATA
// =============================================================================

export async function getRunSteps(runId: string): Promise<JourneyRunStep[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM journey_run_steps WHERE run_id = $1 ORDER BY execution_order ASC, created_at ASC`,
    [runId]
  );
  return rows.map(mapRowToJourneyRunStep);
}

export async function getRunAILogs(runId: string): Promise<JourneyRunAILog[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM journey_run_ai_logs WHERE run_id = $1 ORDER BY created_at ASC`,
    [runId]
  );
  return rows.map(mapRowToJourneyRunAILog);
}

export async function getRunContextSnapshots(
  runId: string
): Promise<JourneyRunContextSnapshot[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM journey_run_context_snapshots WHERE run_id = $1 ORDER BY created_at ASC`,
    [runId]
  );
  return rows.map(mapRowToJourneyRunContextSnapshot);
}

export async function getRunErrors(runId: string): Promise<JourneyRunError[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM journey_run_errors WHERE run_id = $1 ORDER BY created_at ASC`,
    [runId]
  );
  return rows.map(mapRowToJourneyRunError);
}

export async function getRunCheckpoints(
  runId: string
): Promise<JourneyRunCheckpoint[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM journey_run_checkpoints WHERE run_id = $1 ORDER BY created_at ASC`,
    [runId]
  );
  return rows.map(mapRowToJourneyRunCheckpoint);
}

export async function getRunTransitions(
  runId: string
): Promise<JourneyRunTransition[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM journey_run_transitions WHERE run_id = $1 ORDER BY evaluated_at ASC`,
    [runId]
  );
  return rows.map(mapRowToJourneyRunTransition);
}

export async function getRunOSCalls(runId: string): Promise<JourneyRunOSCall[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM journey_run_os_calls WHERE run_id = $1 ORDER BY created_at ASC`,
    [runId]
  );
  return rows.map(mapRowToJourneyRunOSCall);
}

// =============================================================================
// AI USAGE METRICS
// =============================================================================

export async function getAIUsageMetrics(runId: string): Promise<AIUsageMetrics> {
  // Get aggregate metrics
  const aggregateRow = await queryOne<{
    total_calls: string;
    total_tokens: string;
    total_cost_micros: string;
    avg_latency_ms: string;
  }>(
    `SELECT
      COUNT(*) as total_calls,
      COALESCE(SUM(total_tokens), 0) as total_tokens,
      COALESCE(SUM(cost_micros), 0) as total_cost_micros,
      COALESCE(AVG(latency_ms), 0) as avg_latency_ms
    FROM journey_run_ai_logs
    WHERE run_id = $1`,
    [runId]
  );

  // Get per-model breakdown
  const modelRows = await query<{
    model_id: string;
    calls: string;
    tokens: string;
    cost_micros: string;
  }>(
    `SELECT
      COALESCE(model_id, 'unknown') as model_id,
      COUNT(*) as calls,
      COALESCE(SUM(total_tokens), 0) as tokens,
      COALESCE(SUM(cost_micros), 0) as cost_micros
    FROM journey_run_ai_logs
    WHERE run_id = $1
    GROUP BY model_id`,
    [runId]
  );

  const byModel: Record<string, { calls: number; tokens: number; costMicros: number }> =
    {};
  const modelsUsed: string[] = [];

  for (const row of modelRows) {
    const modelId = row.model_id || 'unknown';
    modelsUsed.push(modelId);
    byModel[modelId] = {
      calls: parseInt(row.calls, 10) || 0,
      tokens: parseInt(row.tokens, 10) || 0,
      costMicros: parseInt(row.cost_micros, 10) || 0,
    };
  }

  return {
    totalCalls: parseInt(aggregateRow?.total_calls || '0', 10),
    totalTokens: parseInt(aggregateRow?.total_tokens || '0', 10),
    totalCostMicros: parseInt(aggregateRow?.total_cost_micros || '0', 10),
    avgLatencyMs: parseFloat(aggregateRow?.avg_latency_ms || '0'),
    modelsUsed,
    byModel,
  };
}

// =============================================================================
// STEP-LEVEL QUERIES
// =============================================================================

export async function getStepAILog(
  runId: string,
  stepId: string
): Promise<JourneyRunAILog | null> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM journey_run_ai_logs WHERE run_id = $1 AND step_id = $2 ORDER BY created_at DESC LIMIT 1`,
    [runId, stepId]
  );
  return row ? mapRowToJourneyRunAILog(row) : null;
}

export async function getStepContextSnapshot(
  runId: string,
  stepId: string
): Promise<JourneyRunContextSnapshot | null> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM journey_run_context_snapshots WHERE run_id = $1 AND step_id = $2 ORDER BY created_at DESC LIMIT 1`,
    [runId, stepId]
  );
  return row ? mapRowToJourneyRunContextSnapshot(row) : null;
}

export async function getStepErrors(
  runId: string,
  stepId: string
): Promise<JourneyRunError[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM journey_run_errors WHERE run_id = $1 AND step_id = $2 ORDER BY created_at ASC`,
    [runId, stepId]
  );
  return rows.map(mapRowToJourneyRunError);
}

// =============================================================================
// RECENT RUNS (for dashboard widgets)
// =============================================================================

export async function getRecentRuns(
  tenantId: string,
  limit = 10
): Promise<JourneyRunSummary[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT
      r.id,
      r.journey_id,
      r.status,
      r.triggered_by,
      r.started_at,
      r.ended_at,
      r.total_duration_ms,
      r.completed_steps,
      r.total_steps,
      r.total_cost_micros,
      r.total_tokens,
      r.summary,
      (SELECT COUNT(*) FROM journey_run_errors e WHERE e.run_id = r.id) AS error_count,
      (SELECT COUNT(*) FROM journey_run_checkpoints c WHERE c.run_id = r.id AND c.status = 'pending') AS pending_checkpoints
    FROM journey_runs r
    WHERE r.tenant_id = $1
    ORDER BY r.started_at DESC
    LIMIT $2`,
    [tenantId, limit]
  );

  return rows.map((row) => ({
    id: row.id as string,
    journeyId: row.journey_id as string,
    status: row.status as JourneyRunStatus,
    triggeredBy: row.triggered_by as JourneyRunTrigger,
    startedAt: new Date(row.started_at as string),
    endedAt: row.ended_at ? new Date(row.ended_at as string) : undefined,
    totalDurationMs: row.total_duration_ms as number | undefined,
    completedSteps: (row.completed_steps as number) || 0,
    totalSteps: (row.total_steps as number) || 0,
    totalCostMicros: (row.total_cost_micros as number) || 0,
    totalTokens: (row.total_tokens as number) || 0,
    summary: row.summary as string | undefined,
    errorCount: parseInt(row.error_count as string, 10) || 0,
    pendingCheckpoints: parseInt(row.pending_checkpoints as string, 10) || 0,
  }));
}

// =============================================================================
// STATS
// =============================================================================

export interface JourneyRunStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  runningRuns: number;
  averageDurationMs: number;
  totalCostMicros: number;
  totalTokens: number;
}

export async function getJourneyStats(
  journeyId: string,
  tenantId: string,
  since?: Date
): Promise<JourneyRunStats> {
  const params: unknown[] = [journeyId, tenantId];
  let dateFilter = '';

  if (since) {
    dateFilter = ' AND started_at >= $3';
    params.push(since);
  }

  const row = await queryOne<{
    total_runs: string;
    successful_runs: string;
    failed_runs: string;
    running_runs: string;
    avg_duration_ms: string;
    total_cost_micros: string;
    total_tokens: string;
  }>(
    `SELECT
      COUNT(*) as total_runs,
      COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
      COUNT(*) FILTER (WHERE status = 'running') as running_runs,
      COALESCE(AVG(total_duration_ms), 0) as avg_duration_ms,
      COALESCE(SUM(total_cost_micros), 0) as total_cost_micros,
      COALESCE(SUM(total_tokens), 0) as total_tokens
    FROM journey_runs
    WHERE journey_id = $1 AND tenant_id = $2${dateFilter}`,
    params
  );

  return {
    totalRuns: parseInt(row?.total_runs || '0', 10),
    successfulRuns: parseInt(row?.successful_runs || '0', 10),
    failedRuns: parseInt(row?.failed_runs || '0', 10),
    runningRuns: parseInt(row?.running_runs || '0', 10),
    averageDurationMs: parseFloat(row?.avg_duration_ms || '0'),
    totalCostMicros: parseInt(row?.total_cost_micros || '0', 10),
    totalTokens: parseInt(row?.total_tokens || '0', 10),
  };
}
