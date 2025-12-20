/**
 * Evaluator API - Public endpoint for Human Calibration
 *
 * This endpoint allows evaluators to:
 * - GET: Retrieve their scenario queue and current scenario to score
 * - POST: Submit a score for a scenario
 *
 * No authentication required - access is controlled via unique token.
 * Token is validated against sales_bench_evaluator_invites table.
 */

import { NextRequest, NextResponse } from 'next/server';

const OS_BASE_URL = process.env.UPR_OS_URL || 'https://upr-os-service-191599223867.us-central1.run.app';
const PR_OS_TOKEN = process.env.PR_OS_TOKEN || process.env.UPR_OS_API_KEY || '';

interface EvaluatorContext {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/evaluate/[token]
 * Get evaluator session info and current scenario to score
 */
export async function GET(
  request: NextRequest,
  context: EvaluatorContext
) {
  try {
    const { token } = await context.params;

    if (!token || token.length < 32) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Forward to OS evaluator endpoint
    const response = await fetch(`${OS_BASE_URL}/api/os/sales-bench/evaluator/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-pr-os-token': PR_OS_TOKEN,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Evaluate API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluator data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/evaluate/[token]
 * Submit a score for a scenario
 */
export async function POST(
  request: NextRequest,
  context: EvaluatorContext
) {
  try {
    const { token } = await context.params;
    const body = await request.json();

    if (!token || token.length < 32) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.scenario_id) {
      return NextResponse.json(
        { success: false, error: 'scenario_id is required' },
        { status: 400 }
      );
    }

    // Forward to OS evaluator endpoint
    const response = await fetch(`${OS_BASE_URL}/api/os/sales-bench/evaluator/${token}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pr-os-token': PR_OS_TOKEN,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Evaluate API] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}
